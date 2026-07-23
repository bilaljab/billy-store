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
| Styling | TailwindCSS 3 + CSS مخصص في `globals.css` (خط Cairo، ألوان PlayStation، أنيميشنز) |
| رفع الصور | Cloudinary (unsigned upload preset) — وليس تخزين محلي |
| State management | لا يوجد state management library — كله `useState`/`useEffect` محلي داخل الصفحات (`'use client'`) |
| Deployment | Vercel (موصى به في DEPLOYMENT.md)، مع Turso كبديل serverless-friendly عن SQLite المحلي |

**ملاحظة مهمة:** يوجد مجلد `prisma/` بملف `schema.prisma` و`seed.js`، لكن Prisma **غير مستخدم فعلياً** — لا يوجد `prisma` أو `@prisma/client` ضمن dependencies في package.json. طبقة الوصول لقاعدة البيانات الحقيقية هي `src/lib/db.ts` باستخدام `@libsql/client` مباشرة بـ raw SQL. اعتبر مجلد `prisma/` كـ legacy/متروك ولا تعتمد عليه لفهم الـ schema — الـ schema الحقيقي معرّف داخل `initDb()` في `src/lib/db.ts`.

## بنية المجلدات

```
src/
  app/                    # Next.js App Router
    page.tsx              # الصفحة الرئيسية
    products/              # صفحة المنتجات + [id] لصفحة تفاصيل المنتج
    about/, faq/            # صفحات ثابتة
    admin/
      login/               # صفحة تسجيل دخول الأدمن
      dashboard/           # لوحة التحكم (ملف ضخم ~1277 سطر، كل الإدارة فيه)
    api/                   # Route handlers (route.ts)
      products/, products/[id]/
      discount/, discounts/        # ⚠️ مسارين منفصلين، راجع "ملاحظات" بالأسفل
      admin/
        products/, discount/, discounts/, announcement/, export/, import/, stats/
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
prisma/                     # ⚠️ غير مستخدم، legacy فقط
```

### Conventions ملحوظة
- كل API route هو `route.ts` بأسلوب Next.js App Router (`export async function GET/POST/...`).
- التحقق من صلاحية الأدمن في الـ API routes يتم عبر `isAuthenticated(req)` من `lib/auth.ts`، وعلى مستوى الصفحات عبر `middleware.ts`.
- كل استعلامات SQL تستخدم parameterized queries (`db.execute({ sql, args })`) — لا تكتب string interpolation مباشر في SQL.
- الألوان والخطوط معرّفة مركزياً في `tailwind.config.ts` (لون أساسي `#0070CC`، خلفية داكنة `#050A14`، خط Cairo).
- الصفحات تستخدم `'use client'` بكثرة مع state محلي — لا يوجد server components pattern منظم أو data-fetching library.

## أوامر التشغيل

```bash
npm install       # تثبيت الحزم
npm run dev       # تشغيل بيئة التطوير (localhost:3000)
npm run build     # بناء الإنتاج
npm run start     # تشغيل نسخة الإنتاج بعد البناء
npm run lint      # next lint
```

**لا يوجد test suite** — لا سكربت `test` في package.json ولا ملفات `*.test.*` / `*.spec.*` في المشروع. أي تحقق من صحة الكود حالياً يعتمد على `lint` والاختبار اليدوي فقط.

## متغيرات البيئة

موجودة في `.env` و`.env.local` محلياً (مستثناة من git عبر `.gitignore` — تم التأكد أنهما غير متتبّعين). **لا يوجد ملف `.env.example`** يوثّق المتغيرات المطلوبة رسمياً؛ القائمة أدناه مجمّعة من `SECURITY.md` + `DEPLOYMENT.md` + الكود الفعلي:

