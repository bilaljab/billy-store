# CLAUDE.md

هذا الملف يوثّق بنية مشروع Billy Store لمساعدة أي جلسة Claude Code مستقبلية على فهم المشروع بسرعة دون الحاجة لإعادة الاستكشاف.

## نظرة عامة

متجر إلكتروني (storefront) لألعاب PS4/PS5 واشتراكات PS Plus، موجّه للسوق السعودي. واجهة عربية RTL بالكامل، مع لوحة تحكم إدارية (admin dashboard) لإدارة المنتجات والخصومات والإعلانات.

## Tech Stack

| الطبقة | التقنية |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 |
| اللغة | TypeScript (strict mode) |
| قاعدة البيانات | SQLite عبر Turso (`@libsql/client`) — محلياً ملف `data/billy.db`، وفي الإنتاج عبر Turso cloud (`TURSO_URL` / `TURSO_AUTH_TOKEN`) |
| Auth | JWT مخصص (`jose`) في cookie httpOnly باسم `admin_token` + `bcryptjs` لتشفير كلمة مرور الأدمن. لا يوجد نظام مستخدمين عاديين — أدمن واحد فقط (seed تلقائي من `ADMIN_PASSWORD`) |
| Styling | TailwindCSS 3 (`tailwind.config.js`) + CSS مخصص في `globals.css` (خط Cairo، ألوان PlayStation، أنيميشنز) |
| رفع الصور | Cloudinary (unsigned upload preset) — وليس تخزين محلي |
| State management | لا يوجد state management library — كله `useState`/`useEffect` محلي داخل الصفحات (`'use client'`) |
| Linting | ESLint (`eslint.config.mjs`، flat config) + `eslint-config-next` |
| Deployment | Vercel (موصى به في DEPLOYMENT.md)، مع Turso كبديل serverless-friendly عن SQLite المحلي |

## بنية المجلدات

```
src/
  app/                    # Next.js App Router
    page.tsx              # الصفحة الرئيسية
    products/              # صفحة المنتجات + [id] لصفحة تفاصيل المنتج
    about/, faq/            # صفحات ثابتة
    admin/
      login/               # صفحة تسجيل دخول الأدمن
      dashboard/           # لوحة التحكم (ملف ضخم ~1270 سطر، كل الإدارة فيه)
    api/                   # Route handlers (route.ts)
      products/, products/[id]/
      discounts/            # GET عام: {global, targeted} معاً
      admin/
        products/, announcement/, export/, import/, stats/
        discounts/
          global/           # CRUD للخصم العام الوحيد (كان اسمها /api/admin/discount)
          targeted/          # CRUD لقواعد الخصومات المستهدفة (لكل منتج/نطاق سعر)
      auth/login/, auth/logout/
      upload/               # رفع صور عبر Cloudinary
      views/, visit/         # تتبع المشاهدات والزيارات
    globals.css
  middleware.ts             # حماية /admin/dashboard + أمان الهيدرز + إعادة توجيه favicon
  components/
    layout/                 # Navbar, Footer
    ui/                     # مكونات عامة (ProductCard, FaqAccordion, ScrollReveal...)
    admin/                  # مكونات خاصة بلوحة التحكم
  lib/
    db.ts                   # اتصال قاعدة البيانات + initDb() + serialization
    auth.ts                 # JWT sign/verify + auth helpers
    xlsxParser.ts            # بارسر لملفات Excel/CSV للاستيراد الجماعي
data/billy.db               # قاعدة بيانات SQLite المحلية (gitignored)
scripts/init-db.js          # سكربت تهيئة قاعدة بيانات مستقل
```

### Conventions ملحوظة
- كل API route هو `route.ts` بأسلوب Next.js App Router (`export async function GET/POST/...`).
- التحقق من صلاحية الأدمن في الـ API routes يتم عبر `isAuthenticated(req)` من `lib/auth.ts`، وعلى مستوى الصفحات عبر `middleware.ts`.
- كل استعلامات SQL تستخدم parameterized queries (`db.execute({ sql, args })`) — لا تكتب string interpolation مباشر في SQL.
- الألوان والخطوط معرّفة مركزياً في `tailwind.config.js` (لون أساسي `#0070CC`، خلفية داكنة `#050A14`، خط Cairo، animations).
- الصفحات تستخدم `'use client'` بكثرة مع state محلي — لا يوجد server components pattern منظم أو data-fetching library.
- تسمية مسارات الخصومات: `/api/admin/discounts/global` (الخصم العام، واحد بس) مقابل `/api/admin/discounts/targeted` (قواعد متعددة لكل منتج/نطاق سعر). المسار العام `/api/discounts` بيرجّع الاثنين مع بعض بـ response واحد.

