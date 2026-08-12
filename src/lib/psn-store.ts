import { cleanPsnDescriptionAr } from './ai-provider';

// Primary source for findGameInfo: store.playstation.com's own live storefront pages (the same
// modern Next.js/Apollo GraphQL site real customers browse — not the legacy "chihiro" REST API
// this file used previously, see git history). No key/auth needed for these public pages.
//
// Why the switch from the old chihiro API: it doesn't index recent titles at all (confirmed
// live — "EA Sports FC 26" returns zero results under any phrasing) and its search relevance is
// weak (a "Resident Evil 4" query ranked unrelated "Dead by Daylight" DLC first, with the real
// game absent even from the top 10). The live storefront's own search gets both right — same
// query correctly ranks "Resident Evil 4 PS4 & PS5" (FULL_GAME) first, and "EA Sports FC 26"
// is found immediately. Confirmed live from both a local machine and Vercel's serverless
// environment. Still unofficial/unsupported (scraping Sony's own rendered HTML, not a
// documented API) and in the same ToS gray area as before.
//
// Mechanics: both /search/{query} and /product/{id} pages are server-rendered with a
// <script id="__NEXT_DATA__"> blob containing the full Apollo cache (props.apolloState) used
// to hydrate the page — search results (name, platforms, classification, media/cover images)
// come straight from that. The full description/release date/genres are NOT in that top-level
// cache though; they're embedded one level deeper inside a "batarang" (Sony's internal name for
// a self-contained widget) — pageProps.batarangs.info.text is itself an HTML string containing
// its own nested <script id="env:..."> JSON blob with a richer, unlocalized Product cache entry
// (descriptions split by type: SHORT/LONG/LEGAL/COMPATIBILITY_NOTICE — the LONG one is exactly
// the clean narrative text we want, already separated from legal/compatibility boilerplate).
//
// Queried with the ar-sa locale so name + LONG description come back as Sony's own official
// Arabic Saudi-storefront copy — not a translation. That description is already clean prose (no
// HTML-mixed legal text like the old chihiro long_desc), so cleanPsnDescriptionAr's job here is
// lighter — condensing to the catalog's ~200-300 char editorial length, not extracting a
// narrative out of noise.
//
// Never throws — same "always return {ok, error}" convention as game-info.ts/poster-search.ts.
//
// 2026-08-10 rewrite: the ranked search-results list (apolloState.ROOT_QUERY.universalSearch(...)
// .results, an ordered array of {__ref} pointers into the same cache) was being ignored in favor
// of an unordered Object.values() sweep, and the old nameMatchesQuery() had a real hole (a
// single-word query whose only word was absent from the candidate still passed, since
// "missingWordTokens.length <= 1" made 0-or-1 both acceptable for a 1-token query) plus loose
// substring (.includes()) semantics with no word boundaries. Both live-confirmed to misfire:
// "GTA" matched an in-game currency bundle, "COD" matched "ANONYMOUS;CODE" (the substring "cod"
// inside "code"). See CLAUDE.md for the full incident writeup. This rewrite reads the ranked
// list, replaces substring matching with whole-token comparison plus a proper single-word
// coverage requirement, and adds a scored selection (tiered classification + edition-qualifier
// downweighting + PSN's own rank as a tiebreaker) since rank alone is also demonstrably
// unreliable — live-verified: "EA Sports FC 26"'s top 3 results are a commentary pack and two
// virtual-currency packs; "GTA 6"'s #1 result is an upgrade edition, not the base game.

const PSN_LOCALE = 'ar-sa';
const PSN_BASE = 'https://store.playstation.com';
const PSN_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
};
const PSN_IMAGE_HOST_SUFFIX = 'playstation.com';

// Real game listings, as opposed to virtual currency, standalone items/costumes, or misc add-ons.
// Tiered (not a flat set) because live data shows an acceptable-but-secondary classification can
// still outrank the true base game — see CLASS_TIER_BONUS below.
const CLASSIFICATION_TIERS: Record<string, number> = {
  FULL_GAME: 0,
  GAME_BUNDLE: 1,
  PREMIUM_EDITION: 1,
};