| المتغير | مطلوب | الوصف |
|---|---|---|
| `JWT_SECRET` | ✅ دائماً | لازم 32+ حرف، وإلا `lib/auth.ts` يرمي خطأ عند الإقلاع |
| `ADMIN_PASSWORD` | ✅ دائماً | يُستخدم لعمل seed لحساب الأدمن الأول فقط عند عدم وجوده بقاعدة البيانات |
| `NODE_ENV` | يضبطها Next.js تلقائياً عادة | `.env` المحلي يضبطها `production` بشكل غير معتاد لبيئة محلية |
| `TURSO_URL` / `TURSO_AUTH_TOKEN` | اختياري محلياً، مطلوب بالإنتاج (Vercel) | لو فاضية بيستخدم SQLite محلي في `data/billy.db` تلقائياً |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_UPLOAD_PRESET` | ✅ لميزة رفع الصور | بدونها `/api/upload` يرجع 500 |

## ملاحظات وأشياء تحتاج انتباه (Gotchas)

1. **مجلدات زائدة/تالفة بجذر المشروع**: `{app`, `{public`, `{src`, وداخل `src/app/api/` مجلدات باسم حرفي `{products,auth`، `{products,auth/login,admin` إلخ. هذه واضح أنها ناتجة عن brace-expansion فاشل لأمر `mkdir` (مثلاً `mkdir {app,public,src}` نُفذ بشكل خاطئ فأنشأ مجلدات بأسماء حرفية بدل التوسّع). المجلدات هذه **فارغة أو غير مستخدمة فعلياً** من التطبيق (الكود الحقيقي بـ `src/app`, `public/`, إلخ العادية). ما لمستهم، بس لازم تنتبه إلها كـ "زبالة" محتملة يجب تنظيفها — ما بيندرج تحتها كود فعّال.
2. **ملفات config مكررة/متضاربة**:
   - `tailwind.config.js` و`tailwind.config.ts` — النسخة `.js` أقدم وناقصة (بدون `animation`/`keyframes`)، والنسخة `.ts` أحدث وكاملة. Tailwind بيقرأ وحدة منهم بس (بالأولوية العادية `.js` قبل `.ts`)، فمن المحتمل يكون فيه سلوك غير متوقع لو حدا عدّل بواحد وتوقع التغيير ينعكس.
   - `postcss.config.js` و`postcss.config.mjs` — نفس المحتوى فعلياً (تكرار بدون فايدة).
   → ينصح بحذف نسخة واحدة من كل زوج بعد التأكد من أي وحدة فعلياً مقروءة.
3. **مسارات API مكررة بالاسم المفرد والجمع**: `/api/discount` و`/api/discounts`، و`/api/admin/discount` و`/api/admin/discounts`. من الفحص: الواجهة الأمامية (`products/page.tsx`, `ProductCard.tsx`) تستخدم `/api/discount` (مفرد)، ولوحة التحكم تستخدم `/api/admin/discounts` (جمع). الملفات التانية (`/api/discounts` و`/api/admin/discount`) ما إلها مستخدمين واضحين بالكود — يحتمل تكون legacy من مرحلة إعادة تسمية. يستاهل توضيح/حذف.
4. **مجلد `prisma/` legacy بالكامل** (راجع أعلاه) — الـ schema فيه (`Product`, `Admin` فقط) ما بيطابق الجداول الفعلية المُنشأة بـ `initDb()` (فيها كمان `settings`, `product_views`, `site_visits`). لا تستخدمه كمرجع للـ schema.
5. **لا يوجد `.env.example`** — أي مطور/جلسة جديدة لازم تجمع أسماء المتغيرات المطلوبة يدوياً من `SECURITY.md` و`DEPLOYMENT.md` والكود. يفضّل إنشاء واحد.
6. **أسرار حقيقية داخل `.env`/`.env.local` المحليين** (JWT secret فعلي، كلمة سر أدمن فعلية، Turso auth token فعلي). مش مشكلة أمنية بحد ذاتها لأنهم مستثنون من git، بس انتبه ما تطبعهم أو تشاركهم بأي output خارجي.
7. **لا يوجد ESLint config منفصل** ولا test suite — الاعتماد كليًا على `next lint` الافتراضي والاختبار اليدوي عبر المتصفح.
8. **`data/billy.db`** هي قاعدة بيانات SQLite حقيقية فيها بيانات — موجودة محلياً وليست فارغة (32KB). لا تحذفها أو تعيد تهيئتها بدون التأكد إذا فيها بيانات مهمة (SECURITY.md بيذكر حذفها فقط عند تغيير `ADMIN_PASSWORD` بالإنتاج عشان تعيد الـ seed).
