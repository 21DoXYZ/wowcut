# Wowcut — setup guide

Local dev is up and rendering. To make the full funnel actually work end-to-end, you need real credentials for the external services below. Everything else is code-ready.

## Status

- [x] Postgres (local brew) — schema pushed, `QcStyleProfile` + `TrendDrop` seeded
- [x] Redis (local brew) — Queues will connect on Worker start
- [x] Next dev server runs on `http://localhost:3002` (port 3000 was taken)
- [x] All public pages render: `/`, `/try`, `/pricing`, `/gallery`, `/sign-in`
- [x] `.env` created with placeholders
- [ ] Anthropic API key — required for scenario generation, captions, QC vision judge
- [ ] Gemini API key — required for image generation (Nano Banana 2)
- [ ] Replicate token — required for CLIP similarity, aesthetic score, NSFW
- [ ] Supabase project — required for client magic-link auth
- [ ] Clerk project — required for operator auth
- [ ] Stripe account + 5 price IDs — required for checkout
- [ ] Cloudflare R2 bucket + keys — required for media storage
- [ ] Resend API key — required for transactional email (optional in dev)
- [ ] fal.ai key — required for motion generation (Kling/Seedance)

## Services to set up (in priority order)

### 1. Anthropic + Gemini + Replicate — makes preview flow work

**Anthropic Console** → <https://console.anthropic.com/> → API keys → create → set `ANTHROPIC_API_KEY` in `.env`.

**Google AI Studio** → <https://aistudio.google.com/apikey> → create API key → set `GEMINI_API_KEY`.

**Replicate** → <https://replicate.com/account/api-tokens> → create token → set `REPLICATE_API_TOKEN`.

After these three are set, the `/try` flow will actually produce a moodboard when you complete the 3-step wizard.

### 2. Cloudflare R2 — storage for uploads + outputs

<https://dash.cloudflare.com/> → R2 → Create bucket `wowcut-media-dev`. Manage API Tokens → create S3 token with read/write on this bucket.

Fill:
```
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=wowcut-media-dev
R2_PUBLIC_URL=https://<your-bucket-subdomain>.r2.dev
```

Enable public access on the bucket or set up a custom domain.

### 3. Supabase — client magic-link auth

<https://supabase.com/dashboard> → New project → wait for provisioning. Get URL + anon key + service role from Settings → API.

For production, you'd also use Supabase for Postgres instead of local. In `.env` swap:
```
DATABASE_URL=<supabase connection pooler URL>
DIRECT_URL=<supabase direct URL>
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Then run `pnpm db:push` against Supabase.

### 4. Stripe — payments

<https://dashboard.stripe.com/test/apikeys> → copy secret + publishable keys.

Create 5 products/prices:
| Product | Price | Price ID env var |
|---|---|---|
| Wowcut Week Pass | $49 one-time | `STRIPE_PRICE_ID_WEEK_PASS` |
| Wowcut Base | $250/mo recurring | `STRIPE_PRICE_ID_BASE` |
| Wowcut Base Annual | $2550/yr recurring | `STRIPE_PRICE_ID_BASE_ANNUAL` |
| Wowcut Premium | $500/mo recurring | `STRIPE_PRICE_ID_PREMIUM` |
| Wowcut Premium Annual | $5100/yr recurring | `STRIPE_PRICE_ID_PREMIUM_ANNUAL` |

For local webhooks: `stripe listen --forward-to http://localhost:3002/api/webhooks/stripe` and copy the `whsec_...` into `STRIPE_WEBHOOK_SECRET`.

### 5. Clerk — operator auth

<https://dashboard.clerk.com/> → Create application. Get publishable + secret keys. For now you can skip Clerk setup if you only want to test the client flow — operator app is separate (port 3001) and won't run without Clerk keys.

### 6. Resend — email (optional for dev)

<https://resend.com/api-keys>. Set `RESEND_API_KEY`. For dev you can log emails to console instead — the `sendEmail` wrapper in `@wowcut/email` will throw without a key, but nothing in the preview flow actually sends email pre-checkout.

### 7. fal.ai — motion (Kling/Seedance)

Only needed if you want to generate motion content (Premium tier + weekly Short Motion). <https://fal.ai/> → get API key → set `FAL_API_KEY`. Skip if you're only validating static preview flow.

## Running everything

After filling credentials:

```bash
# Terminal 1: Postgres + Redis (already running via brew services)
brew services list

# Terminal 2: load env and start all apps (turbo --parallel)
cd "wowcut"
set -a; source .env; set +a
pnpm dev
```

This runs:
- `@wowcut/client` on :3002
- `@wowcut/operator` on :3001
- Workers (background processes)
- Remotion on port (if needed)

## What works right now (without real credentials)

- Landing, pricing, gallery pages render
- Sign-in page loads (magic link send will fail — Supabase not wired)
- `/try` wizard accepts uploads but Next route `/api/upload` will fail (R2 not wired)
- `/try` submit will fail (Anthropic + Gemini not wired)

## What will work after each credential step

| Step | What becomes real |
|---|---|
| + Anthropic + Gemini + Replicate + R2 | Preview flow: /try → moodboard in 60-90s |
| + Supabase | Magic-link auth works |
| + Stripe | Checkout → client created |
| + Clerk | Operator OS at :3001 |

## Commands quick ref

```bash
# Regenerate Prisma client after schema changes
pnpm db:generate

# Push schema without migration history (dev only)
pnpm db:push

# Create a migration
pnpm db:migrate

# Seed QC profiles + trend drops + brand faces
pnpm db:seed

# Open Prisma Studio (DB browser on :5555)
pnpm db:studio

# Typecheck all 13 workspaces
pnpm typecheck

# Start all apps in dev mode
pnpm dev
```

## Deploying to production

- **Frontends** (`apps/client`, `apps/operator`) → Vercel
- **Workers** (`apps/workers`) → Railway (keep-alive long-running service)
- **DB** → Supabase (swap local Postgres for connection pooler URL)
- **Redis** → Upstash (free tier enough for MVP)

Set all env vars in each platform's dashboard. Stripe webhooks must point to `https://<client-domain>/api/webhooks/stripe`.
