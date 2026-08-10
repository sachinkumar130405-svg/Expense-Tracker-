"use client";

import DebtDashboard from "@/components/DebtDashboard";

export default function DebtsPage() {
  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Debts</h1>
        <p className="page-subtitle">Track who owes you and who you owe</p>
      </div>

      <DebtDashboard />
    </>
  );
}