interface NextDataMedia {
  role?: string;
  type?: string;
  url?: string;
}

interface NextDataProduct {
  __typename?: string;
  id?: string;
  name?: string;
  storeDisplayClassification?: string;
  platforms?: string[];
  media?: NextDataMedia[];
  // Live-verified (2026-08-10): Sony's own storeDisplayClassification is not reliable enough on
  // its own — "محتوى Ghost of Tsushima الإضافي" ("Ghost of Tsushima Bonus Content", a free DLC
  // unlock, not the base game) is classified FULL_GAME by PSN itself, so the tier filter alone
  // let it through. price.isFree is the reliable signal: every real purchasable base
  // game/edition in the same search had isFree:false ($22.99-$79.99); only bonus/DLC-style
  // free unlocks had isFree:true — see the hard filter in pickBestProduct.
  price?: { isFree?: boolean };
}

interface UniversalSearchRef {
  __ref?: string;
}

interface UniversalSearchResponse {
  __typename?: string;
  results?: UniversalSearchRef[];
}

interface NextData {
  props?: {
    // Deliberately untyped beyond "an object map" — this cache holds Products, the ROOT_QUERY
    // node, EMS nav/experience widgets, and (in some locales/builds) Concept entries, none of
    // which share a single shape. Individual entries are cast to the narrower interfaces above
    // only after checking __typename.
    apolloState?: Record<string, unknown>;
    pageProps?: {
      batarangs?: Record<string, { text?: string }>;
    };
  };
}

interface InfoDescription {
  type?: string;
  value?: string;
}

interface InfoProduct {
  descriptions?: InfoDescription[];
  releaseDate?: string;
  localizedGenres?: { value?: string }[];
}

export interface PsnGameInfoResult {
  ok: boolean;
  data?: {
    name: string;
    description: string;
    imageUrl: string | null;
    released: string | null;
    genres: string[];
  };
  error?: string;
}

function extractNextData(html: string): NextData | null {
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as NextData;
  } catch {
    return null;
  }
}

