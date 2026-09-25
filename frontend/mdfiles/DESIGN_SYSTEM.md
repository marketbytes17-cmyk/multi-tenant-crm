# DESIGN_SYSTEM.md

## MarketBytes CRM — Design System

Defines the visual rules the coding agent should follow so generated screens feel like one product instead of unrelated pages. Colors were extracted by pixel-sampling MarketBytes' own internal workspace tool — use the exact hex values given, do not substitute similar-looking ones.

---

## 1. Brand Direction

A lead-management CRM used daily by agency staff and small-business client admins — not a marketing site. The product should feel **clear, fast, and trustworthy**: data is the hero, decoration is minimal. A dark, near-black sidebar anchors the structure; a single working blue carries all primary actions and active states; a small rotating set of icon tints (blue / violet / orange / gray) gives stat cards visual variety without turning the UI busy. Nothing is decorative — every color choice signals function (active, status, alert, success).

Personality: precise, calm, professional, quietly confident. Not playful, not corporate-sterile.

---

## 2. Color Tokens

| Token | Hex | Role |
|---|---|---|
| `color-ink` | `#030712` | Primary text, sidebar background, default button background |
| `color-primary` | `#155DFC` | Primary accent — active nav, primary icon fills, links, focus rings |
| `color-primary-soft` | `#D5E3FC` | Active nav pill bg, avatar bg, "New" status tint |
| `color-secondary` | `#7F71F8` | Secondary icon accent (violet) |
| `color-secondary-soft` | `#EEECFE` | Background tint behind secondary-accent icons |
| `color-tertiary` | `#F54900` | Tertiary icon accent (orange) |
| `color-tertiary-soft` | `#FFF1E6` | Background tint behind tertiary-accent icons |
| `color-neutral-icon` | `#6B7280` | Neutral icon accent (gray) |
| `color-neutral-soft` | `#F1F2F4` | Background tint behind neutral icons, bell background |
| `color-success` | `#00BC7D` | Online status, closed-won indicator |
| `color-danger` | `#FB3038` | Notification badge, error/alert, closed-lost indicator |
| `color-bg` | `#E3E7EF` | App canvas, behind all cards |
| `color-surface` | `#FFFFFF` | Cards, panels, tables, modals, inputs |
| `color-border` | `#E5E7EB` | Hairline borders, dividers |
| `color-text-secondary` | `#6B7280` | Supporting/secondary text |

**Dark mode:**
`color-bg:#121214` · `color-surface:#1A1A1D` · `color-ink:#F2F2F3` · `color-text-secondary:#9A9AA2` · `color-border:#2B2B2F` · `color-primary-soft:#1E2440`

**Rule:** each stat card or icon badge gets exactly one accent tint from primary/secondary/tertiary/neutral — never mix two in one component. Status is always dot-indicator + colored text, never a filled colored badge.

---

## 3. Typography

Two-font system — do not substitute:
- **Sora** (600/700/800) — headings, nav labels, stat numbers, card titles
- **Inter** (400/500/600/700) — body text, table data, form inputs, buttons

Google Fonts import: `family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700`

| Style | Size | Weight | Font | Line height | Usage |
|---|---|---|---|---|---|
| Page title | 25–28px | 800 | Sora | 1.25 | Screen headline, dashboard greeting |
| Section title | 19–21px | 800 | Sora | 1.3 | Card group headers |
| Card title | 14.5–16px | 700 | Sora | 1.3 | Panel headers |
| Body | 13–14px | 400 | Inter | 1.5 | Table cells, descriptions |
| Secondary | 11.5–12.5px | 400 | Inter | 1.4 | Stat labels, timestamps |
| Micro / table header | 10.5–11px | 600 | Inter | 1.3 | Column headers — **sentence case, not uppercase-tracked** |

---

## 4. Spacing

4px base unit. Use only these steps:

| Token | Value |
|---|---|
| `space-1` | 4px |
| `space-2` | 8px |
| `space-3` | 12px |
| `space-4` | 16px |
| `space-5` | 24px |
| `space-6` | 32px |

Content padding: 20–24px. Card internal padding: 14–18px. Nav item padding: 9px 10px.

---

## 5. Radius & Shadows

| Token | Value | Usage |
|---|---|---|
| `radius-sm` | 9–10px | Inputs, icon badges, small controls |
| `radius-md` | 11px | Kanban lead cards |
| `radius-lg` | 14–16px | Cards, panels, app shell corners |
| `radius-full` | 999px | Buttons, pills, avatars |
| `shadow-card` | `0 1px 2px rgba(3,7,18,.04), 0 8px 20px rgba(3,7,18,.06)` | All elevated surfaces (cards, panels, modals) |

