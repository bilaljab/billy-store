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
  middleware.ts             # حماية /admin/dashboard + جزء من أمان الهيدرز (CSP) — الجزء الثاني (HSTS) بـ next.config.js، انظر Gotcha #16
  components/
    layout/                 # Navbar, Footer
    ui/                     # مكونات عامة (ProductCard, FaqAccordion, ScrollReveal, ConfirmDialog...)
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
- التحقق من صحة قواعد الخصم المستهدف (clamp النسبة 1-90، `type`، ترتيب `minPrice`/`maxPrice`) مركزي بدالة `validateRuleInput()` داخل `targeted/route.ts`، تُستخدم من `POST` و`PUT` معًا — أي حقل أو قاعدة تحقق جديدة تُضاف هناك مرة وحدة، ما تتكرر بكل handler على حدة.
- حذف عناصر حسّاسة (منتج، خصم عام، قاعدة مستهدفة) يمر عبر `ConfirmDialog` مشترك (`src/components/ui/ConfirmDialog.tsx`) — لا تكتب مودال تأكيد حذف جديد مضمّن، استهلك هذا المكوّن.

## أوامر التشغيل

```bash
npm install       # تثبيت الحزم
npm run dev       # تشغيل بيئة التطوير (localhost:3000)
npm run build     # بناء الإنتاج
npm run start     # تشغيل نسخة الإنتاج بعد البناء
npm run lint      # next lint (ESLint)
npx tsc --noEmit  # فحص الأنواع فقط — لا يوجد سكربت npm مخصص لهذا بـ package.json
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
3. **`eslint.config.mjs`**: قاعدة `@typescript-eslint/no-require-imports` مخفّضة لـ `warn` (بدل `error` الافتراضي)، بسبب workaround مقصود بـ `src/lib/db.ts` (`require('fs')`/`require('path')` ديناميكي لمنع الـ bundler من تضمينهم بالإنتاج) — لسا قائم، تأجيل مقصود. (قاعدة `@typescript-eslint/no-explicit-any` كانت مخفّضة لنفس السبب لحد `2026-07-24`: انحلّت بالكامل — 12 مخالفة صريحة عبر 4 ملفات صارت صفر، على فرع `chore/type-safety-and-audit` — عبر تعريف `interface TargetedRule` بـ `dashboard/page.tsx` وحذف 7 casts زائدة كان النوع الصحيح واضح فيها أصلاً من `serializeProduct()`/الـ interfaces الموجودة. القاعدة نفسها بـ `eslint.config.mjs` لسا مسجّلة `warn` — ما انرجّعت لـ `error` تلقائياً، قرار منفصل بسيط لو حدا حاب يعمله.)
4. **`no-img-element`** (تحذير ESLint) موجود بـ 3 أماكن (`dashboard/page.tsx`, `Footer.tsx`, `Navbar.tsx`) — استخدام `<img>` عادي بدل `next/image`. مش مصلّح، خارج نطاق التنظيف الحالي.
5. **`npm audit`** (فرع `chore/type-safety-and-audit`): كان فيه 5 ثغرات high-severity (`next`, `postcss`, `sharp`, `picomatch`, `ws`). **3 منهم انحلّوا** عبر `npm audit fix` العادي (بدون `--force`) بدون أي breaking changes: `ws` (8.19.0→8.21.1)، `picomatch` (→2.3.2)، وnسخة `postcss` الجذرية (8.5.8→8.5.22) — والتحديث الجانبي رفع `next` نفسها لـ `15.5.21` (لسا داخل `^15.2.4` المعرّف بـ `package.json`). **ثغرتين لسا موجودتين وما ينحلّوا بدون قرار منفصل**: `sharp` (next@15.5.21 — آخر إصدار متاح بخط 15.x بالكامل — بيثبّت `sharp: "^0.34.3"` بداخله، تحت نسخة الإصلاح 0.35.0) و`postcss` (نسخة **مدمجة داخلياً** جوه `node_modules/next/node_modules/postcss@8.4.31`، منفصلة عن النسخة الجذرية المصلَّحة). كلا الثغرتين متجذّرتين بـ Next نفسه على آخر نسخة بخط 15.x — حلّهم يتطلب ترقية major لخط 16.x، قرار منفصل يحتاج تقييم breaking changes (خصوصاً على تكامل App Router/React 19)، لسا ما اتخذ. اقتراح `npm audit fix --force` (تنزيل Next لـ 9.3.3) مو خيار حقيقي إطلاقاً — بيكسر التطبيق بالكامل.
6. لوحظ إنه Next.js المثبت فعلياً كان `15.5.12` (وصار `15.5.21` بعد إصلاح الأودت أعلاه) رغم إنه `package.json` بيحدد `"next": "^15.2.4"` — طبيعي (semver range)، بس خليها ببالك إذا حبيت تثبّت نسخة محددة.
7. **باگ كان موجود أصلاً بلوحة الأدمن (اتصلّح على فرع `design/ui-ux-audit-fixes`)**: شريط أدوات "إدارة المنتجات" ([dashboard/page.tsx](src/app/admin/dashboard/page.tsx)، قسم جدول المنتجات) كان صف أزرار (تصدير CSV/الإحصائيات/تعديل الأسعار/استيراد Excel-CSV/**+ إضافة منتج**) بـ`flex` عادي بدون `flex-wrap` ولا `overflow-x-auto`، وبما إنه `body { overflow-x: hidden }` معرّف عالمياً بـ`globals.css`، كانت الأزرار الزايدة عن عرض الشاشة تُقطع تماماً خارج حدود الرؤية على الموبايل (~<556px) بدون أي طريقة توصلها — بما فيها زر "+ إضافة منتج" (الإجراء الرئيسي بالصفحة). الباگ هذا **مش من مخالفات تدقيق UI/UX** (`design-audit.md`) ولا نتج عن أي تعديل بهاي الجلسة — اكتُشف بالصدفة أثناء فحص بصري فعلي (Chrome DevTools MCP) لبند 5.5 من التدقيق (أعمدة الجدول بعرض الموبايل)، وتم إصلاحه فوراً لأنه يمنع وصول كامل لإجراء أساسي. الحل: الهيدر صار `flex-col sm:flex-row` (العنوان فوق، الأزرار تحت على الموبايل) وصف الأزرار صار `flex-wrap`.
8. **مدة كاش `/api/discounts`** ([src/app/api/discounts/route.ts](src/app/api/discounts/route.ts)): `Cache-Control: public, s-maxage=30, stale-while-revalidate=120` — يعني تغييرات الأدمن على الخصم العام أو القواعد المستهدفة ممكن تتأخر بالظهور للزوار حتى ~150 ثانية (30 + 120). **قرار مقصود** (راجعه المستخدم صراحة بجلسة `fix/discount-system-issues` وأبقاه كما هو) لتخفيف الحمل على Turso (كل صفحة منتج/قائمة بتقرأ هالمسار) مقابل تأخير مقبول لحجم المتجر الحالي (عدد منتجات صغير، تغييرات خصم غير متكررة كل ثانية). لو احتجت مستقبلاً استجابة أسرع (مثلاً عروض ومضة قصيرة المدة تحتاج تظهر فوراً)، هذا قرار يُعاد تقييمه وقتها بناءً على حاجة فعلية — مش تغيير استباقي.
9. **تدقيق وإصلاح شامل لأنظمة الخصومات (2026-07-25، فرع `fix/discount-system-issues`، مدموج بـ`main`)**: تقرير كامل بـ[discount-audit.md](discount-audit.md) بجذر المشروع يوثّق 16 مشكلة كانت موجودة فعليًا (بعضها بتأثير مباشر على السعر المعروض للزبون، بعضها ثغرة أمان بتسريب بيانات خصم عبر `GET` غير محمي، وبعضها تجربة إدارية فقط) — **14 منها انحلّت بالكامل** (clamp/رفض صريح لنسب الخصم بكلا النظامين، مصادقة على كل `GET`، معالجة أخطاء منظمة، توحيد تحقق قواعد الخصم المستهدف بدالة مشتركة، مكوّن `ConfirmDialog` مشترك). **بندان لسا مؤجّلان بقرار صريح ولازم أي جلسة مستقبلية تعرفهم قبل ما تلمس كود الخصومات**:
   - لا يوجد مفهوم تاريخ بداية/نهاية (expiry/scheduling) لأي خصم — ميزة جديدة، مش عيب، لسا ما اتقرر تنفيذها.
   - منطق أولوية الخصم العام مقابل المستهدف (اختيار أعلى نسبة مستهدفة تنطبق، والخصم العام fallback بس لو ما فيه قاعدة مستهدفة منطبقة) **مكرَّر يدويًا حرفيًا بثلاث ملفات منفصلة بدون دالة مشتركة**: [src/components/ui/ProductCard.tsx](src/components/ui/ProductCard.tsx)، [src/app/products/page.tsx](src/app/products/page.tsx)، و[src/app/products/[id]/page.tsx](src/app/products/[id]/page.tsx). **أي تعديل مستقبلي على قاعدة الأولوية (مثلاً السماح بالتراكم بدل "الأعلى يفوز") لازم يصير بالثلاث ملفات معًا** — تعديل ملف واحد بس بينتج فورًا سعر مختلف لنفس المنتج حسب الصفحة (الرئيسية مقابل القائمة مقابل التفاصيل). **تحديث (2026-07-26، فرع `feature/products-isr`)**: آلية `products/page.tsx` تحديدًا تغيّرت من HTTP fetch لـ`/api/discounts` (client-side) إلى استعلام DB مباشر داخل Server Component (`getProductsWithDiscounts()`، بنفس نمط `getPageData()` بـ`products/[id]/page.tsx`) — العدد الإجمالي للملفات المكرِّرة لسا 3 بدون تغيير، فقط آلية هذا الملف الواحد تبدّلت.
10. **`PUT /api/admin/products/[id]` بدون أي تحقق من صحة المدخلات** ([src/app/api/admin/products/[id]/route.ts](src/app/api/admin/products/[id]/route.ts))، بعكس `POST` بنفس المسار (`src/app/api/admin/products/route.ts`) اللي بيتحقق بصرامة من الاسم والسعر. تعديل منتج موجود ممكن يكتب `NaN`/سعر سالب أو صفر/اسم فارغ بصمت بقاعدة البيانات. لو طُلب "أضف تحقق للمنتجات"، لازم PUT يتغطى، مش بس POST.
11. **Rate limiting بتسجيل الدخول (`src/app/api/auth/login/route.ts`) بذاكرة (`Map`) داخل العملية، مش مشتركة بين instances** — بترجع لصفر عند كل redeploy أو cold start، وعلى بيئة serverless متعددة instances (Vercel) الحد الفعلي "5 محاولات/15 دقيقة" أضعف بكثير مما يبدو. لا يوجد rate limiting بأي route ثاني بالمشروع. **حسم صريح (تدقيق أمني 2026-07-25، `security-audit.md` §2.2)**: مفتاح الحد يعتمد على `x-forwarded-for` (`login/route.ts:25`) بدون أي تحقق من مصدره بالكود نفسه — لكن توثيق Vercel الرسمي (`vercel.com/docs/headers/request-headers`) يؤكد صراحة إن المنصة **تعيد كتابة** هالهيدر وترفض أي قيمة يرسلها العميل مباشرة ("to prevent IP spoofing"). يعني التصنيف الصحيح هو **🟡 ضعف تحصين (multi-instance/cold-start يصفّر الحد)، وليس 🔴 تجاوز كامل عبر تزوير الهيدر** — طالما التطبيق يُستقبل حصرًا خلف Vercel edge كما هو مخطَّط بالإنتاج (Gotcha #17). تحقّق عملي محلي (dev server بدون طبقة Vercel) أثبت إن الكود المجرّد فعلاً يثق بالهيدر بالكامل لو وصلته الطلبات مباشرة — **هذا الحسم يُعاد تقييمه فورًا لو تغيّرت بنية الاستضافة مستقبلًا** (self-hosted، أو proxy آخر لا يعيد كتابة الهيدر).
12. **"تعديل الأسعار بالجملة" (`bulk-price`) بدون حد أقصى منطقي على نسبة الزيادة/النقصان** (`src/app/api/admin/products/bulk-price/route.ts`) — أي نسبة من 0 لـ99999 مقبولة لكل من percentage وfixed، والنتيجة تُقرَّب لأقرب عدد صحيح بحد أدنى 1 بصمت. أي أسعار عشرية موجودة تنمسح لما يُستخدم هالأداة.
13. **عدّاد "المشاهدات" (`/api/views`) ما بيستثني تصفح لوحة الأدمن، بعكس عدّاد "الزيارات" (`/api/visit`)** اللي بيستثني صراحة أي referer فيه `/admin` وبيعمل dedup لكل IP كل 30 دقيقة. تصفح الأدمن لصفحات منتج بينفخ رقم المشاهدات بالإحصائيات بدون ما يأثر على رقم الزيارات — الرقمين مو مقارَنين بنفس المعيار.
14. **`src/lib/xlsxParser.ts` بارسر ZIP/XML مكتوب يدويًا بالكامل** (بدون مكتبة `xlsx`/sheetjs)، يقرأ أول sheet بس، وبيحدّ أي entry داخل الملف بـ2 ميجابايت بصمت. ملف تالف أو أكبر من الحد بيرجع "0 استيراد" بدون رسالة خطأ توضيحية — قبل اقتراح "رجّع مكتبة xlsx حقيقية"، اسأل ليش كانت مكتوبة يدوي أول مرة (على الأغلب لتفادي حجم bundle أو dependency ثقيلة).
15. **`scripts/init-db.js` كود قديم متروك (orphaned)، مش طريقة تهيئة بديلة صالحة** — يحتاج حزمة `better-sqlite3` غير موجودة إطلاقًا بـ`package.json` (تشغيله برمي `Cannot find module`)، وبيعمل seed لكلمة سر أدمن مكتوبة صراحة بالكود (`'Bilal2026*'`) تختلف كليًا عن مسار الـseed الفعلي المستخدم حاليًا (متغيّر `ADMIN_PASSWORD` عبر `lib/db.ts`). لا تشغّله.
16. **أمان الهيدرز مُعرَّف بملفين بدون مصدر واحد، بتكرار جزئي**: خمس هيدرز (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`) مكرَّرة حرفيًا بكل من `next.config.js` و`middleware.ts` — لكن `Strict-Transport-Security` (HSTS) موجود بـ`next.config.js` بس، و`Content-Security-Policy` موجود بـ`middleware.ts` بس. أي تعديل سياسة هيدرز لازم يلمس الملفين وإلا بيصير تناقض. **كمان**: كود إعادة توجيه favicon جوا `middleware.ts` (السطرين 8-9) ميت فعليًا — تأكّدت بقراءة الـ`matcher` مباشرة: بيستثني كل مسار بامتداد `.ico` (وصور تانية) من استدعاء دالة الـmiddleware أصلًا، فالكود موجود لكن ما بينفّذ أبدًا لطلب `/favicon.ico` حقيقي.
    **تحديثات تدقيق أمني 2026-07-25 (`security-audit.md`، فرع `fix/security-audit-issues`)**:
    - **`unsafe-eval` — انحلّت.** كان مفعّل بدون شرط بـ`script-src` رغم تعليق الكود "tighten in prod". فحص عملي (بناء إنتاجي فعلي + `grep` على `.next/static/chunks/*.js`) أكّد صفر استدعاءات `eval()` بحزمة الإنتاج، فصار `script-src` يبني `'unsafe-eval'` شرطيًا حسب `NODE_ENV` (موجود بـdev فقط). تحقّق: `curl -I` بوضع `npm start` الإنتاجي يرجّع CSP بدون `'unsafe-eval'`، وجولة حية كاملة بالمتصفح (الصفحات العامة + تسجيل دخول أدمن + فتح/حفظ/حذف خصم عبر `ConfirmDialog`) بدون أي رسالة `Refused to evaluate` أو CSP violation بالـconsole.
    - **`unsafe-inline`** (script-src وstyle-src): **باقٍ — قرار مقبول موثّق، مش نسيان.** مطلوب وظيفيًا حاليًا: لا يوجد nonce بالـCSP، وسكربت bootstrap الخاص بـNext.js نفسه (مو كود التطبيق) يحتاج `unsafe-inline` بـscript-src ليشتغل؛ React `style` prop (مستخدم بعدة ملفات: `page.tsx`, `Navbar.tsx`, `ScrollReveal.tsx`, `dashboard/page.tsx`, `products/[id]/page.tsx`) يحتاج `unsafe-inline` بـstyle-src. لا مصدر خطر مؤكد حاليًا (بحث شامل: صفر `dangerouslySetInnerHTML`/`eval`/`new Function` بكل `src/`). **يُعاد تقييمه فورًا لو ظهرت مستقبلًا أي نقطة حقن HTML** (مثلًا حقل نصي من أدمن يُعرض بدون تنقية لأي زائر) — عندها الـCSP الحالي لن يوفر أي حماية إضافية ضدها.
    - **تكرار الـ5 هيدرز المشتركة بين الملفين: توحيد مؤجَّل بقرار صريح.** لا خلل عملي حاليًا (تحقّق فعلي بـcurl: كل الثمانية توجيهات/هيدرز تصل صحيحة بنفس الطلب، Next.js يدمج هيدرز الملفين تلقائيًا). خطر تراجع/كسر أي محاولة توحيد (مثلًا استخراج ملف مصدر واحد يُستورد بكليهما) أكبر من الفائدة الحالية بحجم المشروع — قرار مقصود، مش تقصير.
