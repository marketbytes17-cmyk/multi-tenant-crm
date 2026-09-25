# MarketBytes CRM — Design Spec

Colors extracted by pixel-sampling MarketBytes' internal workspace tool screenshot. Use these exact values — do not substitute similar-looking colors.

---

## 1. Color Tokens

| Token | Hex | Usage |
|---|---|---|
| `--ink` | `#030712` | Sidebar background, primary text, buttons, headlines |
| `--blue` | `#155DFC` | Primary functional accent — active nav state, primary icon fills, links, focus rings |
| `--blue-soft` | `#D5E3FC` | Active nav pill background, avatar background, "New" status tag |
| `--violet` | `#7F71F8` | Secondary icon accent (used on one stat-card type) |
| `--violet-soft` | `#EEECFE` | Background tint behind violet icons |
| `--orange` | `#F54900` | Tertiary icon accent (used on one stat-card type) |
| `--orange-soft` | `#FFF1E6` | Background tint behind orange icons |
| `--gray-icon` | `#6B7280` | Neutral icon accent (used on one stat-card type) |
| `--gray-soft` | `#F1F2F4` | Background tint behind gray icons, notification bell background |
| `--green` | `#00BC7D` | Online/active status dot |
| `--red` | `#FB3038` | Notification badge, error/alert states |
| `--page-bg` | `#E3E7EF` | App canvas background (behind cards) |
| `--surface` | `#FFFFFF` | Card, panel, table, modal backgrounds |
| `--border` | `#E5E7EB` | Hairline borders, table dividers |
| `--text-soft` | `#6B7280` | Secondary/supporting text |

**Dark mode** (if implemented): `--page-bg:#121214; --surface:#1A1A1D; --ink:#F2F2F3; --text-soft:#9A9AA2; --border:#2B2B2F; --blue-soft:#1E2440`

**Rule:** icon tint colors (blue/violet/orange/gray) rotate across stat cards for visual variety — each card gets exactly one. Never mix two accent tints in a single component. Status tags use dot-indicator + colored text, not filled badges.

---

## 2. Typography

- **Headings, nav labels, stat numbers, card titles:** `Sora` (weights 600/700/800)
- **Body text, table data, form inputs, buttons:** `Inter` (weights 400/500/600/700)
- Load both from Google Fonts: `family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700`

| Style | Size | Weight | Font | Usage |
|---|---|---|---|---|
| Page title | 25–28px | 800 | Sora | Dashboard greeting, screen titles |
| Section title | 19–21px | 800 | Sora | Card group headers |
| Card title | 14.5–16px | 700 | Sora | Panel headers ("Recent leads") |
| Body | 13–14px | 400 | Inter | Table cells, descriptions |
| Secondary | 11.5–12.5px | 400 | Inter | Labels under stats, timestamps |
| Micro | 10.5–11px | 600 | Inter | Table column headers (sentence case, not uppercase-tracked) |

---

## 3. Spacing & Radius

- **Base grid:** 4px unit — use multiples (4, 8, 12, 16, 24, 32)
- **Card radius:** 14–16px
- **Button/pill radius:** 999px (fully rounded)
- **Small control radius** (inputs, icon badges): 9–10px
- **Shadow (cards/panels):** `0 1px 2px rgba(3,7,18,.04), 0 8px 20px rgba(3,7,18,.06)`

---

## 4. Layout Structure

```
┌─────────────────────────────────────────────┐
│ Sidebar (fixed, 200-216px, --ink bg)         │  Top bar (--surface bg, border-bottom)
│  - Brand: "MarketBytes" (Sora 700, white)     │   - right-aligned: primary pill button,
│  - Nav items, icon + label                    │     notification bell, user name/role, avatar
│  - Active item: --blue-soft bg, --blue icon   │
├───────────────┬───────────────────────────────┤
│               │  Content area (--page-bg)      │
│               │   - Greeting card (--surface)  │
│               │   - Stat card row (4-across)   │
│               │   - Panel(s): table / kanban   │
└───────────────┴───────────────────────────────┘
```

- Sidebar: dark, icon + label nav items, 9px vertical padding per item, 2px gap
- Top bar: white, border-bottom `1px solid var(--border)`, contents right-aligned
- Content padding: 20–24px
- Mobile (<760px): sidebar collapses to horizontal scrollable icon strip; stat grid drops to 2 columns; tables scroll horizontally

---

## 5. Components

