# FIX_SECURITY_ISSUES.md

Task for AI Agent — Security Remediation (Critical + High Priority)

---

## Instructions

Fix the following four issues **in the order given** — this order reflects actual severity, not convenience. After each fix, run its verification step against the real running code before moving to the next item. Do not report an item as done on the strength of a code diff alone — confirm the verification step actually passes.

---

## Priority 0 — CRITICAL: treat as an active compromise until fixed

### A4 — Public, unauthenticated registration accepts an arbitrary role

**What's wrong:** `auth.py:L13-L38` defines `POST /auth/register` with no authentication requirement, accepting a `role` field directly from the request body — including `"SUPER_ADMIN"`.

**Why this is an incident, not just a bug:** anyone who finds this endpoint can create their own super-admin account and read every client's leads. If this has been deployed anywhere reachable, even briefly, assume compromise rather than mere exposure.

**Fix:**
1. Delete `POST /auth/register` entirely. The only sanctioned account-creation path is the authenticated invite flow (already confirmed safe in B9 — `client_dashboards.py:L241` hardcodes `role="SALES_REP"` server-side).
2. Grep every router for any other endpoint that accepts a `role` field from a request body. B9/B10 confirm the invite and update endpoints are safe; confirm no third path exists that wasn't covered by the original audit.
3. Confirm the only way a `SUPER_ADMIN` row can ever be created is a direct database operation by an already-trusted party (a seed script or manual DB action) — never through any API input.

**Verify:**
- `POST /auth/register` now returns `404` (route gone), not `401`/`403` (which would mean it still exists, just gated).
- A full-text search of every router's Pydantic input schemas for a `role` field turns up nothing writable by an unauthenticated or under-privileged caller.

**Do regardless of the code fix, as incident response:**
- Rotate the JWT secret — this invalidates every existing session, including any illegitimate super-admin one.
- Query the `users` table directly for any admin-role row the team doesn't recognize creating.
- Rotate the Meta App Secret, Verify Token, and Master System User Token if there's any chance this environment was reachable publicly.

---

## Priority 1 — HIGH: tenant and privilege boundaries are broken

### B6 — `/organizations` and `/page-mappings` have no role restriction

**What's wrong:** `organizations.py:L8` and `page_mappings.py:L8` declare no router-level permission dependency — any authenticated user, including a `sales_rep`, can reach `GET /organizations` and `GET /page-mappings`.

**Fix:** add the router-level dependency pattern already working correctly elsewhere in this codebase:
```python
router = APIRouter(
    prefix="/organizations", tags=["organizations"],
    dependencies=[Depends(require_super_admin)],
)
```
Apply the same to `page_mappings.py`. Router-level, not per-route — a per-route check is easy to forget on the next new endpoint added under that prefix.

**Verify:**
- Logged in as `sales_rep`: `GET /organizations` and `GET /page-mappings` both return `403`.
- Logged in as `super_admin`: both still work.

### B7 — `/team` and `/team/invite` have no role check

**What's wrong:** `client_dashboards.py:L208` (`GET /team`) and `L220` (`POST /team/invite`) depend only on `get_current_user` — no role check — so a `sales_rep` can list team members and send invites.

**Fix:**
```python
router = APIRouter(
    prefix="/team", tags=["team"],
    dependencies=[Depends(require_client_admin_or_super)],
)
```

**Verify:**
- Logged in as `sales_rep`: `403` on both `GET /team` and `POST /team/invite`.
- Logged in as `client_admin`: both still work, and still only affect their own tenant (already should hold via RLS per B9 — just confirm no regression).

---

## Priority 1 — HIGH: the RLS mechanism itself may not be applying at all

### D15/D16 — Tenant context set via invalid `SET LOCAL` syntax with a bind parameter

**What's wrong:** `database.py:L48-L49` runs `SET LOCAL app.current_tenant_id = :tenant_id` with a real bind parameter, and never calls `set_config()`.

**Why this needs a live check before you touch the code:** `SET`/`SET LOCAL` are PostgreSQL utility statements whose grammar only accepts a literal in that position, not a parameter placeholder. What actually happens next depends on the driver:
- A driver using true server-side parameter binding (e.g. `asyncpg`) will throw a **syntax error on every request** hitting this path — loud, annoying, but safe: no tenant boundary gets silently crossed, requests just fail.
- A driver doing client-side string substitution before sending the query (some `psycopg2` setups) may let the statement execute — meaning this might not be erroring at all, which is the scenario you need to rule out.

**Do this before applying the fix:**
1. Check application logs / error tracking for a syntax error mentioning `SET LOCAL` or `app.current_tenant_id`. If present: this has been failing loudly. Functional bug, still Priority 1, but not yet a confirmed breach.
2. If you find **no error**, that's more serious, not less: it means this code path has been executing without complaint, and you cannot assume isolation held. Connect directly to the database (bypassing the app) and check whether `current_setting('app.current_tenant_id', true)` was actually being set correctly during real requests. If you can't positively confirm it was working, treat this the same as a confirmed tenant-isolation failure and audit for cross-tenant data access during the affected period.

**Fix:**
```python
await session.execute(
    text("SELECT set_config('app.current_tenant_id', :tenant_id, true)"),
    {"tenant_id": str(tenant_id)},
)
```
The third argument (`true`) is required, not optional — it scopes the value to the current transaction. Without it, the setting persists at the session level and can leak across requests on a reused pooled connection.

**Verify:**
- Seed at least two distinct tenants with real test data, log in as one user per tenant, and confirm each sees only their own tenant's data — across every RLS-protected table, not just the first one you check.
- Confirm the syntax error (if there was one) no longer appears in logs.
- Re-run the isolation test after an idle period, to rule out stale tenant context surviving on a reused pooled connection.

---

## Also worth closing while you're in this code (lower priority, not blocking)

- **A3** — make the error for "wrong password," "inactive account," and "user not found" identical, to stop account enumeration.
- **B5** — stop embedding `role`/`org_id` directly in the JWT payload; keep the token to the user ID only, and keep re-fetching role/org from the database per request as already happens.
- **E19** — write an audit-log row when a team invite is sent, matching the pattern already used for impersonation and status changes.

---

## Required output when done

For A4, B6, B7, and D15/D16 specifically: confirm PASS on each verification step above, not just "code changed." For D15/D16, state explicitly whether the live check in step 1 found evidence of a real historical tenant-isolation failure — that finding determines whether this also needs disclosure treatment, not just a bug-fix commit.
