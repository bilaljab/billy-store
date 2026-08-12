import type { NextRequest } from 'next/server';
import { selfFetch } from './self-fetch';
import type { AIToolDeclaration } from './ai/types';
import { findGamePosterUrl } from './poster-search';
import { findGameInfo } from './game-info';

export type RiskTier = 'safe' | 'single-confirm' | 'double-confirm';

type Args = Record<string, unknown>;
type JsonSchema = Record<string, unknown>;

export interface AdminProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string | null;
  category: string;
  featured: number;
  release_date: string | null;
}

interface TargetedRule {
  id: number;
  type: 'product' | 'range';
  label: string;
  percentage: number;
  active: boolean;
  productIds: number[];
  minPrice: number | null;
  maxPrice: number | null;
}

export interface ToolDef {
  name: string;
  description: string;
  parameters: JsonSchema;
  riskTier: RiskTier;
  route: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  buildRequest: (args: Args, req: NextRequest) => Promise<{ path: string; body?: unknown }>;
  summarize: (args: Args, req: NextRequest) => Promise<string>;
  computeAffectedCount?: (args: Args, req: NextRequest) => Promise<number>;
  // Escape hatch for tools with no equivalent internal route to self-fetch (e.g. an external
  // web lookup) — when present, the executor calls this directly instead of buildRequest+selfFetch.
  execute?: (args: Args, req: NextRequest) => Promise<{ ok: boolean; status: number; data: unknown }>;
}

// Per-request memoization: a single double-confirm bulk-delete confirm already calls this three
// times (batch resolve → summarize → computeAffectedCount), each a full self-fetch HTTP
// round-trip. Keyed on the NextRequest object itself, so it's automatically scoped to one
// request and needs no eviction — confirm/route.ts runs on a distinct NextRequest, so its fresh
// computeAffectedCount() re-validation is genuinely fresh, not served from a stale cache.
const catalogCache = new WeakMap<NextRequest, Promise<AdminProduct[]>>();

// Exported for reuse by the fuzzy-match layer (src/lib/ai/fuzzy-match.ts) — the catalog fetched
// here for batch-name resolution must go through this same self-fetch path (inherits
// /api/admin/products' deleted_at IS NULL filter) rather than a new raw DB query.
export async function fetchAllProducts(req: NextRequest): Promise<AdminProduct[]> {
  const cached = catalogCache.get(req);
  if (cached) return cached;

  const promise = selfFetch('/api/admin/products', req).then(({ data }) => (Array.isArray(data) ? (data as AdminProduct[]) : []));
  catalogCache.set(req, promise);
  return promise;
}

async function fetchTargetedRules(req: NextRequest): Promise<TargetedRule[]> {
  const { data } = await selfFetch('/api/admin/discounts/targeted', req);
  return Array.isArray(data) ? (data as TargetedRule[]) : [];
}

const CATEGORY_LABEL: Record<string, string> = { games: 'الألعاب', subscription: 'الاشتراكات', all: 'كل الفئات' };

function clampPercentage(value: unknown): { clamped: number; note: string } {
  const raw = Number(value);
  const clamped = Math.min(90, Math.max(1, raw));
  const note = raw !== clamped ? ` (تم تعديله من ${raw}% ليطابق الحد المسموح 1-90%)` : '';
  return { clamped, note };
}

