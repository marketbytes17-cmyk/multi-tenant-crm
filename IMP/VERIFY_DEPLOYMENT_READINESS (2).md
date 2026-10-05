# VERIFY_DEPLOYMENT_READINESS.md

Task for AI Agent — Deployment Readiness Audit

---

## Instructions

You are auditing the Market Bytes CRM codebase to confirm whether it was built according to plan and is ready to deploy. For every item in Section A: locate the actual file and code referenced, determine whether it does what's claimed, and report one of:

- **PASS** — with the exact file and line/function that satisfies it
- **FAIL** — what's missing or incorrect, specifically
- **PARTIAL** — exists but incomplete; say what's missing

**Do not mark anything PASS without pointing to the specific code you checked.** Do not infer from file names or comments alone — open the file and confirm the logic actually does what the item claims. For Section B, do not attempt to verify — these require a live system, external data, or a human decision, and guessing here is worse than saying so. Cross-reference `market_bytes_crm_spec.md`, `ARCHITECTURE.md`, and `PRD.md` in this repo for what correct behavior is supposed to look like when a claim is ambiguous.

Produce your findings as the single table specified in Section C.

---

## A. Code-verifiable items

1. `migrations/versions/0002_enable_rls.py` contains `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` for `client_lead_sources`, `leads`, `notes`, and `users` — all four, not a subset.
2. The same migration creates a `CREATE POLICY` for each of those four tables, and each policy's condition references `current_setting('app.current_client_id', true)`.
3. `app/database.py` defines two separate session factories: one bound to `service_database_url` (for the `app_service`/BYPASSRLS role) and one bound to `tenant_database_url` (for the `app_client`/RLS role).
4. `app/deps.py`'s `get_tenant_db` executes `SET LOCAL app.current_role` and, when the user has one, `SET LOCAL app.current_client_id`, inside a transaction, before yielding the session to the route.
5. `app/auth.py`'s `get_current_user` and `app/routers/auth.py`'s `login` both query using the **service** session, not the tenant session — confirm neither does a JWT-authenticated lookup through `get_tenant_db`.
6. `app/routers/webhooks.py` computes an HMAC-SHA256 of the raw request body using the Meta App Secret, and compares it to the `X-Hub-Signature-256` header using a constant-time comparison (`hmac.compare_digest`, not `==`).
7. The `POST /webhooks/meta` handler enqueues the payload to Celery and returns immediately — confirm there is no Graph API call or database write directly inside that route function.
8. `app/tasks.py`'s lead-routing task fetches lead details from the Graph API, matches `page_id`/`form_id` against `ClientLeadSource`, and writes a `Lead` row with the matched `client_id` — confirm all three steps are actually present, not stubbed.
9. In that same task, confirm the case where no matching `ClientLeadSource` is found is handled explicitly (e.g., logged) rather than raising an unhandled exception that would crash the worker.
10. Confirm a notification task is triggered after a lead is successfully created (even if the notification task itself is just a logging stub — confirm it's actually called, not just defined).
11. `app/routers/users.py` has a `POST /users/invite` route restricted to `client_admin`/`super_admin`, and the new user's `client_id` is set from the authenticated caller's own `client_id` — confirm it is never taken from the request body.
12. Search the entire codebase for anywhere a password is assigned to `password_hash` (or written to the database at all) without first passing through `hash_password`. Report every match, or confirm there are none.
13. Confirm `/clients` and `/lead-sources` routers both require `super_admin` (check the `dependencies=` on the router, not just individual routes).
14. Confirm `.env` (not `.env.example`) is listed in `.gitignore`, and check git history (if a `.git` directory exists) for any commit that includes a file literally named `.env`.
15. Check whether a frontend project (Next.js — look for `package.json` with a `next` dependency, or an `app/`/`pages/` directory outside `fastapi_crm/`) actually exists in this repo, versus only being described as planned in `ARCHITECTURE.md`.
16. Search for any test files (`test_*.py`, `*_test.py`, `*.test.ts`, `*.spec.ts`, or a `tests/` directory anywhere in the repo). Report what you find, or confirm there is nothing.
17. Search for CI/CD configuration (`.github/workflows/`, `.gitlab-ci.yml`, `.circleci/`, or similar). Report what you find, or confirm there is nothing.
18. Search for any endpoint or function related to "impersonate"/"impersonation". Per the plan this should not exist yet — confirm whether it's still absent, or flag it if a partial/incomplete implementation exists.
19. Search for any code path that writes to the `audit_log` table (an `AuditLog(...)` insert). Per the plan this should not exist yet — confirm whether it's still absent.

---

## B. Cannot be verified by code review — do not attempt, just report as unverifiable

- Whether the `app_service` and `app_client` Postgres roles actually exist on the target deployment database (this is live infrastructure state, not something in the repo).
- Whether tenant isolation actually holds when exercised against a running instance (requires two real logged-in users).
- Whether the Meta webhook URL is registered in the Meta App Dashboard pointing at a real, reachable endpoint.
- Whether Market Bytes' marketing team has provided the full client roster (Page/Form mappings for every client, not just one).
- Whether a hosting provider has been chosen for the backend/workers/Postgres.
- Whether the Meta App Secret, Verify Token, and Master System User Token are stored in a real secrets manager rather than a local `.env`.
- Expected lead volume from the business.

---

## C. Required output format

A single markdown table:

| # | Item | Status | Evidence / Notes |
|---|---|---|---|
| A1 | RLS enabled on all 4 tables | | |
| A2 | Tenant-isolation policies present on all 4 | | |
| ... | ... | | |
| B1 | DB roles exist on deployment DB | CANNOT VERIFY | requires live DB access |
| ... | ... | | |

Followed by a short summary: overall PASS/FAIL count for Section A, and — most importantly — the single biggest blocker preventing deployment, stated plainly in one sentence.