function extractInfoProduct(nextData: NextData): InfoProduct | null {
  const infoHtml = nextData.props?.pageProps?.batarangs?.info?.text;
  if (typeof infoHtml !== 'string') return null;
  const match = infoHtml.match(/<script id="env:[^"]*" type="application\/json">([\s\S]*?)<\/script>/);
  if (!match) return null;
  try {
    const env = JSON.parse(match[1]) as { cache?: Record<string, InfoProduct> };
    const cacheKey = Object.keys(env.cache ?? {}).find(k => k.startsWith('Product:'));
    return cacheKey ? (env.cache?.[cacheKey] ?? null) : null;
  } catch {
    return null;
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function isProductEntry(v: unknown): v is NextDataProduct {
  return !!v && typeof v === 'object' && (v as NextDataProduct).__typename === 'Product' && typeof (v as NextDataProduct).name === 'string';
}

// Reads apolloState.ROOT_QUERY's universalSearch(...) field (its key embeds the query params —
// countryCode/languageCode/searchTerm/pageSize — so it's found by prefix, not exact match) and
// resolves its ordered `results: [{__ref}]` pointers against the cache, preserving PSN's own
// relevance order. Falls back to the old unordered full-cache sweep if the shape isn't found
// (a Sony markup change, most likely) — this file must never throw, and degrading to the
// previous behavior is safer than a hard failure.
function extractOrderedProducts(apolloState: Record<string, unknown>): { products: NextDataProduct[]; ordered: boolean } {
  const rootQuery = apolloState.ROOT_QUERY;
  if (rootQuery && typeof rootQuery === 'object') {
    const searchKey = Object.keys(rootQuery as Record<string, unknown>).find(k => k.startsWith('universalSearch'));
    if (searchKey) {
      const searchResponse = (rootQuery as Record<string, unknown>)[searchKey] as UniversalSearchResponse | undefined;
      const refs = searchResponse?.results;
      if (Array.isArray(refs)) {
        const products: NextDataProduct[] = [];
        for (const r of refs) {
          const ref = r?.__ref;
          if (typeof ref !== 'string') continue;
          const entry = apolloState[ref];
          if (isProductEntry(entry)) products.push(entry);
        }
        if (products.length > 0) return { products, ordered: true };
      }
    }
  }

  console.log('[psn-store] universalSearch key NOT found in apolloState — falling back to unranked cache sweep');
  return { products: Object.values(apolloState).filter(isProductEntry), ordered: false };
}

// Numeric bridging so a query using a roman numeral ("GTA VI") matches a candidate using an
// arabic numeral ("Grand Theft Auto 6") or vice versa. Deliberately small (covers realistic game
// sequel numbers only) — a token only gets bridged if it exactly equals one of these keys, so an
// unrelated word that happens to look like a roman numeral (e.g. "X" in "Mega Man X") only ever
// ADDS an alternate form to check, it can't remove the literal-form match, so worst case is a
// slightly too-generous match on an already-passing candidate, not a false rejection.
const ROMAN_TO_ARABIC: Record<string, string> = {
  i: '1', ii: '2', iii: '3', iv: '4', v: '5', vi: '6', vii: '7', viii: '8', ix: '9', x: '10',
  xi: '11', xii: '12', xiii: '13', xiv: '14', xv: '15', xvi: '16',
};
const ARABIC_TO_ROMAN: Record<string, string> = Object.fromEntries(
  Object.entries(ROMAN_TO_ARABIC).map(([roman, arabic]) => [arabic, roman])
);

function tokenVariants(token: string): string[] {
  const variants = [token];
  if (ROMAN_TO_ARABIC[token]) variants.push(ROMAN_TO_ARABIC[token]);
  if (ARABIC_TO_ROMAN[token]) variants.push(ARABIC_TO_ROMAN[token]);
  return variants;
}

// PSN's own name data is inconsistent for the same title — re-querying "God of War Ragnarök"
// moments apart returned "God of War Ragnarök" once and "God of War راغنروك" (Arabic
// transliteration) the next time (confirmed live). A strict all-words rule would reject that
// legitimate match, hence coverage-based matching below rather than requiring every word.
const LATIN_DIACRITICS = new RegExp('[̀-ͯ]', 'g');
const ARABIC_TASHKEEL = new RegExp('[ً-ْ]', 'g');

function normalizeForMatch(text: string): string {
  return text
    .normalize('NFD')
    .replace(LATIN_DIACRITICS, '') // strip Latin combining diacritics (e.g. ö → o)
    .replace(ARABIC_TASHKEEL, '') // strip Arabic tashkeel
    .toLowerCase()
    .replace(/[™®©'’]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const STOPWORDS = new Set(['of', 'the', 'a', 'and', 'في', 'على', 'من', 'و']);

// Returns a match confidence in [0, 1], or exactly 0 for a hard rejection. Whole-token comparison
// only — no substring checks — which is what closes both live-confirmed holes in the old
// nameMatchesQuery: "cod" no longer matches inside "code" (not the same token), and a one-word
// query now requires that word to actually be present (coverage === 1 for a 1-token query,
// instead of the old "0 or 1 missing is both fine" rule that let every candidate through).
function scoreNameMatch(query: string, candidateName: string): number {
  const queryTokens = normalizeForMatch(query).split(' ').filter(Boolean);
  if (queryTokens.length === 0) return 0;
  const candidateTokens = normalizeForMatch(candidateName).split(' ').filter(Boolean);
  if (candidateTokens.length === 0) return 0;

  if (queryTokens.join(' ') === candidateTokens.join(' ')) return 1;

  const numericTokens = queryTokens.filter(t => /^\d+$/.test(t));
  for (const t of numericTokens) {
    if (!tokenVariants(t).some(v => candidateTokens.includes(v))) return 0; // mandatory, same as before
  }

  const wordTokens = queryTokens.filter(t => !/^\d+$/.test(t));
  if (wordTokens.length === 0) return 0.7; // query was purely numeric and it matched

  // Coverage is computed over non-stopword tokens only ("basis" tokens) — a stopword match
  // ("of", "the") is free and shouldn't count as real evidence of a title match. Live-verified
  // this matters: "Ghost of Tsushima" against the unrelated "Ghostbusters: Rise of the Ghost
  // Lord" shares "ghost" + "of" = 2/3 word tokens (0.667, would have passed a raw word-token
  // coverage check) purely because both titles happen to contain the filler word "of" — with
  // stopwords excluded from the denominator too, that's 1/2 significant tokens (0.5), correctly
  // below threshold. Falls back to all word tokens only if the query is entirely stopwords
  // (pathological/near-empty query), to avoid dividing by zero.
  const significantTokens = wordTokens.filter(t => !STOPWORDS.has(t));
  const basisTokens = significantTokens.length > 0 ? significantTokens : wordTokens;

  const matchedBasisTokens = basisTokens.filter(t => tokenVariants(t).some(v => candidateTokens.includes(v)));
  const coverage = matchedBasisTokens.length / basisTokens.length;

  if (basisTokens.length === 1) {
    if (coverage < 1) return 0; // the single-token hole this rewrite closes
  } else {
    if (coverage < 0.6) return 0;
  }

  return coverage;
}

// Downweights candidates that are clearly a non-base variant — an upgrade path, a virtual-
// currency/content pack, a season pass — rather than the primary game itself. This is what
// demotes GTA VI's live-observed #1 result "…: ترقية الإصدار المُطلق" (Upgrade Edition) below the
// plain base game. Deliberately narrow: does NOT include Deluxe/Ultimate/Gold/Definitive, since
// those are legitimate distinct purchasable SKUs an admin might genuinely want, not upgrade paths
// — see cleanOfficialName() below, which has the same "don't touch real edition names" rule.
const NON_BASE_QUALIFIER_PATTERN = /(ترقية|حزمة|نقاط|upgrade|bundle|season pass|content pack|currency)/i;

const CLASS_TIER_BONUS = [0.2, 0.05]; // index = CLASSIFICATION_TIERS value
const PLATFORM_BONUS = 0.05;
const RANK_BONUS_WEIGHT = 0.15; // only applied when extractOrderedProducts found a real ranked list
const EDITION_PENALTY = 0.3;
const EXTRA_TOKEN_PENALTY_WEIGHT = 0.05;
const EXTRA_TOKEN_PENALTY_CAP = 8;

interface PickResult {
  product: NextDataProduct;
  score: number;
  rank: number;
}

// Hard filters: classification must be in CLASSIFICATION_TIERS (excludes ITEM/VIRTUAL_CURRENCY/
// OTHER — live-verified necessary, e.g. "EA Sports FC 26"'s top 3 raw results are exactly those),
// and scoreNameMatch must be > 0. Among survivors, picks the highest combined score. Rank from
// PSN's own ordering is a tiebreaker (RANK_BONUS_WEIGHT is small), not the primary signal — in
// every live-verified pathological query, PSN's own #1 result was wrong.
function pickBestProduct(query: string, products: NextDataProduct[], ordered: boolean): PickResult | null {
  let best: PickResult | null = null;

  products.forEach((p, index) => {
    const tier = CLASSIFICATION_TIERS[p.storeDisplayClassification ?? ''];
    if (tier === undefined) return;
    if (p.price?.isFree) return; // see NextDataProduct.price comment — classification alone isn't reliable here

    const nameScore = scoreNameMatch(query, p.name as string);
    if (nameScore <= 0) return;

    const candidateTokenCount = normalizeForMatch(p.name as string).split(' ').filter(Boolean).length;
    const queryWordCount = normalizeForMatch(query).split(' ').filter(Boolean).length;
    const extraTokens = Math.max(0, candidateTokenCount - queryWordCount);
    const extraTokenPenalty = EXTRA_TOKEN_PENALTY_WEIGHT * Math.min(1, extraTokens / EXTRA_TOKEN_PENALTY_CAP);

    const classBonus = CLASS_TIER_BONUS[tier];
    const platformBonus = (p.platforms ?? []).some(pl => pl === 'PS4' || pl === 'PS5') ? PLATFORM_BONUS : 0;
    const rankBonus = ordered ? RANK_BONUS_WEIGHT * (1 - index / products.length) : 0;
    const editionPenalty = NON_BASE_QUALIFIER_PATTERN.test(p.name as string) ? EDITION_PENALTY : 0;

    const score = nameScore + classBonus + platformBonus + rankBonus - editionPenalty - extraTokenPenalty;

    if (!best || score > best.score) best = { product: p, score, rank: index };
  });

  return best;
}

function pickImage(media: NextDataMedia[] | undefined): string | null {
  if (!media?.length) return null;
  const cover = media.find(m => m.role === 'MASTER' && m.type === 'IMAGE') ?? media.find(m => m.type === 'IMAGE');
  const url = cover?.url;
  if (typeof url !== 'string') return null;
  try {
    const host = new URL(url).hostname;
    return host.endsWith(PSN_IMAGE_HOST_SUFFIX) ? url : null;
  } catch {
    return null;
  }
}

// Strips trailing platform/"standard edition" qualifiers PSN bakes into the display name (e.g.
// "EA SPORTS FC™ 27 Standard Edition على PS4 وPS5" → "EA SPORTS FC™ 27") so the stored product
// name matches this catalog's existing plain-title convention. Patterns are end-anchored (never
// touch the middle of a name) and applied iteratively so multiple trailing suffixes strip in one
// pass (e.g. "... Standard Edition على PS4 وPS5" needs two of these patterns, in either order).
//
// Deliberately does NOT strip Deluxe/Ultimate/Gold/Definitive/Remastered/GOTY/Complete Edition —
// those are genuinely different purchasable SKUs at different prices; if the selection logic
// above picked one, the admin needs to see it on the confirm screen, not a silently-relabelled
// base-game name. Never strips ™/®/© (real titles carry them, and text-safety.ts's allowlist
// explicitly accounts for that). Never returns an empty/near-empty result — falls back to the
// original name untouched if stripping would leave nothing meaningful.
const NAME_CLEAN_SUFFIXES: RegExp[] = [
  /[\s\-–—:|،,]*على\s+PS4\s*[وو]\s*PS5$/i,
  /[\s\-–—:|،,]*على\s+PS5$/i,
  /[\s\-–—:|،,]*على\s+PS4$/i,
  /[\s\-–—:|،,]*لأجهزة\s+PS4\s*[وو]\s*PS5$/i,
  /[\s\-–—:|،,]*لجهاز\s+PS4$/i,
  /[\s\-–—:|،,]*لجهاز\s+PS5$/i,
  /[\s\-–—:|،,]*\(نسخة\s+PS[45]\)$/i,
  /[\s\-–—:|،,]*نسخة\s+PS[45]$/i,
  /[\s\-–—:|،,]*الإصدار\s+القياسي$/i,
  /[\s\-–—:|،,]*النسخة\s+القياسية$/i,
  /[\s\-–—:|،,]*إصدار\s+قياسي$/i,
  /[\s\-–—:|،,]*\(PS4\)$/i,
  /[\s\-–—:|،,]*\(PS5\)$/i,
  /[\s\-–—:|،,]*for\s+PS4\s*(&|and)\s*PS5$/i,
  /[\s\-–—:|،,]*for\s+PS[45]$/i,
  /[\s\-–—:|،,]*PS4®?™?\s*(&|and)\s*PS5®?™?$/i,
  /[\s\-–—:|،,]*Standard\s+Edition$/i,
];

function cleanOfficialName(rawName: string): string {
  let name = rawName.trim();
  for (let pass = 0; pass < 6; pass++) {
    let changedThisPass = false;
    for (const pattern of NAME_CLEAN_SUFFIXES) {
      const next = name.replace(pattern, '').trim();
      if (next !== name && next.length >= 2) {
        name = next;
        changedThisPass = true;
      }
    }
    if (!changedThisPass) break;
  }
  name = name.replace(/[\s\-–—:|،,]+$/, '').trim();
  return name.length >= 2 ? name : rawName.trim();
}

export async function findPsnGameInfo(gameName: string): Promise<PsnGameInfoResult> {
  const name = gameName.trim();
  if (!name) return { ok: false, error: 'اسم اللعبة فارغ' };

  let searchHtml: string;
  const t0 = Date.now();
  try {
    const res = await fetch(`${PSN_BASE}/${PSN_LOCALE}/search/${encodeURIComponent(name)}`, {
      headers: PSN_HEADERS,
    });
    console.log(`[psn-store] search fetch took ${Date.now() - t0}ms, status=${res.status}`);
    if (!res.ok) return { ok: false, error: 'تعذّر البحث بمتجر PlayStation' };
    searchHtml = await res.text();
  } catch (err) {
    console.log(`[psn-store] search fetch FAILED after ${Date.now() - t0}ms:`, err);
    return { ok: false, error: 'تعذّر الاتصال بمتجر PlayStation' };
  }

  const searchData = extractNextData(searchHtml);
  const apolloState = searchData?.props?.apolloState ?? {};
  const { products, ordered } = extractOrderedProducts(apolloState);

  const picked = pickBestProduct(name, products, ordered);
  console.log(
    `[psn-store] found ${products.length} candidate products (ordered=${ordered}), best match: ` +
    `${picked ? `"${picked.product.name}" (score=${picked.score.toFixed(2)}, rank=${picked.rank})` : 'NONE'}`
  );
  if (!picked) return { ok: false, error: 'لم يُعثر على لعبة مطابقة بمتجر PlayStation' };
  const best = picked.product;
  if (!best.id) return { ok: false, error: 'لم يُعثر على لعبة مطابقة بمتجر PlayStation' };

  const cleanedName = cleanOfficialName(best.name as string);
  if (cleanedName !== best.name) {
    console.log(`[psn-store] name cleaned: "${best.name}" → "${cleanedName}"`);
  }

  const imageUrl = pickImage(best.media);

  let infoProduct: InfoProduct | null = null;
  const t1 = Date.now();
  try {
    const res2 = await fetch(`${PSN_BASE}/${PSN_LOCALE}/product/${encodeURIComponent(best.id)}`, {
      headers: PSN_HEADERS,
    });
    console.log(`[psn-store] product page fetch took ${Date.now() - t1}ms, status=${res2.status}`);
    if (res2.ok) {
      const detailHtml = await res2.text();
      const detailData = extractNextData(detailHtml);
      if (detailData) infoProduct = extractInfoProduct(detailData);
    }
  } catch (err) {
    console.log(`[psn-store] product page fetch FAILED after ${Date.now() - t1}ms:`, err);
  }

  const released = typeof infoProduct?.releaseDate === 'string' ? infoProduct.releaseDate.split('T')[0] : null;
  const genres = (infoProduct?.localizedGenres ?? [])
    .map(g => g?.value)
    .filter((v): v is string => typeof v === 'string');

  const longDesc = infoProduct?.descriptions?.find(d => d.type === 'LONG')?.value;
  const rawDesc = typeof longDesc === 'string' ? stripHtml(longDesc) : '';

  let description = '';
  if (rawDesc) {
    const t2 = Date.now();
    try {
      description = await cleanPsnDescriptionAr(cleanedName, rawDesc.slice(0, 2000));
      console.log(`[psn-store] cleanPsnDescriptionAr (Gemini) took ${Date.now() - t2}ms`);
    } catch (err) {
      console.log(`[psn-store] cleanPsnDescriptionAr FAILED after ${Date.now() - t2}ms:`, err);
      description = ''; // فشل التنظيف لا يُسقط باقي البيانات (صورة/تاريخ لسا مفيدة)
    }
  }

  return { ok: true, data: { name: cleanedName, description, imageUrl, released, genres } };
}
