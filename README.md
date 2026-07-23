<div align="center">
  <img src="https://via.placeholder.com/150x150/050508/FFFFFF?text=SchemaFlow" alt="SchemaFlow Logo" width="150"/>
  <h1>SchemaFlow</h1>
  <p><strong>Enterprise-grade AI SQL Agent</strong></p>

  [![Python](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-green.svg)](https://fastapi.tiangolo.com/)
  [![Next.js](https://img.shields.io/badge/Next.js-14.2.3-black.svg)](https://nextjs.org/)
</div>

---

## Overview

**SchemaFlow** is a modern, full-stack application that bridges the gap between natural language and complex database operations. Designed for non-technical stakeholders and data analysts alike, SchemaFlow allows users to securely connect to remote databases (PostgreSQL, MySQL, SQLite) and generate safe, read-only SQL queries using plain English.

---

## Features

- **Multi-Database Support:** Connect to PostgreSQL, MySQL, or SQLite databases effortlessly.
- **Natural Language to SQL:** Leverage state-of-the-art LLMs (powered by NVIDIA's API) to instantly translate plain English into optimized SQL.
- **Enterprise Security:** 
  - Strict read-only query enforcement (blocks `DROP`, `DELETE`, `UPDATE`, etc.).
  - Automatic masking of sensitive columns (e.g., passwords, credit cards) before schema metadata ever touches an AI model.
  - JWT-based user authentication and role-based access.
- **Instant Data Visualization:** Automatically generates Recharts (Bar, Line, Area) based on the SQL query results.
- **Premium UI/UX:** Built with a highly responsive, modern "Bento Grid" brutalist aesthetic.

---

## Tech Stack

### Frontend
- **Framework:** [Next.js (App Router)](https://nextjs.org/) & [React](https://reactjs.org/)
- **Styling:** Tailwind CSS & Vanilla CSS (Custom Design System)
- **Data Visualization:** [Recharts](https://recharts.org/)
- **Animation:** Framer Motion

### Backend
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.12)
- **ORM:** [SQLAlchemy](https://www.sqlalchemy.org/)
- **Authentication:** JWT (JSON Web Tokens)
- **LLM Integration:** OpenAI SDK wrapped for NVIDIA NIM API

---

## Architecture

SchemaFlow relies on a decoupled architecture. The Next.js frontend handles state (AuthContext, SessionContext) and rendering, while the FastAPI backend orchestrates database connections, schema extraction, and LLM prompt building.

```mermaid
graph TD
    A[User / Frontend] -->|Connects DB| B(FastAPI Backend)
    B -->|Extracts Schema| C[(Target Database)]
    C -->|Returns Metadata| B
    B -->|Masks Sensitive Data| B
    A -->|Asks Question| B
    B -->|Builds Prompt| D[NVIDIA API / LLM]
    D -->|Returns Raw SQL| B
    B -->|Validates Safety| B
    B -->|Executes Query| C
    C -->|Returns Data| B
    B -->|JSON Response| A
```

---

## Project Structure

```text
SchemaFlow/
├── backend/
│   ├── app/
│   │   ├── api/          # API Route Definitions
│   │   ├── core/         # Security & JWT logic
│   │   ├── db/           # SQLAlchemy Engine & Sessions
│   │   ├── llm/          # LLM Provider Implementations
│   │   ├── models/       # Pydantic & SQLAlchemy Models
│   │   └── services/     # Business Logic & Prompt Builders
│   ├── main.py           # FastAPI Entrypoint
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/          # Next.js App Router (Pages & Layouts)
│   │   ├── components/   # Reusable UI Components
│   │   ├── context/      # React State Contexts
│   │   └── lib/          # API Client & Utilities
│   ├── tailwind.config.ts
│   └── package.json
└── README.md
```

---

## Installation

### Prerequisites
- Node.js (v18+)
- Python (3.11+)

### 1. Clone the repository
```bash
git clone https://github.com/RakshithSharma96/SchemaFlow.git
cd SchemaFlow
```

### 2. Setup the Backend
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
```

### 3. Setup the Frontend
```bash
cd ../frontend
npm install
```

---

## Environment Variables

Create a `.env` file in the `backend/` directory based on the following required keys. 

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | 32-byte Base64 string for signing JWTs. |
| `NVIDIA_API_KEY` | Key for NVIDIA NIM API (get yours free at build.nvidia.com) |
| `NVIDIA_MODEL` | The LLM to use (default: `meta/llama-3.1-8b-instruct`) |

*(A sample configuration can be found in `backend/app/config.py`)*

---

## Running Locally

To run the application locally, you will need two terminal windows.

**Terminal 1 (Backend):**
```bash
cd backend
# Ensure virtual environment is activated
uvicorn app.main:app --reload
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000` in your browser to view the application.

---

## Usage

1. **Sign Up / Log In**: Create an account to access your workspace.
2. **Connect**: Click "Connect Database" and provide your connection URI (e.g., `postgresql://user:pass@localhost:5432/mydb` or `sqlite:///my_local_db.db`).
3. **Query**: Type a question in the chat interface like *"Show me the top 5 users by registration date"*.
4. **Analyze**: SchemaFlow will automatically write the SQL, execute it against your connected database safely, and return the data as a table and a suggested chart.

---

## Screenshots

*(Screenshots coming soon)*

- **Dashboard / Chat Interface**
- **Connection Configuration**
- **Data Visualizations**

---

## Roadmap

- **Vector Search Integration:** Store schema embeddings to support massive enterprise databases without hitting LLM context limits.
- **OAuth Integration:** Allow users to authenticate via GitHub, Google, or Enterprise SSO.
- **Automated Dashboards:** Pin frequently used AI queries to a live, auto-refreshing dashboard.

---

## Author

**Rakshith Sharma**  
[GitHub](https://github.com/RakshithSharma96)
