---
paths:
  - "src/lib/ai/**"
  - "src/lib/ai-provider.ts"
  - "src/lib/assistant-*.ts"
  - "src/lib/psn-store.ts"
  - "src/lib/game-info.ts"
  - "src/lib/poster-search.ts"
  - "src/app/api/admin/assistant/**"
  - "src/app/admin/assistant/**"
  - "src/components/admin/Assistant*.tsx"
---

# Admin AI assistant (`/admin/assistant`)

Full details and measurements in `docs/claude-history.md` (G#24–27, 30; Arabic).

## Structure
- Admin types an Arabic command → function-calling → internal self-fetch to the same admin API routes with the `admin_token` cookie (no duplicated auth logic).
- `src/lib/ai/`: `index.ts` (`callAI` + fallback), `nim-client.ts`, `groq-client.ts`, `prompts.ts`, `fuzzy-match.ts`, `batch.ts`, `name-extract.ts`, `text-safety.ts`.
- Tool registry `assistant-tools.ts` (20 tools, risk tiers: safe / single-confirm / double-confirm). Optional `execute?` field for tools with no internal route.
- The frontend JSON contract (4 shapes in `chat/route.ts` + `confirm/route.ts`) is stable. Don't change it.

## Provider and model
- Primary NIM: **`nvidia/llama-3.3-nemotron-super-49b-v1.5`** (not DeepSeek, despite the original plan). Fallback Groq (`openai/gpt-oss-120b`). `temperature: 0.1`, 60s timeout. The model returns `reasoning_content`/`reasoning` as a separate field (no `<think>` tags); it never reaches any response.
- Speed-up alternatives were tried and failed (`detailed thinking off` breaks tool-calling, `/no_think` ignores `findGameInfo`, `llama-3.3-70b` times out on NIM). Don't switch models without re-measuring for real.
- **Gemini only for three text helpers** in `ai-provider.ts` (`rewriteGameDescriptionAr`, `cleanPsnDescriptionAr`, `findWebUrl`) with pinned model `gemini-3.1-flash-lite` (no `-latest` alias; ≥140 req/day, 15/min, shared quota). The 2.5 generation is blocked for this key; 2.0 has zero quota.

## Confirmation and deletion
- Read tools run immediately. Writes need confirmation. `bulkDeleteProducts` / `bulkUpdatePrices` / `importProducts` = **double confirm** (type the affected count, recomputed server-side).
- Multi-hop up to 5 hops (name → `listProducts` → id). Bulk delete = soft delete (`deleted_at`, 7 days, trash view in dashboard). `bulk-price` / `import` write `undo_data` to `audit_log` with an undo button.
- `BATCHABLE_TOOLS` are exactly three: `createTargetedDiscount`, `updateTargetedDiscount`, `bulkDeleteProducts` (by name via `productNames` / `itemNames`). Validation is **deterministic** (fuzzy-match, `MATCH_THRESHOLD=0.4`), no LLM. Semantic abbreviations ("GTA VI") are not matched by character distance; they show up as "unmatched" to the admin.
- `DISABLED_TOOLS` (`findGamePoster`) are rejected inside `getTool()` itself, not just hidden from the model.
- `getMissingRequiredFields()` blocks a confirm screen with a missing field ("price undefined").
- `findForeignScriptViolation()` (`text-safety.ts`) rejects any `args` / `humanSummary` containing characters outside Arabic + ASCII (+™®©). It is a Unicode-block allowlist, not a language detector.

## Adding a game (`findGameInfo`)
- Source: **live `store.playstation.com` pages** (`psn-store.ts`, locale `ar-sa`, no key): `__NEXT_DATA__` apolloState. RAWG (`findRawgGameInfo`) is exported but disabled (down). Giant Bomb was ruled out.
- Result selection: `scoreNameMatch` with whole tokens (Roman↔Arabic numeral bridge), classification filter (`FULL_GAME` first) + `price.isFree` as a hard filter, coverage over non-stopword tokens. `cleanOfficialName()` strips only platform/Standard suffixes (never Deluxe/GOTY).
- The model expands an abbreviation or Arabic name into an English official title **as a search query only**; the stored name comes solely from the PSN result. Search failure → literal name with no image.
- Known limit: a game whose `ar-sa` name is fully transliterated ("شبح تسوشيما") isn't found by an English query (safe fallback to the literal name). Future fix: second search in `en-sa`.
- Manual poster: "attach/replace image" button in `AssistantConfirmCard` (uploads via `/api/upload`).
- Search goes through Sony's own persisted GraphQL query (`searchViaGraphql`, `SEARCH_HASH` captured from the live store page 2026-11-13); SSR-HTML parsing is kept as fallback. Sony moved results out of the SSR HTML that day, so the old path alone found nothing (tested: old 0/6 games, new 4/4 found). If Sony rotates the hash the call returns empty and the fallback runs; re-capture it from the store page's network tab (`getSearchResults`). `findPsnGameInfoById` is for manual bulk fills.
- Scraping is a gray area under PSN terms (accepted); revisit if actual blocking occurs.

## Testing
- Temporary test data (`ZZTEST *`) is hard-deleted with a delay between requests, and the catalog is verified back to its original state via SQLite directly. Never touch the real discount rules.
