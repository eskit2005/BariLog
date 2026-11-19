# BariLog — Frontend Design System & Architecture (`DESIGN.md`)

> **Platform:** BariLog (Apartment Building Operations, Finance & Community Platform)
> **Context:** 50–100 unit residential buildings (tailored for South Asian / Dhaka apartment contexts where *Bari* = Home/Building and *Log* = Ledger/Record)
> **Implementation:** React 19 SPA with Vite 6 and inline component styles plus shared CSS tokens

## Purpose and Current Coverage

This file guides the visual identity, component styling, and future interface patterns. [README.md](README.md) documents setup/current behavior; [FEATURES.md](FEATURES.md) defines product requirements and gaps.

**Source review: 2026-11-18.** The logo, palette, font families, desktop shell, apartment matrix/list toggle, unit drawer, and document UI are implemented. The reference rules below guide new work; individual components do not yet use identical sizes and spacing. Future layout patterns are explicitly labeled **Planned**. This is a source comparison, not a browser or accessibility audit.

| Area | Current source |
| :--- | :--- |
| Tokens and base typography | `Client/src/index.css` |
| Font loading | `Client/index.html` (Google Fonts: Plus Jakarta Sans, Inter, JetBrains Mono) |
| Ledger Facade logo | `Client/src/components/common/Logo.jsx` |
| Desktop shell | `Client/src/components/layout/` |
| Elevation/list views | `Client/src/pages/ApartmentRegistry/ApartmentRegistry.jsx` |
| Unit details and history | `Client/src/components/apartment/UnitSlideOver.jsx` |
| Rules, notices, complaints, agreements | `Client/src/pages/DocumentRepository/DocumentRepository.jsx` |
| Resident directory & emergency contacts | `Client/src/pages/ResidentDirectory/ResidentDirectory.jsx` |

---

## 1. Design Philosophy & Cross-Field Inspiration

Most property management tools look like cluttered 2005 ERP spreadsheets or overly playful consumer apps. **BariLog** sits in the middle: calm, authoritative, transparent, and effortless to scan under stress (e.g., a water outage or a security gate check-in).

Our visual language draws from **three distinct non-real-estate fields**:

1. **Swiss Editorial & Architectural Blueprints (Layout & Grid)**
   * **Inspiration:** Josef Müller-Brockmann grid systems & architectural elevation drawings.
   * **Application:** Crisp `1px` hairline borders instead of heavy drop shadows, generous whitespace, strict structural alignment, and clear typographic hierarchy that makes dense building data feel airy and organized.
2. **Modern Fintech Ledgers (Financial Transparency)**
   * **Inspiration:** Stripe Dashboard, Wise, and Linear.
   * **Application:** Tabular numerals (`font-variant-numeric: tabular-nums`), high-contrast reconciliation summaries, clear "money in vs. money out" bars, and unambiguous receipt states so residents never wonder where their service charges went.
3. **Aviation & Industrial Telemetry Boards (Status, SLAs & Security)**
   * **Inspiration:** Airport departure boards & Braun physical hardware controls.
   * **Application:** High-legibility status pills, countdown SLA indicators, color-coded urgency badges, and oversized, glove-friendly tap targets for security guards and maintenance technicians working on mobile devices.

---

## 2. Brand Identity & Unique Logo Specification

### Concept: *"The Ledger Facade"*
The name **BariLog** combines *Bari* (বাড়ি — home/building) with *Log* (structured ledger/record).
Rather than a generic pitched-roof house icon, the BariLog mark depicts an **abstract multi-story apartment elevation formed by horizontal ledger lines**—with one illuminated corner unit representing an active, resolved, or occupied record.

### Primary Logo Mark (Inline SVG)
```svg
<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="BariLog Logo">
  <!-- Outer Architectural Frame -->
  <rect x="4" y="3" width="28" height="30" rx="5" fill="#0F172A"/>

  <!-- Floor 4 (Top Ledger Bar + Unit Block) -->
  <rect x="9" y="8" width="12" height="3.2" rx="1.6" fill="#F8FAFC"/>
  <rect x="23" y="8" width="4" height="3.2" rx="1.6" fill="#D97706"/>

  <!-- Floor 3 (Split Apartment Units) -->
  <rect x="9" y="13.8" width="7.5" height="3.2" rx="1.6" fill="#94A3B8"/>
  <rect x="18.5" y="13.8" width="8.5" height="3.2" rx="1.6" fill="#F8FAFC"/>

  <!-- Floor 2 (Full-Width Ledger Entry) -->
  <rect x="9" y="19.6" width="18" height="3.2" rx="1.6" fill="#F8FAFC"/>

  <!-- Ground Floor (Lobby Threshold & Entrance Pillar) -->
  <rect x="9" y="25.4" width="6" height="3.2" rx="1.6" fill="#0D9488"/>
  <rect x="17" y="25.4" width="10" height="3.2" rx="1.6" fill="#64748B"/>
</svg>
```

