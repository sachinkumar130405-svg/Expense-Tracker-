"use client";

import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Debt {
  user_id: number;
  user_name: string;
  amount_owed_to_me: number;
  amount_i_owe: number;
}

export default function DebtDashboard() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDebts = async () => {
    try {
      const res = await fetch(`${API}/debts/`);
      if (res.ok) {
        const data = await res.json();
        setDebts(data.map((d: any) => ({
          ...d,
          amount_owed_to_me: Number(d.amount_owed_to_me),
          amount_i_owe: Number(d.amount_i_owe),
        })));
      }
    } catch (error) {
      console.error("Failed to fetch debts", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchDebts(); }, []);

  const handleSettle = async (userId: number) => {
    try {
      const res = await fetch(`${API}/debts/settle/${userId}`, { method: "POST" });
      if (res.ok) {
        fetchDebts();
      } else {
        alert("Failed to settle debt");
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (isLoading) return <div className="card"><p className="text-muted">Loading debts...</p></div>;

  return (
    <div className="card">
      <h3 className="card-title">Split & Debt Tracking</h3>
      {debts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✅</div>
          <p className="empty-state-text">You're all settled up! No active debts.</p>
        </div>
      ) : (
        debts.map(debt => (
          <div className="debt-card" key={debt.user_id}>
            <div className="debt-info">
              <h3>{debt.user_name}</h3>
              <div className="debt-amounts">
                {debt.amount_owed_to_me > 0 && (
                  <span className="debt-owed">Owes you: <strong>₹{debt.amount_owed_to_me.toFixed(0)}</strong></span>
                )}
                {debt.amount_i_owe > 0 && (
                  <span className="debt-owe">You owe: <strong>₹{debt.amount_i_owe.toFixed(0)}</strong></span>
                )}
              </div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => handleSettle(debt.user_id)}>
              Settle
            </button>
          </div>
        ))
      )}
    </div>
  );
}
