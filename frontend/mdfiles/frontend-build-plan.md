# Market Bytes CRM — Frontend Build Plan (Phase by Phase)

This breaks the frontend into buildable phases. Each screen lists: purpose, data shown, key components, and actions/buttons — enough detail to start coding without guessing.

---

## PHASE 0: Foundation (build first, shared by all roles)

### 0.1 Auth Shell
- **Login page** — email/password fields, "Login" button, error state for invalid credentials
- **Role-based redirect** — after login, route to `/superadmin`, `/client`, or `/rep` based on user role
- **Forgot password flow** — request reset → email link → new password form

### 0.2 App Shell / Layout
- **Sidebar navigation** — collapsible, role-specific menu items (built per role below)
- **Top bar** — logged-in user name, role badge, notifications bell icon, logout
- **Content area** — where each screen renders
- **Toast/notification system** — for success/error messages after actions (assign lead, save settings, etc.)

### 0.3 Shared Components (build once, reuse everywhere)
- **Lead Card** — compact view: name, phone, status badge, source, assigned-to (if applicable)
- **Kanban Column** — reusable stage column with drag-and-drop
- **Data Table** — sortable/filterable table (used for lead lists, client lists, rep lists)
- **Status Badge** — colored pill for lead stage (New/Contacted/Negotiation/Closed Won/Closed Lost)
- **Modal/Drawer** — for "Add New X" forms and lead detail view
- **Empty State** — "No leads yet" placeholder for empty lists

---

## PHASE 1: Super Admin Screens

### 1.1 Dashboard (`/superadmin`)
- **Data shown:** total leads (today/week/month), total active clients, system status indicator (Meta connection: green/red), recent activity feed
- **Components:** 4 stat cards (leads, clients, ad spend, system status), a small line chart (leads over time), recent client activity list
- **Actions:** click a stat card → navigate to relevant detail page

### 1.2 Clients — List (`/superadmin/clients`)
- **Data shown:** table of all client orgs — name, status (active/inactive), lead count, last activity date
- **Components:** Data Table with search bar and status filter
- **Actions:** "Add New Client" button (top right), click a row → Client Detail page

### 1.3 Clients — Add New (`/superadmin/clients/new`)
- **Fields:** Client/business name, contact email, contact phone, initial admin login email, auto-generate password (or set manually)
- **Actions:** "Create Client" button → generates login, shows success confirmation with credentials to share

### 1.4 Clients — Detail (`/superadmin/clients/:id`)
- **Data shown:** client info header (name, status, created date), tabs for: Leads (read-only oversight view), Team (their reps), Pipeline (their Kanban, read-only), Mapped Meta Pages
- **Components:** Tab navigation, reused Data Table and Kanban components in read-only mode
- **Actions:** "Edit Client Info," "Deactivate Client," "Impersonate" button (top right)

### 1.5 Lead Routing — Meta Mapping (`/superadmin/routing`)
- **Data shown:** table of Meta Page IDs/Ad IDs mapped to client names
- **Components:** Data Table, "Add Mapping" form (Page ID input, dropdown to select client)
- **Actions:** Add/Edit/Delete a mapping

### 1.6 Lead Routing — Unmatched Leads (`/superadmin/routing/unmatched`)
- **Data shown:** leads that arrived via webhook but couldn't be matched to a client (raw `page_id`, timestamp, lead data)
- **Components:** Data Table
- **Actions:** "Manually Assign to Client" dropdown per row

### 1.7 Meta Integration Status (`/superadmin/integration`)
- **Data shown:** System User Token status (valid/expired), last webhook received timestamp, webhook success/failure log (recent 50 entries)
- **Components:** Status card, log table
- **Actions:** "Send Test Lead" button (triggers test webhook simulation)

### 1.8 Users — Client Admins (`/superadmin/users`)
- **Data shown:** table of all Client Admin accounts — name, client org, email, status
- **Components:** Data Table with search
- **Actions:** "Reset Password," "Deactivate User" per row

### 1.9 Reports (`/superadmin/reports`)
- **Data shown:** leads by client (bar chart), conversion rate by client (table), date range filter
- **Components:** Chart component, Data Table, date range picker
- **Actions:** "Export CSV" button

### 1.10 Settings (`/superadmin/settings`)
- **Fields:** platform name, default notification settings, admin's own password change
- **Actions:** "Save Settings"

---

## PHASE 2: Client Admin Screens

### 2.1 Dashboard (`/client`)
- **Data shown:** new leads today count, pipeline snapshot (count per stage as mini bar/funnel), team activity (reps and their lead counts)
- **Components:** stat cards, mini funnel chart, team activity list
- **Actions:** click a stat → navigate to Leads or Pipeline

