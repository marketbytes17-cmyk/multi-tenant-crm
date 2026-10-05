# FRONTEND_AUDIT_CHECKLIST.md

## MarketBytes CRM — Build Verification Checklist

Use this to check a generated/built codebase against `FRONTEND_ARCHITECTURE.md`, `DESIGN_SYSTEM.md`, and the frontend build map. Go section by section — each item should be checked against actual files, not assumed. Flag anything unchecked with the file/line where it fails.

---

## 1. Project Structure Compliance

- [ ] `/app` uses route groups matching exactly: `/login`, `/superadmin/*`, `/client/*`, `/rep/*`
- [ ] Each role folder has its own `layout.tsx` rendering the correct sidebar/topbar shell
- [ ] `/components/shared` contains only genuinely cross-role components (KanbanBoard, DataTable, LeadCard, StatusTag, Modal, EmptyState, StatCard)
- [ ] No component is duplicated across `/superadmin`, `/client`, `/rep` when it could have lived in `/shared`
- [ ] `/lib/api` has one file per resource (`leads.ts`, `clients.ts`, `reps.ts`, `auth.ts`) — no inline `fetch()` calls inside components
- [ ] `/lib/hooks` wraps every API call used by a component — no component imports from `/lib/api` directly
- [ ] `/lib/validators` has one Zod schema per form, named `<Form>Schema`
- [ ] `/lib/theme/tokens.ts` exists and is the single source for colors/spacing/radius, wired into `tailwind.config.js`

---

## 2. Routing & Access Control

- [ ] Unauthenticated access to `/superadmin/*`, `/client/*`, `/rep/*` redirects to `/login`
- [ ] Authenticated user with wrong role attempting another role's route is redirected to their own home, not shown a blank/error page
- [ ] Route guard logic reads role from session/JWT server-side (middleware or layout-level check) — not just hidden via client-side conditional rendering
- [ ] No screen fetches data outside its own role's scope (e.g. a `/client` screen never queries another `client_id`)
- [ ] URL structure matches the sidebar nav labels from the build map (no mismatched route/label naming)

---

## 3. State Management

- [ ] All server data (leads, clients, reps, reports) is fetched via TanStack Query — grep for `useState` + `useEffect` combos that manually fetch and store server data; these should not exist
- [ ] Query keys follow the documented convention (`['leads', clientId, filters]`, most-general-first)
- [ ] Mutations (assign lead, change stage, invite rep) use `useMutation`, not manual fetch + manual refetch
- [ ] Optimistic updates with rollback are implemented on: Kanban drag/stage change, lead assignment
- [ ] No server data is duplicated into Context or a global store
- [ ] UI-only state (modal open, selected filter, sidebar collapsed) stays local or in a scoped Context — not mixed into query cache
- [ ] Polling (`refetchInterval`) is set on: lead inbox, pipeline board, notification bell — confirm interval is 30–60s, not missing or set to 0

---

## 4. API Layer

- [ ] Every API function is typed (request params + return type)
- [ ] Error responses are normalized to a single shape (`{ message, code }`) before reaching component-level error handlers
- [ ] No API base URL or secret is hardcoded in a component — pulled from `NEXT_PUBLIC_API_BASE_URL`
- [ ] Each screen's actual API calls match what was specified in the build map for that screen (spot-check 3–5 screens against their documented API contract)

---

## 5. Component Architecture

- [ ] Shared components are prop-driven and contain no role-specific logic or copy (check `KanbanBoard`, `LeadCard`, `DataTable` for hardcoded role checks — there should be none)
- [ ] Screen components (`page.tsx` files) handle data fetching + state composition only; no deep presentational styling logic buried inside them
- [ ] Presentational components (`StatCard`, `StatusTag`) accept props only — no internal data fetching
- [ ] Every list-type screen follows the filter bar → table/board → detail drawer pattern consistently

---

## 6. Design System Compliance

