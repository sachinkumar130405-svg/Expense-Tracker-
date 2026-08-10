# College Expense Tracker

A lightweight, mobile-first expense tracking application tailored specifically for college students living in hostel environments. 
It focuses on rapid transaction entry, shared expenses/split bills, and tracking finite monthly allowances.

## Features

- **Dark Mode UI:** High-contrast, dynamic aesthetic that feels premium.
- **Quick-Add Expense:** Log micro-transactions in under 5 seconds with pre-defined amount chips (e.g. ₹20, ₹50).
- **Custom College Categories:** Relevant categories like Food, Transport, and Academics.
- **Monthly Budgeting:** Set your monthly allowance and track your spending with a color-coded visual indicator.
- **Split & Debt Tracking:** (Coming soon in Phase 4) Track who owes you and who you owe.

## Technology Stack

- **Frontend:** Next.js (React), App Router, Vanilla CSS
- **Backend:** Python, FastAPI, SQLAlchemy, Pydantic
- **Database:** PostgreSQL
- **Deployment:** Docker & Docker Compose

## Quick Start (Docker)

To run the full stack locally using Docker:

1. Ensure Docker and Docker Compose are installed.
2. Clone the repository and navigate to the project root.
3. Run the following command:
   ```bash
   docker-compose up --build
   ```
4. Access the frontend at `http://localhost:3000`
5. Access the backend API docs at `http://localhost:8000/docs`

## Local Development (Without Docker)

### Backend Setup
1. `cd backend`
2. `python -m venv venv`
3. Activate the virtual environment:
   - Windows: `.\venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`
4. `pip install -r requirements.txt`
5. Ensure PostgreSQL is running locally with a database named `expensetracker`.
6. `uvicorn main:app --reload`

### Frontend Setup
1. `cd frontend`
2. `npm install`
3. `npm run dev`

## Roadmap
- [x] Phase 1: Foundation & Project Setup
- [x] Phase 2: Core Expense Logging
- [x] Phase 3: Dashboard & Budgeting
- [ ] Phase 4: Split & Debt Tracking
- [ ] Phase 5: Final Polish, Testing & Deployment
