# College Expense Tracker

A lightweight, mobile-first expense tracking application tailored specifically for college students living in hostel environments. 
It focuses on rapid transaction entry, shared expenses/split bills, and tracking finite monthly allowances.

## Features

- **Dark Mode UI:** High-contrast, dynamic aesthetic that feels premium.
- **Quick-Add Expense:** Log micro-transactions in under 5 seconds with pre-defined amount chips (e.g. ₹20, ₹50).
- **Custom College Categories:** Relevant categories like Food, Transport, and Academics.
- **Receive & Expense Tracking:** Differentiate between spending and receiving money with visual indicators.
- **Monthly Budgeting:** Set your monthly allowance and track your spending with a color-coded visual indicator.
- **Multi-User Support:** User scoping ensures that your expenses and data are securely isolated to your account.
- **Dynamic Charts:** View weekly and monthly spending trends with responsive bar charts and categorized pie charts.
- **Historical Data:** Navigate through past months to view summaries and breakdowns of previous expenses.

## Technology Stack

- **Frontend:** Next.js (React), App Router, Vanilla CSS
- **Backend:** Python, FastAPI, SQLAlchemy, Pydantic
- **Database:** SQLite (Default for local development) / PostgreSQL (Supported via DATABASE_URL)
- **Deployment:** Docker & Docker Compose (Optional)

## Local Development Setup

Follow these detailed instructions to set up the application locally on your machine.

### Prerequisites
- Python 3.8+
- Node.js 16+ & npm

### Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```
2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   ```
3. **Activate the virtual environment:**
   - **Windows:** 
     ```bash
     .\venv\Scripts\activate
     ```
   - **Linux/Mac:** 
     ```bash
     source venv/bin/activate
     ```
4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
5. **Start the backend server:**
   The SQLite database (`expense_tracker.db`) will be automatically created on the first run.
   ```bash
   python -m uvicorn main:app --reload --port 8000
   ```

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Start the development server:**
   ```bash
   npm run dev
   ```

### Accessing the Application

- **Frontend App:** Open your browser and go to `http://localhost:3000`
- **Backend API Docs:** Open your browser and go to `http://localhost:8000/docs`

> **Note:** The application comes with default test users (e.g., "Sachin Kumar" with password "password123").

## Quick Start (Docker)

If you prefer using Docker to run the full stack:

1. Ensure Docker and Docker Compose are installed.
2. Clone the repository and navigate to the project root.
3. Run the following command:
   ```bash
   docker-compose up --build
   ```
4. Access the frontend at `http://localhost:3000` and API docs at `http://localhost:8000/docs`.
