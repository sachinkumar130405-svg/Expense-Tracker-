from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

class ExpenseSplitBase(BaseModel):
    owed_by: int
    amount: Decimal

class ExpenseSplitCreate(ExpenseSplitBase):
    pass

class ExpenseSplit(ExpenseSplitBase):
    id: int
    expense_id: int
    is_settled: bool

    class Config:
        from_attributes = True

class ExpenseBase(BaseModel):
    amount: Decimal
    description: Optional[str] = None
    category_id: Optional[int] = None
    paid_by: Optional[int] = None

class ExpenseCreate(ExpenseBase):
    splits: Optional[List[ExpenseSplitCreate]] = None

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

class DebtSummary(BaseModel):
    user_id: int
    user_name: str
    amount_owed_to_me: Decimal
    amount_i_owe: Decimal
