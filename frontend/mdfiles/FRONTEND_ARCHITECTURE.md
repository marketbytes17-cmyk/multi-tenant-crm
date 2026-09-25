# FRONTEND_ARCHITECTURE.md

## MarketBytes CRM — Frontend Architecture

Defines the technical structure the coding agent should follow so generated code is consistent, predictable, and easy to extend — same intent as DESIGN_SYSTEM.md, but for code instead of visuals.

---

## 1. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | React + Next.js (App Router) | Route groups map cleanly to the three role-based portals |
| Styling | Tailwind CSS | Fast to implement DESIGN_SYSTEM.md tokens as utility classes / theme config |
| Server state | TanStack Query (React Query) | Handles caching, refetch, loading/error state for all API-backed data (leads, clients, reps, reports) |
| Client/UI state | React Context + `useState` | Modal open/closed, selected filters, sidebar collapse — no Redux needed at this scale |
| Forms | React Hook Form + Zod | Schema-based validation, shared between client and (optionally) server |
| Tables | TanStack Table | Sorting/filtering built in, used for every list screen |
| Drag-and-drop | `dnd-kit` | Kanban pipeline board |
| Charts | Recharts | Dashboard and reports screens |

---

## 2. Project Structure

```
/app
  /login
  /superadmin
    /clients
    /routing
    /integration
    /users
    /reports
    /settings
    layout.tsx
  /client
    /leads
    /pipeline
    /team
    /reports
    /settings
    layout.tsx
  /rep
    /leads
    /pipeline
    /performance
    /settings
    layout.tsx
/components
  /shared        → LeadCard, KanbanColumn, DataTable, StatusTag, Modal, EmptyState, StatCard
  /superadmin
  /client
  /rep
/lib
  /api           → one file per resource: leads.ts, clients.ts, reps.ts, auth.ts
  /hooks         → useLeads, useAssignLead, useKanban, useDashboardSummary, etc.
  /validators    → Zod schemas, one per form
  /theme         → design tokens (colors, spacing, radius) as a single source of truth, imported into Tailwind config
```

**Rule:** a component only lives in `/superadmin`, `/client`, or `/rep` if it is genuinely role-specific. Anything reused across two or more roles (Kanban board, Lead Detail drawer, DataTable) belongs in `/shared` and is scoped down via props, not duplicated.

---

## 3. Routing & Access Control

```
/login                → public
/superadmin/*         → requires role === 'super_admin'
/client/*             → requires role === 'client_admin', all data scoped to session client_id
/rep/*                → requires role === 'sales_rep', all data scoped to session user_id
```

- Each role's routes live under their own `layout.tsx`, which renders the correct sidebar/topbar shell and enforces the role guard before rendering children.
- Guard logic: read role from the JWT/session on every protected route load. Invalid/missing session → redirect to `/login`. Valid session, wrong role for the path → redirect to that role's home (`/superadmin`, `/client`, or `/rep`).
- No cross-role component ever reads another role's data directly — scoping happens server-side (API/RLS), and the frontend never assumes it can widen a query.

---

## 4. State Management Rules

- **Server state (anything from the API) → TanStack Query only.** Never mirror server data into `useState` or Context. Each resource gets a query key convention: `['leads', clientId, filters]`, `['pipeline', clientId]`, `['dashboard', role, id]`.
- **Mutations** (assign lead, change stage, invite rep) use `useMutation` with `onMutate` for optimistic updates where the UI needs to feel instant (Kanban drag, status change) and rollback on error.
- **Client-only UI state** (drawer open, selected tab, filter panel expanded) → local `useState` in the owning component, or a small Context if shared across siblings (e.g. `KanbanFilterContext`). Never put UI-only state in a global store.
- **Real-time-ish behavior:** poll via `refetchInterval` (30–60s) on the lead inbox, pipeline, and notification bell queries. This is the default for v1 — swap to websocket/SSE later without changing component code, since components only consume the query result, not the transport.

---

## 5. Data Fetching / API Layer

- All network calls go through `/lib/api/*.ts` — components and hooks never call `fetch` directly.
- Each API file exports typed functions per resource:
  ```ts
  // lib/api/leads.ts
  export async function getLeads(params: LeadFilters): Promise<Lead[]>
  export async function assignLead(leadId: string, repId: string): Promise<Lead>
  export async function updateLeadStage(leadId: string, stage: LeadStage): Promise<Lead>
  ```
- Hooks in `/lib/hooks` wrap these in `useQuery`/`useMutation` — components import the hook, never the raw API function, so caching/loading/error handling stays consistent everywhere.
- API error shape is normalized once at the API layer (`{ message, code }`) so every `onError` handler and toast can assume the same structure.

---

## 6. Component Architecture

- **Shared components are prop-driven, never role-aware.** `KanbanBoard` takes `leads`, `onStageChange`, `canReassign` — it doesn't know or care if it's rendered inside `/client` or `/rep`. The parent screen decides what data and permissions to pass in.
- **Screen components** (`app/client/leads/page.tsx`) are responsible for: fetching data via hooks, handling loading/empty/error states, and composing shared components. They contain no presentational styling beyond layout.
- **Presentational components** (`LeadCard`, `StatCard`, `StatusTag`) contain no data-fetching — pure props in, JSX out.
- Every list-type screen follows the same shape: filter bar → `DataTable` or `KanbanBoard` → drawer/modal for detail, so the pattern is copy-adaptable across Leads, Team, Clients, etc.

---

## 7. Naming Conventions

- Components: `PascalCase` (`LeadDetailDrawer.tsx`)
- Hooks: `camelCase`, prefixed `use` (`useAssignLead.ts`)
- API functions: verb + resource (`getLeads`, `assignLead`, `updateLeadStage`)
- Query keys: array, most-general-first (`['leads', clientId]`, not `['clientLeads', clientId]`)
- Zod schemas: `<Form>Schema` (`InviteRepSchema`)
- Route folders match the sidebar labels from DESIGN_SYSTEM.md / the build map exactly, so URL and nav stay predictable.

---

## 8. Error & Loading Handling (applies everywhere)

Every data-driven screen implements all three, per DESIGN_SYSTEM.md §7:
1. Loading → skeleton shaped like the real content (component-level, not a full-page spinner)
2. Empty → icon + message + CTA where relevant
3. Error → message + Retry button that re-triggers the query

This is enforced at the screen level, not left to individual components to remember.

---

## 9. Environment & Config

- `.env.local` holds `NEXT_PUBLIC_API_BASE_URL` and any client-safe keys only — nothing secret ships to the client.
- Theme tokens from DESIGN_SYSTEM.md live in one file (`/lib/theme/tokens.ts`) and are consumed by `tailwind.config.js` — colors, radii, spacing are never hardcoded inline in components.

---

## 10. Out of Scope Here

- Backend implementation of the API endpoints this layer calls (contracts are proposed in the frontend build map, agreed separately with backend)
- Testing strategy (unit/e2e) — add a `TESTING.md` if/when needed
- CI/CD and deployment pipeline

---

## Reference

Pairs with `DESIGN_SYSTEM.md` (visual rules) and the frontend build map (screen-by-screen breakdown, build order). Use all three together when generating a new screen: build map for what the screen contains, DESIGN_SYSTEM.md for how it looks, this file for how it's wired.
