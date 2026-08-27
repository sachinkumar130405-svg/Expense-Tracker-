"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // For signup
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Apply saved theme on login page too
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isLogin) {
        // Login
        const res = await fetch(`${API}/login/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, password }),
        });
        
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem("user_id", data.user_id);
          localStorage.setItem("user_name", data.name);
          router.push("/");
        } else {
          const err = await res.json();
          setError(err.detail || "Invalid password");
        }
      } else {
        // Register
        // Generating a dummy email since backend requires it but UI doesn't need it
        const dummyEmail = `${name.toLowerCase().replace(/\s+/g, '')}${Math.floor(Math.random() * 1000)}@example.com`;
        
        const res = await fetch(`${API}/register/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            name, 
            email: dummyEmail, 
            password 
          }),
        });
        
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem("user_id", data.id);
          localStorage.setItem("user_name", data.name);
          router.push("/");
        } else {
          const err = await res.json();
          setError(err.detail || "Registration failed");
        }
      }
    } catch (err) {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-theme-toggle">
        <ThemeToggle />
      </div>

      <div className="card login-card">
        <div className="login-brand">
          <span className="brand-icon">⟐</span>
          <h1>
            EXPENSE <span style={{ color: "var(--accent)" }}>TRACKER</span>
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input 
              type="text" 
              placeholder="Your Name" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              placeholder="Enter your password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>

          {error && <div style={{ color: "var(--red)", fontSize: "0.85rem", marginBottom: "var(--spacing-md)", textAlign: "center" }}>{error}</div>}

          <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
            {isLoading ? "Please wait..." : (isLogin ? "Unlock Tracker" : "Create Account")}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "var(--spacing-xl)", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button 
            type="button" 
            onClick={() => { setIsLogin(!isLogin); setError(""); }} 
            style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", marginLeft: "8px", fontWeight: 600 }}
          >
            {isLogin ? "Create one" : "Login instead"}
          </button>
        </div>
      </div>
    </div>
  );
}
