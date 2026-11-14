# CLAUDE.md

Billy Store: Arabic RTL storefront selling PS4/PS5 games and PS Plus subscriptions for the Saudi market, with an admin dashboard (products, discounts, announcements, AI assistant).

> **Kept short on purpose** (Anthropic guidance: under 200 lines, only what can't be inferred from code). Full history of decisions, incidents and measurements lives in [docs/claude-history.md](docs/claude-history.md) (Arabic, not auto-loaded; "G#N" = item number there). AI-assistant rules are in [.claude/rules/ai-assistant.md](.claude/rules/ai-assistant.md) and load automatically when you touch its files.

## Stack

Next.js 15.5 (App Router) + React 19 + TypeScript strict · Tailwind 4 (theme inside `@theme` in `src/app/globals.css`, no `tailwind.config.js`) · SQLite via Turso (`@libsql/client`; local file `data/billy.db`) · Auth: JWT (`jose`) in httpOnly cookie `admin_token` + `bcryptjs`, single admin only · Images: Cloudinary (unsigned preset) · Local STC font · Hosted on Vercel · No state library (local `useState`).

## Commands

```bash
npm run dev        # localhost:3000. Run ONE instance only (shared .next cache)
npm run build      # On Windows stop any running server first (G#23)
npm run lint
npx tsc --noEmit   # no npm script for this
node --experimental-strip-types src/lib/discounts.check.mjs   # discount logic check
```

No test suite (deliberately deferred). Verify with `tsc` + `lint` + `build` + manual/browser checks.

## Environment variables

Template in `.env.example`. Real secrets live in `.env` / `.env.local` (gitignored). Never print or share them.

| Variable | Notes |
|---|---|
| `JWT_SECRET` (32+ chars), `ADMIN_PASSWORD` | Always required. Password is only for the first seed |
| `TURSO_URL` / `TURSO_AUTH_TOKEN` | Required in production; empty locally = local SQLite |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_UPLOAD_PRESET` | Image upload |
| `NVIDIA_NIM_API_KEY`, `GROQ_API_KEY` | Admin assistant (NIM primary, Groq fallback) |
| `GEMINI_API_KEY` | Only for three text helpers in `ai-provider.ts` |
| `RAWG_API_KEY` | Optional, source currently disabled |
| `NEXT_PUBLIC_SITE_URL` | `https://billystoreksa.com` in production. Every consumer falls back to `billy-store.vercel.app` |

## Deployment and domain

- **Domain**: `billystoreksa.com` (registered and DNS-managed on Cloudflare). `www` 308-redirects to the apex. DNS records (`A @ → 76.76.21.21`, `CNAME www → cname.vercel-dns.com`) **must stay DNS only (grey cloud)**; the orange proxy conflicts with SSL and ISR on Vercel.
- **`billy-store.vercel.app`** 308-redirects to the new domain via `redirects()` in `next.config.js` (host condition). Do not remove it.
- **No Git integration on Vercel**: every deploy is manual `vercel --prod`; pushing to GitHub deploys nothing. `vercel --prod` from the project folder ships **uncommitted files too**. To deploy a clean committed state, use `git worktree` and copy `.vercel/project.json` into it.
- **Search Console**: Domain property verified (TXT on Cloudflare); sitemap `https://billystoreksa.com/sitemap.xml` submitted 2026-11-14 (initial "Couldn't fetch" is transient).
- **MCP**: Vercel MCP needs `authorize_team_access` for team `bilaljabs-projects`. Cloudflare MCP needs Zone:Read + DNS:Edit when connecting.
- `DEPLOYMENT.md` is stale and contradicts the stack (mentions Neon/PlanetScale, not Turso). Do not follow it.

## Structure and single sources of truth

- `src/lib/discounts.ts` → `getBestDiscount()`: **the only source** for discount priority (highest matching targeted rule, else global). `ProductCard` relies solely on `product.discount` from `getCatalog()` (`src/lib/catalog.ts`). Any new consumer must pass `discount` or no badge shows.
- `src/lib/contact.ts`: WhatsApp/Instagram/Telegram links. `src/lib/messages.ts`: `buildInquiryMessage()`.
- `src/lib/collections.ts`: `/ps5`, `/ps4`, `/ps-plus` pages through one route `src/app/[collection]/page.tsx`. Platform is read from the product name (`[PS5]` / `(PS4)` / both). **A game with no platform tag = PS5 only** (store convention).
- `src/lib/arabic-names.ts`: Arabic names Saudis search for big English-titled games ("فيفا 26", "بلاك اوبس 7"); used in product `<title>`, a line under the H1, and store search. Hand-kept list; add a row for each big new release.
- Vercel Web Analytics (`<Analytics />` in `layout.tsx`) also counts admin browsing; must be enabled once in the Vercel dashboard (Analytics tab).
- `src/lib/faqs.ts` (FAQ text + `FAQPage` JSON-LD), `src/lib/psplus.ts` (tier benefits: Essential/Extra/Deluxe only, no Premium in Saudi; source is Sony's official page). **Tier prices are never hardcoded**; they come from catalog products via `tierOf()` (product name).
- Security: all headers + CSP live **only in `next.config.js`**; `middleware.ts` is admin-only. `images.remotePatterns` is an allow-list (`res.cloudinary.com`, `image.api.playstation.com`, `media.rawg.io`). A new image host must be added there or `/_next/image` returns 400.
- API: `isAuthenticated(req)` on every admin route (**every `GET` too**). SQL only via `db.execute({sql, args})`. Targeted-discount validation goes through the shared `validateRuleInput()`. Sensitive deletes use the shared `ConfirmDialog`. `PUT/POST /api/admin/products` are validated (name, price 0–99999, ≤200 chars).
- Every query on `products` must exclude `deleted_at` (13 sites, including ISR pages and sitemap).

## Design (dark "cinematic PS Store" theme)

- Tokens in `globals.css` (`@theme`): `accent` for blue text (not `text-brand`), `line` for borders, `gold` as text/tint color. **Do not redefine `--radius-pill` / `--shadow-*` in `:root`.**
- **STC font has two weights only: Regular 400 and Bold 700.** Almost everything is Bold; card titles are Regular; **prices stay Bold** (owner decision, do not lighten). Don't reintroduce `font-black/semibold/medium`.
- `src/components/vendor/` comes from the shadcn CLI (Magic UI / Aceternity). Don't hand-edit (exception: `resizable-navbar.tsx` is deliberately trimmed for performance). Customize via `src/components/fx/index.tsx` and `Navbar.tsx`.
- `BlurFade` hides content until it enters the viewport via JS. Horizontal scroll containers (`.rail`, `Price`) must be `relative` (otherwise `sr-only` widens the page). Don't change `--chip-bg` to fix border contrast; use a dedicated border.
- After any design migration: grep all of `src/` for old tokens and run a real contrast check (Lighthouse), not just "does the class exist".
- Do not add a static hero background image (the current hero backdrop is a blurred catalog product cover).

## Performance and ISR

- `/` ISR 60s; `/products`, `/products/[id]`, `/[collection]` ISR 30s. **Do not read `searchParams` in a Server Component** and do not use `useSearchParams` in `ProductsBrowser` (kills ISR / causes CSR bailout). Filters are read in `useEffect` after mount.
- `ProductCard` is server-renderable (no `'use client'`). Don't bring back the module-level `/api/discounts` cache.
- `/api/discounts`: `s-maxage=30, stale-while-revalidate=120`, so discount changes can lag ~150s (deliberate).
- Deferred: STC font preload (`next-font-manifest` is empty, root cause undiagnosed), `LazyMotion`, Next 16 upgrade.

## Deliberately deferred (don't fix without an explicit request)

- Discounts have no start/end dates (feature not decided).
- Single product delete (`DELETE /api/admin/products/[id]`) is a **hard delete**, unlike bulk delete (soft delete, 7-day restore). Unifying them is a behavior decision.
- Login rate limit is in-memory (weak across instances; accepted behind Vercel). No CSRF Origin check (`sameSite: strict` suffices for a single admin).
- `unsafe-inline` in CSP is accepted; revisit if any HTML-injection point appears (currently zero `dangerouslySetInnerHTML` except JSON-LD).
- `npm audit`: `sharp`/`postcss` vulnerabilities bundled inside `next` need Next 16. All major upgrades (next 16, eslint 10, jose 6, bcryptjs 3, typescript 7) are separate decisions.
- `bulk-price` has no max percentage; `/api/views` counts admin browsing; `xlsxParser.ts` is a hand-written parser (2MB/entry cap, first sheet only, silently returns "0 imported" on a corrupt file).
- `scripts/init-db.js` is orphaned and broken: don't run it. `data/billy.db` holds real data: don't delete it.

## Windows dev pitfalls

- Stop the server before `npm run build`. Never run more than one `next dev` in the same folder. Rapid request loops without delay exhaust the worker; check DB state directly (`sqlite3 -readonly data/billy.db`), not via HTTP status.
- Never `taskkill /IM chrome.exe`; target the PID. Strange failures in a long session: count orphan `node`/`chrome` processes before assuming a code bug.
- Screenshots of long pages: no `fullPage:true`; use manual `scrollIntoView`.
- Editing real data for a test: raw snapshot before, literal restore after (memory `test-data-restore-discipline`).
- Before claiming "dead code": grep **all** of `src/` (the `.ps-btn` incident).
- User reports an old bug "coming back"? Check the code and restart the server before changing anything.

## Audit reports (project root)

`discount-audit.md`, `security-audit.md`, `web-quality-audit.md`, `cro-audit.md`, `design-audit.md`.