### Sidebar nav item
- Default: `color: #8B93A1`, icon stroke `#8B93A1`, no background
- Active: `background: var(--blue-soft)`, `color: var(--blue)`, icon stroke `var(--blue)`, font-weight 600
- Padding: `9px 10px`, border-radius `9px`

### Primary button (pill)
- `background: var(--ink)`, `color: #fff`, `border-radius: 999px`, `padding: 9px 16px`, `font-weight: 600`, `font-size: 12.5–13px`
- On login/primary CTAs specifically: `background: var(--blue)` instead of ink
- Hover: darken background slightly
- Disabled: `background: #D3D4D9`, `color: #9A9BA3`, `cursor: not-allowed`

### Ghost/secondary button
- `background: transparent`, `border: 1px solid var(--border)`, `color: var(--ink)`
- Hover: `border-color: var(--ink)`

### Stat card
- `background: var(--surface)`, `border-radius: 14px`, shadow per §3
- Icon badge: 36×36px, `border-radius: 10px`, one tint color (blue solid+white icon / violet-soft+violet icon / orange-soft+orange icon / gray-soft+gray icon)
- Big number: Sora 800, 21–25px
- Label: Inter 400, 11–12px, `--text-soft`
- Optional mini pill button top-right of card (same style as primary button, smaller padding)

### Table
- `background: var(--surface)`, wrapped in a panel with `border-radius: 14px`
- Header row: `font-weight: 600`, `font-size: 11px`, `color: var(--text-soft)`, sentence case (NOT uppercase-tracked), border-top + border-bottom `1px solid var(--border)`
- Row: `padding: 11–13px 16px`, `border-bottom: 1px solid var(--border)`, last row no border
- Row hover: subtle background shift (`#FAFAFB` equivalent)

### Status tag
- Dot indicator (7px circle) + colored text, no filled pill background
- New → blue dot/text; Contacted → orange dot/text; Closed Won → green dot/text; Closed Lost → red dot/text

### Form input
- `border: 1px solid var(--border)`, `border-radius: 9px`, `padding: 10–11px 12–13px`
- Focus: `outline: 2px solid var(--blue)`, `outline-offset: 1px`, `border-color: var(--blue)`

### Notification bell
- 32–34px circle, `background: var(--gray-soft)`, icon stroke `var(--gray-icon)`
- Red dot badge: 8px, `background: var(--red)`, positioned top-right, `border: 1.5px solid var(--surface)`

### Avatar
- Circle, `background: var(--blue-soft)`, `color: var(--blue)`, initials, bold
- Optional green online-status dot: 8px, bottom-right, `border: 1.5px solid var(--surface)`

### Kanban column & card
- Column: `background: var(--surface)`, `border-radius: 14px`, fixed width ~210px, padding 12px
- Column header: label + count pill (`background: var(--page-bg)`, `color: var(--text-soft)`, small rounded pill)
- Lead card: `background: var(--surface)`, `border: 1px solid var(--border)`, `border-radius: 11px`, padding 10px
- Card hover: `border-color: var(--blue)`

---

## 6. States (must be implemented, not just happy-path)

- **Loading:** skeleton bars matching layout shape, not a spinner
- **Empty:** icon badge (soft tint) + one-line message + relevant CTA if applicable — write in interface voice ("No leads yet" not "Oops, nothing here")
- **Error:** message + Retry action, never a blank screen
- **Disabled buttons:** visually distinct (`#D3D4D9` bg), `cursor: not-allowed`
- **Focus:** visible `2px solid var(--blue)` ring on all interactive elements — required for keyboard navigation

---

## 7. Screens Covered in Reference Build

1. **Login** — split layout: `--ink` panel (brand + tagline) left, white form panel right
2. **Dashboard** (Client Admin) — greeting card → 4 stat cards (rotating icon tints) → recent leads table panel
3. **Pipeline** — Kanban board, horizontal-scroll columns, draggable lead cards

Apply the same shell (sidebar + topbar + content) to remaining screens (Leads list, Team, Reports, Settings, Super Admin views, Sales Rep views) per the earlier frontend build map.

---

## 8. Notes for Implementation

- Two-font system: Sora for structure/numbers, Inter for data/body — do not substitute
- Icon tint rotation (blue/violet/orange/gray) is a *pattern*, not fixed per specific stat — apply consistently across similar card groups so the UI stays legible over multiple screens
- Never introduce a new accent color outside this token list without re-sampling the brand source
- Reference HTML build (all 3 screens, live CSS): see accompanying artifact/build files
