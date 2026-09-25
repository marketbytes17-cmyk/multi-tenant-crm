Market Bytes CRM — End-to-End Technical Specification

Status: living document. Architecture and tech stack decisions below are finalized as of this version.

1. Vision

Market Bytes is moving from a traditional digital marketing agency into a SaaS-enabled growth partner. Since Market Bytes runs all client ad campaigns through its own Meta Ads Manager, clients never need to connect their own Meta accounts. Instead, the CRM automatically ingests every lead generated across the agency's ad portfolio and routes it into isolated, per-client portals — while giving Market Bytes an internal command center for agency-wide visibility.

2. Architecture Overview

Pattern: Centralized multi-tenant architecture — one shared PostgreSQL database, shared schema, isolation enforced by Row-Level Security (RLS), not by separate databases per client.

Components:

Component	Role
Client Portal (Next.js)	Tenant-facing web app — lead inbox, Kanban pipeline, team management
Super Admin Portal (Next.js)	Market Bytes-facing web app — global analytics, tenant provisioning, impersonation
API Gateway / Load Balancer	Single entry point routing to the backend
Backend API	Auth, leads/pipeline CRUD, tenant admin (see §3 for framework decision)
Webhook Receiver	Verifies and ingests Meta's Lead Ads webhook events
Lead Event Queue (Redis)	Decouples webhook ingestion from processing
Lead Routing Worker (Celery)	Maps page_id/form_id → client_id, fetches lead details via Graph API, writes to DB
Notification Worker (Celery)	Alerts a client when a new lead lands
PostgreSQL	Single instance, RLS-enforced, shared schema
Meta Ads Platform	External — source of leads via webhook + Graph API
Email/SMS Provider	External — delivers new-lead notifications

Data flow, end to end:

A lead fills out a form on a client's ad on Meta.
Meta POSTs a webhook event (containing a leadgen_id) to the Webhook Receiver.
Webhook Receiver verifies the X-Hub-Signature-256 header, then pushes a raw event onto the Lead Event Queue and returns 200 OK immediately.
Lead Routing Worker consumes the event, calls the Graph API (using the master System User token) to fetch name/phone/email, looks up client_id from the page_id/form_id, and writes the lead row scoped to that tenant.
Notification Worker consumes the same event (fan-out) and sends an alert to the client.
Client logs into their portal and sees the lead in their Kanban board — RLS guarantees they see only their own tenant's rows.
Super Admin sees everything, plus tenant provisioning and impersonation.
3. Tech Stack
Frontend: Next.js / React, for both the Client Portal and Super Admin Portal.
Backend: Decided — single FastAPI backend (async SQLAlchemy + Alembic for migrations, JWT auth) handling everything — CRM API, webhook receiver, and admin functions.
Alternative considered and dropped: Django (core CRM API + admin) + FastAPI (webhook receiver only). A Django skeleton was prototyped during exploration but is no longer part of the active build.
Why single-FastAPI: matches the working stack already in use (Python/FastAPI); Django's standout feature (its built-in admin) wasn't actually needed since the Super Admin Portal is a custom Next.js app; and one framework means the tenant-isolation (RLS) logic — the single most safety-critical piece of code in this system — is implemented and kept correct in one codebase instead of two.
RLS integration note: FastAPI's dependency-injection model makes this cleaner than the Django equivalent — a get_tenant_db dependency opens one DB session per request, sets the SET LOCAL session variables immediately, and yields it, so every route's queries are naturally scoped without extra request-lifecycle hooks.
Background processing: Celery + Redis for the Lead Routing Worker and Notification Worker. Redis doubles as both the Celery broker and the lead event queue — no separate message broker needed at this scale.
Database: PostgreSQL, Row-Level Security enforced.
Deployment: Backend + workers + Postgres on Render/Railway/AWS; frontend on Vercel; crm.marketbytes.com pointed at the frontend.
4. Meta Integration

Credentials already obtained: Meta App ID, App Secret, Verify Token, Master System User Access Token.

App Secret → used to compute/verify the X-Hub-Signature-256 HMAC on every incoming webhook POST. Never skip this check.
Verify Token → used once, during webhook subscription setup: Meta sends a GET with hub.verify_token + hub.challenge; the endpoint checks the token and echoes back the challenge.
Master System User Access Token → used by the Lead Routing Worker to call the Graph API and fetch actual lead details (name/phone/email) once a leadgen_id arrives.

All four credentials belong in a secrets manager, never in code or committed .env files. The System User token specifically needs a rotation plan since it's long-lived and has lead access across every client's Page.

6. User Roles
Super Admin (Market Bytes staff): global analytics across all clients, tenant provisioning (create client, map Pages/forms to client_id), impersonation (must be audit-logged).
Client Admin: isolated lead inbox, Kanban pipeline (New → Contacted → Negotiating → Won/Lost), can invite their own sales reps.
Sales Rep: works leads assigned to them within their client's tenant.

7. Security Considerations
Webhook signature verification on every inbound request (§4).
Master System User token in a secrets manager, with a rotation plan.
RLS session variables must be set inside a request-scoped transaction (SET LOCAL), not a bare session SET, to avoid leaking tenant context across pooled/reused DB connections.
Fallback path needed for a lead arriving on a page_id that hasn't been mapped to a client_id yet (hold in a dead-letter queue + alert, rather than silently dropping).
Impersonation actions must write to audit_log (actor, target client, timestamp).

9. Already Provided / Confirmed
Meta App ID, App Secret, Verify Token, Master System User Access Token.
One client's full record: name, contact number, email, Facebook Page name, Page ID, active lead form name, list of form questions.
Confirmed: a client can run more than one active campaign/form simultaneously — client_lead_sources already supports this without any schema change.
Confirmed: lead-form questions are inconsistent across clients (no shared schema) — the form_answers JSONB design already handles this without any schema change.
Confirmed: no per-client branding — Client Portal and Super Admin Portal use one default look for every client, no per-tenant logo/theming needed.

10. Build Roadmap
Postgres schema + RLS policies —  (§5).
Backend API skeleton —  FastAPI, JWT auth, CRUD for leads/pipelines/clients, RLS-scoped via get_tenant_db.
Webhook Receiver —  Signature verification, verify-token handshake, enqueues to Celery.
Queue + Lead Routing Worker —  basic version. Celery + Redis, default worker config (no concurrency/pool tuning — comfortably covers realistic agency lead volume as-is). Graph API fetch, page_id/form_id → client_id mapping (supports multiple simultaneous campaigns per client), writes to DB.
Notification Worker — stub version. Chained from the routing task (not a separate queue consumer, for simplicity) — logs only for now; swap in a real email/SMS provider later.
Frontend portals — Client Portal (Kanban) and Super Admin Portal (analytics, provisioning, impersonation), both Next.js, against the API from step 2. One shared default look for every client — no per-tenant branding.
Testing — simulate leads end-to-end via Meta's Lead Ads Testing Tool before any real client campaign touches the system.




dont start to build unless i say