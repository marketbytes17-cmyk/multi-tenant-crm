# Multi-Tenant Agency CRM Backend

A high-performance, asynchronous FastAPI and Celery ingestion stack designed for multi-tenant lead management from Meta (Facebook) Lead Ads.

---

## 🏗️ Architecture Overview

- **API & Webhooks**: FastAPI (Python 3.10+) running on ASGI (Uvicorn).
- **Task Queue & Ingestion Workers**: Celery backed by Redis for asynchronous background ingestion.
- **Relational Storage**: PostgreSQL with native `UUID` and `JSONB` for dynamic form payload storage.
- **Zero Client Friction Multi-Tenancy**: Central Meta Webhook mapped to tenant organizations via PostgreSQL `page_mappings`.

---

## 📋 Prerequisites

Before running the project locally, ensure you have installed:
1. **Python 3.10+**: `python --version`
2. **Docker Desktop & Docker Compose**: `docker compose version`
3. **Git**: `git --version`

---

## 🚀 Teammate Quickstart Guide (3-Step Setup)

Follow these exact 3 steps to spin up the local development stack:

### Step 1: Environment Configuration

Copy the example environment file and configure your local settings:

```bash
cd backend
cp .env.example .env
```

*(On Windows PowerShell: `Copy-Item .env.example .env`)*

---

### Step 2: Start Infrastructure Services (PostgreSQL & Redis)

From the project root directory, run Docker Compose:

```bash
docker compose up -d
```

Verify container status and health checks:

```bash
docker compose ps
```

*PostgreSQL will be accessible at `127.0.0.1:5432` and Redis at `127.0.0.1:6379`.*

---

### Step 3: Install Dependencies & Seed Database

Create a virtual environment, install requirements, and seed initial tenant schemas and mappings:

```bash
# Navigate to backend folder
cd backend

# Create & activate virtual environment
python -m venv venv
# Linux/macOS:
source venv/bin/activate
# Windows PowerShell:
# .\venv\Scripts\Activate.ps1

# Install Python dependencies
pip install -r requirements.txt

# Seed tenant database tables & sample data
python seed_db.py
```

---

## ⚡ Running FastAPI & Celery Workers

Run the FastAPI ASGI server and Celery background worker in separate terminal windows.

### Terminal 1: FastAPI API Server

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

- API Interactive Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/health](http://localhost:8000/health)

---

### Terminal 2: Celery Worker Execution

> [!IMPORTANT]  
> **Windows vs Linux/macOS Worker Execution**:  
> Celery's default `prefork` pool relies on UNIX `fork()`. On Windows, you **must** pass `-P solo` (or `-P gevent`) to prevent execution errors.

#### Windows (PowerShell / CMD)
```bash
cd backend
celery -A app.workers.tasks.celery_app worker --loglevel=info -P solo
```

#### Linux / macOS
```bash
cd backend
celery -A app.workers.tasks.celery_app worker --loglevel=info
```

---

## 🧪 Testing & Lead Webhook Simulation

Run the automated lead simulator to verify the full ingestion pipeline (Meta Webhook $\rightarrow$ HMAC verification $\rightarrow$ Celery Queue $\rightarrow$ PostgreSQL Storage):

```bash
cd backend
python tests/simulate_lead.py
```

Run environment and dependency audit:

```bash
cd backend
python tests/verify_env.py
```

---

## 🔒 Security & Environment Variables

Never commit `.env` or sensitive credentials to GitHub. Always use `.env.example` as a template for new environments.

Key environment variables:
- `META_APP_SECRET`: HMAC SHA-256 validation key for webhook payloads.
- `META_VERIFY_TOKEN`: Verification token for Meta GET challenge verification.
- `DATABASE_URL`: PostgreSQL connection string.
- `REDIS_URL` / `CELERY_BROKER_URL`: Redis connection string for task queuing.