### Wordmark Pairing

* **Typography:** `Plus Jakarta Sans`, tight tracking (`-0.03em`). The current `Logo.jsx` wordmark uses weight `700`.
* **Styling:** **Bari** in `#0F172A` (Slate Ink) + **Log** in `#0D9488` (Architectural Teal) or muted `#475569` on monochrome prints.
* **Clear Space:** Minimum padding equal to the height of one ledger bar (`3.2px` scaled proportionally) around all four sides.

---

## 3. Color Palette & Semantic Tokens

Designed around a cool light canvas (`#F8FAFC`), white surfaces, deep slate text, and high-contrast status indicators. Dark slate is used for the logo and the Overview banner; a dark theme is not implemented.

### Surface & Neutral Tokens

| Token | Hex | Usage |
| :--- | :--- | :--- |
| `--bg-canvas` | `#F8FAFC` | Main application background (Cool Alabaster) |
| `--bg-surface` | `#FFFFFF` | Cards, tables, modals, and active drawers |
| `--bg-subtle` | `#F1F5F9` | Table headers, secondary panels, input backgrounds |
| `--border-hairline` | `#E2E8F0` | Primary card and grid dividers (`1px solid`) |
| `--border-strong` | `#CBD5E1` | Hover borders, active inputs |
| `--text-primary` | `#0F172A` | Headings, primary values, apartment numbers |
| `--text-secondary` | `#475569` | Body text, descriptions, metadata labels |
| `--text-muted` | `#94A3B8` | Timestamps, placeholders, disabled states |

### Brand & Accent Tokens

| Token | Hex | Usage |
| :--- | :--- | :--- |
| `--brand-primary` | `#0D9488` | **Architectural Teal** — Primary CTAs, active nav indicators, verified badges |
| `--brand-primary-hover` | `#0F766E` | Hover state for primary buttons |
| `--brand-tint` | `#F0FDFA` | Subtle highlight background for selected rows or active units |
| `--accent-amber` | `#D97706` | **Terracotta Amber** — Pending approvals, SLA warnings, visitor alerts |

### Semantic Status Tokens (Fintech & Telemetry)

The colors are implemented in `index.css`. Billing, SLA, visitor, and emergency examples below are intended future uses; they do not indicate implemented modules.

| State | Text / Icon | Background Tint | Border | Use Cases |
| :--- | :--- | :--- | :--- | :--- |
| **Resolved / Paid / Occupied** | `#15803D` | `#F0FDF4` | `#BBF7D0` | Paid bills, fixed complaints, owner-occupied units |
| **In Progress / Rented** | `#0369A1` | `#F0F9FF` | `#BAE6FD` | Assigned maintenance, rented units, expected visitors |
| **Pending / Warning / SLA** | `#B45309` | `#FFFBEB` | `#FDE68A` | Overdue bills, SLA nearing breach, uncollected parcels |
| **Critical / Emergency / Vacant** | `#B91C1C` | `#FEF2F2` | `#FECACA` | Water/power emergencies, SLA breached, disputed charges |

---

## 4. Typography & Data Formatting

* **UI & Headings:** `Plus Jakarta Sans` (Geometric humanist sans; warm, modern, and highly readable).
* **Body & Forms:** `Inter` (Neutral, ultra-legible at small sizes).
* **Unit Numbers, IDs & Currency:** `JetBrains Mono` or `Inter` with `font-variant-numeric: tabular-nums`.

### Type Scale (Reference)

Current components vary: for example, Documents uses a `22px`/`700` title and `13.5px` body text. The shared CSS defines font families; inline styles set most sizes. `.tabular-nums` currently combines tabular figures with JetBrains Mono.

* **Page Title:** `24px` / `1.5rem` — Weight `600`, Tracking `-0.02em`
* **Section Heading:** `16px` / `1rem` — Weight `600`, Tracking `-0.01em`
* **Card KPI Metric:** `28px` / `1.75rem` — Weight `700`, `tabular-nums`
* **Body / Table Cell:** `14px` / `0.875rem` — Weight `400` (`500` for primary identifiers like `Apt 4B`)
* **Micro Label / Badge:** `12px` / `0.75rem` — Weight `500`, Uppercase tracking `+0.04em` for column headers

---

## 5. Layout Architecture & Role-Adaptive Navigation

**Current:** A fixed `240px` left rail, top contextual header with building selector, and content canvas. `AppLayout` offsets the content by `240px`; the shell does not currently collapse into mobile bottom navigation. The sidebar uses the same items for every role; page controls and document tabs vary by role.

