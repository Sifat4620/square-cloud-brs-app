# Square VM Cloud — DSR & Backup Management System

A web application for **daily infrastructure monitoring** and **monthly backup verification**, built for IT administrators and managers. It streamlines status reporting (DSRs) and backup-test auditing with a clean dashboard, role-based access, and print/PDF export.

> Tagline: *"Streamline daily infrastructure monitoring and monthly backup verification with a comprehensive reporting system designed for IT administrators and managers."*

---

## Overview

The app is a single-page **React + Vite** tool with **no backend and no database**. Every record — DSRs, backup tests, clients, users, and the auth session — lives in the browser's `localStorage`. It is designed to run:

- **Inside Figma Make** (the design/preview surface), or
- **Standalone** via `vite dev` / `vite build` + `vite preview`.

Because there is no server, all data is per-browser and per-device. This makes it ideal as a single-operator reporting tool or a prototype; sharing data between machines would require adding a backend.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  App.tsx (shell)                                             │
│  • Reads session from localStorage on boot                   │
│  • Sidebar nav + page-level access guards (canAccess)        │
│  • Routes between views via an in-memory `route` state       │
│  • Renders the active view:                                  │
│      Login · DSRList · DSRForm · BackupList · BackupForm ·   │
│      ClientMgmt (admin) · UserMgmt (admin)                   │
└───────────────────────────────┬─────────────────────────────┘
                                 │  reads / writes
                                 ▼
                  store.ts  (localStorage CRUD)  ◄── types.ts (domain model)
                  auth.ts   (login, users, perms)
```

- **`auth.ts`** — built-in admin credentials, dynamic user CRUD, the `PAGE_DEFS` access catalogue, and `canAccess()` guard logic.
- **`store.ts`** — thin localStorage wrapper (`load`/`save`) plus domain CRUD (`getDSRs`/`upsertDSR`, `getClients`/`upsertClient`, `getBackups`/`upsertBackup`/`newBackupTest`) and seed defaults.
- **`types.ts`** — all TypeScript domain types (DSR, Client, BackupTest, BackupEntry, status/state unions).
- **Views** are presentational + local `useState`; they call `store.ts`/`auth.ts` directly. There is no global state library or API layer.
- **`index.css`** — Tailwind v4 import, CSS variables for the theme, and the full `@media print` stylesheet that turns screens into A4 letterhead reports.

State is local to each view (`useState` + a `tick` counter to re-read from storage after mutations). Navigation is a simple in-memory `route` object in `App.tsx` — there is **no router library** (`react-router` is not installed).

---

## Features

### 1. Daily Status Reports (DSR)
A daily infrastructure health checklist covering:

| Section | Components |
|---------|-----------|
| **Uplinks** | BDIX (10 Gbps), SIL Internet |
| **P2P Data Connectivity** | F@H (Dark Fiber), Summit (Capacity Link) |
| **Firewall** | Session count (24h high), Compromised hosts, Bandwidth check (24h high) |
| **KB Status** | Nutanix, Proxmox, VMware, Veeam, Networking Devices |
| **CHQ Status** | Nutanix, Proxmox, Networking Devices |
| **UPS** | 40 KVA UPS1, 10 KVA UPS2 |
| **Cooling** | AC1 – AC4 |

Each component carries a status of `OK` / `FAULT` / `DEGRADED` / `MAINTENANCE` / `N/A`, plus optional value and remarks.

- DSR lifecycle states: **Draft → Submitted → Approved** (approving locks the record read-only).
- "Today's Report" panel shows an at-a-glance system status (All OK / N faults) and highlights the current date's DSR if one exists.
- Filter by year, month, and state; view summary reports (total / approved / with-faults, plus a fault-by-section table).
- **Print / Export to PDF** with branded letterhead and signature footer.

### 2. Monthly Backup Tests
Per-client backup verification records:

- Auto-creates one entry per **active client** for a chosen year/month (`newBackupTest`).
- Per-client `Logs/Status` and `Test Status` (`OK` / `FAILED` / `PENDING` / `N/A`) with remarks.
- Lifecycle states: **Pending → Completed → Approved** (or **Failed**).
- Pass-rate tracking with a visual progress bar (green ≥80%, amber ≥60%, red <60%).
- **Monthly detail report** and **yearly summary** (with a failed-incidents table).
- **Print / Export to PDF**.

### 3. Client Management (Admin)
- Add / edit / activate / deactivate backup-test clients.
- Only **active** clients are included when creating a new monthly backup test (inactive clients are dimmed in the table and skipped by `newBackupTest`).
- Ships with a default list of **17 clients** (see *Seed Data*).

### 4. User Management (Admin)
- Create users with a username, display name, role, password, and **page-level access control**.
- Toggle active/inactive; search and filter by role; avatar gradient is derived from the username.
- Page-access model with dependency rules (enabling "Create / Edit" auto-enables its "View" page; disabling a "View" page removes its dependent "Create / Edit" page).

### 5. Authentication & Access Control
- Built-in **admin** account with full access (`canAccess` short-circuits to `true` for admins).
- Dynamic users stored in `localStorage`, each assigned specific page permissions.
- Page-level guards in `App.tsx` (`nav()` and the route render switch); the **Users** and **Clients** pages are admin-only.

### 6. Reporting & Export
- Summary/report modals (fault counts by section, yearly backup stats).
- Dedicated print stylesheet (`@media print`) producing A4 letterhead reports with signature lines — ideal for compliance/audit records.

---

## Data Model (`src/types.ts`)

```ts
type DSRStatus  = 'OK' | 'FAULT' | 'DEGRADED' | 'MAINTENANCE' | 'N/A'
type DSRState   = 'Draft' | 'Submitted' | 'Approved'
type BackupState = 'Pending' | 'Completed' | 'Failed' | 'Approved'
type TestStatus  = 'OK' | 'FAILED' | 'PENDING' | 'N/A'

