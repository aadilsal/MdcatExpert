# Study Copilot (RAG)

Elite Study Copilot lets students upload their own notes and chat with cited answers grounded in personal uploads and the platform MDCAT library.

## Free vs Elite

| Tier | Uploads | Messages/day | Chat modes |
|------|---------|--------------|------------|
| Free | 3 | 10 | Explain only |
| Elite | Unlimited | Unlimited | All modes |

## Environment variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `GROQ_API_KEY` | Next.js (Vercel) | Chat + scanned-PDF OCR (Llama 3.2 Vision) |
| `INGEST_OCR_SECRET` | Next.js **and** Convex | Shared secret for `/api/copilot/ocr-page` |
| `SITE_URL` | Convex | Public app URL Convex calls for OCR (e.g. `https://mdcatxpert.com`) |

Retrieval uses **Convex full-text search** on document chunks (no embedding API). Groq does not offer embeddings; this keeps the stack on a single API key.

## Admin: Study Library

Route: **Admin → Study Library** (`/admin/study-library`)

- Upload PDF/DOCX/TXT for platform library
- Generate AI summaries (Groq draft → edit → publish)
- Re-index or delete sources

## PCTB seed manifest

Official textbooks only: `scripts/pctb-manifest.json`

```bash
# Import each book (downloads from PCTB via Convex action)
pnpm convex:seed-library

# Or import all in one Convex action
pnpm convex:seed-library:now
```

Books are downloaded from official `pctb.punjab.gov.pk` URLs only, stored in Convex, and ingested automatically. Check **Admin → Study Library** for `processing` → `ready` status.

## Scanned PDF OCR

Many PCTB 2025 textbooks are image-scanned PDFs. Ingestion detects low text density and runs **batched OCR**:

1. Convex schedules page batches
2. Each batch calls **`POST /api/copilot/ocr-page`** on your deployed Next.js app (Vercel)
3. Next.js renders the page image + runs Groq Vision OCR
4. Convex chunks OCR text and indexes it for search

**Vercel:** set `maxDuration` on the OCR route (60s on Pro). **Convex cloud** must reach a public `SITE_URL` (use your Vercel domain, or ngrok when testing locally).

## Supported upload formats

- PDF (text layer or scanned via OCR), DOCX, plain text (paste)

## API routes

| Route | Purpose |
|-------|---------|
| `POST /api/copilot/upload` | Student upload |
| `POST /api/copilot/chat` | RAG chat |
| `DELETE /api/copilot/source/[id]` | Delete source |
| `POST /api/copilot/source/[id]` | Re-index source |
| `POST /api/admin/study-library/upload` | Admin platform upload |
| `POST /api/admin/study-library/summary` | AI summary draft |
| `POST /api/copilot/ocr-page` | Internal: render + OCR one PDF page (Convex only) |
