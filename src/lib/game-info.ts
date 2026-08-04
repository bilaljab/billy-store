import { rewriteGameDescriptionAr } from './ai-provider';
import { findPsnGameInfo } from './psn-store';

// Best-effort automatic game data lookup for the AI assistant's createProduct tool — replaces
// the disabled findGamePoster/Google Search grounding approach (CLAUDE.md Gotcha #24). Uses
// PSN's own unofficial store API (src/lib/psn-store.ts — official Arabic Sony copy + real
// cover art, no key needed) as the sole source. Same "never throw, always return {ok, error}"
// convention as src/lib/poster-search.ts.
//
// RAWG fallback disabled by explicit user decision (2026-08-03): RAWG (api.rawg.io) has been
// unreachable (connection failures, not just rate-limited) across this entire session's
// testing — user judged it unreliable enough that falling through to it wasn't worth keeping
// live. findRawgGameInfo() below is kept fully intact and exported (not deleted) so it can be
// re-wired in one line if RAWG's uptime improves later — see the disabled call site comment.

interface GameInfoResult {
  ok: boolean;
  data?: {
    name: string;
    description: string; // عربي، جاهز — ناتج rewriteGameDescriptionAr، لا يُعاد صياغته
    imageUrl: string | null;
    released: string | null;
    genres: string[];
  };
  error?: string;
}

interface RawgSearchResult {
  id: number;
  name: string;
  background_image?: string;
  description_raw?: string;
  platforms?: { platform?: { name?: string } }[];
}

interface RawgDetail extends RawgSearchResult {
  released?: string | null;
  genres?: { name?: string }[];
}

const RAWG_IMAGE_HOST_SUFFIX = 'rawg.io';

function isPlayStationTitle(result: RawgSearchResult): boolean {
  return (result.platforms ?? []).some(p => p.platform?.name?.includes('PlayStation'));
}

export async function findGameInfo(gameName: string): Promise<GameInfoResult> {
  return findPsnGameInfo(gameName);
  // RAWG fallback disabled — see comment above. Re-enable with:
  // const psnResult = await findPsnGameInfo(gameName);
  // if (psnResult.ok) return psnResult;
  // return findRawgGameInfo(gameName);
}

// Kept intact but currently unused — disabled RAWG fallback, see comment above.
export async function findRawgGameInfo(gameName: string): Promise<GameInfoResult> {
  const name = gameName.trim();
  if (!name) return { ok: false, error: 'اسم اللعبة فارغ' };

  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) return { ok: false, error: 'ميزة جلب بيانات اللعبة غير مُفعّلة (RAWG_API_KEY غير مُعرَّف)' };

  // 1) بحث — نجيب أعلى 5 نتائج ونفضّل أي نتيجة مصنّفة فعلياً بمنصة PlayStation ضمنها (RAWG أحياناً
  // يرجّع نسخة PC مكررة كأول نتيجة بالصلة رغم وجود النسخة الرسمية متعددة المنصات بمرتبة أدنى —
  // تحقّق حي: بحث "God of War Ragnarok" رجّع نسخة PC-only كأول نتيجة، والنسخة PS4/PS5 الحقيقية ثانية).
  let searchJson: { results?: RawgSearchResult[] };
  try {
    const res = await fetch(
      `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(name)}&page_size=5`
    );
    if (res.status === 401) return { ok: false, error: 'مفتاح RAWG غير صالح' };
    if (res.status === 429) return { ok: false, error: 'تم تجاوز حد طلبات RAWG المسموح، حاول لاحقاً' };
    if (!res.ok) return { ok: false, error: 'تعذّر البحث بقاعدة بيانات RAWG' };
    searchJson = await res.json();
  } catch {
    return { ok: false, error: 'تعذّر الاتصال بـ RAWG' };
  }

  const results = searchJson.results ?? [];
  const best = results.find(isPlayStationTitle) ?? results[0];
  if (!best?.id) return { ok: false, error: 'لم يُعثر على لعبة مطابقة بقاعدة بيانات RAWG' };

  // 2) تفاصيل — نتيجة البحث لا تحوي description_raw إطلاقاً (تحقّق حي)، لازم استدعاء منفصل دائماً.
  let detail: RawgDetail = best;
  try {
    const res2 = await fetch(`https://api.rawg.io/api/games/${best.id}?key=${apiKey}`);
    if (res2.ok) detail = await res2.json();
  } catch {
    // نكمل ببيانات البحث فقط لو فشل استدعاء التفاصيل (بدون وصف/genres/released دقيقة)
  }

  let imageUrl: string | null = typeof detail.background_image === 'string' ? detail.background_image : null;
  if (imageUrl) {
    try {
      const host = new URL(imageUrl).hostname;
      if (!host.endsWith(RAWG_IMAGE_HOST_SUFFIX)) imageUrl = null;
    } catch {
      imageUrl = null;
    }
  }

  const englishDescription = typeof detail.description_raw === 'string' ? detail.description_raw.trim() : '';
  const genres = (detail.genres ?? []).map(g => g?.name).filter((n): n is string => typeof n === 'string');
  const released = typeof detail.released === 'string' ? detail.released : null;

  let description = '';
  if (englishDescription) {
    try {
      description = await rewriteGameDescriptionAr({
        gameName: detail.name ?? name,
        englishDescription: englishDescription.slice(0, 2000), // مقتطف مصدر يكفي لإعادة الصياغة
        genres,
      });
    } catch {
      description = ''; // فشل إعادة الصياغة لا يُسقط باقي البيانات (صورة/تاريخ لسا مفيدة)
    }
  }

  return { ok: true, data: { name: detail.name ?? name, description, imageUrl, released, genres } };
}