### 2.2 Leads — All Leads (`/client/leads`)
- **Data shown:** table of all org leads — name, phone, source, status, assigned rep (or "Unassigned"), date received
- **Components:** Data Table with filters (status, assigned/unassigned, date range), search bar
- **Actions:** click a row → Lead Detail drawer; "Assign" dropdown inline per row

### 2.3 Leads — Unassigned (`/client/leads/unassigned`)
- **Data shown:** same as above, filtered to unassigned only — this is the priority action screen
- **Components:** Data Table
- **Actions:** quick-assign dropdown per row, bulk-select + bulk-assign

### 2.4 Lead Detail (drawer/modal, opened from any lead list)
- **Data shown:** full contact info (name, phone, email), source campaign/ad, current status, assigned rep, notes/activity timeline
- **Components:** detail header, activity timeline list, note input box
- **Actions:** reassign rep, change status, add note

### 2.5 Pipeline — Kanban Board (`/client/pipeline`)
- **Data shown:** all org leads as cards across stage columns (New → Contacted → In Negotiation → Closed Won/Lost)
- **Components:** Kanban Column (reused), Lead Card (reused)
- **Actions:** drag card between stages, click card → Lead Detail drawer

### 2.6 Team — Sales Reps (`/client/team`)
- **Data shown:** table of reps — name, email, status, number of leads assigned, conversion rate
- **Components:** Data Table
- **Actions:** "Invite New Rep" button, "Remove Rep" per row

### 2.7 Team — Invite Rep (`/client/team/invite`)
- **Fields:** rep name, email, auto-send invite toggle
- **Actions:** "Send Invite" button

### 2.8 Reports (`/client/reports`)
- **Data shown:** org performance over time (chart), per-rep performance table (leads handled, closed won/lost, conversion %)
- **Components:** chart, Data Table, date range filter
- **Actions:** "Export CSV"

### 2.9 Settings (`/client/settings`)
- **Fields:** org name/logo (branding), notification preferences, admin's own password
- **Actions:** "Save Settings"

---

## PHASE 3: Sales Rep Screens

### 3.1 Dashboard (`/rep`)
- **Data shown:** count of new leads assigned, follow-ups due today, quick personal stats (conversion rate)
- **Components:** stat cards, "follow-up due" list
- **Actions:** click a lead in follow-up list → Lead Detail

### 3.2 My Leads (`/rep/leads`)
- **Data shown:** table/card list of leads assigned to this rep only — name, phone, status, date assigned
- **Components:** Data Table or card grid, filter by status
- **Actions:** click a lead → Lead Detail drawer

### 3.3 Pipeline — My Kanban (`/rep/pipeline`)
- **Data shown:** same Kanban component as Client Admin, but scoped to only this rep's leads
- **Components:** Kanban Column, Lead Card (reused from Phase 0)
- **Actions:** drag card between stages

### 3.4 Lead Detail (drawer, shared component from Phase 2.4, scoped down)
- **Data shown:** contact info, source, notes/activity, no reassign option (unless allowed)
- **Actions:** add note/call log, change status, mark Closed Won/Lost with reason

### 3.5 My Performance (`/rep/performance`)
- **Data shown:** leads handled, conversion rate, average response time — simple stat cards, maybe one trend chart
- **Components:** stat cards, small chart

### 3.6 Settings (`/rep/settings`)
- **Fields:** name, password, notification preferences
- **Actions:** "Save Settings"

---

## Suggested Build Order (Sprints)

1. **Sprint 1:** Phase 0 (auth, shell, shared components) — nothing works without this
2. **Sprint 2:** Phase 2.2, 2.4, 2.5 (Client Admin: Leads list, Lead Detail, Kanban) — this is the core value loop, build it before anything else
3. **Sprint 3:** Phase 3 (Sales Rep) — reuses Kanban/Lead Detail from Sprint 2 with scoped data
4. **Sprint 4:** Phase 2.6–2.9 (Client Admin: Team, Reports, Settings)
5. **Sprint 5:** Phase 1 (Super Admin) — build last since it depends on clients/reps/leads already existing to manage
6. **Sprint 6:** Polish — notifications, empty states, loading states, mobile responsiveness

**Why this order:** the Client Admin + Sales Rep loop (receive lead → assign → work it → close it) is the actual product. Super Admin is management tooling around that loop, so it can come after the core loop is functional and testable with dummy data.

---

## Notes
- Backend/API endpoints are not covered here — this is frontend screens only, as requested.
- Fields/components can be trimmed further once you decide on exact tech stack (React/Next.js per the original spec) and UI library.
