"use client";

import { useState, useEffect, useRef } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const PIE_COLORS = ["#7692FF", "#BDB2FF", "#e040fb", "#ff9800", "#448aff", "#69f0ae", "#ff5252", "#00bcd4"];

interface Category {
  id: number;
  name: string;
  is_default: boolean;
}

export default function HistoryPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  
  const [summary, setSummary] = useState({
    total_expenses: 0, allowance: 0, balance: 0, percentage_used: 0, total_income: 0
  });
  const [pieData, setPieData] = useState<{label: string, total: number}[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const pieCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Fetch categories once
    fetch(`${API}/categories/`)
      .then(r => r.json())
      .then(data => setCategories(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    // Fetch summary
    fetch(`${API}/summary/?month=${month}&year=${year}${userId ? `&user_id=${userId}` : ""}`)
      .then(r => r.json())
      .then(data => {
        setSummary({
          total_expenses: Number(data.total_expenses),
          allowance: Number(data.allowance),
          balance: Number(data.balance),
          percentage_used: Number(data.percentage_used),
          total_income: Number(data.total_income || 0),
        });
      })
      .catch(console.error);

    // Fetch breakdown
    fetch(`${API}/expenses/category-breakdown/?month=${month}&year=${year}${userId ? `&user_id=${userId}` : ""}`)
      .then(r => r.json())
      .then(data => setPieData(data.map((d: any) => ({ label: d.label, total: Number(d.total) }))))
      .catch(console.error);
      
    // Fetch expenses
    fetch(`${API}/expenses/?month=${month}&year=${year}${userId ? `&user_id=${userId}` : ""}`)
      .then(r => r.json())
      .then(data => setExpenses(data.map((e: any) => ({ ...e, amount: Number(e.amount) }))))
      .catch(console.error);
    
    // Reset category filter on month/year change
    setSelectedCategory("All");
  }, [month, year]);

  useEffect(() => {
    const canvas = pieCanvasRef.current;
    if (!canvas || pieData.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 160;
    canvas.width = size;
    canvas.height = size;
    const cx = size / 2;
    const cy = size / 2;
    const radius = 65;
    const innerRadius = 40;

    ctx.clearRect(0, 0, size, size);

    const total = pieData.reduce((sum, d) => sum + d.total, 0);
    let startAngle = -Math.PI / 2;

    pieData.forEach((item, i) => {
      const sliceAngle = (item.total / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
      ctx.arc(cx, cy, innerRadius, startAngle + sliceAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = PIE_COLORS[i % PIE_COLORS.length];
      ctx.fill();
      startAngle += sliceAngle;
    });
  }, [pieData]);

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const years = Array.from({length: 5}, (_, i) => now.getFullYear() - i);

  // Filter expenses by selected category
  const filteredExpenses = selectedCategory === "All" 
    ? expenses 
    : expenses.filter(exp => (exp.category_name || "Uncategorized") === selectedCategory);

  // Get unique category names from loaded expenses for filter chips
  const expenseCategories = [...new Set(expenses.map(exp => exp.category_name || "Uncategorized"))];

  // Bar chart: max value for scaling
  const maxBarValue = Math.max(...pieData.map(d => d.total), 1);

  return (
    <>
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">History</h1>
          <p className="page-subtitle">View past months</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <select 
            value={month} 
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="styled-select"
          >
            {months.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select 
            value={year} 
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="styled-select"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Spent</span>
          <span className="stat-value accent">₹{summary.total_expenses.toFixed(0)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Allowance + Receive</span>
          <span className="stat-value purple">₹{((summary.allowance || 0) + (summary.total_income || 0)).toFixed(0)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Balance</span>
          <span className={`stat-value ${summary.balance < 0 ? "red" : "green"}`}>
            ₹{summary.balance.toFixed(0)}
          </span>
        </div>
      </div>

      <div className="charts-grid" style={{ marginTop: "var(--spacing-xl)" }}>
        {/* Pie Chart */}
        <div className="card">
          <h3 className="card-title">Category Breakdown</h3>
          {pieData.length > 0 ? (
            <div className="pie-chart-wrapper">
              <canvas ref={pieCanvasRef} className="pie-chart-canvas" />
              <div className="pie-legend">
                {pieData.map((item, i) => (
                  <div className="pie-legend-item" key={i}>
                    <span className="pie-legend-dot" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="pie-legend-label">{item.label}</span>
                    <span className="pie-legend-value">₹{item.total.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p className="empty-state-text">No expenses for this period</p>
            </div>
          )}
        </div>

        {/* Horizontal Bar Chart - Category Comparison */}
        <div className="card">
          <h3 className="card-title">Spending by Category</h3>
          {pieData.length > 0 ? (
            <div className="history-bar-chart">
              {pieData.sort((a, b) => b.total - a.total).map((item, i) => {
                const widthPercent = (item.total / maxBarValue) * 100;
                return (
                  <div className="history-bar-row" key={i}>
                    <span className="history-bar-label">{item.label}</span>
                    <div className="history-bar-track">
                      <div 
                        className="history-bar-fill" 
                        style={{ 
                          width: `${Math.max(widthPercent, 8)}%`,
                          background: `linear-gradient(90deg, ${PIE_COLORS[i % PIE_COLORS.length]}, ${PIE_COLORS[i % PIE_COLORS.length]}88)`,
                        }}
                      >
                        <span className="history-bar-amount">₹{item.total.toFixed(0)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <p className="empty-state-text">No data to display</p>
            </div>
          )}
        </div>
      </div>

      {/* Category Filter + Transactions Table */}
      <div className="card" style={{ marginTop: "var(--spacing-md)" }}>
        <h3 className="card-title">Monthly Transactions</h3>
        
        {/* Category filter chips */}
        {expenseCategories.length > 0 && (
          <div className="category-filter">
            <button 
              className={`category-filter-chip ${selectedCategory === "All" ? "active" : ""}`}
              onClick={() => setSelectedCategory("All")}
            >
              All ({expenses.length})
            </button>
            {expenseCategories.map(cat => {
              const count = expenses.filter(e => (e.category_name || "Uncategorized") === cat).length;
              return (
                <button 
                  key={cat}
                  className={`category-filter-chip ${selectedCategory === cat ? "active" : ""}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        )}

        {filteredExpenses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <p className="empty-state-text">
              {selectedCategory === "All" 
                ? "No expenses logged for this month" 
                : `No ${selectedCategory} expenses this month`}
            </p>
          </div>
        ) : (
          <table className="expense-table">
            <thead>
              <tr>
                <th>Details</th>
                <th>Category</th>
                <th style={{ textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map(exp => (
                <tr key={exp.id}>
                  <td>
                    <div className="expense-detail-date">
                      {new Date(exp.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
