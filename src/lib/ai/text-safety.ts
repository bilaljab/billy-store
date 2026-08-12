// Defense-in-depth backstop against model-generated free text (product names/descriptions,
// discount labels, announcement text, ...) leaking tokens from an unexpected script — observed
// live (2026-08-09): asked to add "FC 27", the model sometimes free-text-generated an expanded
// product name containing Vietnamese words ("trên", "và") while trying to compose what it guessed
// was the full official title. The root-cause fix is prompt-level (see ADMIN_ASSISTANT_SYSTEM_PROMPT
// in prompts.ts, and the createProduct/updateProduct tool descriptions in assistant-tools.ts,
// both now explicitly forbid inventing/expanding a name) plus a lower sampling temperature (see
// nim-client.ts/groq-client.ts) — this check is a last-resort net for whatever slips through.
//
// KNOWN LIMITATION, stated plainly rather than implied: this is a strict Arabic+ASCII allowlist,
// not a language detector. It reliably catches scripts with distinct Unicode blocks (Vietnamese,
// Chinese, Cyrillic, Thai, etc.) because those fall outside the allowed ranges entirely. It CANNOT
// catch a hallucination that happens to reuse only plain ASCII letters (a wrong English word, an
// invented feature, a wrong price) or Latin diacritics that overlap with legitimate accented
// product titles (é, ñ, ö, ...) — this catalog's real titles are observed to be pure ASCII/Arabic
// already, so excluding accented Latin entirely is an acceptable trade for reliability here, but
// it is a narrow net for "wrong script," not a general anti-hallucination mechanism.
const ALLOWED_TEXT_PATTERN = new RegExp(
  '^[' +
    '\\t\\n\\r\\x20-\\x7E' + // whitespace + printable ASCII (letters, digits, common punctuation)
    '\\u0600-\\u06FF' + // Arabic
    '\\u0750-\\u077F' + // Arabic Supplement
    '\\u08A0-\\u08FF' + // Arabic Extended-A
    '\\uFB50-\\uFDFF' + // Arabic Presentation Forms-A (includes the riyal sign U+FDFC)
    '\\uFE70-\\uFEFF' + // Arabic Presentation Forms-B
    '\\u2000-\\u206F' + // General punctuation (em-dash, curly quotes, etc. used in Arabic text)
    '\\u00A9\\u00AE\\u2122' + // © ® ™ specifically — real official game titles carry these
                              // (confirmed live: "EA SPORTS FC™ 26"), added individually rather
                              // than opening the whole Latin-1 Supplement block those live in,
                              // which would also let Vietnamese-overlapping accented Latin back in
  ']*$'
);

export function hasForeignScript(text: string): boolean {
  return !ALLOWED_TEXT_PATTERN.test(text);
}

// Scans every string value in a flat args object (tool call arguments are never nested more than
// one level for the tools this applies to) plus the computed humanSummary, returning the first
// offending {field, value} pair found, or null if everything passes.
export function findForeignScriptViolation(
  args: Record<string, unknown>,
  humanSummary: string
): { field: string; value: string } | null {
  if (hasForeignScript(humanSummary)) return { field: 'humanSummary', value: humanSummary };
  for (const [key, value] of Object.entries(args)) {
    if (typeof value === 'string' && hasForeignScript(value)) return { field: key, value };
  }
  return null;
}
