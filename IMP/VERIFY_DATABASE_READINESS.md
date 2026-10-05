# VERIFY_DATABASE_READINESS.md

Task for AI Agent — Database Readiness Audit

---

## Instructions

You are auditing whether the database layer of the Market Bytes CRM actually generalizes to **every** client — not just the one client whose data was used to build and test it — and whether it's ready to receive **live** lead data from Meta, where question sets and field types vary per client's form. For every item in Section A: open the actual file, confirm the logic, and report **PASS** (with file/line), **FAIL** (what's wrong), or **PARTIAL** (works but incomplete). For Section B, do not attempt — report as unverifiable and state what a human needs to do instead.

The recurring failure mode to hunt for throughout: **anything written or tested against one client's shape of data that would break the moment a second, differently-shaped client is added.**

---

## A. Schema & code checks (static — verify by reading the actual files)

### Multi-client generalization (not hardcoded to one client)

1. In `market_bytes_crm_schema.sql` / `app/models.py`, confirm `client_lead_sources` has `UNIQUE(page_id, form_id)` — **not** a unique or one-to-one constraint on `client_id`. A client-to-source relationship that's anything other than one-to-many would break the moment any client runs a second campaign.
2. Confirm there is no `LIMIT 1`, no assumption of "the one client," and no hardcoded `client_id`, `page_id`, or `form_id` value anywhere in `app/tasks.py`, `app/models.py`, or the migrations. Search for any literal UUID or Meta ID string outside of test/example files.
3. Confirm every RLS policy (`migrations/versions/0002_enable_rls.py`) scopes by `current_setting('app.current_client_id', true)` — a session variable — and not by any literal client ID. This is what makes isolation generalize to N clients instead of the one it was written against.
4. Confirm `_find_lead_source` in `app/tasks.py` matches on `page_id` (and `form_id` when present) with no assumption that only one row exists in the whole table — the query should work identically whether `client_lead_sources` has 1 row or 10,000 across 500 clients.

### Form-schema flexibility (different clients, different question sets, different question types)

5. Confirm `leads.form_answers` is `JSONB` with **no** CHECK constraint, no required keys, and no fixed shape enforced at the database level — a client whose form has 3 questions and a client whose form has 15 completely different questions must both be storable without a schema change.
6. Confirm `_parse_field_data` in `app/tasks.py` does not assume any custom question exists, is required, or has a specific name — only `name`/`phone`/`email` should be treated as known fields; everything else must fall through generically.
7. **Multi-value question types (checkboxes, multi-select):** confirm `_parse_field_data` preserves every value Meta returns for a custom question, not just the first. *(This was checked as part of this audit — a bug was found and fixed: the function previously truncated every custom answer to `values[0]`, silently discarding additional selections from any checkbox/multi-select question. Confirm the fix in the current code keeps the full list when more than one value is present.)*
8. Confirm no column anywhere (`name`, `phone`, `email`, or any `form_answers` value) has a length limit that could truncate real-world data — check for `VARCHAR(n)` instead of `TEXT` in the schema.
9. Confirm `pgcrypto` (or equivalent) is enabled in the schema/migration — `gen_random_uuid()` depends on it, and its absence would make every table creation fail on a fresh database, not just this one.

### Indexes & constraints for scale (many clients, not one)

10. Confirm `idx_lead_sources_page_id`, `idx_leads_client_id`, and `idx_leads_status` exist — without these, a lookup that's fast with one client's data becomes a full table scan once dozens of clients and their leads accumulate.
11. Confirm foreign keys (`client_id`, `source_id`, `assigned_to`, `author_id`, `actor_id`) all have `ON DELETE` behavior explicitly set (`CASCADE` or `SET NULL`, per the schema) rather than left to default — an unset behavior can block deleting a client outright once real data exists across many tables.

---

## B. Requires live data — cannot be verified by reading code

These need an actual test against Meta and/or a populated database with more than one client. Report each as unverifiable rather than guessing at the outcome.

1. **Seed the database with at least 3 distinct clients**, each with a different `client_lead_sources` mapping, and confirm RLS isolation holds for all of them pairwise — not just two. (A design that happens to work for 2 tenants can still have an edge case that only shows up at 3+.)
2. **Give at least two of those test clients genuinely different lead forms** — different number of questions, different question types (short answer, dropdown, and at least one checkbox/multi-select) — and confirm each one's `leads.form_answers` correctly reflects its own form's shape with no cross-contamination or missing fields.
3. **Run a real test through Meta's Lead Ads Testing Tool** end to end: submit a test lead on a form with a multi-select question, and confirm the value that lands in `form_answers` is the full list of selections, not just one.
4. **Confirm the actual field `name` keys Meta sends for custom questions match what a live form produces** — Meta's Graph API returns the question's configured field key, which is not guaranteed to be predictable ahead of time; this must be observed from a real webhook payload / Graph API response, not assumed from documentation.
5. **Confirm behavior when a lead arrives for a `page_id` not yet in `client_lead_sources`** — trigger this deliberately with a test Page that hasn't been mapped, and confirm the "log and drop" fallback in `app/tasks.py` actually fires cleanly rather than crashing the worker.
6. **Confirm the two Postgres roles (`app_service`, `app_client`) exist on whichever database instance is actually used for this test** — this is infrastructure setup, not something the code can self-verify.

---

## C. Required output format

A single markdown table:

| # | Item | Status | Evidence / Notes |
|---|---|---|---|
| A1 | client_lead_sources is one-to-many per client | | |
| A2 | No hardcoded client/page/form values | | |
| ... | ... | | |
| B1 | 3+ client RLS isolation test | CANNOT VERIFY | requires seeded DB + live login |
| ... | ... | | |

Followed by one sentence stating plainly: **is this database ready for more than one client's worth of live, varied-form-shape data, or not** — and if not, the single biggest reason why.