- [ ] No hardcoded hex colors anywhere in component files — grep for `#` inside `.tsx`/`.jsx` files outside `/lib/theme`; anything found is a violation
- [ ] Only the documented color tokens are used (`color-ink`, `color-primary`, `color-primary-soft`, `color-secondary`, `color-tertiary`, `color-neutral-icon`, `color-success`, `color-danger`, `color-bg`, `color-surface`, `color-border`, `color-text-secondary`)
- [ ] Each icon badge/stat card uses exactly one accent tint — none mix two accent colors
- [ ] Status tags use dot + colored text — confirm no filled colored badge implementation slipped in
- [ ] Typography: Sora used only for headings/nav/numbers/card titles; Inter used for body/data/forms — spot check for font-family leaks
- [ ] Table headers are sentence case, not uppercase-tracked
- [ ] Spacing values are multiples of the 4px scale (4/8/12/16/24/32) — no arbitrary padding/margin values
- [ ] Radius values match tokens: 9–10px small controls, 11px kanban cards, 14–16px cards/panels, 999px pills/buttons/avatars
- [ ] Card/panel shadow matches the documented value, applied consistently (no mix of custom shadows)

---

## 7. Required States

For every data-driven screen, confirm all three exist as actual rendered UI (not just handled in code comments):

- [ ] **Loading** — skeleton shaped like real content, not a bare spinner, not a blank screen during fetch
- [ ] **Empty** — icon + message + CTA where applicable, present for: Leads (unassigned), Team (no reps), Pipeline (no leads in a stage), Reports (no data in range)
- [ ] **Error** — message + working Retry button that re-triggers the query, present on every screen that fetches data

Interaction states:
- [ ] Buttons have visible hover state
- [ ] Buttons have visible disabled state (`#D3D4D9` bg / `#9A9BA3` text / `cursor: not-allowed`)
- [ ] Every interactive element shows a `2px solid color-primary` focus ring on keyboard focus (tab through each screen manually to confirm)

---

## 8. Responsive Behavior

- [ ] At ≤760px: sidebar collapses to horizontal icon strip, labels hidden
- [ ] At ≤760px: stat card grid drops from 4 to 2 columns
- [ ] Tables scroll horizontally inside their own container at narrow widths — page itself never scrolls sideways
- [ ] Kanban board remains horizontally scrollable at all widths, columns don't compress illegibly
- [ ] No fixed-pixel-width containers holding body text

---

## 9. Accessibility

- [ ] All interactive controls are real `<button>`/`<a>`/`<input>` elements — no clickable `<div>`s without proper role/tabindex
- [ ] Tables use `<thead>`, `<th scope="col">`
- [ ] Form fields have associated `<label for="">`
- [ ] Full core flow (login → dashboard → assign a lead → move a kanban card) is completable via keyboard only
- [ ] Kanban drag-and-drop has a non-drag alternative (e.g. status dropdown in Lead Detail) for keyboard/screen-reader users
- [ ] Color is never the only signal for status — dot + text label confirmed present everywhere a status appears
- [ ] Text/background color combinations meet WCAG AA (spot-check `color-ink` on `color-surface`, white on `color-ink`/`color-primary`)

---

## 10. Screen Coverage (cross-check against build map)

For each role, confirm every documented screen exists and is reachable from the nav:

**Super Admin:** Dashboard · Clients (list/add/detail) · Lead Routing (mapping/unmatched) · Meta Integration Status · Users · Reports · Settings

**Client Admin:** Dashboard · All Leads · Unassigned Leads · Lead Detail · Pipeline · Team · Invite Rep · Reports · Settings

**Sales Rep:** Dashboard · My Leads · My Pipeline · Lead Detail (scoped) · My Performance · Settings

- [ ] No screen from the build map is missing
- [ ] No screen exists that wasn't in the build map (scope creep check)
- [ ] Sales Rep screens correctly omit reassign/team/billing controls per the permission boundaries defined earlier

---

## 11. Naming Conventions

- [ ] Components: `PascalCase`
- [ ] Hooks: `camelCase`, prefixed `use`
- [ ] API functions: verb + resource pattern (`getLeads`, `assignLead`)
- [ ] Zod schemas: `<Form>Schema`
- [ ] Query keys: array, general-to-specific ordering

---

## How to Use This File

1. Run through sections 1–2 first — structural issues here invalidate everything built on top.
2. Sections 3–5 are best checked with the codebase open, grepping for the patterns called out.
3. Sections 6–9 are best checked by actually running the app and clicking/tabbing through each screen.
4. Section 10 is a coverage pass — compare against the build map screen list directly.
5. Log every unchecked item with file path + what's missing, don't just mark "fail" — the fix should be actionable from this file alone.