// Thin transport layer for Google Gemini's plain-text completion REST API.
// Scope note (2026-08-09 provider migration): the admin assistant's chat/function-calling
// entry point (formerly callAI here) moved to src/lib/ai/ (NVIDIA NIM primary, Groq fallback —
// see src/lib/ai/index.ts). This file now only holds the three one-shot text-completion helpers
// that stayed on Gemini by explicit decision (out of scope for that migration): they're simple
// prompt-in/text-out calls unrelated to the admin chat loop's tool-calling reliability problem
// the migration was solving. AIApiError stays the error type these three functions throw.

// Pinned explicitly to gemini-3.1-flash-lite (not an alias like "-latest") — decision documented
// in full in CLAUDE.md, including the confirmed real quota (>=140 req/day, 15 req/min on this
// key) and why every other candidate (2.5 generation, 2.0 generation, 3.5/3.6, Groq) was ruled out.
const MODEL = 'gemini-3.1-flash-lite';

interface AITextPart {
  text?: string;
}

export class AIApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIApiError';
  }
}

// One-shot plain-text rewrite call — deliberately separate from any function-calling loop
// (no tools, no history). Used by src/lib/game-info.ts to turn RAWG's raw English description
// into an Arabic description matching the catalog's editorial voice (see copywriting-audit.md),
// decoupled from the main assistant chat's system prompt/context so quality/length stay
// consistent regardless of how the admin phrased their request. Shares the same GEMINI_API_KEY
// quota as any other Gemini call in this file (~140 req/day) — not a separate budget.
export async function rewriteGameDescriptionAr(input: {
  gameName: string;
  englishDescription: string;
  genres: string[];
}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new AIApiError('GEMINI_API_KEY غير مُعرَّف بمتغيرات البيئة');

  const prompt =
    `أنت كاتب محتوى تسويقي لمتجر ألعاب PS4/PS5 سعودي. لديك وصف إنجليزي خام للعبة "${input.gameName}"` +
    ` (الأنواع: ${input.genres.join('، ') || 'غير محددة'}):\n"""\n${input.englishDescription}\n"""\n` +
    `اكتب وصفاً عربياً فصيحاً أدبياً أصلياً (وليس ترجمة حرفية) بطول 200-300 حرف تقريباً، يذكر شخصيات أو أماكن أو` +
    ` آليات لعب فعلية مذكورة بالنص أعلاه إن وُجدت. بدون مقدمة أو خاتمة أو علامات اقتباس — فقط نص الوصف نفسه.`;

  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] }),
      }
    );
  } catch {
    throw new AIApiError('تعذّر الاتصال بخدمة Gemini لإعادة صياغة الوصف');
  }
  if (!res.ok) throw new AIApiError(`Gemini API responded with ${res.status}`);

  const data = await res.json();
  const parts: AITextPart[] = data?.candidates?.[0]?.content?.parts ?? [];
  return parts.map(p => p.text ?? '').join('').trim();
}

// Same one-shot pattern as rewriteGameDescriptionAr, but for src/lib/psn-store.ts: PSN's
// long_desc is already official Arabic (Sony's own Saudi-storefront copy), not English needing
// translation — it just needs condensing, since raw long_desc mixes the actual game synopsis
// with HTML markup, DLC/bonus-content bullet lists, system-compatibility notices, and ToS/health
// -warning legal boilerplate. Caller strips HTML tags before calling this; Gemini's job is only
// to extract/condense the narrative portion, not rewrite or translate it.
export async function cleanPsnDescriptionAr(gameName: string, rawArabicText: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new AIApiError('GEMINI_API_KEY غير مُعرَّف بمتغيرات البيئة');

  const prompt =
    `فيما يلي نص وصف رسمي من متجر PlayStation للعبة "${gameName}"، يحتوي على القصة الفعلية ممزوجة` +
    ` بمتطلبات النظام ومحتوى إضافي (DLC) وشروط استخدام وتحذيرات قانونية:\n"""\n${rawArabicText}\n"""\n` +
    `استخرج فقط الفقرة السردية اللي تتكلم عن قصة/أحداث/آليات اللعبة، وأعد صياغتها كوصف تسويقي عربي فصيح` +
    ` بطول 200-300 حرف تقريباً. تجاهل تماماً: متطلبات النظام، قوائم المحتوى الإضافي، أوضاع اللعب` +
    ` (فردي/جماعي)، وأي نص قانوني أو شروط استخدام أو تحذيرات صحية. بدون مقدمة أو خاتمة أو علامات اقتباس —` +
    ` فقط نص الوصف نفسه.`;

  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] }),
      }
    );
  } catch {
    throw new AIApiError('تعذّر الاتصال بخدمة Gemini لتنظيف الوصف');
  }
  if (!res.ok) throw new AIApiError(`Gemini API responded with ${res.status}`);

  const data = await res.json();
  const parts: AITextPart[] = data?.candidates?.[0]?.content?.parts ?? [];
  return parts.map(p => p.text ?? '').join('').trim();
}

// ⚠️ BUILT BUT NOT WIRED UP — Gemini's Google Search grounding tool consistently returns 429
// RESOURCE_EXHAUSTED on this key, reproduced identically across two different models
// (gemini-3.1-flash-lite and gemini-3.6-flash), while plain generateContent and normal function
// calling work fine on the same key at the same time. This strongly indicates grounding requires
// a billing account linked to the Google Cloud project to unlock its quota (even the nominally
// "free" tier of it) — a documented pattern for this feature, not a bug in this code. The user
// explicitly declined to enable any billing, so this function and its only caller
// (src/lib/poster-search.ts) are kept in the codebase, fully implemented, but never invoked from
// the actual assistant tool list — see the "DISABLED" note on findGamePoster in assistant-tools.ts.
export async function findWebUrl(query: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new AIApiError('GEMINI_API_KEY غير مُعرَّف بمتغيرات البيئة');

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: query }] }],
        tools: [{ google_search: {} }],
      }),
    }
  );

  if (!res.ok) {
    throw new AIApiError(`Gemini search grounding responded with ${res.status}`);
  }

  const data = await res.json();
  const candidate = data?.candidates?.[0];
  const parts: AITextPart[] = candidate?.content?.parts ?? [];
  const text = parts.map(p => p.text ?? '').join('');

  const match = text.match(/https?:\/\/\S+/);
  return match ? match[0].replace(/[.,)\]]+$/, '') : null;
}
