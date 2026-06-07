# MdcatXpert

MDCAT preparation platform for Pakistan — past papers as interactive quizzes, progress dashboards, analytics, and admin tools to bulk-import question banks from Excel.

## Features

**Students**

- Sign up / log in (email + password via Convex Auth)
- Take timed quizzes and view detailed results
- Dashboard and subject analytics
- Premium upgrade flow (payment screenshot + admin approval)
- Promo codes at signup

**Admins** (`role: admin` on your user in Convex)

- Upload question banks from `.xlsx` (review → publish workflow)
- Manage quizzes, students, payments, and discount codes

**AI** (see [docs/AI_FEATURES_PLAN.md](docs/AI_FEATURES_PLAN.md))

- Mistake analyzer, weakness radar, and related insights (Groq)

## Tech stack

| Layer | Technology |
| ----- | ---------- |
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Backend | [Convex](https://convex.dev) (database, functions, file storage) |
| Auth | [@convex-dev/auth](https://labs.convex.dev/auth) (Password provider) |
| Email | Resend (contact form, notifications) |
| Charts | Recharts |

Legacy Supabase migrations and Python helpers under `api/` remain in the repo; **local dev uses Next.js API routes + Convex** for uploads and staging (not `/api/py/*`).

## Getting started

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm

### Install

```bash
pnpm install
```

### Environment

Copy `.env.local.example` to `.env.local` and fill in values. Convex CLI will also set `NEXT_PUBLIC_CONVEX_URL` and related vars when you run `convex dev`.

Typical variables:

| Variable | Purpose |
| -------- | ------- |
| `NEXT_PUBLIC_CONVEX_URL` | Convex deployment URL (from `npx convex dev`) |
| `CONVEX_DEPLOYMENT` | Convex deployment name |
| `GROQ_API_KEY` | AI features |
| `RESEND_API_KEY` | Transactional email (Next.js) |
| `RESEND_FROM_EMAIL` | Sender address for Resend (Next.js and Convex) |
| `AUTH_RESEND_KEY` | Password reset OTP emails (**Convex** dashboard env; can match `RESEND_API_KEY`) |

### Run locally

Use **two terminals**:

```bash
# Terminal 1 — Convex backend (schema, auth, mutations)
pnpm convex:dev

# Terminal 2 — Next.js frontend
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### First admin user

After signing up, set `role` to `admin` for your user in the [Convex dashboard](https://dashboard.convex.dev) → **Data** → `users` table.

### Scripts

| Command | Description |
| ------- | ----------- |
| `pnpm dev` | Start Next.js dev server |
| `pnpm convex:dev` | Start Convex dev sync |
| `pnpm build` | Production build |
| `pnpm start` | Run production server |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript check |
| `pnpm convex:seed-promos` | Seed test promo codes in Convex |

## Admin Excel upload format

Upload at **Admin → Upload** (`.xlsx` / `.xls`). **All worksheets** with the correct layout are imported (e.g. Physics, Chemistry, Biology, English tabs in one file). **Release year** is required in the form. **Archive title** is optional; if omitted, it is resolved from (in order):

1. Form field  
2. `Title` column in the sheet (first non-empty row)  
3. Worksheet name (unless `Sheet1`)  
4. File name (without extension)

### Required columns

| Column | Description |
| ------ | ----------- |
| `Question` | Question text |
| `A`–`D` | Full answer text for each option (prefixes like `C) playing` are stripped on import) |
| `Correct` | `A`, `B`, `C`, or `D` — also accepts `C)`, `C) playing`, or the full matching option text |
| `Subject` | `Biology`, `Chemistry`, `Physics`, `English`, or `General` (optional if the **sheet tab** is named after a subject) |

### Optional columns

| Column | Description |
| ------ | ----------- |
| `Title` | Archive title (when not entered in the form) |
| `Image` | Image URL for the question |

Invalid rows are skipped; the upload response includes `skipped_rows` (Excel row numbers).

### Flow

1. `POST /api/quizzes/upload` — parse file → Convex `stagingQuestions`  
2. Review at `/admin/upload/review/[batchId]`  
3. `POST /api/staging/publish/[batchId]` — create quiz + questions  

PDF upload is not enabled in the Next.js path yet (`/api/quizzes/upload-pdf` returns 501).

## API routes (app)

| Route | Description |
| ----- | ----------- |
| `POST /api/quizzes/upload` | Admin XLSX → staging batch |
| `GET /api/staging/[batchId]` | List staged questions |
| `PATCH/DELETE /api/staging/question/[id]` | Edit / remove staged question |
| `POST /api/staging/publish/[batchId]` | Publish batch as quiz |
| `POST /api/payments/submit` | Submit payment proof |
| `GET /api/auth/me` | Current user profile |

## Project layout

```
src/app/          Next.js App Router (pages + API routes)
convex/           Convex schema, auth, mutations, queries
api/services/     Legacy Python parsers (PDF/XLSX; optional on Vercel)
docs/             Blueprint, phases, AI plan
supabase/         Legacy SQL migrations (reference)
```

## Documentation

- [Blueprint](docs/blueprint.md) — product vision and schema overview  
- [AI features plan](docs/AI_FEATURES_PLAN.md)  
- [Deployment](DEPLOYMENT.md)  
- [Domain setup](DOMAIN_SETUP.md)  
- [Admin upload phase](docs/phases/phase-2-admin-upload.md)  

## Deploy

Deploy the Next.js app to Vercel and link a Convex production deployment (`npx convex deploy`). See [DEPLOYMENT.md](DEPLOYMENT.md) for environment variables and post-deploy checks.

## License

Private — All rights reserved.