## أوامر التشغيل

```bash
npm install       # تثبيت الحزم
npm run dev       # تشغيل بيئة التطوير (localhost:3000)
npm run build     # بناء الإنتاج
npm run start     # تشغيل نسخة الإنتاج بعد البناء
npm run lint      # next lint (ESLint)
```

**لا يوجد test suite** — لا سكربت `test` في package.json ولا ملفات `*.test.*` / `*.spec.*` في المشروع. أي تحقق من صحة الكود حالياً يعتمد على `lint` والاختبار اليدوي فقط. قرار مقصود (تم تأجيله) — إضافة إطار اختبار (Jest/Vitest/Playwright) تستاهل نقاش منفصل، مش جزء من تنظيف سريع.

## متغيرات البيئة

موجودة في `.env` و`.env.local` محلياً (مستثناة من git عبر `.gitignore`). **`.env.example`** بجذر المشروع بيوثّق كل المتغيرات المطلوبة بدون قيم حقيقية — انسخه لـ `.env.local` وعبّي القيم عند إعداد بيئة جديدة.

| المتغير | مطلوب | الوصف |
|---|---|---|
| `JWT_SECRET` | ✅ دائماً | لازم 32+ حرف، وإلا `lib/auth.ts` يرمي خطأ عند الإقلاع |
| `ADMIN_PASSWORD` | ✅ دائماً | يُستخدم لعمل seed لحساب الأدمن الأول فقط عند عدم وجوده بقاعدة البيانات |
| `TURSO_URL` / `TURSO_AUTH_TOKEN` | اختياري محلياً، مطلوب بالإنتاج (Vercel) | لو فاضية بيستخدم SQLite محلي في `data/billy.db` تلقائياً |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_UPLOAD_PRESET` | ✅ لميزة رفع الصور | بدونها `/api/upload` يرجع 500 |

## ملاحظات وأشياء تحتاج انتباه (Gotchas)

1. **أسرار حقيقية داخل `.env`/`.env.local` المحليين** (JWT secret فعلي، كلمة سر أدمن فعلية، Turso auth token فعلي). مش مشكلة أمنية بحد ذاتها لأنهم مستثنون من git، بس انتبه ما تطبعهم أو تشاركهم بأي output خارجي.
2. **`data/billy.db`** هي قاعدة بيانات SQLite حقيقية فيها بيانات — موجودة محلياً وليست فارغة. لا تحذفها أو تعيد تهيئتها بدون التأكد إذا فيها بيانات مهمة (SECURITY.md بيذكر حذفها فقط عند تغيير `ADMIN_PASSWORD` بالإنتاج عشان تعيد الـ seed).
3. **`eslint.config.mjs`**: قاعدتي `@typescript-eslint/no-explicit-any` و`@typescript-eslint/no-require-imports` مخفّضتين لـ `warn` (بدل `error` الافتراضي)، لأنه `next build` بيفشل على أي ESLint error. السبب: فيه استخدامات `any` متبقية بعدة ملفات (`dashboard/page.tsx`, `page.tsx`, `products/page.tsx`, `export/route.ts`) وworkaround مقصود بـ `src/lib/db.ts` (`require('fs')`/`require('path')` ديناميكي لمنع الـ bundler من تضمينهم بالإنتاج) — لسا ما انصلحوا بعد، تأجيل مقصود. لو حدا قرر يصلحهم مستقبلاً، ينفع يرجّع القاعدتين لـ `error`.
4. **`no-img-element`** (تحذير ESLint) موجود بـ 3 أماكن (`dashboard/page.tsx`, `Footer.tsx`, `Navbar.tsx`) — استخدام `<img>` عادي بدل `next/image`. مش مصلّح، خارج نطاق التنظيف الحالي.
5. **`npm audit`** بيطلع تحذيرات أمان high-severity متعلقة بنسخة `next` (15.5.12) المثبتة فعلياً وبعض الحزم المرتبطة (`postcss`, `sharp`, `picomatch`, `ws`) — موجودة أصلاً بالمشروع قبل أي تعديل بجلسة التنظيف هاي، مش ناتجة عنها. تحديث `next`/الحزم قرار منفصل يستاهل تخطيط خاص (احتمال breaking changes)، لسا ما اتخذ.
6. لوحظ إنه Next.js المثبت فعلياً هو `15.5.12` رغم إنه `package.json` بيحدد `"next": "^15.2.4"` — طبيعي (semver range)، بس خليها ببالك إذا حبيت تثبّت نسخة محددة.
