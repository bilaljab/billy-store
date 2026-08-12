import type { NextRequest } from 'next/server';
import { matchProductNames } from './fuzzy-match';
import { fetchAllProducts } from '../assistant-tools';

export interface BatchResolution {
  resolvedIds: number[];
  unmatchedNames: string[];
  // Names that fuzzy-matched to something but too ambiguously to pick with confidence — see
  // MatchProductNamesResult.ambiguous in fuzzy-match.ts.
  flaggedForReview: string[];
}

// 2026-08-10: the per-chunk LLM "verification" call that used to live here was deleted after
// tracing it end-to-end and confirming it was pure overhead. Its only output, `resolvedIds`, was
// always `[...expectedIds]` — a Set built entirely from the locally-computed fuzzy-match results
// (see the old runBatchChunk, git history). The model's response was consulted only as a
// pass/fail gate; it could not add, remove, reorder, or alter a single id. On every successful
// call the output was bit-identical to skipping the call outright. Its only real effect was on
// the FAILURE path: two failed attempts (any callAI throw — provider down, timeout, malformed
// JSON, missing tool call) caused an entire 12-item chunk to be silently withheld from
// `resolvedIds` — i.e. it was a self-imposed, purely probabilistic data-loss mechanism, costing
// 4-5 heavyweight reasoning round-trips per 50-item request (the dominant share of a measured
// ~147s total) to buy nothing but a chance of dropping items. Since fuzzy-match already performs
// the only real decision here (which catalog item, if any, a name refers to), resolution is now
// fully deterministic: no chunking, no LLM call, no possibility of silent loss.
export async function resolveBatchedItems(
  candidateNames: string[],
  req: NextRequest
): Promise<BatchResolution> {
  const t0 = Date.now();
  const catalog = await fetchAllProducts(req);
  const { matched, unmatched, ambiguous } = matchProductNames(candidateNames, catalog);

  // Two different admin-typed names can legitimately fuzzy-match the same catalog id (e.g. a
  // near-duplicate or a name typed twice) — dedupe so the caller never sends a repeated id
  // downstream (e.g. into a targeted-discount productIds array).
  const resolvedIds = [...new Set(matched.map(m => m.id))];

  console.log(
    `[batch] resolved ${resolvedIds.length} unique id(s) from ${candidateNames.length} name(s) ` +
    `(unmatched=${unmatched.length}, ambiguous=${ambiguous.length}) in ${Date.now() - t0}ms`
  );

  return { resolvedIds, unmatchedNames: unmatched, flaggedForReview: ambiguous };
}