export const TOOLS: ToolDef[] = [
  // ── Safe / read-only — auto-executed, no confirmation ──
  {
    name: 'listProducts',
    description: 'يرجع كل المنتجات الحالية (غير المحذوفة) بالمتجر: الاسم، السعر، الفئة، حالة التميز.',
    parameters: { type: 'object', properties: {}, required: [] },
    riskTier: 'safe',
    route: '/api/admin/products',
    method: 'GET',
    buildRequest: async () => ({ path: '/api/admin/products' }),
    summarize: async () => '',
  },
  {
    name: 'getProduct',
    description: 'يرجع تفاصيل منتج واحد محدد عبر رقم المعرّف (id). يبحث ضمن كل المنتجات الحالية.',
    parameters: {
      type: 'object',
      properties: { id: { type: 'number', description: 'رقم معرّف المنتج' } },
      required: ['id'],
    },
    riskTier: 'safe',
    route: '/api/admin/products',
    method: 'GET',
    buildRequest: async () => ({ path: '/api/admin/products' }),
    summarize: async () => '',
  },
  {
    name: 'getStats',
    description: 'يرجع إحصائيات المتجر: عدد الزيارات الكلي واليومي، وأكثر المنتجات مشاهدة.',
    parameters: { type: 'object', properties: {}, required: [] },
    riskTier: 'safe',
    route: '/api/admin/stats',
    method: 'GET',
    buildRequest: async () => ({ path: '/api/admin/stats' }),
    summarize: async () => '',
  },
  {
    name: 'getGlobalDiscount',
    description: 'يرجع إعدادات الخصم العام الحالي (النسبة، العنوان، هل هو مفعّل).',
    parameters: { type: 'object', properties: {}, required: [] },
    riskTier: 'safe',
    route: '/api/admin/discounts/global',
    method: 'GET',
    buildRequest: async () => ({ path: '/api/admin/discounts/global' }),
    summarize: async () => '',
  },
  {
    name: 'getTargetedDiscounts',
    description: 'يرجع كل قواعد الخصم المستهدفة (لكل منتج أو نطاق سعر).',
    parameters: { type: 'object', properties: {}, required: [] },
    riskTier: 'safe',
    route: '/api/admin/discounts/targeted',
    method: 'GET',
    buildRequest: async () => ({ path: '/api/admin/discounts/targeted' }),
    summarize: async () => '',
  },
  {
    name: 'getAnnouncement',
    description: 'يرجع نص الإعلان الحالي أعلى الموقع (إن وُجد) وهل هو مفعّل.',
    parameters: { type: 'object', properties: {}, required: [] },
    riskTier: 'safe',
    route: '/api/admin/announcement',
    method: 'GET',
    buildRequest: async () => ({ path: '/api/admin/announcement' }),
    summarize: async () => '',
  },
  // ⚠️ DISABLED — filtered out of toAIDeclarations() below, Gemini never sees or calls this.
  // Fully implemented (including src/lib/poster-search.ts and ai-provider.ts's findWebUrl) but
  // kept unreachable: it depends on Gemini's Google Search grounding, which returns 429
  // RESOURCE_EXHAUSTED on this key even on a fresh/different model — almost certainly because
  // grounding requires a Google Cloud billing account linked (even for its nominally free quota).
  // The user explicitly declined to enable any billing, so this tool stays code-complete but
  // switched off rather than removed, in case that decision changes later.
  {
    name: 'findGamePoster',
    description: 'يبحث عن رابط صورة غلاف (بوستر) رسمية للعبة من متجر PlayStation الرسمي، لاستخدامها كصورة منتج. بحث أفضل جهد فقط — قد لا يجد صورة، أو قد تحتوي الصورة على شعار/تصنيف عمري لأنها مأخوذة كما هي من صفحة المنتج الرسمية بدون تعديل.',
    parameters: {
      type: 'object',
      properties: { gameName: { type: 'string', description: 'اسم اللعبة بالإنجليزي أو كما يُعرف رسمياً' } },
      required: ['gameName'],
    },
    riskTier: 'safe',
    route: '(external: store.playstation.com)',
    method: 'GET',
    buildRequest: async () => ({ path: '' }),
    summarize: async () => '',
    execute: async (args) => {
      const result = await findGamePosterUrl(String(args.gameName ?? ''));
      return result.ok
        ? { ok: true, status: 200, data: { imageUrl: result.imageUrl } }
        : { ok: false, status: 404, data: { error: result.error } };
    },
  },

  {
    name: 'findGameInfo',
    description:
      'يبحث عن بيانات لعبة حقيقية من متجر PlayStation الرسمي (اسم رسمي، وصف عربي رسمي مُكثَّف، رابط صورة غلاف حقيقي، ' +
      'تاريخ الإصدار، الأنواع) لاستخدامها عند إضافة منتج جديد عبر createProduct. استدعِ هذه الأداة دائماً وبشكل استباقي ' +
      'أول ما يطلب الأدمن إضافة لعبة بالاسم — حتى لو الاسم قصير أو اختصار أو مكتوب بالعربي (مثل "fc 27" أو "GTA 6" أو ' +
      '"جراند 6") — قبل createProduct، بدون انتظار طلب صريح من الأدمن للاسم/الوصف الرسمي. gameName هو استعلام بحث فقط ' +
      'ولا يُخزَّن بأي مكان — مرّر الاسم الرسمي الكامل بالإنجليزية بعد ما توسّعه بمعرفتك من أي اختصار أو ترجمة عربية ' +
      '(بدون لاحقة منصة أو إصدار). مرّر قيمة description المسترجعة كما هي لـcreateProduct دون إعادة صياغتها من جديد — ' +
      'هي جاهزة أصلاً. بحث أفضل جهد فقط، قد لا يجد نتيجة مطابقة — استخدم اسم الأدمن الحرفي حينها. لو الأدمن ذكر السعر ' +
      '(وبشكل اختياري الفئة/التميز) بنفس رسالته الأصلية، مرّرهم هنا أيضاً بـprice/category/featured فيصير ممكن إكمال ' +
      'الإضافة مباشرة بخطوة واحدة أسرع.',
    parameters: {
      type: 'object',
      properties: {
        gameName: { type: 'string', description: 'الاسم الرسمي الكامل بالإنجليزية بعد توسيع أي اختصار أو ترجمة أي اسم عربي — للبحث فقط، لا يُخزَّن' },
        price: { type: 'number', description: 'اختياري — سعر المنتج لو ذكره الأدمن بنفس الرسالة، يسرّع الإضافة' },
        category: { type: 'string', enum: ['games', 'subscription'], description: 'اختياري — افتراضياً games' },
        featured: { type: 'boolean', description: 'اختياري' },
      },
      required: ['gameName'],
    },
    riskTier: 'safe',
    route: '(external: store.playstation.com)',
    method: 'GET',
    buildRequest: async () => ({ path: '' }),
    summarize: async () => '',
    execute: async (args) => {
      const result = await findGameInfo(String(args.gameName ?? ''));
      return result.ok
        ? { ok: true, status: 200, data: result.data }
        : { ok: false, status: 404, data: { error: result.error } };
    },
  },

  // ── Single-confirm write tools ──
  {
    name: 'createProduct',
    description: 'يضيف منتجاً جديداً بالمتجر. الاسم والسعر مطلوبان. لإضافة لعبة، استدعِ findGameInfo أولاً واستباقياً (حتى باسم قصير/اختصار/عربي) واستخدم قيمه (name/description/image/release_date) حرفياً — لا تنتظر طلباً صريحاً. اسم المنتج المخزَّن (name) يأتي حصراً من findGameInfo، أو من نص الأدمن الحرفي (بما فيه اختصاره أو عربيته كما هي) لو فشلت الأداة أو ما لقت نتيجة — التوسيع/الترجمة مسموح فقط داخل استعلام findGameInfo، ممنوع تماماً بحقل name نفسه.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'number' },
        image: { type: 'string' },
        category: { type: 'string', enum: ['games', 'subscription'] },
        featured: { type: 'boolean' },
        release_date: { type: 'string' },
      },
      required: ['name', 'price'],
    },
    riskTier: 'single-confirm',
    route: '/api/admin/products',
    method: 'POST',
    buildRequest: async (args) => ({
      path: '/api/admin/products',
      body: {
        name: args.name,
        description: args.description ?? '',
        price: args.price,
        image: args.image ?? null,
        category: args.category ?? 'games',
        featured: !!args.featured,
        release_date: args.release_date ?? null,
      },
    }),
    summarize: async (args) => {
      const categoryLabel = CATEGORY_LABEL[String(args.category ?? 'games')] ?? String(args.category);
      const imageNote = args.image
        ? ' مع صورة غلاف (راجعها بالمعاينة أدناه، وبإمكانك استبدالها قبل التأكيد).'
        : ' بدون صورة — بإمكانك إرفاق واحدة قبل التأكيد.';
      return `سيتم إضافة منتج جديد باسم "${args.name}" بسعر ${args.price} ر.س ضمن فئة ${categoryLabel}.${imageNote}`;
    },
  },
  {
    name: 'updateProduct',
    description: 'يعدّل منتجاً موجوداً عبر رقم المعرّف (id). أرسل فقط الحقول المطلوب تغييرها. لو غيّرت الاسم (name)، استخدم بالضبط ما كتبه الأدمن — لا تؤلف اسماً رسمياً كاملاً من عندك.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        name: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'number' },
        image: { type: 'string' },
        category: { type: 'string', enum: ['games', 'subscription'] },
        featured: { type: 'boolean' },
        release_date: { type: 'string' },
      },
      required: ['id'],
    },
    riskTier: 'single-confirm',
    route: '/api/admin/products/[id]',
    method: 'PUT',
    buildRequest: async (args, req) => {
      const products = await fetchAllProducts(req);
      const current = products.find(p => p.id === Number(args.id));
      const body = {
        name: args.name ?? current?.name ?? '',
        description: args.description ?? current?.description ?? '',
        price: args.price ?? current?.price ?? 0,
        image: args.image ?? current?.image ?? null,
        category: args.category ?? current?.category ?? 'games',
        featured: args.featured !== undefined ? !!args.featured : !!current?.featured,
        release_date: args.release_date ?? current?.release_date ?? null,
      };
      return { path: `/api/admin/products/${args.id}`, body };
    },
    summarize: async (args, req) => {
      const products = await fetchAllProducts(req);
      const current = products.find(p => p.id === Number(args.id));
      if (!current) return `تحذير: لم يتم العثور على منتج برقم #${args.id}.`;
      const changes: string[] = [];
      if (args.name !== undefined && args.name !== current.name) changes.push(`الاسم: "${current.name}" ← "${args.name}"`);
      if (args.price !== undefined && Number(args.price) !== current.price) changes.push(`السعر: ${current.price} ← ${args.price}`);
      if (args.category !== undefined && args.category !== current.category) {
        changes.push(`الفئة: ${CATEGORY_LABEL[current.category] ?? current.category} ← ${CATEGORY_LABEL[String(args.category)] ?? args.category}`);
      }
      if (args.description !== undefined && args.description !== current.description) changes.push('الوصف سيتغيّر');
      if (args.featured !== undefined && !!args.featured !== !!current.featured) {
        changes.push(`التميز: ${current.featured ? 'مفعّل' : 'غير مفعّل'} ← ${args.featured ? 'مفعّل' : 'غير مفعّل'}`);
      }
      if (changes.length === 0) return `لن يتغيّر أي حقل فعلياً بالمنتج "${current.name}" (#${current.id}).`;
      return `سيتم تعديل المنتج "${current.name}" (#${current.id}):\n${changes.join('\n')}`;
    },
  },
  {
    name: 'deleteProduct',
    description: 'يحذف منتجاً واحداً نهائياً عبر رقم المعرّف (id). حذف فردي حقيقي، غير قابل للتراجع.',
    parameters: { type: 'object', properties: { id: { type: 'number' } }, required: ['id'] },
    riskTier: 'single-confirm',
    route: '/api/admin/products/[id]',
    method: 'DELETE',
    buildRequest: async (args) => ({ path: `/api/admin/products/${args.id}` }),
    summarize: async (args, req) => {
      const products = await fetchAllProducts(req);
      const current = products.find(p => p.id === Number(args.id));
      const label = current ? `"${current.name}" (#${current.id})` : `#${args.id}`;
      return `سيتم حذف المنتج ${label} نهائياً — هذا الإجراء لا يمكن التراجع عنه.`;
    },
  },
  {
    name: 'setGlobalDiscount',
    description: 'يفعّل أو يحدّث الخصم العام المطبَّق على كل المنتجات (ما لم تنطبق قاعدة خصم مستهدفة أعلى).',
    parameters: {
      type: 'object',
      properties: { percentage: { type: 'number' }, label: { type: 'string' }, active: { type: 'boolean' } },
      required: ['percentage'],
    },
    riskTier: 'single-confirm',
    route: '/api/admin/discounts/global',
    method: 'POST',
    buildRequest: async (args) => ({
      path: '/api/admin/discounts/global',
      body: { percentage: args.percentage, label: args.label ?? '', active: args.active ?? true },
    }),
    summarize: async (args) => {
      const { clamped, note } = clampPercentage(args.percentage);
      const labelPart = args.label ? ` بعنوان "${args.label}"` : '';
      return `سيتم تفعيل خصم عام بنسبة ${clamped}%${note}${labelPart} على كل المنتجات.`;
    },
  },
  {
    name: 'deleteGlobalDiscount',
    description: 'يلغي الخصم العام الحالي بالكامل.',
    parameters: { type: 'object', properties: {}, required: [] },
    riskTier: 'single-confirm',
    route: '/api/admin/discounts/global',
    method: 'DELETE',
    buildRequest: async () => ({ path: '/api/admin/discounts/global' }),
    summarize: async () => 'سيتم إلغاء الخصم العام الحالي بالكامل.',
  },
  {
    name: 'createTargetedDiscount',
    description: 'ينشئ قاعدة خصم مستهدفة جديدة: إما لمنتجات محددة (type=product مع productIds أو productNames) أو نطاق سعري (type=range مع minPrice/maxPrice). لو الأدمن سمّى المنتجات بالاسم (خصوصاً أكتر من عدد قليل)، استخدم productNames بالأسماء كما كُتبت حرفياً بدل ما تحاول تحل الأسماء لـproductIds بنفسك.',
    parameters: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['product', 'range'] },
        percentage: { type: 'number' },
        label: { type: 'string' },
        productIds: { type: 'array', items: { type: 'number' } },
        productNames: { type: 'array', items: { type: 'string' }, description: 'أسماء المنتجات كما كتبها الأدمن حرفياً — تُستخدم بدل productIds لو المنتجات ذُكرت بالاسم' },
        minPrice: { type: 'number' },
        maxPrice: { type: 'number' },
      },
      required: ['type', 'percentage'],
    },
    riskTier: 'single-confirm',
    route: '/api/admin/discounts/targeted',
    method: 'POST',
    buildRequest: async (args) => ({
      path: '/api/admin/discounts/targeted',
      body: {
        type: args.type,
        percentage: args.percentage,
        label: args.label ?? '',
        active: true,
        productIds: args.productIds ?? [],
        minPrice: args.minPrice ?? null,
        maxPrice: args.maxPrice ?? null,
      },
    }),
    summarize: async (args) => {
      const { clamped, note } = clampPercentage(args.percentage);
      if (args.type === 'range') {
        return `سيتم إنشاء خصم مستهدف بنسبة ${clamped}%${note} على المنتجات بين ${args.minPrice ?? 'أي سعر'} و${args.maxPrice ?? 'أي سعر'} ر.س.`;
      }
      const count = Array.isArray(args.productIds) ? args.productIds.length : 0;
      return `سيتم إنشاء خصم مستهدف بنسبة ${clamped}%${note} على ${count} منتج محدد.`;
    },
  },
  {
    name: 'updateTargetedDiscount',
    description: 'يعدّل قاعدة خصم مستهدفة موجودة عبر رقم المعرّف (id). لو الأدمن سمّى المنتجات بالاسم، استخدم productNames بدل ما تحاول تحل الأسماء لـproductIds بنفسك.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        type: { type: 'string', enum: ['product', 'range'] },
        percentage: { type: 'number' },
        label: { type: 'string' },
        productIds: { type: 'array', items: { type: 'number' } },
        productNames: { type: 'array', items: { type: 'string' }, description: 'أسماء المنتجات كما كتبها الأدمن حرفياً — تُستخدم بدل productIds لو المنتجات ذُكرت بالاسم' },
        minPrice: { type: 'number' },
        maxPrice: { type: 'number' },
      },
      required: ['id', 'type', 'percentage'],
    },
    riskTier: 'single-confirm',
    route: '/api/admin/discounts/targeted',
    method: 'PUT',
    buildRequest: async (args) => ({
      path: '/api/admin/discounts/targeted',
      body: {
        id: args.id,
        type: args.type,
        percentage: args.percentage,
        label: args.label ?? '',
        active: true,
        productIds: args.productIds ?? [],
        minPrice: args.minPrice ?? null,
        maxPrice: args.maxPrice ?? null,
      },
    }),
    summarize: async (args, req) => {
      const rules = await fetchTargetedRules(req);
      const exists = rules.some(r => r.id === Number(args.id));
      const { clamped, note } = clampPercentage(args.percentage);
      const warning = exists ? '' : ` تحذير: لم يُعثر على قاعدة برقم #${args.id} حالياً — قد لا ينتج عن هذا أي تغيير فعلي.`;
      return `سيتم تعديل قاعدة الخصم المستهدف #${args.id} لتصبح ${clamped}%${note}.${warning}`;
    },
  },
  {
    name: 'deleteTargetedDiscount',
    description: 'يحذف قاعدة خصم مستهدفة عبر رقم المعرّف (id).',
    parameters: { type: 'object', properties: { id: { type: 'number' } }, required: ['id'] },
    riskTier: 'single-confirm',
    route: '/api/admin/discounts/targeted',
    method: 'DELETE',
    buildRequest: async (args) => ({ path: '/api/admin/discounts/targeted', body: { id: args.id } }),
    summarize: async (args, req) => {
      const rules = await fetchTargetedRules(req);
      const rule = rules.find(r => r.id === Number(args.id));
      const label = rule ? `"${rule.label || rule.id}"` : `#${args.id}`;
      return `سيتم حذف قاعدة الخصم المستهدف ${label}.`;
    },
  },
  {
    name: 'setAnnouncement',
    description: 'ينشر أو يحدّث نص الإعلان الظاهر أعلى الموقع لكل الزوار.',
    parameters: {
      type: 'object',
      properties: { text: { type: 'string' }, active: { type: 'boolean' } },
      required: ['text'],
    },
    riskTier: 'single-confirm',
    route: '/api/admin/announcement',
    method: 'POST',
    buildRequest: async (args) => ({
      path: '/api/admin/announcement',
      body: { text: args.text, active: args.active ?? true },
    }),
    summarize: async (args) => `سيتم نشر الإعلان التالي لكل زوار الموقع: "${args.text}"`,
  },
  {
    name: 'deleteAnnouncement',
    description: 'يحذف الإعلان الحالي أعلى الموقع.',
    parameters: { type: 'object', properties: {}, required: [] },
    riskTier: 'single-confirm',
    route: '/api/admin/announcement',
    method: 'DELETE',
    buildRequest: async () => ({ path: '/api/admin/announcement' }),
    summarize: async () => 'سيتم حذف الإعلان الحالي من الموقع.',
  },

  // ── Double-confirm write tools (two real steps required by the UI) ──
  {
    name: 'bulkDeleteProducts',
    description: 'ينقل مجموعة منتجات (بالمعرّفات أو الأسماء) لسلة المحذوفات دفعة واحدة. قابلة للاسترجاع خلال 7 أيام من قسم المحذوفات بلوحة التحكم. لو الأدمن سمّى المنتجات بالاسم، استخدم itemNames بدل ما تحاول تحل الأسماء لـids بنفسك.',
    parameters: {
      type: 'object',
      properties: {
        ids: { type: 'array', items: { type: 'number' } },
        itemNames: { type: 'array', items: { type: 'string' }, description: 'أسماء المنتجات كما كتبها الأدمن حرفياً — تُستخدم بدل ids لو المنتجات ذُكرت بالاسم' },
      },
      required: [],
    },
    riskTier: 'double-confirm',
    route: '/api/admin/products/bulk-delete',
    method: 'POST',
    buildRequest: async (args) => ({ path: '/api/admin/products/bulk-delete', body: { ids: args.ids } }),
    summarize: async (args, req) => {
      const ids = Array.isArray(args.ids) ? (args.ids as number[]) : [];
      const products = await fetchAllProducts(req);
      const matched = products.filter(p => ids.includes(p.id));
      const names = matched.map(p => p.name).join('، ') || '(لا توجد منتجات مطابقة حالياً)';
      return `سيتم نقل ${matched.length} منتج لسلة المحذوفات (قابلة للاسترجاع خلال 7 أيام): ${names}`;
    },
    computeAffectedCount: async (args, req) => {
      const ids = Array.isArray(args.ids) ? (args.ids as number[]) : [];
      const products = await fetchAllProducts(req);
      return products.filter(p => ids.includes(p.id)).length;
    },
  },
  {
    name: 'bulkUpdatePrices',
    description: 'يعدّل أسعار كل المنتجات ضمن فئة معينة (أو الكل) بنسبة مئوية أو قيمة ثابتة، زيادة أو نقصان.',
    parameters: {
      type: 'object',
      properties: {
        mode: { type: 'string', enum: ['percentage', 'fixed'] },
        value: { type: 'number' },
        direction: { type: 'string', enum: ['increase', 'decrease'] },
        category: { type: 'string', enum: ['all', 'games', 'subscription'] },
      },
      required: ['mode', 'value', 'direction', 'category'],
    },
    riskTier: 'double-confirm',
    route: '/api/admin/products/bulk-price',
    method: 'POST',
    buildRequest: async (args) => ({
      path: '/api/admin/products/bulk-price',
      body: { mode: args.mode, value: args.value, direction: args.direction, category: args.category },
    }),
    summarize: async (args, req) => {
      const count = await countAffectedByCategory(args.category, req);
      const categoryLabel = CATEGORY_LABEL[String(args.category)] ?? String(args.category);
      const directionLabel = args.direction === 'increase' ? 'زيادة' : 'نقصان';
      const valueLabel = args.mode === 'percentage' ? `${args.value}%` : `${args.value} ر.س`;
      return `سيتم ${directionLabel} أسعار ${count} منتج ضمن ${categoryLabel} بمقدار ${valueLabel}. ملاحظة: السعر الناتج يُقرَّب لأقرب عدد صحيح بحد أدنى 1 ر.س (أي كسور عشرية موجودة تُمحى).`;
    },
    computeAffectedCount: async (args, req) => countAffectedByCategory(args.category, req),
  },
  {
    name: 'importProducts',
    description: 'يستورد دفعة منتجات جديدة دفعة واحدة (حتى 500 منتج). أي عنصر ببيانات غير صالحة يُستبعد دون إيقاف بقية العملية.',
    parameters: {
      type: 'object',
      properties: { products: { type: 'array', items: { type: 'object' } } },
      required: ['products'],
    },
    riskTier: 'double-confirm',
    route: '/api/admin/import',
    method: 'POST',
    buildRequest: async (args) => ({ path: '/api/admin/import', body: { products: args.products } }),
    summarize: async (args) => {
      const count = Array.isArray(args.products) ? args.products.length : 0;
      return `سيتم استيراد حتى ${count} منتج، وأي عنصر ببيانات غير صالحة سيُستبعد دون إيقاف بقية العملية.`;
    },
    computeAffectedCount: async (args) => (Array.isArray(args.products) ? args.products.length : 0),
  },
];

