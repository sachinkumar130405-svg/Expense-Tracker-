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
