"use client";

import { useState, useEffect } from "react";
import ExpenseForm from "@/components/ExpenseForm";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Expense {
  id: number;
  amount: number;
  description: string;
  date: string;
  category_id: number;
  category_name: string | null;
  is_income: boolean;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  const fetchExpenses = () => {
    const userId = localStorage.getItem("user_id");
    fetch(`${API}/expenses/${userId ? `?user_id=${userId}` : ""}`)
      .then(r => r.json())
      .then(data => setExpenses(data.map((e: any) => ({ ...e, amount: Number(e.amount) }))))
      .catch(console.error);
  };

  useEffect(() => { fetchExpenses(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    try {
      const res = await fetch(`${API}/expenses/${id}`, { method: "DELETE" });
      if (res.ok) fetchExpenses();
      else alert("Failed to delete expense");
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (exp: Expense) => {
    setExpenseToEdit(exp);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setExpenseToEdit(null);
  };

  return (
    <>
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="page-subtitle">{expenses.length} total transactions</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + New Expense
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {expenses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <p className="empty-state-text">No expenses yet. Click "+ New Expense" to get started!</p>
          </div>
        ) : (
          <table className="expense-table">
            <thead>
              <tr>
                <th>Details</th>
                <th>Category</th>
                <th style={{ textAlign: "right" }}>Amount</th>
                <th style={{ textAlign: "right", width: "100px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(exp => (
                <tr key={exp.id}>
                  <td>
                    <div className="expense-detail-date">
                      {new Date(exp.date).toLocaleDateString("en-IN", {
                        day: "2-digit", month: "2-digit", year: "numeric",
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </div>
                    <div className="expense-detail-desc">{exp.description || "—"}</div>
                  </td>
                  <td>
                    <span className="category-badge">{exp.category_name || "Uncategorized"}</span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <span className="expense-amount" style={{ color: exp.is_income ? "var(--green)" : "var(--accent)" }}>
                      {exp.is_income ? "+" : "-"}₹{exp.amount.toFixed(2)}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                      <button onClick={() => handleEdit(exp)} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: "1rem" }}>✏️</button>
                      <button onClick={() => handleDelete(exp.id)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: "1rem" }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ExpenseForm isOpen={showForm} onClose={handleFormClose} onSaved={fetchExpenses} editExpense={expenseToEdit} />
    </>
  );
}
