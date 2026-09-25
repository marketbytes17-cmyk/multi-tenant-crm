# Market Bytes CRM — Complete Frontend Build Map

Everything needed to build brick by brick: architecture decisions, folder structure, then every screen with layout, components, states, validation, and API contract stubs.

---

## PART A: Foundation Decisions (make these before writing screens)

### A.1 Tech Stack (per original spec)
- **Framework:** React + Next.js (App Router recommended for role-based route groups)
- **Styling:** Tailwind CSS (fast to build role-specific themes)
- **State management:**
  - **Server state** (leads, clients, reps, reports) → React Query / TanStack Query — handles caching, refetch, loading/error states automatically
  - **Client/UI state** (modal open/closed, selected filters, sidebar collapsed) → React Context or local `useState`, no need for Redux at this scale
- **Forms:** React Hook Form + Zod for validation schemas
- **Tables:** TanStack Table (sorting/filtering built in)
- **Drag-and-drop (Kanban):** `dnd-kit`
- **Charts:** Recharts

### A.2 Route Structure & Guards
```
/login
/superadmin/*        → guard: role === 'super_admin'
/client/*             → guard: role === 'client_admin', scoped to their client_id
/rep/*                 → guard: role === 'sales_rep', scoped to their user_id
```
- Route guard checks JWT role claim on every protected route load; redirect to `/login` if invalid, redirect to correct role home if wrong role tries wrong path.
- Each role's routes live in a separate route group/layout so sidebars don't leak across roles.

### A.3 Global Layout Regions (applies to all 3 roles)
```
┌─────────────────────────────────────┐
│ Top Bar: logo | role badge | 🔔 | user ▾ │
├───────────┬───────────────────────────┤
│           │                           │
│  Sidebar  │      Content Area         │
│  (nav)    │      (screen renders)     │
│           │                           │
└───────────┴───────────────────────────┘
```
- Sidebar: collapsible on desktop, off-canvas drawer on mobile (<768px)
- Top bar notification bell: dropdown showing last 5 notifications, "View All" link
- User menu (top right): Profile, Settings, Logout

### A.4 Universal States (every data-driven screen needs all three)
- **Loading:** skeleton placeholders matching the layout shape (not just a spinner)
- **Empty:** icon + one-line message + relevant CTA (e.g. "No leads yet" + nothing to do, vs "No reps yet" + "Invite Rep" button)
- **Error:** message + "Retry" button; never a blank white screen

### A.5 Real-Time Behavior
- **Lead inbox (Client Admin & Sales Rep):** poll every 30s via React Query `refetchInterval`, OR use a websocket/SSE channel if backend supports it later — start with polling, it's simpler to build
- **Kanban board:** optimistic UI update on drag (move card instantly, roll back if API call fails)
- **Notifications bell:** poll every 30–60s

### A.6 Folder Structure
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
  /shared        → LeadCard, KanbanColumn, DataTable, StatusBadge, Modal, EmptyState
  /superadmin
  /client
  /rep
/lib
  /api           → one file per resource: leads.ts, clients.ts, reps.ts, auth.ts
  /hooks         → useLeads, useAssignLead, useKanban, etc.
  /validators    → Zod schemas per form
