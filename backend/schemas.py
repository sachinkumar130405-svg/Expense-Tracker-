from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

# --- Auth ---
class UserRegister(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    name: str
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True

# --- Expense Splits ---
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

# --- Categories ---
class CategoryBase(BaseModel):
    name: str
    is_default: bool = False

class CategoryCreate(BaseModel):
    name: str

class Category(CategoryBase):
    id: int

    class Config:
        from_attributes = True

# --- Expenses ---
class ExpenseBase(BaseModel):
    amount: Decimal
    description: Optional[str] = None
    category_id: Optional[int] = None
    paid_by: Optional[int] = None
    is_income: bool = False

class ExpenseCreate(ExpenseBase):
    date: Optional[datetime] = None
    splits: Optional[List[ExpenseSplitCreate]] = None

class ExpenseUpdate(BaseModel):
    amount: Optional[Decimal] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    date: Optional[datetime] = None
    is_income: Optional[bool] = None

class Expense(ExpenseBase):
    id: int
    date: datetime
    category_name: Optional[str] = None

    class Config:
        from_attributes = True

# --- Allowance ---
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

# --- Summary ---
class Summary(BaseModel):
    total_expenses: Decimal
    total_income: Decimal
    allowance: Decimal
    balance: Decimal
    percentage_used: Decimal

# --- Charts ---
class ChartDataPoint(BaseModel):
    label: str
    total: Decimal

class WeeklySummary(BaseModel):
    label: str
    total: Decimal

# --- Debts ---
class DebtSummary(BaseModel):
    user_id: int
    user_name: str
    amount_owed_to_me: Decimal
    amount_i_owe: Decimal
