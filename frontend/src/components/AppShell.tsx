"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/login";
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Apply saved theme on mount
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);

    // Auth guard: redirect to login if not authenticated
    const userId = localStorage.getItem("user_id");
    const userName = localStorage.getItem("user_name");
    if (!userId || !userName) {
      if (!isLoginPage) {
        router.push("/login");
        return;
      }
    }
    setIsReady(true);
  }, [pathname, isLoginPage, router]);

  // Don't render anything until auth check is done (prevents flash of empty dashboard)
  if (!isReady && !isLoginPage) {
    return (
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        minHeight: "100vh",
        background: "var(--bg-deep)",
        color: "var(--text-muted)"
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div className="app-layout">
      {!isLoginPage && <Sidebar />}
      <main className={isLoginPage ? "" : "main-content"} style={isLoginPage ? { width: "100%", padding: 0 } : {}}>
        {children}
      </main>
    </div>
  );
}