Borders: `1px solid color-border` on tables, inputs, ghost buttons, kanban cards. No borders on primary buttons or icon badges.

---

## 6. Components

**Sidebar nav item** — default: `color-neutral-icon` text/icon, no bg. Active: `color-primary-soft` bg, `color-primary` text/icon, weight 600, `radius-sm`.

**Primary button (pill)** — `color-ink` bg (or `color-primary` for main CTAs like Sign In), white text, `radius-full`, padding 9px 16px, weight 600, size 12.5–13px.

**Ghost button** — transparent bg, `1px solid color-border`, `color-ink` text. Hover: border → `color-ink`.

**Stat card** — `color-surface` bg, `radius-lg`, `shadow-card`. Icon badge 36×36px, `radius-sm`, one accent tint. Number: Sora 800, 21–25px. Label: Inter 400, 11–12px, `color-text-secondary`.

**Table** — wrapped in a `radius-lg` panel. Header row: weight 600, 11px, `color-text-secondary`, sentence case, `1px solid color-border` top and bottom. Rows: padding 11–13px 16px, bottom border, last row borderless, hover background shift.

**Status tag** — 7px dot + colored text, no filled background. New → primary; Contacted → tertiary; Closed Won → success; Closed Lost → danger.

**Form input** — `1px solid color-border`, `radius-sm`, padding 10–11px 12–13px.

**Notification bell** — 32–34px circle, `color-neutral-soft` bg, `color-neutral-icon` icon. Badge: 8px `color-danger` dot, top-right, `1.5px solid color-surface` ring.

**Avatar** — circle, `color-primary-soft` bg, `color-primary` initials. Optional 8px `color-success` status dot, bottom-right, `1.5px solid color-surface` ring.

**Kanban column** — `color-surface` bg, `radius-lg`, ~210px width, 12px padding. Header: label + count pill (`color-bg` bg, `color-text-secondary` text).

**Kanban card** — `color-surface` bg, `1px solid color-border`, `radius-md`, 10px padding. Hover: border → `color-primary`.

**Modal** — same card treatment as panels; overlay uses `color-ink` at reduced opacity.

---

## 7. States

- **Default** — as specified per component above.
- **Hover** — buttons darken/shift background; ghost buttons and kanban cards get `color-ink`/`color-primary` border; table rows get subtle background shift.
- **Focus** — `2px solid color-primary` outline, 1–2px offset, on every interactive element. Required for keyboard nav — never remove `:focus-visible` styling.
- **Active** (pressed) — slightly darker/deeper than hover.
- **Disabled** — `#D3D4D9` background, `#9A9BA3` text, `cursor: not-allowed`, no hover effect.
- **Loading** — skeleton bars shaped like the eventual content, never a bare spinner on its own for data-heavy views.
- **Empty** — icon badge (soft tint) + one-line message in plain interface voice + relevant CTA where applicable.
- **Error** — message + explicit Retry action; never a blank screen.

---

## 8. Responsive Rules

Single breakpoint at **760px**:

- **Desktop (>760px):** fixed sidebar (200–216px), 4-column stat grid, full-width tables.
- **Mobile (≤760px):** sidebar collapses to a horizontal scrollable icon strip (labels hidden, icons only), stat grid drops to 2 columns, tables scroll horizontally inside their panel rather than the page scrolling sideways, kanban board remains horizontal-scroll.

Use relative units and flex/grid throughout; no fixed pixel widths on containers that hold text.

---

## 9. Accessibility

- **Contrast:** `color-ink` on `color-surface`/`color-bg` and white text on `color-ink`/`color-primary` both meet WCAG AA for body text; verify any new tint combination before shipping.
- **Focus states:** every interactive element (buttons, inputs, nav items, table row actions, kanban cards) must show the `2px solid color-primary` focus ring on keyboard focus — this is non-negotiable, not optional polish.
- **Semantic elements:** use real `<button>`, `<nav>`, `<table>` (with `<thead>`/`<th scope="col">`), and `<label for>` on all form fields — do not build interactive controls out of styled `<div>`s.
- **Keyboard behavior:** full flow (login → dashboard → assign a lead → move a kanban card) must be operable without a mouse; kanban drag actions need a keyboard-accessible alternative (e.g. a status dropdown) alongside drag-and-drop.
- **Status by color + text/icon:** status tags always pair color with a dot and a text label — never color alone to convey meaning.

---

## Reference

Live HTML build of Login, Dashboard, and Pipeline screens implementing this system is available as an accompanying artifact. Apply the same shell (sidebar + topbar + content) to remaining screens per the frontend build map (Leads list, Team, Reports, Settings, Super Admin views, Sales Rep views).
