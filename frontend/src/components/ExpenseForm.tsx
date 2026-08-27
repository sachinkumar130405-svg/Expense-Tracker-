"use client";

import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const QUICK_AMOUNTS = [20, 50, 100, 200, 500];

interface Category {
  id: number;
  name: string;
  is_default: boolean;
}

interface Expense {
  id: number;
  amount: number;
  description: string;
  date: string;
  category_id: number;
  is_income: boolean;
}

interface ExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  editExpense?: Expense | null;
}

export default function ExpenseForm({ isOpen, onClose, onSaved, editExpense }: ExpenseFormProps) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  
  // Date state
  const [isManualDate, setIsManualDate] = useState(false);
  const [manualDate, setManualDate] = useState("");
  
  // Income vs Expense
  const [isIncome, setIsIncome] = useState(false);

  // Helper to get current datetime in YYYY-MM-DDTHH:MM format for datetime-local input
  const getCurrentDateTimeLocal = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  };

  const now = new Date();
  const dateDisplay = now.toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
  const timeDisplay = now.toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit",
  });

  // When manual date is toggled on, pre-fill with current datetime
  const handleManualToggle = (checked: boolean) => {
    setIsManualDate(checked);
    if (checked && !manualDate) {
      setManualDate(getCurrentDateTimeLocal());
    }
  };

  useEffect(() => {
    fetch(`${API}/categories/`)
      .then(r => r.json())
      .then(data => {
        setCategories(data);
        if (data.length > 0 && !categoryId && !editExpense) setCategoryId(data[0].id);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (editExpense) {
      setAmount(editExpense.amount.toString());
      setDescription(editExpense.description);
      setCategoryId(editExpense.category_id);
      setIsIncome(editExpense.is_income || false);
      if (editExpense.date) {
        setIsManualDate(true);
        const d = new Date(editExpense.date);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        setManualDate(d.toISOString().slice(0, 16));
      }
    } else {
      setAmount("");
      setDescription("");
      setCategoryId(categories.length > 0 ? categories[0].id : 0);
      setIsManualDate(false);
      setManualDate("");
      setIsIncome(false);
    }
  }, [editExpense, isOpen, categories]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const res = await fetch(`${API}/categories/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      if (res.ok) {
        const newCat = await res.json();
        setCategories(prev => [...prev, newCat]);
        setCategoryId(newCat.id);
        setNewCategoryName("");
        setShowAddCategory(false);
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to add category");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const parsedAmount = parseFloat(amount);
    
    const userId = localStorage.getItem("user_id") || "1";
    const payload: any = {
      amount: parsedAmount,
      description,
      category_id: categoryId,
      paid_by: parseInt(userId),
      is_income: isIncome,
    };
    
    if (isManualDate && manualDate) {
      payload.date = new Date(manualDate).toISOString();
    }

    try {
      const url = editExpense ? `${API}/expenses/${editExpense.id}` : `${API}/expenses/`;
      const method = editExpense ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setAmount("");
        setDescription("");
        onSaved();
        onClose();
      } else {
        alert("Failed to log expense.");
      }
    } catch (error) {
      console.error(error);
      alert("Error connecting to server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{editExpense ? "Edit Expense" : "New Expense"}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Type Toggle */}
          <div className="form-group">
            <div style={{ display: "flex", background: "var(--bg-input)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
              <button 
                type="button" 
                onClick={() => setIsIncome(false)}
                style={{ flex: 1, padding: "10px", border: "none", cursor: "pointer", fontWeight: 600, background: !isIncome ? "var(--red)" : "transparent", color: !isIncome ? "#fff" : "var(--text-secondary)", transition: "0.2s" }}
              >
                Expense
              </button>
              <button 
                type="button" 
                onClick={() => setIsIncome(true)}
                style={{ flex: 1, padding: "10px", border: "none", cursor: "pointer", fontWeight: 600, background: isIncome ? "var(--green)" : "transparent", color: isIncome ? "#fff" : "var(--text-secondary)", transition: "0.2s" }}
              >
                Receive
              </button>
            </div>
          </div>
          
          {/* Date */}
          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-xs)" }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Date & Time</label>
              <label style={{ fontSize: "0.8rem", color: "var(--accent)", cursor: "pointer" }}>
                <input 
                  type="checkbox" 
                  checked={isManualDate} 
                  onChange={e => handleManualToggle(e.target.checked)} 
                  style={{ width: "auto", marginRight: "4px" }} 
                />
                Manual
              </label>
            </div>
            
            {isManualDate ? (
              <input 
                type="datetime-local" 
                value={manualDate}
                onChange={e => setManualDate(e.target.value)}
                required
              />
            ) : (
              <input type="text" value={`${dateDisplay}  •  ${timeDisplay}`} readOnly style={{ opacity: 0.7, cursor: "default" }} />
            )}
          </div>

          {/* Amount */}
          <div className="form-group">
            <label className="form-label">Amount (₹)</label>
            {!editExpense && (
              <div className="chip-container">
                {QUICK_AMOUNTS.map(amt => (
                  <button key={amt} type="button" className={`chip ${amount === amt.toString() ? "active" : ""}`} onClick={() => setAmount(amt.toString())}>
                    +₹{amt}
                  </button>
                ))}
              </div>
            )}
            <input type="number" placeholder="Or enter custom amount" value={amount} onChange={e => setAmount(e.target.value)} required step="0.01" />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description</label>
            <input type="text" placeholder="What was this for?" value={description} onChange={e => setDescription(e.target.value)} required />
          </div>

          {/* Category */}
          <div className="form-group">
            <label className="form-label">Category</label>
            <div className="chip-container">
              {categories.map(cat => (
                <button key={cat.id} type="button" className={`chip ${categoryId === cat.id ? "active" : ""}`} onClick={() => setCategoryId(cat.id)}>
                  {cat.name}
                </button>
              ))}
              <button type="button" className="chip" onClick={() => setShowAddCategory(!showAddCategory)} style={{ borderStyle: "dashed" }}>
                + Add
              </button>
            </div>
            {showAddCategory && (
              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <input
                  type="text"
                  placeholder="Category name"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  style={{ marginBottom: 0 }}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleAddCategory())}
                />
                <button type="button" className="btn btn-primary btn-sm" onClick={handleAddCategory} style={{ whiteSpace: "nowrap" }}>
                  Add
                </button>
              </div>
            )}
          </div>

          {/* Submit */}
          <div style={{ display: "flex", gap: "var(--spacing-sm)", marginTop: "var(--spacing-md)" }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2, background: isIncome ? "var(--green)" : "var(--accent)" }} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : (isIncome ? "Save Receive" : "Save Expense")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