17. **`DEPLOYMENT.md` غير محدَّث ويناقض الستاك الفعلي المستخدم** — بيقول SQLite ما بيشتغل على Vercel ويقترح Neon/PlanetScale/Supabase، بدون أي ذكر لـTurso (المستخدم فعليًا بالإنتاج حسب هذا الملف)، وبيسرد `JWT_SECRET` بس كمتغير بيئة مطلوب (ناقص `ADMIN_PASSWORD` وTurso وCloudinary). **لا تتبعه حرفيًا** — جدول "متغيرات البيئة" أعلى بهذا الملف هو المرجع الصحيح والحالي.
18. **تناقض ISR/تحديث السعر بين صفحات شبه متطابقة** — **جزئيًا محلول (2026-07-26، فرع `feature/products-isr`)**: كان الوصف الأصلي إن الرئيسية `revalidate=60`، تفاصيل المنتج `revalidate=30`، لكن `/products` صفحة `'use client'` بتجيب البيانات فريش بكل mount بدون ISR إطلاقًا. **الآن**: `/products` صارت Server Component بـ`revalidate=30` (تطابق تفاصيل المنتج) — التناقض الأصلي (صفحة بدون ISR إطلاقًا مقابل صفحتين فيهم) انحل. يبقى فرق طفيف مقصود بين 30 (تفاصيل/قائمة) و60 (الرئيسية) — غير موحَّد عمدًا، تفاصيله بخطة `feature/products-isr` (نقطة 5 من التحليل). **ما زال قائمًا بدون حل**: `ProductCard.tsx` عنده كاش خصومات على مستوى الموديول ([src/components/ui/ProductCard.tsx](src/components/ui/ProductCard.tsx)) بينحمّل مرة وحدة بس لكل جلسة متصفح وما بينعاد تحميله إلا بـfull reload — بعد ما الأدمن يغيّر خصم، بطاقات منتجات معروضة بنفس جلسة SPA ممكن تفضل تعرض السعر/الشارة القديمة. هذا الجزء **خارج نطاق** تحويل `/products` لـISR (يخص `ProductCard` نفسه، المستخدم بثلاث أماكن ولم يُلمَس).
19. **روابط تواصل (واتساب/انستقرام/تيليجرام) مكتوبة مباشرة (hardcoded) بأكتر من 8 ملفات منفصلة بدون مصدر واحد مشترك** (`page.tsx`, `about/page.tsx`, `faq/page.tsx`, `Footer.tsx`, `Navbar.tsx`, `ProductActions.tsx`, `WhatsAppFloat.tsx`) — تغيير رقم الواتساب أو أي حساب يحتاج بحث واستبدال يدوي بكل هالملفات، ما فيه constant مشترك يُعدَّل بمكان واحد.
20. **تدقيق أمني شامل (2026-07-25، فرع `audit/security` → إصلاحات على `fix/security-audit-issues`)**: تقرير كامل بـ[security-audit.md](security-audit.md) بجذر المشروع يغطي هيدرز/CSP (Gotcha #16)، rate limiting (Gotcha #11)، مسح شامل لكل API routes بحثًا عن أنماط مشابهة لثغرة الخصومات (`discount-audit.md`)، وCSRF/تسريب env/SQL injection/نسخة Next.js الفعلية. **بندان انحلّا بكود فعلي**: `GET /api/admin/announcement` كان بدون `isAuthenticated` (بعكس كل شقيق آخر بـ`admin/**`) — أُضيف التحقق؛ و`unsafe-eval` بالـCSP صار شرطي بـ`NODE_ENV` (تفاصيل بـGotcha #16 أعلاه). باقي الملاحظات (rate limiting، `unsafe-inline`، تكرار الهيدرز) موثّقة كقرارات مقبولة ضمن Gotcha #11 وGotcha #16 أعلاه، مش عيوب تحتاج إصلاح فوري. **ثغرة `npm audit` إضافية مكتشفة (جديدة، غير موثّقة بـGotcha #5)**: 9 حزم بسلسلة devDependencies (`eslint`, `eslint-config-next`, `eslint-plugin-import`, `eslint-plugin-jsx-a11y`, `eslint-plugin-react`, `@eslint/config-array`, `@eslint/eslintrc`, `minimatch`, `brace-expansion`) — جذرها ثغرة `brace-expansion` واحدة (`GHSA-mh99-v99m-4gvg`، DoS). صفر أثر إنتاجي (devDependencies فقط، لا تُشحن). الإصلاح يتطلب ترقية `eslint` لنسخة major (`10.8.0`) — **قرار منفصل مؤجَّل، بنفس نمط قرار ترقية Next 16.x الموثّق بـGotcha #5** (اللي لسا المرجع الصحيح لثغرتي `sharp`/`postcss` المتجذّرتين بـ`next` نفسه — هالجلسة ما لمستهم). **CSRF (بند 6 بـ`security-audit.md`)**: تحليل إضافة فحص `Origin`/`Referer` كدفاع بعمق ثانٍ لطلبات `admin/**` المتغيّرة للحالة عُرض على المستخدم وقرر **عدم التنفيذ حاليًا** — `sameSite: 'strict'` بكوكي `admin_token` كافية لحجم الاستخدام الفعلي (أدمن واحد)، ومخاطرة false positives (preview URLs بنطاقات مختلفة، متصفحات تحذف Referer) تفوق الفائدة الحالية. **يُعاد تقييمه فقط لو ظهر سبب فعلي** (مثلًا: عدة حسابات أدمن، أو دليل استغلال CSRF حقيقي) — قرار مقصود، مش إهمال.
21. **✅ Pagination لجدول إدارة المنتجات بلوحة الأدمن (2026-07-26، فرع `feature/admin-table-pagination` من `main`) — مُصلَح**: بند 12 بـ[web-quality-audit.md](web-quality-audit.md) كان موثّقًا كـ"مؤجَّل لجلسة معمارية منفصلة" (DOM ضخم: 8,661 عنصر إجمالي، 396 ابن مباشر بـ`<tbody>` جدول المنتجات، أحداث layout بتكلفة 358ms/346ms). الحل المُنفَّذ: **client-side pagination + بحث/فلترة محليان بالكامل** ([dashboard/page.tsx](src/app/admin/dashboard/page.tsx)) — بدون أي تعديل backend/`db.ts`/مكتبة جديدة. الجلب يبقى fetch واحد غير محدود لكل المنتجات (كما كان)، لكن الرندر بس يعمل `.slice()` بحجم صفحة 20 (`PRODUCTS_PAGE_SIZE`) فوق مصفوفة مفلترة بالبحث/الفئة بالذاكرة. **تحقّق فعلي حي (Chrome DevTools MCP، بيانات Turso حقيقية 396 منتج، بناء إنتاجي فعلي)**: إجمالي DOM انخفض من 8,661 لـ**793** (‑90.8%)، أبناء `<tbody>` من 396 لـ**20** بالضبط، أكبر حدث layout انخفض من 358ms إلى **110ms** (يؤثر على 161 عقدة بدل حتى 9,561). "تحديد الكل" صار يعني "كل النتائج المطابقة للفلتر الحالي عبر كل الصفحات" (وليس فقط الصفحة الظاهرة) — قرار صريح من المستخدم، مع رسالة توضيحية بشريط الإجراءات الجماعية ("محدد عبر N صفحات") وتصفير تلقائي للتحديد عند تغيير البحث/الفلتر (لمنع حذف عناصر غير ظاهرة بالغلط). حذف جماعي عبر عدة صفحات يُرجع صراحة لصفحة 1 (`setPage(1)` صريح بـ`handleDeleteSelected`، وليس اعتمادًا فقط على تثبيت حدود الصفحة العام — تحقّق مباشر أثبت الفرق: حذف عنصرين فقط من أصل 45 نتيجة مفلترة، حيث بقي عدد الصفحات كما هو (3) فما كان تثبيت الحدود ليتدخّل أصلًا، ومع ذلك رجعت الصفحة لـ1 بفضل الاستدعاء الصريح). بطاقات الإحصائيات ومنتقي المنتجات بمودال الخصم المستهدف ([:1130-1154](src/app/admin/dashboard/page.tsx#L1130)) **بدون أي تعديل** — يبقيان يقرآن مصفوفة `products` الكاملة كما هي (صحيح للأول لأنه لازم يعكس الكتالوج كامل؛ الثاني مودال مغلق افتراضيًا فلا يساهم بمشكلة الـDOM المقاسة أصلًا). اختبار وظيفي شامل عبر منتجات تجريبية مؤقتة (استُوردت عبر `/api/admin/import` ثم حُذفت بالكامل عبر نفس ميزة الحذف الجماعي المُختبرة، صفر أثر على الكتالوج الحقيقي 396 منتج).
