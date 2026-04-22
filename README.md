# Wowcut

Templated content production subscription for beauty & fashion DTC brands.
Clients pay $250/mo for 20 on-brand content units — static + motion, captions, hashtags.
Production runs through a heavy-automation pipeline with operator-in-the-loop only for borderline QC.

## Monorepo layout

```
wowcut/
├── apps/
│   ├── client/          # app.wowcut.ai (public + authed) — preview flow, onboarding, delivery, library
│   ├── operator/        # operator.wowcut.ai — internal OS for the production team
│   ├── workers/         # BullMQ background workers — preview, generation, qc, assembly, delivery, trend
│   └── remotion/        # 5 Remotion compositions for video assembly
├── packages/
│   ├── db/              # Prisma schema + client
│   ├── api/             # tRPC routers (client-portal + operator)
│   ├── shared/          # env, brand constants, Zod schemas, rate-limit, brand-detection
│   ├── ai/              # style presets, prompt compiler, providers, QC
│   ├── storage/         # Cloudflare R2 client
│   ├── email/           # Resend + React Email templates
│   └── ui/              # Tailwind preset, brand tokens, shared components
├── turbo.json
├── pnpm-workspace.yaml
└── .env.example
```

## Quickstart

```bash
# 1. Install
pnpm install

# 2. Copy env
cp .env.example .env

# 3. Fill in your keys — at minimum:
#    DATABASE_URL, DIRECT_URL (Supabase Postgres)
#    REDIS_URL (Upstash)
#    STRIPE_SECRET_KEY + price IDs
#    GEMINI_API_KEY, FAL_API_KEY, REPLICATE_API_TOKEN, OPENAI_API_KEY
#    CLERK (operator) + SUPABASE (client magic links)
#    R2 bucket credentials
#    RESEND_API_KEY

# 4. Database
pnpm db:push         # or pnpm db:migrate
pnpm db:seed         # seeds trend drops + brand-face placeholders

# 5. Dev
pnpm dev             # runs all apps in parallel
# OR per-app:
pnpm --filter @wowcut/client dev     # http://localhost:3000
pnpm --filter @wowcut/operator dev   # http://localhost:3001
pnpm --filter @wowcut/workers dev
pnpm --filter @wowcut/remotion dev
```

## Architecture

See `/spec.md` for the full v2.0 implementation spec (26 sections).

### Key flows

**Preview → checkout** (`apps/client/app/(public)/try`):
1. Prospect submits brand URL
2. Brand detection scrapes logo + hero image + colors (`packages/shared/brand-detection.ts`)
3. `preview` queue renders 1 sample via Nano Banana 2 (watermarked)
4. Reveal screen → Stripe Checkout → Client record created

**Minimum onboarding → pilot** (`apps/client/app/(authed)/onboarding`):
1. 5-minute wizard collects 1 SKU + 1 style + 1 brand color + logo
2. 3 pilot samples auto-generate (priority 2, no operator in loop)
3. Pilot-ready email → client approves → week 1 production starts

**Weekly production**:
1. Content plan auto-generated for approved clients
2. `generation` queue runs ×3 alternates per static unit, ×1 per motion
3. `qc` worker computes composite score; ≥ 92 auto-approves to `assembly`
4. Operator reviews only borderline cases (`/queue/qc` with bulk ops + shortcuts)
5. `assembly` worker invokes Remotion → 9:16/1:1/4:5 exports → R2
6. `delivery` worker runs Monday 09:00 UTC → CSV + captions + Resend email

**Trend drops**:
- `trend` worker runs 1st of each month (CRON `0 9 1 * *`)
- Adds 2 bonus units to every active client's plan based on that month's theme
- See `packages/db/prisma/seed.ts` for 12 pre-written themes for year 1

## Brand system

Inspired by Figma's marketing chrome: strict black/white, variable font weights at unusual stops (320/330/340/450/480/540/700), pill (50px) and circle (50%) geometry, dashed 2px focus outlines, negative letter-spacing throughout, vibrant gradients only in hero sections.

Default variable font: **General Sans Variable** (Fontshare) — closest to figmaSans' airy, geometric feel.

Encoded in:
- `packages/ui/src/tokens.ts` — raw token values
- `packages/ui/src/tailwind-preset.ts` — Tailwind theme
- `packages/ui/src/globals.css` — base reset, focus rings, component classes
- `packages/ui/src/components/*` — Button, Card, MonoLabel, PillTabs, Logo, Input, Progress, Badge

## Deployment

| App | Target |
|---|---|
| `apps/client` | Vercel → `app.wowcut.ai` |
| `apps/operator` | Vercel → `operator.wowcut.ai` |
| `apps/workers` | Railway (or Fly.io) — single service or split per queue |
| `apps/remotion` | Rendered on-demand inside workers or AWS Lambda |
| Database | Supabase Postgres |
| Queues | Upstash Redis |
| Media | Cloudflare R2 |

## Testing

```bash
pnpm test                          # all
pnpm --filter @wowcut/ai test      # prompt compiler + QC composite scorer
```

Focus areas:
- Prompt compiler determinism
- QC verdict logic (fixtures)
- Auto-approve threshold correctness
- Content plan distribution
- Preview rate limiting
- Stripe webhook idempotency

## Conventions

- **TypeScript strict**, no `any`
- **Server Components by default**; `"use client"` only when needed
- **Absolute imports**: `@/*` or `@wowcut/*`
- **Env access**: only via `packages/shared/src/env.ts` (Zod-validated)
- **Queue-first**: every AI/long-running operation goes through BullMQ
- **Idempotent workers**: safe to retry
- **Auto-approve when safe**: operator sees only borderline QC cases

## Open decisions (v2.0 spec §23)

Pre-committed defaults, override via code comments / config:

| Question | Default |
|---|---|
| 12 Brand Faces | Placeholder seeds; regenerate in week 2 |
| Remotion templates | Minimalist house style matching brand chrome |
| Annual discount | 15% |
| Trend drops | 2 bonus units on top of 20 base |
| Preview watermark | Text-only "WOWCUT PREVIEW" |
| Gallery fallback | After 3 failed previews |

## Status

Scaffold complete end-to-end. Provider calls are stubbed — replace:
- `packages/ai/src/providers/nano-banana.ts` → real `@google/generative-ai` image endpoint
- `packages/ai/src/providers/fal.ts` → `@fal-ai/client` calls for Kling + Seedance
- `packages/ai/src/providers/replicate.ts` → Replicate fallback models
- `packages/ai/src/qc/index.ts` → Replicate CLIP + NSFW + custom blur/color microservice
- `apps/workers/src/assembly.worker.ts` → real Remotion `renderMedia` calls
