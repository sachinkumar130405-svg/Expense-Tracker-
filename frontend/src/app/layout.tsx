"use client";

import { Inter } from "next/font/google";
import { usePathname } from "next/navigation";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <html lang="en" className={inter.variable}>
      <head>
        <title>Expense Tracker</title>
        <meta name="description" content="A premium expense tracker for college students. Track spending, and manage your budget." />
      </head>
      <body>
        <div className="app-layout">
          {!isLoginPage && <Sidebar />}
          <main className={isLoginPage ? "" : "main-content"} style={isLoginPage ? { width: "100%", padding: 0 } : {}}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
