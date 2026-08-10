from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal

class ExpenseBase(BaseModel):
    amount: Decimal
    description: Optional[str] = None
    category_id: Optional[int] = None
    paid_by: Optional[int] = None

class ExpenseCreate(ExpenseBase):
    pass

class Expense(ExpenseBase):
    id: int
    date: datetime

    class Config:
        from_attributes = True

class CategoryBase(BaseModel):
    name: str
    is_default: bool = False

class Category(CategoryBase):
    id: int

    class Config:
        from_attributes = True

class AllowanceBase(BaseModel):
    month: int
    year: int
    initial_balance: Decimal

class AllowanceCreate(AllowanceBase):
    pass

class Allowance(AllowanceBase):
    id: int
    user_id: Optional[int] = None

    class Config:
        from_attributes = True

class Summary(BaseModel):
    total_expenses: Decimal
    allowance: Decimal
    balance: Decimal
    percentage_used: Decimal
