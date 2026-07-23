<div align="center">
  <br />
    <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/Database-Dark.svg" alt="SchemaFlow Database Icon" width="80" height="80" />
  <br />
  <br />
  <h1 align="center">
    <strong>SchemaFlow</strong>
  </h1>
  <p align="center">
    <em>The Next-Generation Enterprise AI SQL Agent.</em>
  </p>
  <p align="center">
    Talk to your database in plain English. Get production-ready, read-only SQL instantly.
  </p>

  <p align="center">
    <a href="https://www.python.org/"><img src="https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" /></a>
    <a href="https://fastapi.tiangolo.com/"><img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi" alt="FastAPI" /></a>
    <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" /></a>
    <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" /></a>
  </p>
</div>

<br />

> **SchemaFlow** bridges the gap between complex data infrastructure and non-technical stakeholders. By harnessing the power of advanced Large Language Models (LLMs) via the NVIDIA NIM API, SchemaFlow acts as an intelligent, autonomous data analyst that sits securely on top of your databases.

---

## ✨ Key Features

### 🧠 Autonomous Query Generation
Don't write SQL. Just ask. SchemaFlow comprehends complex relationships in your database and writes highly optimized, syntactically flawless SQL queries tailored to your specific RDBMS dialect.

### 🛡️ Zero-Trust Security Architecture
Data safety is non-negotiable. 
- **Read-Only Enforcement:** A robust middleware layer actively intercepts and blocks destructive operations (`DROP`, `DELETE`, `UPDATE`, `INSERT`).
- **Data Masking:** Schema metadata is sanitized before it ever touches an external LLM. PII and sensitive columns are structurally masked.
- **Stateless Execution:** Queries run in ephemeral sessions with isolated database connections.

### 🌐 Universal Database Connectivity
SchemaFlow natively speaks to the world's most popular database engines out of the box.
- ✅ **PostgreSQL**
- ✅ **MySQL**
- ✅ **SQLite**

### 📊 Instant Visual Analytics
Why stop at tabular data? SchemaFlow automatically parses query results and intelligently generates **Bar**, **Line**, and **Area** charts using Recharts, giving you immediate visual insights.

### 🎨 Brutalist Bento Grid UI
Built on a bespoke brutalist design system, the frontend leverages a modern Bento Grid layout, glassmorphism, and Framer Motion micro-animations for an ultra-premium user experience.

---

## 🏗️ Technical Architecture

SchemaFlow relies on a decoupled, microservice-inspired architecture designed for high throughput and low latency.

<div align="center">

```mermaid
graph TD
    subgraph Frontend [Client Layer - Next.js]
        UI[Bento UI & Recharts]
        State[Auth & Session Context]
    end

    subgraph Backend [API Layer - FastAPI]
        Auth(JWT Authentication)
        Prompt(LLM Prompt Builder)
        Sec(Query Sanitizer)
    end

    subgraph Intelligence [AI Layer]
        Nvidia[NVIDIA NIM API]
        Llama[Llama 3.1 70B]
    end

    subgraph Infrastructure [Data Layer]
        PG[(PostgreSQL)]
        MY[(MySQL)]
        SQ[(SQLite)]
    end

    UI <-->|REST API| Auth
    Auth <--> Prompt
    Prompt <-->|Schema + Question| Nvidia
    Nvidia -->|Raw SQL| Llama
    Llama -->|SQL String| Sec
    Sec <-->|Validates & Executes| PG
    Sec <-->|Validates & Executes| MY
    Sec <-->|Validates & Executes| SQ
    Sec -->|JSON Result Set| UI
```

</div>

---

## 🚀 Getting Started

### Prerequisites
Before you begin, ensure you have the following installed:
- **Node.js** (v18.0.0 or higher)
- **Python** (v3.11.0 or higher)
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/RakshithSharma96/SchemaFlow.git
cd SchemaFlow
```

### 2. Configure the Backend (FastAPI)
```bash
cd backend
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:
```env
# Cryptographic signing key for JWTs
SECRET_KEY=your_secure_32_byte_base64_string

# NVIDIA NIM AI Configuration
NVIDIA_API_KEY=your_nvidia_api_key_here
NVIDIA_MODEL=meta/llama-3.1-70b-instruct
```

Launch the API server:
```bash
uvicorn app.main:app --reload
```
*The backend will be available at `http://localhost:8000`*

### 3. Configure the Frontend (Next.js)
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
*The frontend will be available at `http://localhost:3000`*

---

## 💻 Usage Flow

1. **Authenticate:** Securely log into your workspace via JWT.
2. **Connect Data Source:** Provide a standard connection URI (e.g., `postgresql://user:password@localhost:5432/production_db`).
3. **Query Naturally:** Ask questions like:
   > *"What was our MRR growth month-over-month for Q3?"*
4. **Analyze:** Watch SchemaFlow generate the SQL, execute the query, and render a dynamic chart in under a second.

---

<details>
<summary><b>📸 UI Previews (Click to expand)</b></summary>
<br/>

*(Screenshots coming soon! Feel free to submit a PR with screenshots of your local deployment)*

- **Dashboard / Chat Interface**
- **Data Connection Panel**
- **Interactive Visualizations**

</details>

---

## 🗺️ Roadmap

- [ ] **Vector Embedding Search:** Implement RAG (Retrieval-Augmented Generation) for massive enterprise schemas to bypass LLM token limits.
- [ ] **OAuth 2.0 Integration:** Seamless login via GitHub, Google, and Okta SSO.
- [ ] **Export to CSV/Excel:** One-click data exports from the dashboard.
- [ ] **Scheduled Reports:** Cron-based execution of natural language queries with email delivery.

---

## 🧑‍💻 Author

**Rakshith Sharma**  
[GitHub Profile](https://github.com/RakshithSharma96)
