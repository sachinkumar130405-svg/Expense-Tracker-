from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import date, datetime, timedelta
from sqlalchemy import func
import bcrypt

import models
import schemas
from database import engine, get_db, SessionLocal

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Expense Tracker API")

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return False
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    # Check and insert default users
    if not db.query(models.User).first():
        db.add_all([
            models.User(name='Sachin Kumar', email='sachin@example.com', password_hash=get_password_hash('password123')),
            models.User(name='Roommate', email='roommate@example.com', password_hash=get_password_hash('password123'))
        ])
        db.commit()

    # Fix sequences if postgres
    from database import engine
    from sqlalchemy import text
    if "postgres" in engine.url.drivername:
        try:
            db.execute(text("SELECT setval('users_id_seq', COALESCE((SELECT MAX(id)+1 FROM users), 1), false);"))
            db.commit()
        except Exception:
            db.rollback()
    
    # Check and insert default categories
    if not db.query(models.Category).first():
        db.add_all([
            models.Category(name='Food', is_default=True),
            models.Category(name='Fruits', is_default=True),
            models.Category(name='Snacks', is_default=True),
            models.Category(name='Entertainment', is_default=True),
            models.Category(name='Subscriptions', is_default=True),
            models.Category(name='Transport', is_default=True),
            models.Category(name='Academics', is_default=True),
            models.Category(name='Others', is_default=True),
        ])
    db.commit()
    db.close()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Expense Tracker API"}

# ──────────────────────────────────
#  AUTH
# ──────────────────────────────────

@app.post("/register/", response_model=schemas.UserResponse)
def register(user: schemas.UserRegister, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pw = get_password_hash(user.password)
    db_user = models.User(name=user.name, email=user.email, password_hash=hashed_pw)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/login/")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(
        func.lower(models.User.name) == user.name.lower()
    ).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid password")
    
    return {"message": "Login successful", "user_id": db_user.id, "name": db_user.name}

# ──────────────────────────────────
#  CATEGORIES
# ──────────────────────────────────

@app.get("/categories/", response_model=List[schemas.Category])
def read_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).all()

