# PrimeTrade — Crypto Portfolio Tracker (Backend Developer Project)

This project is a submission for the Backend Developer (Intern) assignment at PrimeTrade. It demonstrates a secure, scalable backend system built with a corresponding frontend UI to interact with the APIs.

## 🌟 Core Features Implemented

### ✅ Backend (FastAPI + Async SQLAlchemy)
*   **Authentication & Registration:** Secure user registration and login endpoints utilizing password hashing (`bcrypt`) and JWT authentication.
*   **Role-Based Access Control (RBAC):** Built-in support for `USER` and `ADMIN` roles. Specific endpoints (like deleting users or creating global events) are restricted to `ADMIN` accounts.
*   **Full CRUD APIs:** 
    *   **Trades:** Secondary entity supporting full Create, Read, Update, and Delete operations for crypto trades.
    *   **Events (Calendar):** Additional entity for Admins to manage a global economic calendar.
*   **API Versioning & Modularity:** Clean REST principles with API versioning (e.g., `/api/v1/trades`, `/api/v1/auth`). Organized using FastAPI routers.
*   **Database Schema:** Asynchronous SQLite database (`aiosqlite`) managed via SQLAlchemy ORM models with relational constraints (Users 1:N Trades).
*   **API Documentation:** Interactive Swagger UI automatically generated and available at `/docs`.

### ✅ Basic Frontend (React + Vite)
*   **Authentication UI:** Simple and clean generic Login/Registration pages.
*   **Protected Dashboard:** Dashboard route locked behind an AuthContext. Uses HTTP Interceptors to attach the JWT token automatically to every outgoing API request.
*   **CRUD Actions:** Fully integrated UI to add, edit, and delete trades in the portfolio section. Integrated UI for admins to manipulate the event calendar.
*   **Feedback:** Toast notifications provided for all API responses (success/errors).

### ✅ Security & Scalability
*   **Secure JWT Handling:** JWT tokens are managed via Context and securely passed in headers.
*   **Input Validation:** Pydantic schemas enforce type safety, input sanitization, and data validation at the boundaries of the API.
*   **Performant Async Architecture:** The backend was entirely refactored from standard sync operations to `async` (using `AsyncSession` and `create_async_engine`). This allows the API to handle high concurrency, crucial for scaling trading systems.

---

## 🚀 How to Run Locally
Python 3.10+ is highly recommended
### 1. Start the Backend
```bash
cd backend
# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate  # On Windows

# Install dependencies
pip install -r requirements.txt

# Start the async server
uvicorn main:app --port 5000 --reload
```
*Note: The database (`primetrade.db`) is automatically created and seeded with mock users and trades upon startup using the FastAPI `lifespan` manager.*

**Default Credentials for Testing:**
*   **Admin:** `admin@primetrade.ai` / `Admin@123`
*   **Trader:** `trader@primetrade.ai` / `Trader@123`

### 2. Start the Frontend (Separate Terminal)
```bash
# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

---

## 📈 Scalability Note
While this assignment uses SQLite for simplicity and portability, the architecture is designed to map directly to enterprise-grade systems:

1.  **Database Migration:** The ORM layer (SQLAlchemy) allows an immediate drop-in replacement of SQLite with PostgreSQL (`asyncpg`) without changing any application logic.
2.  **Stateless API:** The backend API is entirely stateless (JWT based). This enables horizontal scaling across multiple instances sitting behind a Load Balancer (like Nginx or AWS ALB).
3.  **Caching Potential:** For heavy endpoints (like summarizing all trades or fetching live market prices), incorporating Redis for temporary response caching would immediately lower database latency.
4.  **Microservices Readiness:** The modular routing structure (Auth, Users, Trades, Events) allows specific high-traffic modules to be extracted into standalone microservices easily.
