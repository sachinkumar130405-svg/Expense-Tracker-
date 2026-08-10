"use client";

import { useState, useEffect, useRef } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const PIE_COLORS = ["#00d4aa", "#bb86fc", "#e040fb", "#ff9800", "#448aff", "#69f0ae", "#ff5252", "#00bcd4"];

interface ChartPoint {
  label: string;
  total: number;
}

interface SummaryData {
  total_expenses: number;
  allowance: number;
  balance: number;
  percentage_used: number;
}

export default function DashboardStats() {
  const [summary, setSummary] = useState<SummaryData & { total_income?: number }>({
    total_expenses: 0, allowance: 0, balance: 0, percentage_used: 0, total_income: 0
  });
  const [barData, setBarData] = useState<ChartPoint[]>([]);
  const [weeklySummary, setWeeklySummary] = useState<ChartPoint[]>([]);
  const [pieData, setPieData] = useState<ChartPoint[]>([]);
  const [chartPeriod, setChartPeriod] = useState<"week" | "month">("week");
  const [isSettingAllowance, setIsSettingAllowance] = useState(false);
  const [newAllowance, setNewAllowance] = useState("");
  const pieCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    fetch(`${API}/summary/${userId ? `?user_id=${userId}` : ""}`).then(r => r.json()).then(data => {
      setSummary({
        total_expenses: Number(data.total_expenses),
        allowance: Number(data.allowance),
        balance: Number(data.balance),
        percentage_used: Number(data.percentage_used),
        total_income: Number(data.total_income || 0),
      });
    }).catch(console.error);
  }, []);

  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    fetch(`${API}/expenses/chart-data/?period=${chartPeriod}${userId ? `&user_id=${userId}` : ""}`)
      .then(r => r.json())
      .then(data => {
        if (chartPeriod === "month") {
          setBarData(data.daily.map((d: any) => ({ label: d.label, total: Number(d.total) })));
          setWeeklySummary(data.weekly.map((d: any) => ({ label: d.label, total: Number(d.total) })));
        } else {
          setBarData(data.map((d: any) => ({ label: d.label, total: Number(d.total) })));
          setWeeklySummary([]);
        }
      })
      .catch(console.error);
  }, [chartPeriod]);

  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    fetch(`${API}/expenses/category-breakdown/${userId ? `?user_id=${userId}` : ""}`)
      .then(r => r.json())
      .then(data => setPieData(data.map((d: any) => ({ label: d.label, total: Number(d.total) }))))
      .catch(console.error);
  }, []);

  // Draw pie chart
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

  const maxBar = Math.max(...barData.map(d => d.total), 1);

  const handleSetAllowance = async (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date();
    const userId = localStorage.getItem("user_id");
    try {
      await fetch(`${API}/allowances/${userId ? `?user_id=${userId}` : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: today.getMonth() + 1,
          year: today.getFullYear(),
          initial_balance: parseFloat(newAllowance),
        }),
      });
      setIsSettingAllowance(false);
      setNewAllowance("");
      window.location.reload();
    } catch (error) {
      console.error(error);
    }
  };

  const getAllowanceColor = () => {
    if (summary.percentage_used >= 100) return "var(--red)";
    if (summary.percentage_used >= 80) return "var(--orange)";
    return "var(--accent)";
  };

  return (
    <>
      {/* Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Spent this month</span>
          <span className="stat-value accent">₹{summary.total_expenses.toFixed(0)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Allowance + Receive</span>
          {summary.allowance > 0 || (summary.total_income && summary.total_income > 0) ? (
            <span className="stat-value purple">
              ₹{((summary.allowance || 0) + (summary.total_income || 0)).toFixed(0)}
            </span>
          ) : (
            <button className="btn btn-secondary btn-sm" onClick={() => setIsSettingAllowance(true)}>
              Set Budget
            </button>
          )}
        </div>
        <div className="stat-card">
          <span className="stat-label">Balance</span>
          <span className={`stat-value ${summary.balance < 0 ? "red" : "green"}`}>
            ₹{summary.balance.toFixed(0)}
          </span>
          {summary.allowance > 0 && (
            <div className="allowance-bar-bg">
              <div
                className="allowance-bar-fill"
                style={{
                  width: `${Math.min(summary.percentage_used, 100)}%`,
                  backgroundColor: getAllowanceColor(),
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Allowance Modal */}
      {isSettingAllowance && (
        <div className="modal-overlay" onClick={() => setIsSettingAllowance(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Set Monthly Budget</h2>
              <button className="modal-close" onClick={() => setIsSettingAllowance(false)}>×</button>
            </div>
            <form onSubmit={handleSetAllowance}>
              <div className="form-group">
                <label className="form-label">Amount (₹)</label>
                <input
                  type="number"
                  value={newAllowance}
                  onChange={e => setNewAllowance(e.target.value)}
                  placeholder="e.g. 5000"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block">Save Budget</button>
            </form>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="charts-grid">
        {/* Bar Chart */}
        <div className="card" style={{ position: "relative", gridColumn: chartPeriod === "month" ? "1 / -1" : "auto" }}>
          <div className="chart-header">
            <h3 className="card-title" style={{ marginBottom: 0 }}>Spending Trend</h3>
            <div className="chart-toggle">
              <button className={chartPeriod === "week" ? "active" : ""} onClick={() => setChartPeriod("week")}>Week</button>
              <button className={chartPeriod === "month" ? "active" : ""} onClick={() => setChartPeriod("month")}>Month</button>
            </div>
          </div>
          
          {chartPeriod === "month" && weeklySummary.length > 0 && (
            <div style={{
              position: "absolute", 
              top: "var(--spacing-3xl)", 
              right: "var(--spacing-lg)", 
              background: "var(--bg-deep)",
              padding: "var(--spacing-sm)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              fontSize: "0.7rem",
              zIndex: 10
            }}>
              <div style={{ fontWeight: 600, marginBottom: "4px", color: "var(--text-secondary)" }}>Weekly Summary</div>
              {weeklySummary.map(w => (
                <div key={w.label} style={{ display: "flex", justifyContent: "space-between", gap: "12px", margin: "2px 0" }}>
                  <span>{w.label}</span>
                  <span style={{ color: "var(--text-primary)" }}>₹{w.total.toFixed(0)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="bar-chart" style={{ paddingRight: chartPeriod === "month" ? "100px" : "0", overflowX: "auto" }}>
            {barData.map((item, i) => {
              // Calculate percentage relative to max bar
              const heightPercent = maxBar === 0 ? 0 : (item.total / maxBar) * 100;
              return (
                <div className="bar-column" key={i} style={{ minWidth: chartPeriod === "month" ? "20px" : "auto", height: "100%", justifyContent: "flex-end" }}>
                  {chartPeriod === "week" && <span className="bar-value">₹{item.total.toFixed(0)}</span>}
                  {chartPeriod === "month" && item.total > 0 && <span className="bar-value" style={{ fontSize: "0.5rem" }}>₹{item.total.toFixed(0)}</span>}
                  <div className="bar" style={{ height: item.total === 0 ? "0%" : `${Math.max(heightPercent, 2)}%`, background: item.total === 0 ? "transparent" : "var(--accent)" }} title={`₹${item.total.toFixed(0)}`} />
                  <span className="bar-label">{item.label}</span>
                </div>
              );
            })}
            {barData.length === 0 && (
              <div className="empty-state">
                <p className="empty-state-text">No data yet</p>
              </div>
            )}
          </div>
        </div>

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
              <p className="empty-state-text">Add expenses to see breakdown</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
