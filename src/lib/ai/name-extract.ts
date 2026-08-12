// Deterministic, code-side extraction of candidate item names from an admin's raw message — a
// safeguard against the exact failure mode that originally prompted this whole migration: an LLM
// silently truncating a long list of names (the old Gemini model reportedly stopped around
// 20-22 of 50). Even a fast/non-reasoning model swapped in later could reintroduce that same
// failure while copying names into a tool-call argument. This function gives chat/route.ts an
// independent, non-LLM candidate list to compare against and merge with, per README in batch.ts/
// fuzzy-match.ts: over-extraction here is safe, because every candidate still has to survive
// matchProductNames() against the real catalog before anything happens to it — an extracted
// string that isn't a real product name just becomes another "unmatched" entry shown to the
// admin, never acted on.

// Drop a leading instruction clause ending in a colon ("طبّق خصم على:", "احذف:") so it isn't
// itself treated as a candidate name. Deliberately only strips up to the FIRST colon, not every
// colon in the message — a real title can legitimately contain one (e.g. "Uncharted 4: A Thief's
// End"), so splitting on every colon would corrupt it.
function stripInstructionPrefix(message: string): string {
  const firstColon = message.search(/[:：]/);
  if (firstColon === -1) return message;
  // Only treat it as an instruction prefix if it's early in the message (a real title's colon
  // would typically appear well into a name, not right after a short verb phrase) — a generous
  // cap avoids accidentally eating a message that opens with a long, colon-bearing title.
  if (firstColon > 60) return message;
  return message.slice(firstColon + 1);
}

const LIST_MARKER_PATTERN = /^\s*(?:[-–•*]|\d+[.)]|[٠-٩]+[.)])\s*/;
const CURRENCY_OR_PERCENT_PATTERN = /^\d+%?$|^ر\.?س\.?$|^ريال$|^sar$/i;

export function extractCandidateNames(rawMessage: string): string[] {
  const body = stripInstructionPrefix(rawMessage);

  // Split on newlines, Arabic/ASCII comma, and semicolon — NOT on the Arabic conjunction "و"
  // (deliberately, v1): it attaches without a space to the following word in real PSN data
  // ("وGreat White Shark"), and appears inside legitimate titles, so a naive split would cut
  // names in half far more often than it would correctly separate two names.
  const pieces = body.split(/[\n،,;؛]+/);

  const names: string[] = [];
  for (const raw of pieces) {
    const trimmed = raw.replace(LIST_MARKER_PATTERN, '').trim();
    if (!trimmed || trimmed.length < 2) continue;
    if (CURRENCY_OR_PERCENT_PATTERN.test(trimmed)) continue;
    names.push(trimmed);
  }

  // Runaway guard — this is a safeguard against under-extraction, not a feature for arbitrarily
  // long admin messages.
  return names.slice(0, 300);
}

// Merge policy: prefer the model's own list unless the deterministic extraction found
// meaningfully more candidates, in which case take the union (case-insensitive, trimmed dedupe)
// rather than replacing outright — the model sometimes normalizes a name into a form that
// fuzzy-matches better than the raw text would, so discarding its output isn't free either.
export function mergeNameLists(modelNames: string[], serverNames: string[]): { names: string[]; serverRecoveredMore: boolean } {
  const serverRecoveredMore = serverNames.length > modelNames.length * 1.15 + 1;
  if (!serverRecoveredMore) return { names: modelNames, serverRecoveredMore: false };

  const seen = new Set<string>();
  const union: string[] = [];
  for (const n of [...modelNames, ...serverNames]) {
    const key = n.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    union.push(n.trim());
  }
  return { names: union, serverRecoveredMore: true };
}
