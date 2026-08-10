from sqlalchemy import Column, Integer, String, Boolean, DECIMAL, ForeignKey, Text, TIMESTAMP, func
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    is_default = Column(Boolean, default=False)

class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(DECIMAL(10, 2), nullable=False)
    description = Column(Text)
    date = Column(TIMESTAMP, server_default=func.now())
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"))
    paid_by = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))

    category = relationship("Category")
    user = relationship("User")

class Allowance(Base):
    __tablename__ = "allowances"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True) # Optional for MVP
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    initial_balance = Column(DECIMAL(10, 2), nullable=False)

class ExpenseSplit(Base):
    __tablename__ = "expense_splits"
    id = Column(Integer, primary_key=True, index=True)
    expense_id = Column(Integer, ForeignKey("expenses.id", ondelete="CASCADE"))
    owed_by = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    amount = Column(DECIMAL(10, 2), nullable=False)
    is_settled = Column(Boolean, default=False)
    
    expense = relationship("Expense")
    debtor = relationship("User")
