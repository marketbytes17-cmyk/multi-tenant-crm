# VERIFY_SECURITY.md

Task for AI Agent — Security Audit

---

## Instructions

You are auditing whether a user can only access the role and data they're actually entitled to — from login, through every route, down to the database. For every item in Section A–E: open the actual file, confirm the logic, and report **PASS** (with file/line), **FAIL**, or **PARTIAL**. For Section F, do not attempt — report as unverifiable.

The question this document exists to answer, in plain terms: **can a logged-in user reach data or actions their role and tenant shouldn't allow — either by the login page giving them the wrong access, or by an API call bypassing what the UI would normally show them?**

---

## A. Authentication

1. Every password is hashed via `passlib`'s `hash_password` before being stored — confirm no code path anywhere writes to `password_hash` with a raw value.
2. JWTs are signed and verified with an explicit algorithm list (`algorithms=["HS256"]`) on decode — confirm this is never omitted or set to accept multiple/unspecified algorithms, which would allow an "alg: none" style forgery.
3. `POST /auth/login` and `get_current_user` (the check applied on every subsequent request) both reject an inactive user, and both return the **same generic error** for "no such user," "wrong password," and "deactivated account" — confirm this, since distinguishing them would let an attacker enumerate valid emails.
4. Confirm there is no public self-registration endpoint anywhere — the only way a user account is created is `POST /users/invite`, which requires an authenticated `client_admin` or `super_admin`.

## B. Role-based access — can a role reach a login/route/action it shouldn't

5. **Role is not embedded in the JWT.** Confirm the token payload carries only the user's ID (`sub`), and `get_current_user` looks up `role`, `client_id`, and `is_active` fresh from the database on every request. This matters specifically for your question: if role were embedded in the token instead, a user's access wouldn't actually change until their old token expired, even after an admin changed their role or deactivated them.
6. `/clients` and `/lead-sources` routers declare `require_super_admin` at the router level (`dependencies=[...]`), not per-route — confirm every route under those prefixes is covered, not just some.
7. `/users` (list and invite) requires `require_client_admin_or_super` — confirm a `sales_rep` token gets `403` on both `GET /users` and `POST /users/invite`.
8. `/leads` and `/notes` require only authentication, no specific role — confirm this is intentional (RLS is the actual tenant boundary there) rather than a missed check. A `sales_rep` and a `client_admin` hitting the same endpoint should get different *data* (per RLS) but never a different *permission outcome* at this layer.
9. `POST /users/invite`'s request schema (`UserCreate`) has no `role` field at all — confirm a `client_admin` cannot supply `role: "super_admin"` in the request body to self-escalate a new account; the role is hardcoded server-side to `sales_rep`.
10. `PATCH /users/{id}`'s request schema (`UserUpdate`) has no `role` or `client_id` field — confirm this endpoint can only toggle `is_active` and cannot be used to promote a `sales_rep` to `client_admin`.
11. A `client_admin` cannot see or modify a `super_admin` account via `GET /users` or `PATCH /users/{id}` — trace why: `super_admin` rows have `client_id = NULL`, and the RLS policy's non-super_admin branch requires an exact `client_id` match, which `NULL` never satisfies. Confirm this reasoning actually holds against the policy text in the migration.

## C. Tenant isolation / IDOR

12. `PATCH /leads/{lead_id}` returns `404` — not `403`, not an empty success — when the lead belongs to a different tenant. Confirm this, since a `403` would leak that the ID exists at all.
13. `PATCH /users/{user_id}` behaves the same way for a cross-tenant target.
14. Confirm **every** tenant-scoped route uses `get_tenant_db`, never `ServiceSessionLocal` directly. A route that accidentally used the service session would silently bypass RLS entirely for that one endpoint — this is the single easiest way to introduce a cross-tenant data leak, so check every router file, not just a sample.

## D. The RLS mechanism itself

15. Confirm `get_tenant_db` sets tenant context via `SELECT set_config('app.current_role', :role, true)` (and the same pattern for `app.current_client_id`) — **not** `SET LOCAL app.current_role = :role`. The latter is invalid syntax once a real server-side bind parameter is involved (as with asyncpg), and previously caused exactly this bug in this project — confirm the fix is present and no other file has reintroduced the broken pattern.
16. Confirm the third argument to `set_config` is `true` in both calls — this is what scopes the setting to the current transaction only; without it, a value could leak across requests on a reused pooled connection.

## E. Real, currently-open gaps — name them, don't paper over them

17. **No rate limiting on `POST /auth/login`.** Password hashing is currently the only brute-force defense. Flag this explicitly rather than assuming it's handled elsewhere.
18. **No CORS configuration exists in `app/main.py`.** Once the frontend is on a different origin, this needs explicit allowed-origins configuration — `allow_origins=["*"]` combined with credentials must never be used.
19. **No audit logging is wired up yet.** Inviting a user and deactivating a user both write no row to `audit_log` today, even though the table exists. The same is true for impersonation, which doesn't exist yet at all.
20. Confirm HTTPS/TLS termination is documented as a hosting-layer responsibility, not silently assumed to be "someone else's problem" with no record of the decision.

---

## F. Requires a live system — do not attempt, report as unverifiable

- Whether the JWT secret actually deployed is a strong, freshly-generated value rather than the `.env.example` placeholder.
- Whether the frontend (once built) stores the JWT in a way resistant to XSS (e.g., an httpOnly cookie) rather than `localStorage`.
- Whether the frontend implements its own role-based route guards as a UX convenience **in addition to**, never as a substitute for, the backend checks above.
- Whether any real request/error log anywhere in the deployed environment inadvertently captures a raw JWT, password, or Meta credential.
- Whether a real brute-force attempt against the login endpoint is actually blocked at the network/hosting layer.

---

## G. Required output format

A single markdown table:

| # | Item | Status | Evidence / Notes |
|---|---|---|---|
| A1 | Passwords always hashed | | |
| ... | ... | | |
| F1 | JWT secret strength in production | CANNOT VERIFY | requires access to deployed config |

Followed by one sentence: **can a user reach a role, login, or dataset they shouldn't — yes or no — and if yes, exactly which item above is the reason.**
