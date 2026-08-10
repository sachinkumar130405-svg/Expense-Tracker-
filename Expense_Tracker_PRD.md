# Product Requirements Document
**Project:** College Expense Tracker App
**Author:** Sachin Kumar, Institute of Engineering and Technology, Lucknow
**Date:** August 10, 2026

## 1. Executive Summary
The goal of this project is to build a mobile-first, lightweight expense tracking application tailored specifically for college students living in hostel environments. Standard financial apps are cluttered with irrelevant categories (e.g., mortgages, stock portfolios). This application focuses on rapid transaction entry, split expenses among peers, and tracking finite monthly allowances.

## 2. Target Audience & Use Cases
**Primary User:** Undergraduate students residing in hostels with a fixed monthly allowance or limited budget.

**Key Scenarios:**
* Logging everyday micro-transactions (canteen snacks, auto-rickshaw fares).
* Tracking hardware and academic purchases (e.g., ESP boards, sensors, printouts).
* Splitting bills with friends after late-night food deliveries or shared transportation.
* Monitoring when the monthly allowance drops to a critical level.

## 3. Feature Requirements

### 3.1. Expense Logging & Categories
* **Quick Add UI:** A persistent, accessible action button to log an expense in under 5 seconds.
* **Custom College Categories:**
    * *Food:* Mess fees, canteen snacks, food delivery.
    * *Transport:* E-rickshaws, autos, train tickets.
    * *Academics:* Stationery, electronics components, subscriptions (LeetCode, Spotify).
* **Quick-Select Amounts:** Pre-defined chips for frequent amounts (e.g., ₹20, ₹50, ₹100) to minimize keyboard usage.

### 3.2. Split & Debt Tracking
A core module dedicated to peer-to-peer lending and splitting bills.
* Ability to log an expense and split it evenly or custom-wise with contacts.
* "Who owes me" and "Who I owe" dashboard view.
* Option to settle debts with a single click.

### 3.3. Budgeting & Visualization
* **Monthly Allowance Setting:** Input a starting balance at the beginning of the month.
* **Visual Indicators:** Progress bars that change color (e.g., green to red) as the budget depletes, with a strict warning at 20% remaining.
* **Dashboard Charts:** Weekly spending bar chart on the main screen.

## 4. Technical Specifications

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | React / Next.js | Component-based architecture ideal for dynamic, mobile-first SPAs. |
| **Backend** | Python (FastAPI) | High performance, easy to build RESTful APIs, excellent for potential data analytics. |
| **Database** | PostgreSQL | Robust relational database for ensuring ACID compliance with financial transactions. |
| **Deployment** | Docker | Containerization ensures consistency across environments and simplifies hosting. |

> **UI/UX Note:** The application should default to a Dark Mode theme with high-contrast accent colors. The dashboard must be the landing page, immediately displaying the current balance and recent transactions.

## 5. Future Enhancements (Phase 2)
* Integration with AI to categorize expenses automatically based on notes.
* Exporting monthly reports to PDF or Excel.
* Group trip/hackathon expense mode.
