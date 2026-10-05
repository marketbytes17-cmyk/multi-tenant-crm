# AGENTS.md

AI Agent Instructions — Market Bytes CRM

This file tells an AI coding agent how to work inside this repository: what to read first, project-wide rules, code and design conventions, security constraints, the commands it can run, and what it must not touch without explicit approval.

---

## Project context

Market Bytes CRM is a multi-tenant lead-management platform for Market Bytes, a digital marketing agency. It ingests leads generated across every client's Meta (Facebook/Instagram) ad campaigns through one centralized Meta integration, and routes each lead into an isolated, per-client portal — without any client ever connecting their own Meta account.

**Architecture:** one shared PostgreSQL database, shared schema, tenant isolation enforced by Postgres Row-Level Security (RLS) — not by separate databases or app-level filtering alone.

**Stack:**
- **Backend:** FastAPI (async), SQLAlchemy 2.0, Alembic for migrations, JWT auth.
- **Frontend:** Next.js / React — Client Portal and Super Admin Portal, one shared default UI (no per-client branding).
- **Background processing:** Celery + Redis (Lead Routing Worker, Notification Worker).
- **Database:** PostgreSQL with RLS.

**Data flow:** Meta webhook → signature-verified receipt → Celery queue → Graph API fetch → `page_id`/`form_id` → `client_id` mapping → DB write (RLS-scoped) → Client Portal / Super Admin Portal.

---

## Before you start

Read these before changing any code, in this order:

1. `market_bytes_crm_spec.md` — full technical spec: architecture, data flow, schema, open questions, build roadmap. This is the source of truth for what the system is supposed to do.
2. `market_bytes_crm_schema.sql` — the canonical database schema, including RLS policies.
3. `fastapi_crm/README.md` — backend setup, the two-DB-role split, and known gaps.
4. `app/database.py` and `app/deps.py` — the tenant-isolation mechanism (`app_service` vs `app_client` roles, `get_tenant_db`). Do not write a new DB-accessing code path without understanding this first — it's the single most safety-critical part of the system.

---

## General rules

- **RLS is the tenant boundary, not application code.** Never add manual `client_id` filtering as a *substitute* for RLS — RLS is what actually prevents one client from ever seeing another's data, even if application code has a bug. App-level filtering, where it exists, is defense-in-depth, not the primary mechanism.
- **Build basic first.** This project is deliberately built simple-now, scale-later (confirmed project decision). Do not introduce additional infrastructure (new queues, caching layers, sharding, microservices) beyond what's already in the spec unless explicitly asked.
- **Keep the webhook receiver fast.** `POST /webhooks/meta` must only verify the signature and hand off to Celery — no Graph API calls, no DB writes, no heavy logic inside that request.
- **Every new tenant-scoped table needs both a `client_id` column and an RLS policy.** Adding one without the other is an incomplete change.
- **A client can run multiple simultaneous campaigns/forms** — never assume a 1:1 client-to-Page or client-to-form relationship anywhere in the code.
- **Form data is inconsistent across clients** — never assume a fixed set of custom questions; only `name`, `phone`, `email` are guaranteed fields, everything else belongs in `form_answers` (JSONB).

---

## Code guidelines

- **Backend (Python):** SQLAlchemy 2.0 declarative style (`Mapped[...]` / `mapped_column(...)`), not the legacy `Column(...)` style. Pydantic v2 schemas with `model_config = ConfigDict(from_attributes=True)`.
- **Reuse existing dependencies** — `get_tenant_db` for any route touching tenant data, `require_role(...)` / `require_super_admin` for permission checks. Do not hand-roll a new auth or tenant-scoping mechanism.
- **One set of model classes.** `app/models.py` is shared between the FastAPI app and the Celery worker (`app/tasks.py`). Never create a second, parallel model definition for the worker side.
- **Naming:** snake_case for Python identifiers; table/column names must match the schema exactly (see `db_table` values in `models.py`) — these are relied on by both the API and the workers reading/writing the same tables. camelCase for TypeScript/React identifiers once the frontend exists.
- **No duplicate business logic between the webhook receiver and the routing worker.** Payload parsing (`_parse_field_data`, `_find_lead_source` in `app/tasks.py`) lives in one place only.

---

## Design rules

- **No per-client branding or theming** — this was an explicit project decision. Every client sees the same default UI; do not add per-tenant logos, color schemes, or custom CSS paths.
- A formal design system/component library has not been chosen yet. Until one is, keep the UI simple and consistent rather than introducing one-off styling per screen — flag to a human if a design system decision is needed rather than picking one unilaterally.
- Kanban board stages are fixed: New → Contacted → Negotiating → Won/Lost. Don't make these per-client configurable unless asked.

---

## Security rules

- **Never log, print, or expose:** the Meta App Secret, Meta Verify Token, Master System User Access Token, JWT secret, or any database credential — in code, logs, error messages, or commit history.
- **Never bypass Meta webhook signature verification** (`X-Hub-Signature-256`), including "temporarily" for debugging or in tests — use a correctly-signed mock payload instead.
- **Never disable Row-Level Security**, and never write a query that intentionally reads across `client_id` boundaries outside the two designated service-role paths: the webhook receiver, the Celery workers, and Alembic migrations.
- **The `app_service` (BYPASSRLS) DB role is reserved for:** authentication lookups (before a tenant is known), the webhook receiver, Celery workers, and migrations. Never use it for a regular per-request tenant-facing API route — that must use `app_client` via `get_tenant_db`.
- **Never commit `.env` files, real credentials, or anything from `.env.example` filled in with actual secrets.**
- **Never log, print, or store a plaintext password.** Always hash via `passlib` (`hash_password` in `app/auth.py`) before persisting — this applies to `POST /users/invite` (which sets a rep's password directly, no invite email yet) exactly as much as it does to any future signup path.
- **The Master System User token has lead access across every client's Page.** Treat any code path that touches it as high-sensitivity; it should only ever be read from environment/secrets configuration, never hardcoded or logged.

---

## Commands

**Backend:**
```
pip install -r requirements.txt
uvicorn app.main:app --reload          # run the API
celery -A app.celery_app worker --loglevel=info   # run the worker
alembic revision --autogenerate -m "message"       # new migration
alembic upgrade head                                # apply migrations
```

**Frontend** (once scaffolded):
```
npm install
npm run dev
npm run build
npm run lint
```

**Tests:** not yet set up — no test command exists yet. Flag this rather than assuming a framework; ask before choosing one (pytest is the natural default given the stack).

---

## Boundaries

Do not change any of the following without explicit human approval:

- The RLS policies (`migrations/versions/0002_enable_rls.py`) or the tenant-isolation logic in `app/deps.py` / `app/database.py` — this is the core security guarantee of the entire system.
- Which DB role (`app_service` vs `app_client`) a given code path connects with.
- The `clients`, `client_lead_sources`, `leads`, `users`, `notes`, or `audit_log` schema (columns, types, constraints) — these are shared across the API and the workers; a change in one place without the other breaks the system.
- The Meta webhook signature-verification logic in `app/routers/webhooks.py`.
- The decision to use Redis + Celery (vs. introducing a different queue/broker) — this was a deliberate basic-first choice.
- The decision to have no per-client branding.
- `requirements.txt` version constraints for security-relevant packages (`python-jose`, `passlib`, `sqlalchemy`) — flag a needed upgrade rather than bumping silently.
