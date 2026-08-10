from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="College Expense Tracker API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Update this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the College Expense Tracker API"}

@app.post("/expenses/", response_model=schemas.Expense)
def create_expense(expense: schemas.ExpenseCreate, db: Session = Depends(get_db)):
    expense_data = expense.model_dump(exclude={"splits"})
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

    return db_expense

@app.get("/debts/", response_model=List[schemas.DebtSummary])
def get_debts(current_user_id: int = 1, db: Session = Depends(get_db)): # Hardcoding user 1 for MVP
    # Get all other users
    users = db.query(models.User).filter(models.User.id != current_user_id).all()
    
    debt_summaries = []
    for user in users:
        # Amount they owe me (I paid, they are owed_by in splits)
        owed_to_me = db.query(func.sum(models.ExpenseSplit.amount))\
            .join(models.Expense, models.ExpenseSplit.expense_id == models.Expense.id)\
            .filter(
                models.Expense.paid_by == current_user_id,
                models.ExpenseSplit.owed_by == user.id,
                models.ExpenseSplit.is_settled == False
            ).scalar() or 0
            
        # Amount I owe them (They paid, I am owed_by in splits)
        i_owe = db.query(func.sum(models.ExpenseSplit.amount))\
            .join(models.Expense, models.ExpenseSplit.expense_id == models.Expense.id)\
            .filter(
                models.Expense.paid_by == user.id,
                models.ExpenseSplit.owed_by == current_user_id,
                models.ExpenseSplit.is_settled == False
            ).scalar() or 0
            
        if owed_to_me > 0 or i_owe > 0:
            debt_summaries.append({
                "user_id": user.id,
                "user_name": user.name,
                "amount_owed_to_me": owed_to_me,
                "amount_i_owe": i_owe
            })
            
    return debt_summaries

@app.post("/debts/settle/{other_user_id}")
def settle_debts(other_user_id: int, current_user_id: int = 1, db: Session = Depends(get_db)):
    # Mark debts where I paid and they owe me as settled
    db.query(models.ExpenseSplit)\
        .join(models.Expense, models.ExpenseSplit.expense_id == models.Expense.id)\
        .filter(
            models.Expense.paid_by == current_user_id,
            models.ExpenseSplit.owed_by == other_user_id
        ).update({"is_settled": True})
        
    # Mark debts where they paid and I owe them as settled
    db.query(models.ExpenseSplit)\
        .join(models.Expense, models.ExpenseSplit.expense_id == models.Expense.id)\
        .filter(
            models.Expense.paid_by == other_user_id,
            models.ExpenseSplit.owed_by == current_user_id
        ).update({"is_settled": True})
        
    db.commit()
    return {"message": "Debts settled successfully"}


@app.get("/expenses/", response_model=List[schemas.Expense])
def read_expenses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    expenses = db.query(models.Expense).order_by(models.Expense.date.desc()).offset(skip).limit(limit).all()
    return expenses

@app.get("/categories/", response_model=List[schemas.Category])
def read_categories(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    categories = db.query(models.Category).offset(skip).limit(limit).all()
    return categories

from datetime import date
from sqlalchemy import func

@app.post("/allowances/", response_model=schemas.Allowance)
def set_allowance(allowance: schemas.AllowanceCreate, db: Session = Depends(get_db)):
    # Upsert allowance for the month
    db_allowance = db.query(models.Allowance).filter(
        models.Allowance.month == allowance.month,
        models.Allowance.year == allowance.year
    ).first()
    
    if db_allowance:
        db_allowance.initial_balance = allowance.initial_balance
    else:
        db_allowance = models.Allowance(**allowance.model_dump())
        db.add(db_allowance)
    
    db.commit()
    db.refresh(db_allowance)
    return db_allowance

@app.get("/summary/", response_model=schemas.Summary)
def get_summary(month: int = None, year: int = None, db: Session = Depends(get_db)):
    today = date.today()
    target_month = month or today.month
    target_year = year or today.year
    
    # Get allowance
    allowance = db.query(models.Allowance).filter(
        models.Allowance.month == target_month,
        models.Allowance.year == target_year
    ).first()
    allowance_amt = allowance.initial_balance if allowance else 0
    
    # Get total expenses
    total_expenses = db.query(func.sum(models.Expense.amount)).filter(
        func.extract('month', models.Expense.date) == target_month,
        func.extract('year', models.Expense.date) == target_year
    ).scalar() or 0
    
    balance = allowance_amt - total_expenses
    percentage_used = (total_expenses / allowance_amt * 100) if allowance_amt > 0 else 0
    
    return {
        "total_expenses": total_expenses,
        "allowance": allowance_amt,
        "balance": balance,
        "percentage_used": percentage_used
    }
