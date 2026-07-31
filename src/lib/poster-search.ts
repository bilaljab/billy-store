import { findWebUrl } from './ai-provider';

// Best-effort automatic poster lookup for the AI assistant's createProduct tool. Not a guarantee
// of a "clean" image (no logo/age-rating badge) — that would require a second vision-model pass
// per candidate image, deliberately not built per explicit product decision (see CLAUDE.md).
// This only extracts whatever PlayStation Store's own schema.org Product structured data exposes.

interface PosterResult {
  ok: boolean;
  imageUrl?: string;
  error?: string;
}

const PS_STORE_HOST_SUFFIX = '.playstation.com';

export async function findGamePosterUrl(gameName: string): Promise<PosterResult> {
  const name = gameName.trim();
  if (!name) return { ok: false, error: 'اسم اللعبة فارغ' };

  let pageUrl: string | null;
  try {
    pageUrl = await findWebUrl(
      `Find the exact official PlayStation Store product page URL (must start with https://store.playstation.com) for the PS4/PS5 game: "${name}". Reply with ONLY the URL, nothing else.`
    );
  } catch {
    return { ok: false, error: 'تعذّر البحث عن صفحة المنتج بمتجر PlayStation' };
  }

  if (!pageUrl || !pageUrl.startsWith('https://store.playstation.com')) {
    return { ok: false, error: 'لم يُعثر على صفحة منتج مطابقة بمتجر PlayStation' };
  }

  let html: string;
  try {
    const res = await fetch(pageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (!res.ok) return { ok: false, error: 'تعذّر فتح صفحة المنتج' };
    html = await res.text();
  } catch {
    return { ok: false, error: 'تعذّر الاتصال بمتجر PlayStation' };
  }

  const jsonLdMatch = html.match(/<script id="mfe-jsonld-tags"[^>]*>([\s\S]*?)<\/script>/);
  if (!jsonLdMatch) return { ok: false, error: 'لم يُعثر على بيانات المنتج بالصفحة' };

  let imageUrl: unknown;
  try {
    const parsed = JSON.parse(jsonLdMatch[1]);
    imageUrl = parsed?.image;
  } catch {
    return { ok: false, error: 'تعذّر قراءة بيانات المنتج بالصفحة' };
  }

  if (typeof imageUrl !== 'string' || !imageUrl.startsWith('https://')) {
    return { ok: false, error: 'لم يُعثر على صورة صالحة بالصفحة' };
  }

  try {
    const host = new URL(imageUrl).hostname;
    if (!host.endsWith(PS_STORE_HOST_SUFFIX)) {
      return { ok: false, error: 'مصدر الصورة غير موثوق (ليس من متجر PlayStation)' };
    }
  } catch {
    return { ok: false, error: 'رابط الصورة غير صالح' };
  }

  return { ok: true, imageUrl };
}
