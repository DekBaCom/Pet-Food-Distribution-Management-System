# ระบบแจกอาหารหมาแมว | Pet Food Distribution System

ระบบบริหารจัดการกิจกรรมแจกอาหารสุนัขและแมว รองรับการลงทะเบียน การสร้าง QR Code การยืนยันตัวตน การจัดการ Stock และ Dashboard พร้อม deploy บน Cloudflare

![Stack](https://img.shields.io/badge/Next.js-15-black) ![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers_%2B_D1_%2B_R2-orange) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Prisma](https://img.shields.io/badge/Prisma-5.22-indigo)

## สารบัญ

- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Folder Structure](#folder-structure)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Authentication & RBAC](#authentication--rbac)
- [Run Locally](#run-locally)
- [Environment Variables](#environment-variables)
- [Deploy to Cloudflare](#deploy-to-cloudflare)
- [Demo Accounts](#demo-accounts)
- [Known Limitations](#known-limitations)
- [Next Steps](#next-steps)

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Cloudflare Edge                      │
│                                                          │
│  ┌────────────────────┐    ┌────────────────────────┐   │
│  │  Cloudflare Worker │───▶│   Cloudflare D1        │   │
│  │  (Next.js 15 via   │    │   (SQLite-compatible)  │   │
│  │   OpenNext)        │    └────────────────────────┘   │
│  │                    │                                  │
│  │   - Pages          │    ┌────────────────────────┐   │
│  │   - API Routes     │───▶│   Cloudflare R2        │   │
│  │   - NextAuth       │    │   (File uploads)       │   │
│  │   - Middleware     │    └────────────────────────┘   │
│  └────────────────────┘                                  │
└──────────────────────────────────────────────────────────┘
          ▲
          │ HTTPS
          │
    ┌──────────┐         ┌──────────┐         ┌──────────┐
    │  Public  │         │  Staff   │         │  Admin   │
    │  (Form)  │         │  Mobile  │         │ Dashboard│
    └──────────┘         └──────────┘         └──────────┘
```

**Workflow:**

```
Register → Fill info → Upload photos → Submit
   ↓
Registration ID + Secure QR generated
   ↓
Event day: Staff scans QR → Verify → Record distribution
   ↓
Stock deducted → Status updated → Report available
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) + TypeScript |
| UI | Tailwind CSS + shadcn/ui + Radix UI + Lucide |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Database | Cloudflare D1 (SQLite) via Prisma + @prisma/adapter-d1 |
| File Storage | Cloudflare R2 |
| Auth | NextAuth.js v4 (JWT) + RBAC |
| QR | qrcode (gen) + jsqr (scan) |
| Export | xlsx |
| Deployment | Cloudflare Workers via @opennextjs/cloudflare |
| Testing | Jest + Testing Library |

---

## Folder Structure

```
├── app/
│   ├── (public)/           # Public pages
│   │   ├── page.tsx        # Homepage
│   │   ├── register/       # Multi-step registration
│   │   ├── status/         # Status lookup
│   │   ├── event/          # Event details
│   │   └── faq/            # FAQ
│   ├── staff/              # Staff pages (protected)
│   │   ├── checkin/        # QR scanner
│   │   └── distribution/   # Food distribution form
│   ├── admin/              # Admin (SUPER_ADMIN/ADMIN only)
│   │   ├── registrations/
│   │   ├── checkins/
│   │   ├── inventory/
│   │   ├── reports/
│   │   ├── users/
│   │   └── settings/
│   ├── auth/login/         # Login page
│   └── api/                # API routes
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   ├── layout/             # Header, footer
│   ├── admin/              # Admin sidebar, charts
│   └── providers/          # Session provider
├── lib/
│   ├── db.ts               # Prisma client (D1 + local)
│   ├── storage.ts          # R2 + local file upload
│   ├── auth.ts             # NextAuth config
│   ├── qr.ts               # QR generation + parsing
│   └── utils.ts            # Shared utilities
├── prisma/
│   ├── schema.prisma       # DB schema
│   ├── migrations/         # D1 SQL migrations
│   ├── seed.ts             # Local seed script
│   └── export-seed.ts      # Export local data → SQL for D1
├── types/                  # TypeScript types
├── __tests__/              # Jest tests
├── middleware.ts           # Route protection
├── wrangler.toml           # Cloudflare config
├── open-next.config.ts     # OpenNext config
└── cloudflare-env.d.ts     # Cloudflare bindings types
```

---

## Database Schema

**15 tables** covering the full workflow:

- `User` — Staff accounts with roles
- `Account`, `Session`, `VerificationToken` — NextAuth
- `Event` — Distribution events (date, time, location)
- `Registration` — Core registration record
- `Animal` — Dogs/cats breakdown per registration
- `FoodRequest` — Requested food types & quantities
- `Document` — Uploaded photos/docs
- `QRCode` — Secure QR tokens
- `Checkin` — Event check-in records
- `Distribution` — Actual food distributed
- `Inventory` — Stock per food type
- `InventoryTransaction` — Stock movements
- `AuditLog` — Security/compliance trail

---

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/auth/[...nextauth]` | NextAuth handlers |
| GET/POST | `/api/registrations` | List / Create |
| GET/PATCH/DELETE | `/api/registrations/[id]` | View / Update / Soft delete |
| GET | `/api/registrations/[id]/qr` | Generate QR code |
| GET | `/api/registrations/by-id/[registrationId]` | Lookup by human ID |
| POST | `/api/status` | Public status check |
| POST | `/api/qr/scan` | Staff: validate QR + load reg |
| POST | `/api/checkins` | Staff: record check-in |
| POST | `/api/distributions` | Staff: record distribution + deduct stock |
| GET/POST | `/api/inventory` | Stock list / add transaction |
| PATCH | `/api/inventory/[id]` | Adjust stock |
| GET | `/api/reports` | Export (CSV/Excel) |
| GET/POST | `/api/admin/users` | User management |
| PATCH | `/api/admin/users/[id]` | Update user |
| GET | `/api/admin/chart-data` | Dashboard metrics |
| GET | `/api/files/[...path]` | Serve R2 files |

---

## Authentication & RBAC

**JWT sessions** (8-hour expiry). Login at `/auth/login`.

| Role | Access |
|------|--------|
| `SUPER_ADMIN` | Everything incl. user mgmt, delete |
| `ADMIN` | All admin pages, no user delete |
| `SUPERVISOR` | Staff + override check-in |
| `REGISTRATION_STAFF` | Create registrations, view records |
| `CHECKIN_STAFF` | QR scan, record distribution |
| `WAREHOUSE` | Inventory management |
| `VIEWER` | Read-only reports |

Protected routes (via `middleware.ts`):
- `/admin/*` → ADMIN / SUPER_ADMIN
- `/staff/*` → any staff role

---

## Run Locally

```bash
# Install
npm install

# Push schema to local SQLite + seed
npm run db:generate
npm run db:push
npm run db:seed

# Start dev server
npm run dev
```

Then open http://localhost:3000.

### Run Tests

```bash
npm test       # Jest
npm run lint   # ESLint
npm run build  # Full type check + build
```

### Preview on Cloudflare Worker locally

```bash
npm run cf:preview  # Builds + runs wrangler dev
```

---

## Environment Variables

**`.env.local`** (local dev):

```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="pet-food-dist-secret-key-2026-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

**Cloudflare Worker secrets** (set via dashboard or `wrangler secret put`):

```
NEXTAUTH_SECRET  # Strong random value
NEXTAUTH_URL     # Production URL
```

**Bindings** (in `wrangler.toml`):

```
DB         → Cloudflare D1 database (pet-food-db)
UPLOADS    → Cloudflare R2 bucket (pet-food-uploads)
```

---

## Deploy to Cloudflare

### One-time setup

```bash
# Login (interactive browser OAuth)
npx wrangler login

# Create D1 database
npm run cf:d1:create
# → Copy the database_id into wrangler.toml

# Create R2 bucket
npm run cf:r2:create

# Apply migrations to D1 (remote)
npx wrangler d1 execute pet-food-db --remote --file=prisma/migrations/0001_init.sql

# (Optional) Seed with demo data
# 1. Run local seed first to populate local SQLite
npm run db:seed
# 2. Export local data → SQL for D1
npx ts-node --project tsconfig.seed.json prisma/export-seed.ts
# 3. Apply to D1
npx wrangler d1 execute pet-food-db --remote --file=prisma/seed-data.sql
```

### Deploy

```bash
# Build + deploy
npm run cf:deploy
```

Subsequent deploys: just `npm run cf:deploy`.

### Set secrets (production)

```bash
npx wrangler secret put NEXTAUTH_SECRET
# Paste a strong random value
```

---

## Demo Accounts

Seeded via `prisma/seed.ts`. **Change passwords in production.**

| Role | Email | Password |
|------|-------|----------|
| SUPER_ADMIN | `super_admin@petfood.th` | `Admin123!` |
| ADMIN | `admin@petfood.th` | `Admin123!` |
| REGISTRATION_STAFF | `reg_staff@petfood.th` | `Staff123!` |
| CHECKIN_STAFF | `checkin@petfood.th` | `Staff123!` |
| WAREHOUSE | `warehouse@petfood.th` | `Staff123!` |
| SUPERVISOR | `supervisor@petfood.th` | `Staff123!` |
| VIEWER | `viewer@petfood.th` | `View123!` |

### Demo data (seeded)

- 1 Event (upcoming distribution)
- 100 Registrations (varied receiver types, provinces)
- 50 Check-ins already processed
- 100 Distribution records
- 5 Food types with stock in Inventory

---

## Known Limitations

1. **Windows + OpenNext**: OpenNext issues warnings on Windows — use WSL or deploy from CI for best results.
2. **D1 SQLite constraints**: No JSON column type; some Prisma features (JSON filters) unavailable.
3. **File uploads**: Images are served via `/api/files/...` — bandwidth passes through Worker. For heavy use consider R2 custom domain.
4. **QR scanner**: Requires HTTPS or localhost (camera API constraint).
5. **Thai font**: Uses Noto Sans Thai loaded via next/font. If offline → falls back to system fonts.
6. **PDPA**: Consent captured but no automated data-retention/erasure job yet.
7. **No email**: No transactional email yet (integrate Cloudflare Email Routing or Resend).

---

## Next Steps

- [ ] Add `AuditLog` writes on every mutation (currently table exists but unused)
- [ ] Implement Supervisor override flow for duplicate check-in
- [ ] Add email/SMS notification after successful registration
- [ ] Add full LINE Notify / LIFF integration
- [ ] Implement data-retention job (delete PII after N days per PDPA)
- [ ] Add `/admin/audit` page for audit log viewing
- [ ] Rate-limit public endpoints via Cloudflare WAF rules
- [ ] Add e2e tests (Playwright) for the full registration → check-in flow
- [ ] Cloudflare Access protection for `/admin/*` as a second factor
- [ ] Pre-generate Excel report asynchronously via Cloudflare Queues

---

## License

MIT