@app.post("/categories/", response_model=schemas.Category)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Category).filter(
        func.lower(models.Category.name) == category.name.lower()
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")
    db_cat = models.Category(name=category.name, is_default=False)
    db.add(db_cat)
    db.commit()
    db.refresh(db_cat)
    return db_cat

@app.delete("/categories/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db)):
    cat = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(cat)
    db.commit()
    return {"message": "Category deleted"}

# ──────────────────────────────────
#  EXPENSES
# ──────────────────────────────────

@app.post("/expenses/", response_model=schemas.Expense)
def create_expense(expense: schemas.ExpenseCreate, db: Session = Depends(get_db)):
    expense_data = expense.model_dump(exclude={"splits"})
    if not expense_data.get('date'):
        expense_data['date'] = datetime.now()
        
    db_expense = models.Expense(**expense_data)
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    
    if expense.splits:
        for split in expense.splits:
            db_split = models.ExpenseSplit(
                expense_id=db_expense.id,
                owed_by=split.owed_by,
                amount=split.amount
            )
            db.add(db_split)
        db.commit()

    cat_name = None
    if db_expense.category_id:
        cat = db.query(models.Category).filter(models.Category.id == db_expense.category_id).first()
        if cat:
            cat_name = cat.name

    return schemas.Expense(
        id=db_expense.id,
        amount=db_expense.amount,
        description=db_expense.description,
        category_id=db_expense.category_id,
        paid_by=db_expense.paid_by,
        date=db_expense.date,
        is_income=db_expense.is_income,
        category_name=cat_name
    )

@app.get("/expenses/", response_model=List[schemas.Expense])
def read_expenses(user_id: int = None, month: int = None, year: int = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    query = db.query(models.Expense)
    if user_id:
        query = query.filter(models.Expense.paid_by == user_id)
    if month and year:
        query = query.filter(
            func.extract('month', models.Expense.date) == month,
            func.extract('year', models.Expense.date) == year
        )
    expenses = query.order_by(models.Expense.date.desc()).offset(skip).limit(limit).all()
    result = []
    for exp in expenses:
        cat_name = None
        if exp.category_id:
            cat = db.query(models.Category).filter(models.Category.id == exp.category_id).first()
            if cat:
                cat_name = cat.name
        result.append(schemas.Expense(
            id=exp.id,
            amount=exp.amount,
            description=exp.description,
            category_id=exp.category_id,
            paid_by=exp.paid_by,
            date=exp.date,
            is_income=exp.is_income,
            category_name=cat_name
        ))
    return result

@app.put("/expenses/{expense_id}", response_model=schemas.Expense)
def update_expense(expense_id: int, expense_update: schemas.ExpenseUpdate, db: Session = Depends(get_db)):
    db_expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
        
    update_data = expense_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_expense, key, value)
        
    db.commit()
    db.refresh(db_expense)
    
    cat_name = None
    if db_expense.category_id:
        cat = db.query(models.Category).filter(models.Category.id == db_expense.category_id).first()
        if cat:
            cat_name = cat.name
            
    return schemas.Expense(
        id=db_expense.id,
        amount=db_expense.amount,
        description=db_expense.description,
        category_id=db_expense.category_id,
        paid_by=db_expense.paid_by,
        date=db_expense.date,
        is_income=db_expense.is_income,
        category_name=cat_name
    )

@app.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    db_expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    # Manually delete splits since SQLite foreign key cascade might be disabled
    db.query(models.ExpenseSplit).filter(models.ExpenseSplit.expense_id == expense_id).delete()
    db.delete(db_expense)
    db.commit()
    return {"message": "Expense deleted successfully"}

# ──────────────────────────────────
#  CHART DATA
# ──────────────────────────────────

@app.get("/expenses/chart-data/")
def get_chart_data(user_id: int = None, period: str = "month", db: Session = Depends(get_db)):
    """
    period = 'week' -> last 7 days, grouped by day
    period = 'month' -> last 30 days, grouped by day, plus weekly summary
    """
    today = date.today()
    
    if period == "week":
        start = today - timedelta(days=6)
        query = db.query(
            func.strftime('%Y-%m-%d', models.Expense.date).label("day"),
            func.sum(models.Expense.amount).label("total")
        ).filter(
            func.date(models.Expense.date) >= start,
            models.Expense.is_income == False
        )
        if user_id:
            query = query.filter(models.Expense.paid_by == user_id)
        rows = query.group_by("day").order_by("day").all()

        day_map = {r.day: float(r.total) for r in rows}
        result = []
        for i in range(7):
            d = start + timedelta(days=i)
            key = d.strftime('%Y-%m-%d')
            label = d.strftime('%a')
            result.append({"label": label, "total": day_map.get(key, 0)})
        return result
    else:
        # Monthly: last 30 days, day-wise
        start = today - timedelta(days=29)
        query = db.query(
            func.strftime('%Y-%m-%d', models.Expense.date).label("day"),
            func.sum(models.Expense.amount).label("total")
        ).filter(
            func.date(models.Expense.date) >= start,
            models.Expense.is_income == False
        )
        if user_id:
            query = query.filter(models.Expense.paid_by == user_id)
        rows = query.group_by("day").order_by("day").all()

        day_map = {r.day: float(r.total) for r in rows}
        daily_data = []
        for i in range(30):
            d = start + timedelta(days=i)
            key = d.strftime('%Y-%m-%d')
            label = d.strftime('%d %b')
            daily_data.append({"label": label, "total": day_map.get(key, 0)})
            
        # Weekly summary (last 4 weeks)
        weekly_summary = []
        for w in range(4):
            week_end = today - timedelta(weeks=w)
            week_start = week_end - timedelta(days=6)
            week_query = db.query(func.sum(models.Expense.amount)).filter(
                func.date(models.Expense.date) >= week_start,
                func.date(models.Expense.date) <= week_end,
                models.Expense.is_income == False
            )
            if user_id:
                week_query = week_query.filter(models.Expense.paid_by == user_id)
            total = week_query.scalar() or 0
            label = f"W{4-w}"
            weekly_summary.append({"label": label, "total": float(total)})
        weekly_summary.reverse()
        
        return {
            "daily": daily_data,
            "weekly": weekly_summary
        }

@app.get("/expenses/category-breakdown/", response_model=List[schemas.ChartDataPoint])
def get_category_breakdown(user_id: int = None, month: int = None, year: int = None, db: Session = Depends(get_db)):
    today = date.today()
    target_month = month or today.month
    target_year = year or today.year
    
    query = db.query(
        models.Category.name,
        func.sum(models.Expense.amount).label("total")
    ).join(
        models.Expense, models.Expense.category_id == models.Category.id
    ).filter(
        func.extract('month', models.Expense.date) == target_month,
        func.extract('year', models.Expense.date) == target_year,
        models.Expense.is_income == False
    )
    if user_id:
        query = query.filter(models.Expense.paid_by == user_id)
    
    rows = query.group_by(models.Category.name).all()

    return [{"label": r.name, "total": float(r.total)} for r in rows]

# ──────────────────────────────────
#  ALLOWANCES & SUMMARY
# ──────────────────────────────────

@app.post("/allowances/", response_model=schemas.Allowance)
def set_allowance(allowance: schemas.AllowanceCreate, user_id: int = None, db: Session = Depends(get_db)):
    query = db.query(models.Allowance).filter(
        models.Allowance.month == allowance.month,
        models.Allowance.year == allowance.year
    )
    if user_id:
        query = query.filter(models.Allowance.user_id == user_id)
    
    db_allowance = query.first()

    if db_allowance:
        db_allowance.initial_balance = allowance.initial_balance
    else:
        db_allowance = models.Allowance(**allowance.model_dump())
        if user_id:
            db_allowance.user_id = user_id
        db.add(db_allowance)
    
    db.commit()
    db.refresh(db_allowance)
    return db_allowance

@app.get("/summary/", response_model=schemas.Summary)
def get_summary(user_id: int = None, month: int = None, year: int = None, db: Session = Depends(get_db)):
    today = date.today()
    target_month = month or today.month
    target_year = year or today.year
    
    allowance_query = db.query(models.Allowance).filter(
        models.Allowance.month == target_month,
        models.Allowance.year == target_year
    )
    if user_id:
        allowance_query = allowance_query.filter(models.Allowance.user_id == user_id)
    allowance = allowance_query.first()
    allowance_amt = allowance.initial_balance if allowance else 0
    
    exp_query = db.query(func.sum(models.Expense.amount)).filter(
        func.extract('month', models.Expense.date) == target_month,
        func.extract('year', models.Expense.date) == target_year,
        models.Expense.is_income == False
    )
    if user_id:
        exp_query = exp_query.filter(models.Expense.paid_by == user_id)
    total_expenses = exp_query.scalar() or 0
    
    inc_query = db.query(func.sum(models.Expense.amount)).filter(
        func.extract('month', models.Expense.date) == target_month,
        func.extract('year', models.Expense.date) == target_year,
        models.Expense.is_income == True
    )
    if user_id:
        inc_query = inc_query.filter(models.Expense.paid_by == user_id)
    total_income = inc_query.scalar() or 0
    
    balance = (allowance_amt + total_income) - total_expenses
    total_available = allowance_amt + total_income
    percentage_used = (total_expenses / total_available * 100) if total_available > 0 else 0
    
    return {
        "total_expenses": total_expenses,
        "total_income": total_income,
        "allowance": allowance_amt,
        "balance": balance,
        "percentage_used": percentage_used
    }