Implemented routes: Overview (`/`), Apartment Registry (`/apartments`), Resident Directory (`/directory`), and Documents (`/documents`). Finance, Maintenance & SLA, Gate & Visitors, and Audit & Analytics sidebar links carry “Soon” badges; their routes fall back to Overview. Overview acts as a central module launcher with active cards for Apartment Registry, Resident Directory, and Documents & Repository.

**Planned:** A Bottom Action Bar for mobile field users, the role-specific navigation groups below, a staff job queue, and a security kiosk.

### Role-Specific Entry & Navigation Density (Planned)

1. **Building Manager / Committee Member (Full Command View)**
   * **Left Rail (240px):** Grouped cleanly into the 5 operational pillars:
     * *Overview* (Dashboard & Analytics)
     * *Building & Residents* (Units, Directory, Documents)
     * *Finance* (Billing, Payments, Expenses, Transparency)
     * *Operations* (Complaints & SLA, Preventive, Vendors, Facilities)
     * *Gate & Community* (Visitors, Parcels, Notices/Polls, Incidents, Audit Log)
2. **Resident / Tenant (Calm Self-Service Portal)**
   * Streamlined top/side navigation focused on 5 items: **Home**, **My Bills & Building Ledger**, **Maintenance & Facilities**, **Gate (Visitors & Parcels)**, and **Community Notices**.
3. **Maintenance Staff / Vendor (Mobile-First Job Queue)**
   * Card-stack interface showing **Assigned Tasks** sorted by SLA urgency, with one-tap status transitions (`Start Work` → `Upload Photo Evidence` → `Log Materials` → `Mark Resolved`).
4. **Security Personnel (Kiosk / Gate Tablet Mode)**
   * High-contrast split screen: **Left:** Expected Visitor PIN/QR Verification & Quick Walk-In Entry; **Right:** Active Inside Visitors & Uncollected Parcel Shelf.

---

## 6. Signature UI Patterns Across the 20 Features

### Pattern A: The Interactive Building Matrix (Implemented for Feature 01; extensions planned for 02/04)

* **Visual:** Toggle between **List View** and **Floor-Plan Elevation Grid**.
* **Current:** Floors stack from highest to lowest, with unit tiles, occupancy colors (Green = Owner, Blue = Rented, Red = Vacant), sqft/BHK specifications, and a `YOU` marker for linked units. Search, occupancy filters, and the list/elevation toggle are implemented. Clicking a unit opens a right-hand drawer with specifications, owner/occupant contact information, and occupancy history. Manager/admin actions include occupancy changes and deletion of vacant units.
* **Planned extensions:** Full resident profiles, tenancy dates/contracts, opt-in contact visibility, and dedicated emergency contact fields. Existing contact details are not an emergency directory.

### Pattern B: Structured Document Workspace (Implemented; Feature 03 partial)

* Shared page header with role badge, horizontal tabs, bordered cards/tables, and form modals.
* Rules and Notices tabs are visible to all roles. Complaints and Maintenance Agreements tabs are shown to residents/managers/admins. Creation, resolution, and acknowledgement controls follow role permissions.
* A warning-tinted banner lists expiry reminders. Colored pills distinguish `OPEN`/`RESOLVED` complaints and `PENDING`/`NOTED` agreements.
* Per-user tab badges and `NEW` tags use browser localStorage. They are local activity cues, not shared read receipts or delivered notifications.
* This workspace edits structured text/date records. File previews, uploads/downloads, and configurable document permission tiers are planned. The selected building does not filter these records.

### Pattern C: Resident Directory & Emergency Contact Phonebook (Implemented for Feature 03/04)

* Building-scoped community phonebook with resident search, unit/floor grouping, and live occupancy status indicators.
* Three-tier independent privacy controls: explicit separate checkboxes for phone visibility, email visibility, and emergency contact visibility (defaulted to hidden for peer residents).
* Authorized emergency contacts drawer with quick-action `tel:` links for next-of-kin, blood group, and physician contacts.
* Role-specific permissions: Building managers and assigned security personnel maintain emergency records and access contact details regardless of peer consent.

---

## 7. Component Rules & Elevation Guidelines

These are reference defaults for new components. Existing cards vary (for example, Overview uses `12px` radii and `24px` padding); mobile defaults below are design targets, not a completed responsive shell.

1. **Borders Over Shadows:** Default cards use `background: #FFFFFF`, `border: 1px solid #E2E8F0`, `border-radius: 10px`, and `box-shadow: none`.
2. **Spacing Rhythm (8px Base Grid):** Card padding: `20px` (desktop), `16px` (mobile). Gap: `16px` or `24px`.
3. **Empty States:** Minimalist line-art icon, single-sentence explanation, and one primary action button.