async function countAffectedByCategory(category: unknown, req: NextRequest): Promise<number> {
  const products = await fetchAllProducts(req);
  if (category === 'all') return products.length;
  return products.filter(p => p.category === category).length;
}

// Tools present in TOOLS but never advertised to Gemini — kept implemented, deliberately
// unreachable. See the "DISABLED" comment on each entry above for the specific reason.
const DISABLED_TOOLS = new Set(['findGamePoster']);

export function getTool(name: string): ToolDef | undefined {
  if (DISABLED_TOOLS.has(name)) return undefined;
  return TOOLS.find(t => t.name === name);
}

// Batchable tools accept a companion productNames/itemNames text list (resolved server-side via
// fuzzy matching + per-batch LLM verification, see src/lib/ai/batch.ts) alongside their normal
// id-based argument, for admin requests that name items by text rather than numeric id. Maps
// each tool name to which id-based argument the resolved ids get written into. Deliberately
// scoped to these three only: bulkUpdatePrices is category-scoped (no name list makes sense),
// importProducts takes full new-row payloads (not references to existing products).
export const BATCHABLE_TOOLS = new Map<string, 'productIds' | 'ids'>([
  ['createTargetedDiscount', 'productIds'],
  ['updateTargetedDiscount', 'productIds'],
  ['bulkDeleteProducts', 'ids'],
]);

// TOOLS is a static const, so this is safe to compute once and reuse — chat/route.ts's hop loop
// otherwise rebuilds this (14 tool schemas with long Arabic descriptions, re-serialized into
// every request body) on every single hop of every request.
let cachedDeclarations: AIToolDeclaration[] | null = null;

export function toAIDeclarations(): AIToolDeclaration[] {
  if (!cachedDeclarations) {
    cachedDeclarations = TOOLS
      .filter(t => !DISABLED_TOOLS.has(t.name))
      .map(({ name, description, parameters }) => ({ name, description, parameters }));
  }
  return cachedDeclarations;
}
