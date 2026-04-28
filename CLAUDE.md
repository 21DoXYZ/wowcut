# Claude Instructions — Wowcut

## Project
Turborepo + pnpm monorepo. Three deployable apps:
- `apps/client` → Vercel (Next.js 14, client portal)
- `apps/operator` → Vercel (Next.js 14, internal QC/ops)
- `apps/workers` → Railway (BullMQ workers, long-running)

## Stack
- Frontend: Next.js 14 App Router, TypeScript, Tailwind
- DB: Postgres via Prisma (`packages/db`)
- Auth: Supabase (`@supabase/ssr`) — native OTP only, no custom token logic
- Queues: BullMQ on Redis
- Storage: Cloudflare R2 (`packages/storage`)
- AI: Vertex AI via `@google/genai` SDK
- Payments: Stripe

## Commands
```bash
pnpm typecheck      # must be 0 errors before any deploy
pnpm dev            # all apps
pnpm db:push        # apply schema
pnpm db:seed        # seed QcStyleProfile, TrendDrops, test Client
pnpm build          # full production build
```

## Production Readiness Checklist
Run this before every deploy. Skipping any step has caused multi-day outages.

### 1. Auth
- [ ] Supabase OTP enabled for the project (Auth > Settings > Email)
- [ ] At least one Client row exists in Prisma with matching `email` field
- [ ] Test login end-to-end: send code → enter code → lands on /deliveries
- [ ] `middleware.ts` cookie pattern: set on `request.cookies` FIRST, then create `NextResponse.next({ request })`

### 2. Database
- [ ] `DATABASE_URL` in `packages/db/.env` points to correct environment
- [ ] Run `pnpm db:push` if schema changed
- [ ] Run `pnpm db:seed` in fresh environments (creates QcStyleProfile + test Client)
- [ ] Verify Client record exists for every real user: `prisma.client.findUnique({ where: { email } })`

### 3. Workers
- [ ] `REDIS_URL` env var set on Railway
- [ ] All worker files imported in `apps/workers/src/index.ts`
- [ ] BullMQ jobs enqueued after DB status updates (not just DB, both)
- [ ] Timeout paths mark both `Generation` AND `ContentPlanItem` as failed

### 4. Queues — common mistakes
- `bulkRetry` must call `enqueueRetry()` (not just update DB status)
- `trend.worker` must call `enqueueWeeklyBatch()` after creating ContentPlanItems
- `seedance-poll.worker` on MAX_ATTEMPTS must update `ContentPlanItem` status too

### 5. API routes
- [ ] Every `<a href="/api/...">` link has a corresponding route file
- [ ] Stripe portal route exists at `app/api/stripe/portal/route.ts`

### 6. Build
- [ ] `pnpm typecheck` — 0 errors
- [ ] `pnpm build` — completes without error
- [ ] Check Vercel deployment logs immediately after deploy; ERROR state = TypeScript/build failure

## Auth — Rules (learned the hard way)

**Never build custom OTP logic.** Supabase has native OTP:
```ts
// Send
supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } })
// Verify
supabase.auth.verifyOtp({ email, token, type: "email" })
```
No server routes, no `admin.generateLink`, no manual token storage.

**The hidden auth trap:** Supabase auth succeeding ≠ user can access the app.
`session.ts::getCurrentClient()` does `prisma.client.findUnique({ where: { email } })`.
If no Client row exists → returns null → layout redirects to /sign-in → infinite loop.
**Always seed a Client row for every user who needs access.**

**Middleware cookie fix:** The `setAll` callback in `createServerClient` must set cookies on
`request.cookies` before creating a new `NextResponse.next({ request })`, otherwise each call
overwrites previous cookies.

## Code Style
- Read files fully before modifying
- No comments unless logic is non-obvious
- No emojis in code or output
- No em-dashes (—) in UI text — use plain hyphen (-)
- TypeScript strict — no `any`
- Prefer editing existing files over creating new ones
- Solve only what was asked, no over-engineering

## Git
Always ask before committing or pushing.