interface StatusField { status: DSRStatus; value: string; remarks: string }

interface DSR {
  id, date, name, signature, state, createdAt, updatedAt
  uplinks:  { bdix, silInternet }
  p2p:      { fah, summit }
  firewall: { sessionCount, compromisedHosts, bandwidthCheck }
  kb:       { nutanix, proxmox, vmware, veeam, networkingDevices }
  chq:      { nutanix, proxmox, networkingDevices }
  ups:      { ups1, ups2 }
  cooling:  { ac1, ac2, ac3, ac4 }
  generalRemarks: string
  // every leaf above is a StatusField { status, value, remarks }
}

interface Client { id, name, active, createdAt }

interface BackupEntry { clientId, clientName, logsStatus, testStatus, remarks }

interface BackupTest {
  id, year, month, state, responsibleName,
  responsibleDesignation, date, signature, entries: BackupEntry[],
  createdAt, updatedAt
}
```

`AppUser` (in `auth.ts`) holds `id, username, password, displayName, roleName, pages: PageKey[], active, createdAt`. The active auth session (`AuthSession`) is the same minus the plaintext password.

---

## Page Access & Roles

Pages are defined in `auth.ts` as `PAGE_DEFS`. Each page may declare a `requires` dependency (auto-enabled when the page is enabled):

| Page key | Label | Group | Requires |
|----------|-------|-------|----------|
| `dsr-list` | Daily DSR — View | Daily DSR | — |
| `dsr-form` | Daily DSR — Create / Edit | Daily DSR | `dsr-list` |
| `backup-list` | Backup Tests — View | Backup Tests | — |
| `backup-form` | Backup Tests — Create / Edit | Backup Tests | `backup-list` |
| `clients` | Client Management | Admin | — |
| `users` | User Management | *(admin-only, not in `PAGE_DEFS`)* | — |

Access rules (`canAccess`):
- **Admin** → every page, always.
- **Dynamic users** → only the `PageKey[]` assigned at creation.
- The **Users** and **Clients** nav items render only for admins; non-admins hitting them see an *Access restricted* placeholder.
- In `App.tsx`, `dsr-form` is reachable only if the session can access `dsr-list`, and `backup-form` only if it can access `backup-list` (the dependent-view guard).

---

## Workflows

### Daily Status Report
1. Log in as admin (or a user with `dsr-list` + `dsr-form`).
2. From **All DSRs**, click **+ New DSR** (or **Create Today's DSR** in the Today panel).
3. A blank DSR opens for today's date. Set component statuses/values/remarks per section.
4. **Save Draft** (keeps `Draft`) or **Submit DSR** (moves to `Submitted`).
5. Admin can open a `Submitted` DSR and click **Approve** → state `Approved`, and the record becomes **read-only** (all fields disabled; only *Print* remains).
6. Use **Report** to open the summary modal, or **Print** on a DSR to export the A4 letterhead.

### Monthly Backup Test
1. Go to **All Tests → + New Backup Test** (admin only).
2. Pick year/month; **Create Backup Test** generates one row per **active** client (existing tests for that month are blocked).
3. Fill each client's `Logs/Status` and `Test Status`; add remarks (required for failed clients for the audit trail).
4. **Save Draft**, **Mark Completed**, or **Mark Failed**. From `Completed`, admin can **Approve & Lock** (read-only) or revert to **Failed**.
5. **Reports** opens the Monthly detail / Yearly summary modal (with a Failed Test Incidents table); **Print / Export PDF** produces the A4 report.

---

## Seed / Default Data

- **Default clients (17)**, seeded on first load into `srs_clients_v1` if empty:
  Meghna Denim, NZ Group, DataSoft, Jovision, Mir Cloud, Initvent Software, Databiz, Onnorokom, Sunlife Insurance, STL, SFBL, SPL, UPHCS, Dept. Fisheries, Silicon ICT, Saibonsoft, Dept. of Livestock.
- **Years** selectable: `2025, 2026, 2027, 2028, 2029` (`YEARS` in `store.ts`).
- **Months**: full `MONTHS` array (January–December).
- **Admin credentials**: `admin` / `Admin@2025` (hard-coded in `auth.ts`).

---

## Tech Stack

| Area | Technology |
|------|------------|
| UI | React 19, React DOM 19 |
| Build | Vite 8 |
| Language | TypeScript 5.7+ |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Fonts | Plus Jakarta Sans, DM Mono (loaded via Google Fonts in `index.css`) |
| Formatting | oxfmt |
| Persistence | Browser `localStorage` (no backend / database) |

This is a **Figma Make** project — it is designed to run inside Figma's preview panel, but also runs standalone via Vite.

---

## Project Structure

```
square-cloud-brs-app/
├── index.html                 # Vite HTML shell (#root) with Figma slot comments
├── vite.config.ts             # Vite + Tailwind + Figma Make plugins, @ alias, port 8443
├── package.json
├── tsconfig.json
├── .mise.toml                 # Node 22 / pnpm 10.34.3
├── .figma/make/              # Figma Make site config + dev/deploy tooling
│   └── site.json             # title/description, robots: noindex
├── src/
│   ├── main.tsx               # React entrypoint
│   ├── App.tsx                # App shell: sidebar, routing, access control
│   ├── auth.ts                # Auth, user model, page definitions, permissions
│   ├── store.ts               # localStorage CRUD (DSRs, clients, backups) + defaults
│   ├── types.ts               # TypeScript domain types
│   ├── index.css              # Tailwind import + theme vars + print styles
│   ├── vite-env.d.ts
│   ├── imports/
│   │   └── logocloud_upscaled.png   # Square VM Cloud logo (used in UI + letterhead)
│   └── views/
│       ├── Login.tsx          # Login screen + demo-account shortcuts
│       ├── DSRList.tsx         # DSR dashboard, filters, summary report, Today panel
│       ├── DSRForm.tsx         # DSR create/edit + print letterhead/footer
│       ├── BackupList.tsx      # Backup tests dashboard + monthly/yearly reports
│       ├── BackupForm.tsx      # Backup test create/edit + pass-rate + print
│       ├── ClientMgmt.tsx      # Client CRUD (admin)
│       └── UserMgmt.tsx        # User CRUD + access control (admin)
└── (built output goes to dist/)
```

---

## Getting Started

### Prerequisites
- Node.js 22+ and pnpm (or npm)

### Install & Run

```bash
pnpm install
pnpm dev
```

The dev server starts on `0.0.0.0` and defaults to port **8443** (`vite.config.ts`: `port: parseInt(process.env.PORT || '8443')`, `strictPort: true` — so if 8443 is taken the dev server errors rather than switching ports). Override with `PORT=xxxx pnpm dev`. Open the printed/local URL in your browser.

> Inside Figma Make a dev server is already running on `$PORT`; you don't need to start it manually.

### Build

```bash
pnpm build      # production build to dist/
pnpm preview    # preview the production build (also on 8443 by default)
```

### Format

```bash
pnpm format     # oxfmt
```

---

## Demo Accounts

| Username | Password | Access |
|----------|----------|--------|
| `admin` | `Admin@2025` | Full administrator (all pages) |
| `viewer` | `View@2025` | One-click filler on the login screen — **not pre-seeded** (see caveat) |

> **Caveat:** The `admin` account is built in. The `viewer` button on the login screen only *auto-fills* those credentials — there is no `viewer` user in `localStorage` until you create one via **User Management**. Clicking *Sign In* with the auto-filled `viewer` values will fail unless that user already exists. Create a `viewer` user (assign at least `dsr-list` / `backup-list`) to demo a read-only role.

---

## Data & Persistence

- All records (DSRs, backup tests, clients, users) are stored **in the browser's `localStorage`** — there is no server or database.
- Data is **per-browser / per-device**. Clearing site data removes all records.
- This makes the app ideal for a single-operator reporting tool or prototype; for multi-user/shared data, a backend would need to be added.

### localStorage keys

| Key | Contents |
|-----|----------|
| `srs_auth_v2` | Current auth session |
| `srs_users_v1` | Dynamic user accounts |
| `srs_dsrs_v2` | Daily Status Reports |
| `srs_backups_v1` | Monthly backup tests |
| `srs_clients_v1` | Client list |

---

## Print / PDF Export

- A comprehensive `@media print` block in `index.css`:
  - Hides all UI chrome (`.no-print`, `aside`, `header`, `nav`).
  - Sets A4 page size with 15mm/14mm margins.
  - Styles tables, status pills, and section cards for print; forces color preservation (`print-color-adjust: exact`).
- **DSRForm** renders a `print-only` letterhead (logo + "Daily Status Report" + meta row) and a signature footer; the on-screen header card is hidden on print.
- **BackupForm** renders a `print-only` report header and a signature/date block.
- **Report modals** (DSR summary, Backup monthly/yearly) call `window.print()` to export their contents.
- Use the browser's "Save as PDF" from the print dialog for compliance/audit copies.

---

## Notes & Caveats

- Designed and exported from **Figma Make**; `vite.config.ts` includes Figma-specific dev plugins (site configuration, error-overlay replay, React-refresh boundary fallback, make-kit). These are dev-only and skipped on `vite build`.
- The app is responsive and print-optimized for A4 compliance reports.
- Default client list and admin credentials are intended for getting started quickly — change them before any production-like use (the admin password is hard-coded in `auth.ts`).
- **Approving** a DSR or Backup Test locks it read-only; there is no un-approve path in the UI.
- **No backend**: there is no sync, auth server, or multi-user concurrency — two browsers hold independent copies of the data.
- `robots: { index: false }` is set in `.figma/make/site.json`, so built pages are marked `noindex, nofollow`.

---

© 2025 Square VM Cloud · DSR Management System
