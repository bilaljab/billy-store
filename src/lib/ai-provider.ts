// Thin transport layer for Google Gemini's function-calling REST API.
// No knowledge of admin routes, DB, or auth — see src/lib/assistant-tools.ts for the tool registry
// and src/app/api/admin/assistant/**/route.ts for how results get wired back into the DB.

// Pinned explicitly to gemini-3.1-flash-lite (not an alias like "-latest") — decision documented
// in full in CLAUDE.md, including the confirmed real quota (>=140 req/day, 15 req/min on this
// key) and why every other candidate (2.5 generation, 2.0 generation, 3.5/3.6, Groq) was ruled out.
const MODEL = 'gemini-3.1-flash-lite';

const SYSTEM_INSTRUCTION = `أنت مساعد إداري ذكي للوحة تحكم متجر Billy Store الإلكتروني (ألعاب PS4/PS5 واشتراكات PS Plus).
رد دائماً باللغة العربية فقط.
استخدم الأدوات (tools) المتاحة لك لتنفيذ طلبات الأدمن أو جلب بيانات حقيقية — لا تخترع أرقاماً أو بيانات من عندك.
لو طلب الأدمن غامضاً أو ناقص معلومة أساسية (مثل سعر منتج جديد بدون تحديد الاسم)، اسأل سؤالاً توضيحياً قصيراً كنص عادي بدل استدعاء أي أداة بمعطيات ناقصة أو مخمَّنة.`;

export interface AIFunctionCall {
  name: string;
  args: Record<string, unknown>;
  id?: string;
}

export interface AIPart {
  text?: string;
  functionCall?: AIFunctionCall;
  functionResponse?: { name: string; id?: string; response: Record<string, unknown> };
  // Newer "thinking" Gemini models require this to be echoed back verbatim alongside a
  // functionCall part in the next turn's history, or the API rejects the request.
  thoughtSignature?: string;
}

export interface AIMessage {
  role: 'user' | 'model';
  parts: AIPart[];
}

export interface AIResult {
  text: string | null;
  functionCall: AIFunctionCall | null;
  thoughtSignature: string | null;
}

export interface AIFunctionDeclaration {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export class AIApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIApiError';
  }
}

export async function callAI(history: AIMessage[], tools: AIFunctionDeclaration[]): Promise<AIResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new AIApiError('GEMINI_API_KEY غير مُعرَّف بمتغيرات البيئة');

  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: history,
          tools: tools.length > 0 ? [{ functionDeclarations: tools }] : undefined,
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        }),
      }
    );
  } catch {
    throw new AIApiError('تعذّر الاتصال بخدمة Gemini');
  }

  if (!res.ok) {
    throw new AIApiError(`Gemini API responded with ${res.status}`);
  }

  const data = await res.json();
  const candidate = data?.candidates?.[0];
  const parts: AIPart[] = candidate?.content?.parts ?? [];

  const functionCallPart = parts.find(p => p.functionCall);
  if (functionCallPart?.functionCall) {
    return {
      text: null,
      functionCall: functionCallPart.functionCall,
      thoughtSignature: functionCallPart.thoughtSignature ?? null,
    };
  }

  const text = parts.map(p => p.text ?? '').join('').trim();
  return { text: text || null, functionCall: null, thoughtSignature: null };
}

// One-shot plain-text rewrite call — deliberately separate from callAI's function-calling loop
// (no tools, no history, no thoughtSignature). Used by src/lib/game-info.ts to turn RAWG's raw
// English description into an Arabic description matching the catalog's editorial voice
// (see copywriting-audit.md), decoupled from the main assistant chat's system prompt/context so
// quality/length stay consistent regardless of how the admin phrased their request. Shares the
// same GEMINI_API_KEY quota as the main assistant chat (~140 req/day) — not a separate budget.
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
  const parts: AIPart[] = data?.candidates?.[0]?.content?.parts ?? [];
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
  const parts: AIPart[] = data?.candidates?.[0]?.content?.parts ?? [];
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
  const parts: AIPart[] = candidate?.content?.parts ?? [];
  const text = parts.map(p => p.text ?? '').join('');

  const match = text.match(/https?:\/\/\S+/);
  return match ? match[0].replace(/[.,)\]]+$/, '') : null;
}
