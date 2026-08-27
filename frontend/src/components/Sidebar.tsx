"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/expenses", label: "Expenses", icon: "💳" },
  { href: "/history", label: "History", icon: "📜" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    const storedName = localStorage.getItem("user_name");
    if (storedName) {
      setUserName(storedName);
    } else {
      router.push("/login");
    }
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
    router.push("/login");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-icon">⟐</span>
        <h1>
          EXPENSE <span className="brand-text-accent">TRACKER</span>
        </h1>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-link ${pathname === item.href ? "active" : ""}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <ThemeToggle />

      <div className="sidebar-user" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="sidebar-user-name">{userName}</div>
          <div className="sidebar-user-email text-muted">User</div>
        </div>
        <button onClick={handleLogout} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px" }} title="Logout">
          🚪
        </button>
      </div>
    </aside>
  );
}
