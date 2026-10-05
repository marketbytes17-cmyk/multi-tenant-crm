# PRD.md — Market Bytes CRM

## Product overview

**Name:** Market Bytes CRM (Market Bytes Proprietary CRM)

**One-line description:** A multi-tenant CRM that automatically ingests every lead generated across Market Bytes' Meta ad campaigns and routes it into isolated, ready-to-use portals for each client — with zero setup required on the client's end.

**Product vision:** Market Bytes is transitioning from a traditional digital marketing agency into a SaaS-enabled growth partner. Because Market Bytes runs every client's ad campaigns through its own Meta Ads Manager, clients never need to connect their own accounts — leads simply appear in their portal, ready to work.

## Problem

Client ad campaigns currently generate leads with no unified way for:
- Clients to see, own, and act on their leads as they arrive.
- Market Bytes to see agency-wide performance (lead volume, ad spend, ROI) across its full client portfolio in one place.

Asking clients to connect their own Meta accounts (standard OAuth) would add friction and support burden Market Bytes wants to avoid entirely, since it already manages all ad accounts centrally.

## Goal

Give every Market Bytes client a live, self-service view of their leads and a simple way to work them — while giving Market Bytes internal staff a single command center for tenant management and agency-wide visibility. Success looks like: a lead submitted on a client's ad appears in that client's portal automatically, with no manual export, no client-side setup, and no risk of one client ever seeing another's data.

## Target users

- **Super Admin (Market Bytes staff):** Manages the whole platform — onboards new clients, maps their Meta Pages/Forms, monitors agency-wide lead volume and campaign health, and can impersonate a client account to troubleshoot.
- **Client Admin:** The client's point of contact — sees only their own leads, manages their sales pipeline, and invites their own sales reps.
- **Sales Rep:** Works leads assigned to them within their client's account; no visibility outside their own tenant.

## Core features

For the first version:

1. **Centralized Meta Lead Ads ingestion** — a single master System User token and one webhook endpoint capture leads across every client's ad campaigns; no client-side Meta connection required.
2. **Automatic lead routing** — each incoming lead is matched (via Page ID and Form ID) to the correct client, supporting clients that run more than one active campaign/form at a time.
3. **Isolated client lead inbox & pipeline** — a Kanban board (New → Contacted → Negotiating → Won/Lost) scoped so a client only ever sees their own leads.
4. **Flexible lead capture** — since clients' lead forms ask different, inconsistent custom questions, every lead stores its answers without assuming a fixed set of fields.
5. **Client team management** — a Client Admin can invite their own sales reps and assign leads to them.
6. **Super Admin command center** — global lead/campaign analytics, tenant provisioning (creating clients, mapping Pages/Forms), and an impersonation mode for support.
7. **New-lead notifications** — a client is alerted when a new lead lands in their pipeline.
8. **One shared portal design** — a single default look and feel for every client; no per-client branding in v1.

## User flows

**Lead ingestion (automatic, no user action):**
Someone submits a lead form on a client's Meta ad → Meta sends a webhook event → the system verifies it, fetches the lead's details, matches it to the right client, and files it into that client's inbox as "New."

**Client Admin:**
Log in → see new leads in the inbox/Kanban board → move a lead through pipeline stages as it progresses → add notes → invite a sales rep → assign leads to reps.

**Sales Rep:**
Log in → see only the leads assigned to them → update status and add notes as they work each lead.

**Super Admin:**
Log in → view lead volume and campaign performance across all clients → onboard a new client (create their record, map their Page/Form) → impersonate a client account if they need help.

## Requirements

**Functional**
- Strict data isolation between clients, enforced at the database level (not just in application code).
- Role-based access for three roles: Super Admin, Client Admin, Sales Rep.
- Webhook authenticity verification on every inbound lead event — an unsigned or forged request must never create a lead.
- Lead routing must handle a client running multiple simultaneous campaigns/forms.
- Every admin action taken while impersonating a client must be attributable after the fact.

**UX**
- Leads should appear in a client's inbox promptly after the real-world form submission, without the client needing to do anything.
- The Kanban pipeline should let a user move a lead between stages in a single action.
- One consistent interface for every client — no per-client visual customization in v1.

**Performance**
- The webhook endpoint must acknowledge Meta's event quickly regardless of how the rest of the lead-processing pipeline is performing, so a slow downstream step never causes Meta to see a failed delivery.
- The system should handle realistic agency-scale lead bursts (e.g., a client's ad going unexpectedly viral) without dropping events.

**Platform**
- Web-based portals for both Client Admin/Sales Rep and Super Admin, accessible from a standard browser — no native mobile app in v1.

## Success metrics

- **Zero cross-client data leakage** — no client ever sees another client's lead, verified by testing, not just by design intent.
- **Lead capture completeness** — every lead submitted on a mapped campaign reaches the correct client's inbox; leads lost due to routing errors trend to zero.
- **Time-to-visibility** — time from a real-world form submission to the lead appearing in the client's portal stays low and predictable, even during volume spikes.
- **Client adoption** — proportion of onboarded clients actively using the portal (logging in, moving leads through the pipeline) weekly.
- **Reduced manual work** — leads Market Bytes staff previously had to export/forward manually drops to near zero post-launch.

## Out of scope

Deliberately not part of this version — candidates for later iterations:

- Per-client branding or portal theming (confirmed: one shared look for all clients).
- Any client-side Meta account connection or OAuth flow (the entire point of the centralized System User approach is to avoid this).
- Billing or subscription management for portal access.
- Custom, per-client pipeline stages (the New/Contacted/Negotiating/Won/Lost stages are fixed for v1).
- Real email/SMS delivery for lead notifications (v1 ships with a logging stub; a provider integration comes later).
- Advanced agency-wide reporting/BI beyond basic lead volume and campaign health.
- Native mobile apps.
