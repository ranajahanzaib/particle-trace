# Particle Trace — Cloudflare Pages & R2 Deployment Guide

This guide details the step-by-step procedure for deploying Particle Trace to Cloudflare Pages with an R2 storage binding for ColliderML Release 1 event bundles.

---

## Architecture Overview

- **Frontend & Static Hosting:** Cloudflare Pages (serving `apps/web/dist`)
- **API Endpoints:** Cloudflare Pages Functions (`functions/api/`)
- **Event Storage:** Cloudflare R2 bucket (`particle-trace-data`)
- **Data Ingestion:** Local/CI Python pipeline (`pipeline/`)

```text
[Browser User]
      │
      ▼
[Cloudflare Pages CDN] ─── (Serves React Vite SPA bundle)
      │
      ▼
[/api/configs/:config/events/:id]
      │ (Pages Functions with R2 Binding)
      ▼
[Cloudflare R2 Bucket: particle-trace-data]
      │
      ├── colliderml-release-1/manifest.json
      └── colliderml-release-1/ttbar_pu0/
            ├── manifest.json
            └── events/
                  ├── 0.json.gz
                  ├── 1.json.gz
                  └── ...
```

---

## 1. Prerequisites

1. Cloudflare account with Pages and R2 enabled.
2. Node.js >= 20 and `pnpm` installed.
3. Python >= 3.10 installed with virtual environment.
4. Cloudflare Wrangler CLI:
   ```bash
   pnpm add -D wrangler
   npx wrangler login
   ```

---

## 2. Creating the Cloudflare R2 Bucket

Create the production and preview R2 buckets via the Wrangler CLI or Cloudflare dashboard:

```bash
# Create production bucket
npx wrangler r2 bucket create particle-trace-data

# Create preview bucket
npx wrangler r2 bucket create particle-trace-data-preview
```

Verify that the buckets are created:

```bash
npx wrangler r2 bucket list
```

---

## 3. Configuring R2 API Tokens for Publishing

To upload preprocessed event bundles from your machine or CI runner, generate an R2 S3-compatible API token in Cloudflare Dashboard:

1. Navigate to **R2** ➔ **Manage R2 API Tokens** ➔ **Create API Token**.
2. Permissions: **Admin Read & Write**.
3. Note your:
   - Account ID
   - Access Key ID
   - Secret Access Key
   - Endpoint URL: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`

Copy `.env.example` to `.env` in the project root:

```bash
cp .env.example .env
```

Fill in your credentials:

```ini
R2_BUCKET_NAME=particle-trace-data
R2_ENDPOINT_URL=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_PREFIX=colliderml-release-1
```

---

## 4. Ingesting Events & Publishing to R2

Use the Python pipeline CLI to ingest a selected range of collision events and upload them directly to R2:

```bash
# 1. Activate virtual environment
source .venv/bin/activate

# 2. Ingest and normalize collision events (e.g. 20 events from ttbar_pu0)
python3 -m particle_trace.cli ingest \
  --channel ttbar \
  --pileup pu0 \
  --events 20 \
  --output-dir ./data/processed \
  --compress

# 3. Validate processed data integrity
python3 -m particle_trace.cli validate --target-dir ./data/processed

# 4. Publish to Cloudflare R2
python3 -m particle_trace.cli publish \
  --target-dir ./data/processed \
  --bucket particle-trace-data \
  --endpoint https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

---

## 5. Building & Deploying the Pages Application

### Local Verification with Wrangler

Test the full application locally including Pages Functions and R2 simulation:

```bash
# Build frontend
pnpm build

# Run local Pages preview server
npx wrangler pages dev apps/web/dist --compatibility-date=2024-11-01
```

### Deploying to Cloudflare Pages

Deploy the build artifact to Cloudflare Pages:

```bash
# Direct CLI deploy
npx wrangler pages deploy apps/web/dist --project-name=particle-trace
```

### Git Integration (Continuous Deployment)

Alternatively, connect your GitHub repository to Cloudflare Pages:

- **Build command:** `pnpm build`
- **Build output directory:** `apps/web/dist`
- **Root directory:** `/`
- Under **Settings ➔ Functions ➔ R2 bucket bindings**, ensure `R2_BUCKET` is linked to `particle-trace-data`.

---

## 6. Verifying Deployed API Endpoints

Once deployed, verify that the API serves data and manifests correctly:

```bash
# Health check
curl -i https://particle-trace.pages.dev/api/health

# Top-level manifest
curl -i https://particle-trace.pages.dev/api/manifest

# Available configurations
curl -i https://particle-trace.pages.dev/api/configs

# Event listing
curl -i https://particle-trace.pages.dev/api/configs/ttbar_pu0/events?limit=10

# Single event bundle
curl -i https://particle-trace.pages.dev/api/configs/ttbar_pu0/events/0
```

---

## 7. Updating the Processed Dataset

To add more events or additional physics channels (e.g. `ttbar_pu200` or Higgs channels):

1. Run `python3 -m particle_trace.cli ingest --channel <channel> --pileup <pu> --events <count> --output-dir ./data/processed`.
2. Run `python3 -m particle_trace.cli publish --target-dir ./data/processed`.
3. The API will dynamically serve the new events without requiring a redeployment of the frontend code.
