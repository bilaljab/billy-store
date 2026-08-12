import Fuse from 'fuse.js';
import type { AdminProduct } from '../assistant-tools';

export interface MatchResult {
  input: string;
  id: number;
  matchedName: string;
  score: number;
}

export interface MatchProductNamesResult {
  matched: MatchResult[];
  unmatched: string[];
  // Names that DID match something, but too closely between the top two candidates to pick
  // confidently (within AMBIGUITY_MARGIN) — distinct from `unmatched` (no candidate found at
  // all), since the admin-facing message for each case should read differently.
  ambiguous: string[];
}

// Empirically tuned against the real catalog (2026-08-09), not the 0.35 starting point. Direct
// testing against real product names found 0.35 too strict for a legitimate real-world typo on a
// longer compound title — "PS Plus Essentail" (missing/swapped letters) scored 0.384 against the
// real "PS Plus Essential - شهر", just above 0.35, meaning Fuse would drop it entirely rather than
// surface a match. Raised to 0.4, re-verified: the same typo now matches confidently (0.384 < 0.4)
// with the next-best candidate still a wide 0.673 away (no new ambiguity introduced across the
// three near-identical "PS Plus ..." catalog entries, which are the most collision-prone titles
// here). Fuse's threshold is inverted-confidence (0 = exact match only, 1 = matches anything).
// Known limitation, NOT fixable by threshold tuning: true abbreviations ("GTA VI" for "Grand Theft
// Auto VI") score far outside any reasonable threshold (0.577) because fuzzy string matching is
// edit-distance based, not semantic — an admin typing an abbreviation gets correctly reported as
// unmatched (surfaced, not silently guessed) rather than mis-resolved, which is the safer failure
// mode for a tool that acts on real money/inventory.
const MATCH_THRESHOLD = 0.4;
// If the top two candidates' scores are within this margin of each other, treat the match as
// ambiguous rather than silently picking one — avoids e.g. confusing "FIFA 24" with "FIFA 25" on
// a truncated/garbled name.
const AMBIGUITY_MARGIN = 0.05;

// Pure function, no DB/LLM calls — resolves admin-typed product names against the real catalog
// via fuzzy string matching BEFORE anything gets sent to an LLM. Names that don't confidently
// match are returned as `unmatched` and must never be forwarded to the model (this alone
// deterministically fixes the "typos get mishandled" half of the reliability bug this migration
// is meant to solve — see src/lib/ai/batch.ts for how the LLM-facing half is handled).
export function matchProductNames(candidateNames: string[], catalog: AdminProduct[]): MatchProductNamesResult {
  const fuse = new Fuse(catalog, {
    keys: ['name'],
    includeScore: true,
    ignoreLocation: true,
    threshold: MATCH_THRESHOLD,
  });

  const matched: MatchResult[] = [];
  const unmatched: string[] = [];
  const ambiguous: string[] = [];

  for (const rawName of candidateNames) {
    const name = rawName.trim();
    if (!name) continue;

    const results = fuse.search(name);
    if (results.length === 0) {
      unmatched.push(rawName);
      continue;
    }

    const [best, second] = results;
    const bestScore = best.score ?? 1;
    const secondScore = second?.score ?? 1;
    const isAmbiguous = results.length > 1 && secondScore - bestScore < AMBIGUITY_MARGIN;

    if (isAmbiguous) {
      ambiguous.push(rawName);
      continue;
    }

    matched.push({ input: rawName, id: best.item.id, matchedName: best.item.name, score: bestScore });
  }

  return { matched, unmatched, ambiguous };
}