```

---

## PART B: Screen-by-Screen Detail

Format per screen: **Route → Layout → Components → API → States → Validation**

---

### SUPER ADMIN

#### B1. Dashboard — `/superadmin`
- **Layout:** 4-stat-card row → line chart (leads over time) → recent activity list below
- **Components:** `StatCard` x4, `LineChart`, `ActivityFeedItem` list
- **API:** `GET /api/superadmin/dashboard-summary` → `{ totalLeads, activeClients, adSpend, systemStatus, leadsOverTime[], recentActivity[] }`
- **States:** skeleton cards on load; if `systemStatus.metaConnection === 'down'`, show red banner above stats
- **Validation:** n/a (read-only)

#### B2. Clients List — `/superadmin/clients`
- **Layout:** search bar + status filter dropdown (top), table below, "Add Client" button top-right
- **Components:** `DataTable` (columns: name, status badge, lead count, last activity), `SearchInput`, `FilterDropdown`
- **API:** `GET /api/superadmin/clients?search=&status=&page=`
- **States:** skeleton rows; empty state "No clients yet" + Add Client CTA
- **Validation:** n/a

#### B3. Add Client — `/superadmin/clients/new`
- **Layout:** single-column form modal or dedicated page
- **Fields:** Business Name (text), Contact Email (email), Contact Phone (tel), Admin Login Email (email), Password (auto-generate toggle + manual field)
- **Components:** `FormField` x5, `Toggle`, `SubmitButton`
- **API:** `POST /api/superadmin/clients` → body `{ name, email, phone, adminEmail, password? }` → returns `{ clientId, generatedPassword }`
- **States:** submit loading spinner on button; success → show credentials in a confirmation modal with "Copy" button
- **Validation:** name required (min 2 chars); email valid format + uniqueness check (async, on blur); phone format; password min 8 chars if manual

#### B4. Client Detail — `/superadmin/clients/:id`
- **Layout:** header card (name, status, created date, Edit/Deactivate/Impersonate buttons) → tab bar → tab content
- **Tabs:** Leads (read-only `DataTable`), Team (read-only rep list), Pipeline (read-only `KanbanBoard`), Mapped Pages (table of page_id → this client)
- **API:** `GET /api/superadmin/clients/:id`, `GET /api/superadmin/clients/:id/leads`, `.../team`, `.../pipeline`, `.../mapped-pages`
- **States:** each tab loads independently (don't block on all 4 calls at once); empty states per tab
- **Validation:** n/a (read-only view)

#### B5. Lead Routing / Meta Mapping — `/superadmin/routing`
- **Layout:** table + "Add Mapping" button opening inline form row or modal
- **Components:** `DataTable` (Page ID, Ad ID, Client Name, Edit/Delete icons), `AddMappingModal`
- **API:** `GET /api/superadmin/mappings`, `POST /api/superadmin/mappings`, `DELETE /api/superadmin/mappings/:id`
- **States:** skeleton table; empty state "No mappings yet"
- **Validation:** Page ID required; Client dropdown required (must select existing client); duplicate Page ID→Client check on submit

#### B6. Unmatched Leads — `/superadmin/routing/unmatched`
- **Layout:** table with inline "Assign to Client" dropdown per row
- **API:** `GET /api/superadmin/leads/unmatched`, `POST /api/superadmin/leads/:id/manual-assign` → body `{ clientId }`
- **States:** row-level loading spinner on assign action; row disappears from list on success (with a toast confirmation)
- **Validation:** client selection required before "Assign" button enables

#### B7. Meta Integration Status — `/superadmin/integration`
- **Layout:** status card (token health, last webhook timestamp) → log table below
- **Components:** `StatusCard` (green/red indicator), `DataTable` (timestamp, event, status)
- **API:** `GET /api/superadmin/integration/status`, `GET /api/superadmin/integration/logs`, `POST /api/superadmin/integration/test-lead`
- **States:** auto-refresh status every 60s; "Send Test Lead" button shows loading → success/fail toast
- **Validation:** n/a

#### B8. Client Admins (Users) — `/superadmin/users`
- **Layout:** search + table (name, client org, email, status, actions)
- **API:** `GET /api/superadmin/users`, `POST /api/superadmin/users/:id/reset-password`, `POST /api/superadmin/users/:id/deactivate`
- **States:** confirmation modal before deactivate ("Are you sure?"); toast on reset password sent
- **Validation:** n/a

#### B9. Reports — `/superadmin/reports`
- **Layout:** date range picker (top) → bar chart (leads by client) → table (conversion by client) → export button
- **Components:** `DateRangePicker`, `BarChart`, `DataTable`, `ExportButton`
- **API:** `GET /api/superadmin/reports?from=&to=`
- **States:** re-fetch on date range change with loading overlay on chart/table
- **Validation:** end date must be ≥ start date

#### B10. Settings — `/superadmin/settings`
- **Layout:** simple form sections: Platform Info, Notification Defaults, Change Password
- **API:** `GET /api/superadmin/settings`, `PATCH /api/superadmin/settings`, `POST /api/auth/change-password`
- **States:** "Save" button disabled until a field changes; success toast
- **Validation:** password fields (current, new, confirm) must match rules; new ≠ current

---

### CLIENT ADMIN

#### B11. Dashboard — `/client`
- **Layout:** 3 stat cards (new leads today, unassigned count, active reps) → mini funnel chart → team activity list
- **API:** `GET /api/client/dashboard-summary`
- **States:** skeleton cards; if `unassignedCount > 0`, highlight that stat card in amber
- **Validation:** n/a

#### B12. All Leads — `/client/leads`
- **Layout:** filter bar (status, assigned/unassigned, date range, search) → table
- **Components:** `DataTable` (name, phone, source, status badge, assigned rep or "Unassigned" pill, date), inline `AssignDropdown` per row
- **API:** `GET /api/client/leads?status=&assignedRep=&search=&page=`, `POST /api/client/leads/:id/assign` → `{ repId }`
- **States:** skeleton table; row-level spinner on assign; toast on success
- **Validation:** rep must be selected before assign confirms

#### B13. Unassigned Leads — `/client/leads/unassigned`
- **Layout:** same as B12 pre-filtered, plus checkbox column for bulk select + "Bulk Assign" button
- **API:** same as B12 plus `POST /api/client/leads/bulk-assign` → `{ leadIds[], repId }`
- **States:** bulk action bar appears when ≥1 row selected
- **Validation:** at least 1 lead selected + rep chosen to enable bulk assign

#### B14. Lead Detail — drawer (opened from B12/B13/Pipeline)
- **Layout:** slide-in drawer from right; header (name, status badge) → contact info block → assigned rep (editable dropdown) → activity timeline → note input at bottom
- **Components:** `Drawer`, `InfoBlock`, `Dropdown`, `Timeline`, `NoteInput`
- **API:** `GET /api/client/leads/:id`, `PATCH /api/client/leads/:id` (status/reassign), `POST /api/client/leads/:id/notes`
- **States:** timeline loads separately (can lag slightly behind header); note submit shows inline spinner then appends to timeline optimistically
- **Validation:** note field non-empty to submit; status change confirms via dropdown select (no separate submit button)

#### B15. Pipeline (Kanban) — `/client/pipeline`
- **Layout:** horizontal-scroll columns (New / Contacted / In Negotiation / Closed Won / Closed Lost), lead cards inside
- **Components:** `KanbanBoard`, `KanbanColumn` x5, `LeadCard` (draggable)
- **API:** `GET /api/client/pipeline`, `PATCH /api/client/leads/:id/stage` → `{ stage }` (called on drop)
- **States:** optimistic move on drag; roll back card position + toast error if API fails
- **Validation:** dropping into "Closed Lost" triggers a required reason modal before confirming the move

#### B16. Team / Sales Reps — `/client/team`
- **Layout:** table (name, email, status, leads assigned, conversion %) + "Invite Rep" button
- **API:** `GET /api/client/team`, `POST /api/client/team/:id/remove`
- **States:** confirm modal before remove; empty state "No reps yet" + Invite CTA
- **Validation:** n/a

#### B17. Invite Rep — `/client/team/invite`
- **Layout:** simple form modal
- **Fields:** Name, Email, "Send invite" toggle (email vs. manual credential share)
- **API:** `POST /api/client/team/invite` → `{ name, email }`
- **States:** submit spinner; success toast "Invite sent"
- **Validation:** name required; email valid + not already a rep in this org

#### B18. Reports — `/client/reports`
- **Layout:** date range picker → line chart (org performance over time) → per-rep table
- **API:** `GET /api/client/reports?from=&to=`
- **States:** loading overlay on range change
- **Validation:** end date ≥ start date

#### B19. Settings — `/client/settings`
- **Layout:** sections: Org Profile (name, logo upload), Notification Preferences, Change Password
- **API:** `GET /api/client/settings`, `PATCH /api/client/settings`
- **States:** logo upload shows preview + progress bar
- **Validation:** logo file type/size limit (e.g. PNG/JPG, <2MB)

---

### SALES REP

#### B20. Dashboard — `/rep`
- **Layout:** 2 stat cards (new leads assigned, follow-ups due today) → follow-up list below
- **API:** `GET /api/rep/dashboard-summary`
- **States:** skeleton; empty state if no follow-ups due
- **Validation:** n/a

#### B21. My Leads — `/rep/leads`
- **Layout:** filter bar (status) → table or card grid
- **API:** `GET /api/rep/leads?status=`
- **States:** skeleton; empty state "No leads assigned yet"
- **Validation:** n/a

#### B22. My Pipeline (Kanban) — `/rep/pipeline`
- **Layout:** same Kanban component as B15, scoped to this rep's leads only, no reassign option
- **API:** `GET /api/rep/pipeline`, `PATCH /api/rep/leads/:id/stage`
- **States:** same optimistic drag behavior as B15
- **Validation:** same Closed Lost reason requirement

#### B23. Lead Detail — drawer (shared component, scoped)
- **Layout:** same as B14 minus the reassign dropdown (rep can't reassign unless permission granted)
- **API:** `GET /api/rep/leads/:id`, `PATCH /api/rep/leads/:id`, `POST /api/rep/leads/:id/notes`
- **States/Validation:** same as B14

#### B24. My Performance — `/rep/performance`
- **Layout:** 3 stat cards (leads handled, conversion rate, avg response time) + small trend chart
- **API:** `GET /api/rep/performance`
- **States:** skeleton cards
- **Validation:** n/a

#### B25. Settings — `/rep/settings`
- **Layout:** Profile (name, avatar), Notification Preferences, Change Password
- **API:** `GET /api/rep/settings`, `PATCH /api/rep/settings`
- **States/Validation:** same pattern as B19

---

## PART C: Build Order (bricks, in sequence)

1. **Brick 1 — Foundation:** Part A in full (auth, layout shell, shared components, folder structure) — nothing else works without this
2. **Brick 2 — Core loop:** B12, B14, B15 (Client Admin: Leads, Lead Detail, Kanban) — this is the product's core value
3. **Brick 3 — Rep side:** B21, B22, B23 (reuses Kanban/Drawer from Brick 2, scoped down)
4. **Brick 4 — Assignment tools:** B13 (Unassigned), B16, B17 (Team/Invite)
5. **Brick 5 — Reporting:** B18, B24 (Client + Rep reports)
6. **Brick 6 — Super Admin:** B1–B10, built last since it manages entities (clients, reps, leads) that already exist from Bricks 2–5 during testing
7. **Brick 7 — Polish:** notification bell wiring, all empty/error states audited, mobile responsiveness pass, accessibility pass (keyboard nav, ARIA labels on interactive elements)

---

## Still explicitly out of scope (confirm separately before backend work starts)
- Actual visual design system (exact colors, fonts, spacing scale) — this map gives structure, not a Figma file
- Backend implementation of the API endpoints listed (contracts given here are proposals for the frontend team to agree with backend)
- Websocket/real-time infra if you later replace polling
- Testing strategy (unit/e2e) — not covered here
