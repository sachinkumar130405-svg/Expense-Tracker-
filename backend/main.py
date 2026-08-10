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
    db_expense = models.Expense(**expense.model_dump())
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

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
