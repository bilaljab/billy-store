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

const PSN_LOCALE = 'ar-sa';
const PSN_BASE = 'https://store.playstation.com';
const PSN_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
};
const PSN_IMAGE_HOST_SUFFIX = 'playstation.com';

// Real game listings, as opposed to virtual currency, standalone items/costumes, or misc add-ons.
const ACCEPTABLE_CLASSIFICATIONS = new Set(['FULL_GAME', 'GAME_BUNDLE', 'PREMIUM_EDITION']);

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
  media?: NextDataMedia[];
}

interface NextData {
  props?: {
    apolloState?: Record<string, NextDataProduct>;
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

// PSN's own name data is inconsistent for the same title — re-querying "God of War Ragnarök"
// moments apart returned "God of War Ragnarök" once and "God of War راغنروك" (Arabic
// transliteration) the next time (confirmed live). A strict all-words rule would reject that
// legitimate match. So: numeric tokens (sequel numbers like "4", "2") must match verbatim —
// they're rarely transliterated — while at most one non-numeric word may fail to match,
// tolerating a single transliterated/localized proper noun without accepting a candidate that
// shares nothing but generic words (kept as a safety net even though the modern search's own
// ranking is far better than the legacy API's — see file header).
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

function nameMatchesQuery(query: string, candidateName: string): boolean {
  const queryTokens = normalizeForMatch(query).split(' ').filter(Boolean);
  if (queryTokens.length === 0) return false;
  const normalizedName = normalizeForMatch(candidateName);

  const numericTokens = queryTokens.filter(t => /^\d+$/.test(t));
  if (numericTokens.some(t => !normalizedName.includes(t))) return false;

  const wordTokens = queryTokens.filter(t => !/^\d+$/.test(t));
  const missingWordTokens = wordTokens.filter(t => !normalizedName.includes(t));
  return missingWordTokens.length <= 1;
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

export async function findPsnGameInfo(gameName: string): Promise<PsnGameInfoResult> {
  const name = gameName.trim();
  if (!name) return { ok: false, error: 'اسم اللعبة فارغ' };

  let searchHtml: string;
  try {
    const res = await fetch(`${PSN_BASE}/${PSN_LOCALE}/search/${encodeURIComponent(name)}`, {
      headers: PSN_HEADERS,
    });
    if (!res.ok) return { ok: false, error: 'تعذّر البحث بمتجر PlayStation' };
    searchHtml = await res.text();
  } catch {
    return { ok: false, error: 'تعذّر الاتصال بمتجر PlayStation' };
  }

  const searchData = extractNextData(searchHtml);
  const apolloState = searchData?.props?.apolloState ?? {};
  const products = Object.values(apolloState).filter(
    (v): v is NextDataProduct => v?.__typename === 'Product' && typeof v.name === 'string'
  );

  const best = products.find(
    p =>
      ACCEPTABLE_CLASSIFICATIONS.has(p.storeDisplayClassification ?? '') &&
      nameMatchesQuery(name, p.name as string)
  );
  if (!best?.id) return { ok: false, error: 'لم يُعثر على لعبة مطابقة بمتجر PlayStation' };

  const imageUrl = pickImage(best.media);

  let infoProduct: InfoProduct | null = null;
  try {
    const res2 = await fetch(`${PSN_BASE}/${PSN_LOCALE}/product/${encodeURIComponent(best.id)}`, {
      headers: PSN_HEADERS,
    });
    if (res2.ok) {
      const detailHtml = await res2.text();
      const detailData = extractNextData(detailHtml);
      if (detailData) infoProduct = extractInfoProduct(detailData);
    }
  } catch {
    // نكمل ببيانات البحث فقط لو فشل استدعاء صفحة المنتج (بدون وصف/تاريخ/أنواع دقيقة)
  }

  const released = typeof infoProduct?.releaseDate === 'string' ? infoProduct.releaseDate.split('T')[0] : null;
  const genres = (infoProduct?.localizedGenres ?? [])
    .map(g => g?.value)
    .filter((v): v is string => typeof v === 'string');

  const longDesc = infoProduct?.descriptions?.find(d => d.type === 'LONG')?.value;
  const rawDesc = typeof longDesc === 'string' ? stripHtml(longDesc) : '';

  let description = '';
  if (rawDesc) {
    try {
      description = await cleanPsnDescriptionAr(best.name as string, rawDesc.slice(0, 2000));
    } catch {
      description = ''; // فشل التنظيف لا يُسقط باقي البيانات (صورة/تاريخ لسا مفيدة)
    }
  }

  return { ok: true, data: { name: best.name as string, description, imageUrl, released, genres } };
}
