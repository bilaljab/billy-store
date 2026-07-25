# تقرير التدقيق الأمني — Billy Store

**تاريخ التدقيق:** 2026-07-25
**فرع التدقيق:** `audit/security` (من `main`)
**تاريخ المعالجة:** 2026-07-25 (نفس اليوم)، فرع `fix/security-audit-issues` (من `main`)
**نطاق التدقيق الأصلي:** استكشاف وتوثيق فقط — **صفر تعديل على أي كود مصدري**. لا يتضمن هذا التقرير خطة إصلاح ولا أي commit على كود التطبيق؛ القرار على خطة الإصلاح يصير لاحقًا مع المستخدم.
**منهجية التحقق:** قراءة كود كاملة لكل ملف ذي علاقة + تحقق عملي فعلي (تشغيل `npm run dev` حقيقي، طلبات curl فعلية على الهيدرز وroutes الإدارية، استنفاد فعلي لحد تسجيل الدخول (rate limit) مع تنظيف الأثر فورًا، `npm run build` فعلي وفحص ثابت (`grep`) للـchunks الناتجة، `npm audit` فعلي، وبحث في توثيق Vercel الرسمي لحسم سؤال موثوقية `x-forwarded-for`). كل ما يلي موسوم بطريقة تحققه.

---

## ⚠️ حالة المعالجة (تحديث لاحق)

**بندان بجدول القسم 4 انحلّا بكود فعلي على فرع `fix/security-audit-issues`، والباقي وُثِّق كقرارات مقبولة/مؤجَّلة بـ`CLAUDE.md` (بدون أي تعديل كود) — ما عدا بند واحد لسا قيد الاستشارة:**
- **بند 1** (`GET /api/admin/announcement` بدون `isAuthenticated`) — **✅ مُصلَح**. commit: `fix: require authentication on GET /api/admin/announcement`. تحقّق: curl بدون كوكي يرجع 401 بدل 200، وبكوكي أدمن صحيحة يرجع 200 وبيانات طبيعية.
- **بند 3** (`unsafe-eval` بالـCSP بدون شرط `NODE_ENV`) — **✅ مُصلَح**. commit: `fix: restrict CSP unsafe-eval to development mode only`. تحقّق: `grep` على حزمة الإنتاج (صفر `eval()`)، `curl -I` بوضع `npm start` يؤكد غياب `unsafe-eval`، وجولة حية كاملة بالمتصفح (Chrome DevTools MCP) عبر الصفحات العامة ولوحة الأدمن (تسجيل دخول، فتح/حفظ/حذف خصم عبر `ConfirmDialog`) بصفر رسائل CSP violation بالـconsole.
- **بند 2** (rate limiting/`x-forwarded-for`)، **بند 4** (`unsafe-inline`)، **بند 5** (تكرار الهيدرز) — **موثّقة كقرار** بـ`CLAUDE.md`: بند 2 وبند 5 ضمن **Gotcha #11** و**Gotcha #16** على التوالي، وبند 4 ضمن **Gotcha #16** (فقرة `unsafe-inline`).
- **بند 7** (مفتاح rate limiting يعتمد على `x-forwarded-for`) — **موثّق كقرار** ضمن **Gotcha #11** بـ`CLAUDE.md` (نفس الجذر مع بند 2).
- **بند 8** (`npm audit`، 9 حزم devDependencies) — **موثّق كقرار** ضمن **Gotcha #20** (جديد) بـ`CLAUDE.md`.
- **بند 6** (CSRF) — **⏸️ قيد الاستشارة**. تحليل مفصّل (التعديل المقترح لو تمت الموافقة، مستوى التعقيد، مستوى المخاطرة) عُرض على المستخدم بالمحادثة — **لم يُتخذ قرار بعد ولم يُنفَّذ أي تعديل**، لأنه إضافة دفاع بعمق جديدة (مش إصلاح خلل مثبت، `SameSite=strict` فعّالة حاليًا بمفردها).

---

## 1. جرد آلية الحماية الحالية بالكود

### 1.1 هيدرز الأمان — موزّعة بملفين بدون مصدر واحد

| الهيدر | `src/middleware.ts` | `next.config.js` |
|---|---|---|
| `X-Content-Type-Options` | ✅ سطر 15 | ✅ سطر 21 |
| `X-Frame-Options` | ✅ سطر 16 | ✅ سطر 22 |
| `X-XSS-Protection` | ✅ سطر 17 | ✅ سطر 23 |
| `Referrer-Policy` | ✅ سطر 18 | ✅ سطر 24 |
| `Permissions-Policy` | ✅ سطر 19 | ✅ سطر 25 |
| `Content-Security-Policy` | ✅ أسطر 20-31 | ❌ غير موجود |
| `Strict-Transport-Security` (HSTS) | ❌ غير موجود | ✅ سطر 20 |
| `X-DNS-Prefetch-Control` | ❌ غير موجود | ✅ سطر 19 |

**تحقّق فعلي عبر `curl -sD -`** (dev server محلي، `npm run dev`):
```
$ curl -sD - -o /dev/null http://localhost:3000/api/products
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
x-content-type-options: nosniff
x-frame-options: DENY
x-xss-protection: 1; mode=block
referrer-policy: strict-origin-when-cross-origin
permissions-policy: camera=(), microphone=(), geolocation=()
content-security-policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self'; frame-ancestors 'none'
```
كلا الملفين فعلاً يُطبَّقان معًا على نفس الطلب (Next.js يدمج هيدرز `next.config.js` مع هيدرز الـ middleware) — النتيجة العملية صحيحة (كل الهيدرز الثمانية حاضرة)، لكن **5 هيدرز مكرَّرة حرفيًا بملفين منفصلين بدون مصدر واحد**، وأي تعديل مستقبلي (قيمة أو إضافة/حذف هيدر) لازم يلمس الملفين معًا وإلا بيصير تناقض صامت.

### 1.2 المصادقة — JWT في كوكي httpOnly

`src/lib/auth.ts`: `JWT_SECRET` من env (يرمي خطأ عند الإقلاع لو غير موجود أو أقل من 32 حرفًا، أسطر 4-7)، `signToken` بـ`jose`/HS256/انتهاء 24 ساعة (أسطر 11-17)، `isAuthenticated(req)` (أسطر 33-38) بيقرأ كوكي `admin_token` ويتحقق منه بـ`jwtVerify`. هذا الهيلبر هو نقطة الحماية الوحيدة لكل الـAPI routes — **لا يوجد أي طبقة حماية ثانية** (middleware لا يحمي `/api/*`، انظر 1.3).

كوكي `admin_token` عند تسجيل الدخول الناجح (`login/route.ts:56-62`، **تحقّق فعلي عبر curl**):
```
set-cookie: admin_token=<redacted-jwt>; Path=/; Expires=...; Max-Age=86400; HttpOnly; SameSite=strict
```
لاحظ غياب `Secure` بالقيمة المرصودة محليًا — متوقّع لأن `secure: process.env.NODE_ENV === 'production'` (`login/route.ts:58`) وبيئة الاختبار كانت dev. بالإنتاج (`NODE_ENV=production`) يُفترض ظهور `Secure` أيضًا — لم يُختبَر مباشرة بهذا التدقيق لأن التحقق العملي اقتصر على dev server محلي.

### 1.3 `middleware.ts` لا يحمي أي `/api/*` — كل route مسؤول عن نفسه

**تحقّق عبر قراءة كود دقيقة**: منطق حماية الصفحات بـ`middleware.ts` محصور صراحة بـ`if (pathname.startsWith('/admin/dashboard'))` (سطر 34) — شرط لا ينطبق أبدًا على أي مسار `/api/*`. الـ`matcher` (أسطر 62-64) نفسه يشمل `/api/*` (لا يستثنيه)، فالـmiddleware *يُنفَّذ* على طلبات الـAPI (لذلك تصلها هيدرز الأمان)، لكن **منطق فحص الكوكي لا يُطبَّق عليها إطلاقًا**. يعني: حماية كل admin API route تعتمد **حصرًا** على استدعاء `isAuthenticated(req)` داخل الـroute نفسه — أي نسيان استدعاء واحد = ثغرة كاملة بدون أي شبكة أمان ثانية (انظر القسم 3).

### 1.4 Rate limiting لتسجيل الدخول — `Map` بذاكرة العملية، **مؤكَّد لا مصدر تخزين مشترك**

`src/app/api/auth/login/route.ts:6-8`:
```ts
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
```
مفتاح الحد (سطر 25): `req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'`. لا Redis، لا DB، لا أي تخزين خارج ذاكرة العملية نفسها — **مؤكَّد بقراءة الكود مباشرة، ليس افتراضًا**.

### 1.5 لا يوجد CSRF token — الاعتماد كليًا على `SameSite=strict`

بحث شامل (`grep -ri csrf src/`) = **صفر نتائج**. لا يوجد أي آلية CSRF token (double-submit، synchronizer token، إلخ) بأي route. الحماية الوحيدة من CSRF هي `sameSite: 'strict'` بكوكي `admin_token` (`login/route.ts:59`) — مذكورة بالتفصيل بالقسم 4.

---

## 2. المحاور الأربعة

### 2.1 محور CSP/الهيدرز (Gotcha #16) — تحليل واقعي لهالمشروع تحديدًا

**التكرار الدقيق موثّق أعلاه (1.1)**. النقطة الأهم هنا: تحليل واقعي (مو نظري) لـ`unsafe-inline`/`unsafe-eval`.

**`script-src 'unsafe-eval'` — تحقّق عملي حاسم: لا حاجة فعلية له بالإنتاج**

بُني المشروع فعليًا (`npm run build`، نجح بدون أخطاء) وفُحصت كل ملفات JS الناتجة بـ`.next/static/chunks/*.js` (13 ملف) بحثًا عن استدعاءات `eval(` حقيقية:
```
$ grep -rlE '[^a-zA-Z."'"'"']eval\(' .next/static/chunks/*.js
(لا نتائج — صفر ملفات)
```
**صفر استدعاءات `eval()` بكامل حزمة الإنتاج**. التعليق بالكود نفسه (`middleware.ts:24`: `// unsafe-eval needed for Next.js dev; tighten in prod`) يعترف إن الحاجة مقتصرة على وضع التطوير (webpack HMR)، لكن الشرط الفعلي بالكود **غير مقيّد بـ`NODE_ENV`** — يعني `unsafe-eval` يصل فعليًا لكل مستخدم بالإنتاج بدون أي فائدة وظيفية مقابلة، فقط اتساع غير ضروري لسطح هجوم XSS (لو وُجدت نقطة حقن أصلًا — انظر أدناه لماذا هذا مو حرج حاليًا).

**`script-src 'unsafe-inline'` — مطلوب فعليًا، لا يوجد nonce**

فحص الـHTML المُصيَّر فعليًا (`curl http://localhost:3000/` وقراءة المصدر) أظهر `<script>` واحد بدون سمة `nonce` (سكربت bootstrap الخاص بـNext.js نفسه، ليس كود التطبيق). بحث عن `nonce="` بكامل الصفحة = صفر نتائج. يعني: `unsafe-inline` مطلوب فعليًا حاليًا لأن لا يوجد أي آلية nonce بالـCSP — لو أُزيل بدون إضافة nonce، التطبيق نفسه سينكسر (سكربت bootstrap لن يُنفَّذ).

**`style-src 'unsafe-inline'` — مطلوب فعليًا، لكن المصدر غير خطير**

بحث بكامل `src/` (`style={{...}}`) أظهر استخدام React لـ`style` prop مباشرة بعدة ملفات (`page.tsx`, `Navbar.tsx`, `ScrollReveal.tsx`, `dashboard/page.tsx`, `products/[id]/page.tsx`) — كل القيم محسوبة من بيانات ثابتة بالتطبيق نفسه (نسب مئوية، تأخير أنيميشن) **وليست من مدخلات مستخدم أو أدمن غير موثوقة**. React يترجم `style` prop تلقائيًا لسمة `style="..."` inline بالـHTML، فيحتاج `unsafe-inline` بـ`style-src` تحديدًا بسبب هذا النمط الشائع بمكتبة React نفسها، مو بسبب خلل بالتطبيق.

**الخلاصة الواقعية لهالمشروع تحديدًا:** لم يُعثر على أي نقطة XSS فعلية قابلة للاستغلال (لا `dangerouslySetInnerHTML`، لا `eval(`، لا `new Function(`، بحث شامل بـ`src/` = صفر نتائج للثلاثة). فـ`unsafe-inline`/`unsafe-eval` حاليًا **دفاع بعمق ناقص (لا يوجد استغلال معروف يعتمد عليه)** — لكن لو ظهرت مستقبلًا أي نقطة حقن HTML (مثلًا حقل نصي من الأدمن يُعرض بدون تنقية لأي زائر)، الـCSP الحالي **لن يوفر أي حماية إضافية** لأنه يسمح صراحة بتنفيذ أي سكربت inline. `unsafe-eval` تحديدًا زائد بالكامل بالإنتاج (مؤكَّد بفحص الـchunks) ويمكن إزالته لسياق الإنتاج فقط بدون أي كسر وظيفي متوقّع حسب هذا الفحص.

**ملاحظة توثيقية منفصلة (غير أمنية) — كود favicon ميت:**
`middleware.ts:7-10` يحاول إعادة توجيه `/favicon.ico`/`/favicon.png` لكن الـ`matcher` (أسطر 62-64) يستثني هذه الامتدادات من استدعاء الـmiddleware أصلًا عبر negative lookahead — **الكود لا يُنفَّذ أبدًا لطلب حقيقي**. تحقّق بقراءة الـmatcher مباشرة، ليس افتراضًا. لا يمثّل خطرًا أمنيًا، مجرد دقة توثيق.

### 2.2 محور Rate Limiting (Gotcha #11) — حسم موثوقية `x-forwarded-for`

**السؤال الحاسم:** هل الكود يثق بقيمة `x-forwarded-for` كما وردت من الطلب مباشرة، أو فيه ضمان منصة تمنع تزويرها؟

**تحقّق عبر قراءة كود:** `login/route.ts:25` يأخذ أول قيمة بالسلسلة كما هي حرفيًا (`.split(',')[0].trim()`) بدون أي تحقق من مصدرها.

**تحقّق عبر توثيق Vercel الرسمي** (`vercel.com/docs/headers/request-headers`، قسم `x-forwarded-for`، نص مقتبس حرفيًا):
> "If you are trying to use Vercel behind a proxy, we currently overwrite the `X-Forwarded-For` header and **do not forward external IPs**. This restriction is in place to prevent IP spoofing."

**الحسم الصريح:** بالإنتاج على Vercel (الخطة القياسية، غير Enterprise)، منصة Vercel نفسها **تعيد كتابة** هيدر `x-forwarded-for` بالـIP الحقيقي للعميل وتتجاهل أي قيمة يرسلها العميل مباشرة بطلبه — موثّق صراحة كإجراء "لمنع IP spoofing". يعني: **التصنيف الصحيح هو 🟡 "ضعف بسبب multiple instances/cold starts" فقط، وليس 🔴 "قابل للتجاوز بالكامل عبر تزوير الهيدر"** — طالما التطبيق يُستقبل حصرًا عبر Vercel edge كما هو مُخطَّط له بالإنتاج (`DEPLOYMENT.md`/Gotcha #17). لو نُشر يومًا خلف بنية مختلفة (مثلًا خلف proxy آخر لا يعيد كتابة الهيدر، أو self-hosted بدون Vercel)، هذا الحسم ينعكس فورًا لـ🔴 — نقطة تستحق إعادة تقييم عند أي تغيير مستقبلي بمنصة الاستضافة.

**تحقّق عملي فعلي (محلي، dev server — يُظهر سلوك الكود المجرّد بدون طبقة Vercel):**

استنفاد الحد بنفس IP ثابت (6 طلبات، نفس `x-forwarded-for: 9.9.9.9`):
```
محاولة 1-5: 401 "بيانات الدخول غير صحيحة"
محاولة 6:   429 "حاول بعد 899 ثانية"
```
محاولة تزوير محلي (8 طلبات، `x-forwarded-for` مختلف بكل مرة: `10.0.0.1`...`10.0.0.8`):
```
كل الـ8 طلبات: 401 (لا واحدة وصلت 429 — الحد لم يُستنفد لأي "IP" لأنه كل طلب اعتُبر مصدرًا جديدًا)
```
هذا يثبت **السلوك الخام للكود نفسه** (بدون أي طبقة منصة تحميه): لو وصلت الطلبات للتطبيق مباشرة بدون Vercel edge يعيد كتابة الهيدر، الحد قابل للتجاوز الكامل بتغيير الهيدر بكل طلب. لكن بالإنتاج الفعلي على Vercel، هذا المسار محجوب لأن المنصة تكتب الهيدر بنفسها (أعلاه). **الخطورة الفعلية إذًا تبقى محصورة بضعف multi-instance/cold-start الموثّق أصلًا بـGotcha #11** — ثغرة تحصين حقيقية (تصفير الحد عند كل نشر/instance جديد على serverless)، وليست بابًا مفتوحًا بالكامل للتجاوز الفوري.

**تقييم خطورة واقعي بحجم المتجر الحالي:** أدمن واحد فقط، حركة زوار محدودة. حتى لو تصفّر الحد عند كل cold start (يحدث بشكل طبيعي على Vercel serverless بدون حركة مستمرة)، هذا يوسّع نافذة محاولات brute-force نظريًا لكن **لا يلغي الحماية بالكامل** (كل instance لسا محدود بـ5 محاولات/15 دقيقة قبل تصفيره)، وكلمة مرور الأدمن مُشفَّرة بـ`bcrypt` (مقاومة فعلية لهجوم offline لو تسرّبت قاعدة البيانات، لكن هذا خارج نطاق rate limiting). **لا يستدعي حالة طوارئ لحجم الاستخدام الحالي**، لكنه فجوة تحصين معروفة تستحق حل مركزي (KV/Redis مشترك) لو زادت حركة الموقع أو تعدد الأدمن مستقبلًا.

### 2.3 مسح شامل لكل API routes — تأكيد الجرد الكامل

| المسار | Methods | `isAuthenticated`؟ | ملاحظات |
|---|---|---|---|
| `admin/products` | GET, POST | ✅ كلاهما | |
| `admin/products/[id]` | PUT, DELETE | ✅ كلاهما | (Gotcha #10: PUT بلا تحقق مدخلات — مشكلة صحة بيانات، ليست مصادقة) |
| `admin/products/bulk-delete` | POST | ✅ | |
| `admin/products/bulk-price` | POST | ✅ | (Gotcha #12: بلا حد أقصى نسبة — مشكلة صحة بيانات) |
| `admin/import` | POST | ✅ | |
| `admin/export` | GET | ✅ | |
| `admin/stats` | GET | ✅ | **تحقّق فعلي عبر curl بدون كوكي → 401** |
| `admin/discounts/global` | GET, POST, DELETE | ✅ الثلاثة | (أُصلحت سابقًا، `discount-audit.md`) |
| `admin/discounts/targeted` | GET, POST, PUT, DELETE | ✅ الأربعة | (أُصلحت سابقًا، `discount-audit.md`) |
| `admin/announcement` | GET, POST, DELETE | ❌ **GET فقط** / ✅ POST, DELETE | **ثغرة مؤكدة — انظر أدناه** |
| `auth/login` | POST | (غير منطبق — ينشئ الجلسة) | rate limited، انظر 2.2 |
| `auth/logout` | POST | (غير منطبق — يمسح كوكي فقط) | |
| `upload` | POST | ✅ | يتحقق حجم/نوع الملف قبل الرفع لـCloudinary |
| `products`, `products/[id]` | GET | (عام بالتصميم) | قراءة فقط، parameterized queries |
| `announcement` (عام) | GET | (عام بالتصميم) | نفس بيانات `admin/announcement` GET بالضبط |
| `discounts` (عام) | GET | (عام بالتصميم، موثّق Gotcha #8) | |
| `views` | POST | (عام بالتصميم) | يتحقق `productId` رقم صحيح موجب وموجود فعليًا |
| `visit` | POST | (عام بالتصميم) | يستثني referer فيه `/admin`، dedup بالـIP كل 30 دقيقة |

**الثغرة الوحيدة المكتشفة: `GET /api/admin/announcement` (`src/app/api/admin/announcement/route.ts:5-11`) بدون `isAuthenticated` — بعكس كل شقيق آخر بـ`admin/**`، وبعكس `POST`/`DELETE` بنفس الملف (محميان صح، أسطر 14 و26).**

**تحقّق فعلي عبر curl بدون كوكي:**
```
$ curl -s -w "\nHTTP_STATUS:%{http_code}\n" http://localhost:3000/api/admin/announcement
null
HTTP_STATUS:200
```
مقارنة بـ route إداري آخر بنفس المجلد (`admin/stats`، سلوك صحيح):
```
$ curl -s -w "\nHTTP_STATUS:%{http_code}\n" http://localhost:3000/api/admin/stats
{"error":"Unauthorized"}
HTTP_STATUS:401
```
**تقييم خطورة واقعي:** منخفض. البيانات المُرجَعة (نص الإعلان + حالة تفعيله) **متطابقة حرفيًا** مع ما يرجعه `GET /api/announcement` العام (بدون بادئة `admin/`) — وهو مسار مصمَّم أصلًا ليكون عامًا بدون مصادقة. **تحقّق فعلي:**
```
$ curl -s -w "\nHTTP_STATUS:%{http_code}\n" http://localhost:3000/api/announcement
null
HTTP_STATUS:200
```
نفس القيمة (`null` — لا إعلان مفعّل وقت الاختبار) من كلا المسارين. يعني: لا تسريب معلومة إضافية فعليًا (نفس البيانات متاحة أصلًا بشكل شرعي)، لكنها تبقى **ثغرة حقيقية بمعنى "مخالفة نمط الحماية المتوقّع لكل شيء تحت `admin/**`"** — أي تغيير مستقبلي (لو صار `admin/announcement` GET يرجع حقل إضافي غير موجود بالنسخة العامة) يتحول فورًا لتسريب فعلي بدون أي تنبيه، لأن الحارس غائب أصلًا.

### 2.4 ثغرات إضافية

**أ. CSRF — الاعتماد كليًا على `SameSite=strict` بدون طبقة ثانية**
لا يوجد CSRF token بأي مكان (`grep -ri csrf src/` = صفر). كل route إداري متغيّر الحالة (`admin/**` POST/PUT/DELETE) محمي فقط بـ`isAuthenticated` (فحص كوكي JWT). الكوكي نفسها `SameSite=strict` (`login/route.ts:59`) — هذا **يمنع فعليًا** إرسال الكوكي مع طلبات cross-site (سواء GET أو POST)، وهو دفاع CSRF فعّال ضمن حدوده لمتصفحات حديثة تدعم `SameSite` بشكل صحيح. **لا يوجد دفاع بعمق ثانٍ** (لا فحص `Origin`/`Referer`، لا CSRF token احتياطي) — لو وُجد يومًا خلل بتطبيق `SameSite` (متصفح قديم، أو subdomain مشترك يُنشئ سياق same-site غير مقصود)، لا توجد طبقة حماية بديلة.

**ب. متغيرات البيئة — لا تسريب مكتشَف**
`grep -r NEXT_PUBLIC_ src/` = صفر نتائج — لا سر خادمي يُبنى بحزمة العميل عبر هذه الآلية. كل قراءة لـ`process.env.*` (`JWT_SECRET`, `ADMIN_PASSWORD`, `TURSO_URL`, `TURSO_AUTH_TOKEN`, `CLOUDINARY_*`) موجودة بملفات خادمية فقط (`lib/auth.ts:4`, `lib/db.ts`, `api/upload/route.ts`). لم يُعثر على أي route يُرجع `process.env` كاملًا أو جزئيًا بردّه.

**ج. `dangerouslySetInnerHTML` / `eval` / حقن سكربت ديناميكي — لا يوجد**
`grep -rn "dangerouslySetInnerHTML|eval(|new Function(" src/` = صفر نتائج بالكامل.

**د. SQL Injection — لا يوجد، كل الاستعلامات parameterized**
فحص عيّني لعدة ملفات (`db.ts`, `login/route.ts:42`, `bulk-delete/route.ts`, `discounts/global/route.ts`) أكّد استخدام `db.execute({ sql, args })` بـ`?` placeholders بكل مكان، بما فيها الحالة الديناميكية (`bulk-delete` يبني عدد الـ`?` من طول المصفوفة لكن يمرر القيم عبر `args`، مو تضمين نصي مباشر بالـSQL). لا استعلام واحد بـstring interpolation مباشر بأي ملف تم فحصه.

**هـ. نسخة Next.js الفعلية و`npm audit`**
`package.json` يحدد `"next": "^15.2.4"` لكن النسخة **الفعلية المثبتة** (تحقّق مباشر: `node -e "console.log(require('next/package.json').version)"`) هي **`15.5.21`** — متطابقة مع ما وثّقه `CLAUDE.md` (Gotcha #6) كنتيجة لإصلاحات `npm audit fix` سابقة، ومؤكَّد أنها فعليًا بفرع `main` الحالي (لا حاجة لدمج فرع منفصل).

**`npm audit --json` أُعيد تشغيله مباشرة (تحقّق نهائي، ليس تقديرًا) — ناتج `metadata.vulnerabilities` حرفيًا:**
```json
{
  "info": 0,
  "low": 0,
  "moderate": 0,
  "high": 12,
  "critical": 0,
  "total": 12
}
```
**12 ثغرة بالضبط، كلها `high`، صفر بأي درجة أخرى.** تفصيل الـ12 حزمة كما تظهر بمفتاح `vulnerabilities` بالـJSON (اسم الحزمة + `isDirect`):

| الحزمة | `isDirect` | `via` |
|---|---|---|
| `brace-expansion` | false | `brace-expansion` (GHSA-mh99-v99m-4gvg، DoS) |
| `minimatch` | false | `brace-expansion` |
| `@eslint/config-array` | false | `minimatch` |
| `@eslint/eslintrc` | false | `minimatch` |
| `eslint-plugin-import` | false | `minimatch` |
| `eslint-plugin-jsx-a11y` | false | `minimatch` |
| `eslint-plugin-react` | false | `minimatch` |
| `eslint` | **true** | `@eslint/config-array`, `@eslint/eslintrc`, `minimatch` |
| `eslint-config-next` | **true** | `eslint`, `eslint-plugin-import`, `eslint-plugin-jsx-a11y`, `eslint-plugin-react` |
| `next` | **true** | `postcss`, `sharp` |
| `postcss` | false | (نسخة مدمجة داخل `next/node_modules/postcss`) |
| `sharp` | false | (مدمجة داخل `next@15.5.21`) |

يعني **9 من الـ12 حزمة** جذرها الوحيد ثغرة `brace-expansion` واحدة (DoS، `GHSA-mh99-v99m-4gvg`) المنتشرة عبر سلسلة تبعيات ESLint بالكامل (`minimatch` ← `@eslint/*` ← `eslint`/`eslint-plugin-*` ← `eslint-config-next`) — **كلها `devDependencies` فقط، لا تُشحن للإنتاج**، خطورتها الفعلية على التطبيق الحي = صفر (تؤثر فقط على بيئة التطوير/CI). الإصلاح (`eslint@10.8.0`) يتطلب ترقية major.

**الـ3 حزم المتبقية** (`next`, `postcss`, `sharp`) هي بالضبط الثغرتان الموثّقتان مسبقًا بـGotcha #5 — `next@15.5.21` نفسها تظهر كحزمة مباشرة مصابة (`isDirect: true`) *لأنها* تعتمد على نسخ مدمجة من `postcss`/`sharp` تحت عتبة الإصلاح؛ `sharp` (تحت نسخة الإصلاح 0.35.0) و`postcss` (نسخة مدمجة داخل `next/node_modules/postcss`، منفصلة عن النسخة الجذرية المصلَّحة) كلاهما متجذّر بـNext.js نفسه على آخر نسخة متاحة بخط 15.x — يتطلب حل حقيقي ترقية لـ16.x (قرار منفصل غير مُتخذ، كما وثّق Gotcha #5 أصلًا). `npm audit fix --force` **ليس خيارًا حقيقيًا** (بينزّل `next` لـ9.3.3 ويكسر التطبيق بالكامل — نفس التحذير الموثّق سابقًا).

---

## 3. تنظيف/آثار جانبية لاختبار Rate Limiting

اختبار استنفاد الحد الحقيقي (القسم 2.2) استُخدم فيه IP ثابت وهمي (`9.9.9.9`) وأيضًا محاكاة استخدام حقيقي بدون هيدر مخصص (يقع على مفتاح `'unknown'` بالكود — نفس المفتاح اللي يستخدمه أي طلب حقيقي محليًا بدون بروكسي). كلا المفتاحين وصلا فعليًا لحالة `429` (حد مستنفد لـ~15 دقيقة).

**خطوة التنظيف الفعلية المنفَّذة:**
1. بعد تسجيل نتيجة الاستنفاد (429 + قيمة `retryAfter`)، أُعيد تشغيل `npm run dev` بالكامل (إيقاف العملية القديمة بالكامل، بما فيها عملية orphaned تبيّن أنها بقيت شغّالة على المنفذ 3000 بعد أول محاولة إيقاف — أُنهيت صراحة بـ`Stop-Process`).
2. **تحقّق فعلي بعد إعادة التشغيل**: تسجيل دخول حقيقي بحساب الأدمن الفعلي (`admin` + `ADMIN_PASSWORD` من `.env.local`) أُرسل مباشرة بعد إعادة التشغيل:
```
HTTP status: 200
Set-Cookie header present (admin_token): yes
{"success":true}
```
هذا يثبت: الحد بذاكرة العملية (`Map`) صُفِّر تلقائيًا بإعادة التشغيل (متوقَّع، لأنه متغيّر module-scope)، وتسجيل الدخول الحقيقي **لم يبق محظورًا** لبقية نافذة الـ15 دقيقة الأصلية — لا أثر جانبي متبقٍ من اختبار الاستنفاد.

---

## 4. جدول المشاكل — بثلاثة أبعاد خطورة

**الأبعاد:** 🔴 قابل للاستغلال فعليًا (يمس أمان بيانات/حسابات حقيقية) | 🟡 تحصين/best-practice (دفاع بعمق ناقص، بدون استغلال مباشر مؤكَّد بحجم المشروع الحالي) | 🔵 كشف معلومات (info disclosure بدون أن يكون استغلالًا مباشرًا)

| # | القسم | الموقع بالكود | الوصف | الخطورة | ملاحظات | الحالة بعد المعالجة |
|---|---|---|---|---|---|---|
| 1 | Announcement API | `admin/announcement/route.ts:5-11` | `GET` بدون `isAuthenticated`، بعكس كل شقيق آخر بـ`admin/**` وبعكس `POST`/`DELETE` بنفس الملف. **تحقّق فعلي بـcurl بدون كوكي: 200 بدل 401** | 🔵 كشف معلومات (منخفض الأثر فعليًا — نفس البيانات متاحة أصلًا عبر `/api/announcement` العام) | لا حارس مركزي (middleware لا يحمي `/api/*`) — أي نسيان مشابه بأي route جديد لن يُكتشف تلقائيًا | ✅ **مُصلَح** (`fix/security-audit-issues`، commit `fix: require authentication on GET /api/admin/announcement`) — تحقّق: بدون كوكي 401، بكوكي أدمن صحيحة 200 وبيانات طبيعية |
| 2 | Rate limiting تسجيل الدخول | `auth/login/route.ts:6-8, 25` | `Map` بذاكرة العملية فقط، تُصفَّر عند كل cold start/instance جديد بـVercel serverless. **مؤكَّد بقراءة كود + تحقق عملي (إعادة تشغيل محلي تُصفّر الحد فورًا)** | 🟡 تحصين | **ليس** قابلًا للتجاوز عبر تزوير `x-forwarded-for` بالإنتاج على Vercel — المنصة تعيد كتابة الهيدر وتتجاهل قيمة العميل (موثّق رسميًا، انظر 2.2). التصنيف مقيَّد بافتراض النشر الفعلي خلف Vercel edge كما هو مخطَّط؛ ينعكس لـ🔴 لو تغيّرت بنية الاستضافة | 📄 **موثّق كقرار** — `CLAUDE.md` Gotcha #11 |
| 3 | CSP — `script-src` | `middleware.ts:24` | `'unsafe-eval'` مُفعَّل بدون شرط `NODE_ENV`، رغم تعليق الكود نفسه إنه للتطوير فقط. **تحقّق عملي حاسم: صفر استدعاءات `eval()` بحزمة الإنتاج المبنية فعليًا** | 🟡 تحصين | زائد بالكامل بالإنتاج، قابل للإزالة بدون كسر وظيفي متوقَّع حسب فحص الـchunks. يوسّع سطح هجوم XSS نظريًا لو ظهرت نقطة حقن مستقبلًا (لا يوجد حاليًا) | ✅ **مُصلَح** (`fix/security-audit-issues`، commit `fix: restrict CSP unsafe-eval to development mode only`) — تحقّق: `grep` صفر eval() بالإنتاج، `curl -I` يؤكد غياب `unsafe-eval` بوضع `npm start`، وجولة حية بالمتصفح (صفحات عامة + لوحة أدمن كاملة) بصفر CSP violations |
| 4 | CSP — `script-src`/`style-src` | `middleware.ts:24-25` | `'unsafe-inline'` بكليهما بدون آلية nonce. **تحقّق عملي: سكربت bootstrap واحد فعلي بدون nonce بالـHTML المُصيَّر، واستخدام `style` prop مباشر بعدة ملفات React** | 🟡 تحصين | مطلوب فعليًا حاليًا لتشغيل التطبيق (لا nonce بديل) — المصدر (كود التطبيق نفسه، لا مدخلات مستخدم) يجعل الخطر الفعلي منخفض، لكنه يلغي فائدة CSP كحاجز ضد XSS لو ظهرت نقطة حقن مستقبلًا | 📄 **موثّق كقرار** — `CLAUDE.md` Gotcha #16 (فقرة `unsafe-inline`) |
| 5 | هيدرز الأمان | `middleware.ts:15-19` مقابل `next.config.js:19-25` | 5 هيدرز (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`) مكرَّرة حرفيًا بملفين منفصلين، بينما `HSTS` بملف واحد فقط (`next.config.js`) و`CSP` بملف واحد فقط (`middleware.ts`). **تحقّق فعلي عبر curl: كل الثمانية تصل فعليًا بنفس الطلب** | 🟡 تحصين/صيانة | لا خلل عملي حاليًا (النتيجة النهائية صحيحة)، لكن خطر صيانة — تعديل هيدر واحد بملف واحد بس ينتج تناقضًا صامتًا | 📄 **موثّق كقرار** — `CLAUDE.md` Gotcha #16 (فقرة تكرار الهيدرز) |
| 6 | CSRF | لا يوجد ملف مخصص | لا CSRF token بأي مكان — الاعتماد الكامل على `sameSite: 'strict'` بكوكي `admin_token` (`login/route.ts:59`) بدون أي دفاع بعمق ثانٍ (لا فحص Origin/Referer) | 🟡 تحصين | `SameSite=strict` دفاع فعّال ضمن حدوده بالمتصفحات الحديثة؛ الفجوة هي غياب طبقة احتياطية لو فشل هذا الدفاع لأي سبب | ⏸️ **قيد الاستشارة** — تحليل (تعديل مقترح/تعقيد/مخاطرة) عُرض على المستخدم، لسا ما تقرر، صفر تنفيذ |
| 7 | Rate limiting IP key | `auth/login/route.ts:25` | مفتاح الحد يعتمد حصرًا على `x-forwarded-for` بدون أي fallback موثوق غير `'unknown'` الثابت | 🟡 تحصين | لا يمثّل ثغرة إضافية مستقلة عن البند 2 — نفس الجذر (اعتماد كامل على IP-based key بدل مصادقة الجلسة نفسها) | 📄 **موثّق كقرار** — `CLAUDE.md` Gotcha #11 (نفس فقرة بند 2) |
| 8 | `npm audit` | `package.json` / `package-lock.json` | **12 ثغرة بالضبط (تحقّق مباشر عبر `npm audit --json`، `metadata.vulnerabilities.total=12`، كلها `high`، صفر critical/moderate/low)**: 9 حزم بسلسلة devDependencies (`eslint`, `eslint-config-next`, `eslint-plugin-import`, `eslint-plugin-jsx-a11y`, `eslint-plugin-react`, `@eslint/config-array`, `@eslint/eslintrc`, `minimatch`, `brace-expansion` — كلها جذرها ثغرة `brace-expansion` واحدة)، و3 حزم (`next`, `postcss`, `sharp`) هي بالضبط الثغرتان الموثّقتان مسبقًا Gotcha #5 (`next` تظهر كحزمة مباشرة مصابة لأنها تعتمد على نسخ `postcss`/`sharp` المدمجتين تحت عتبة الإصلاح) | 🟡 تحصين (devDeps) / 🟡 تحصين (sharp+postcss المدمجتان، تتطلب ترقية major لـNext 16.x) | لا اكتشاف جديد بالثغرتين الجذريتين (موثّقتان أصلًا بـGotcha #5)؛ الجديد هو سلسلة devDependencies (9 من أصل 12 حزمة) — أثرها العملي على التطبيق الحي = صفر (لا تُشحن للإنتاج) | 📄 **موثّق كقرار** — `CLAUDE.md` Gotcha #20 (جديد) |

---

## ملخص سريع

- **آلية الحماية الأساسية (JWT + `isAuthenticated`) سليمة بنيويًا** وتُطبَّق بشكل صحيح على كل `admin/**` API route **ما عدا استثناء واحد مؤكَّد**: `GET /api/admin/announcement` (بند 1) — خطورة فعلية منخفضة لأن نفس البيانات عامة أصلًا، لكنه مخالفة نمط تستحق تصحيحًا.
- **`middleware.ts` لا يوفر أي حماية لـ`/api/*`** (حصرًا هيدرز أمان) — كل route مسؤول عن مصادقة نفسه بدون شبكة أمان ثانية؛ هذا يفسّر جذريًا ليش بند 1 حصل ولن يُكتشف تلقائيًا مستقبلًا لو تكرر بروت جديد.
- **`rate limiting` (Gotcha #11) مؤكَّد `Map` بذاكرة العملية فعليًا (قراءة كود + تحقق عملي حي)**، لكن **حُسم صراحة أنه غير قابل للتجاوز عبر تزوير `x-forwarded-for` على Vercel بالإنتاج** (توثيق Vercel الرسمي: المنصة تعيد كتابة الهيدر وتتجاهل قيمة العميل) — التصنيف الصحيح 🟡 (ضعف multi-instance/cold-start فقط)، وليس 🔴 (تجاوز كامل). هذا الحسم مشروط ببقاء النشر خلف Vercel edge كما هو مخطَّط؛ يستحق إعادة تقييم لو تغيّرت بنية الاستضافة.
- **الاختبار العملي لاستنفاد الحد نُظِّف فورًا** — إعادة تشغيل dev server صفّرت الحد، وتحقّق فعلي (تسجيل دخول حقيقي ناجح) أكّد عدم بقاء أي حظر متبقٍ.
- **`unsafe-inline`/`unsafe-eval` بالـCSP (Gotcha #16) مطلوبان وظيفيًا حاليًا (باستثناء `unsafe-eval` بالإنتاج تحديدًا، مؤكَّد زائد بفحص فعلي لحزمة البناء)**، لكن لا يوجد أي نقطة XSS فعلية مكتشفة يستغلانها حاليًا (بحث شامل: صفر `dangerouslySetInnerHTML`/`eval`/`new Function`) — الخطر حاليًا نظري/دفاع-بعمق-ناقص، وليس استغلالًا قائمًا.
- **لا CSRF token، لا تسريب env vars، لا SQL injection** — الاعتماد على `SameSite=strict` وحده لـCSRF (فعّال ضمن حدوده)، وكل الاستعلامات parameterized فعليًا.
- **نسخة Next.js الفعلية مؤكَّدة `15.5.21` بفرع `main`** — متطابقة مع توثيق `CLAUDE.md`. `npm audit --json` (تحقّق مباشر) أرجع **12 ثغرة بالضبط، كلها `high`**: 9 حزم بسلسلة devDependencies (جذرها ثغرة `brace-expansion` واحدة، أثر عملي صفر على الإنتاج) + 3 حزم (`next`, `postcss`, `sharp`) هي بالضبط الثغرتان الموثّقتان مسبقًا Gotcha #5 (تتطلبان ترقية major لـNext 16.x).
- **لا إصلاح تم بهذا التدقيق نفسه** — كل الملاحظات موثّقة أعلاه فقط، بفرع `audit/security` منفصل عن `main`.

## ملخص سريع (بعد جلسة المعالجة — 2026-07-25، فرع `fix/security-audit-issues`)

- **بندان انحلّا بكود فعلي، كل واحد بـcommit منفصل مع إعادة تشغيل نفس اختبار التقرير الأصلي (curl/build/متصفح) للتأكد من التغيير الفعلي**: بند 1 (`isAuthenticated` على `GET /api/admin/announcement`) وبند 3 (`unsafe-eval` صار شرطي بـ`NODE_ENV`).
- **5 بنود (2، 4، 5، 7، 8) وُثِّقت كقرارات مقبولة/مؤجَّلة بـ`CLAUDE.md`** (Gotcha #11، Gotcha #16، وGotcha #20 الجديد) — بدون أي تعديل كود، لأنها إما دفاع بعمق ناقص بدون استغلال مؤكَّد، أو محكومة بحسم خارجي (توثيق Vercel)، أو تتطلب قرار ترقية major منفصل.
- **بند 6 (CSRF) لسا قيد الاستشارة** — تحليل كامل (تعديل مقترح، تعقيد منخفض، مخاطرة متوسطة بسبب احتمال false positives على Origin/Referer) عُرض على المستخدم، بانتظار قرار بمحادثة لاحقة.
- **`npm run build`، `npm run lint`، و`npx tsc --noEmit` الثلاثة نجحوا بدون أخطاء** بعد كلا الإصلاحين (تحذيرات ESLint المتبقية كلها سابقة الوجود وموثّقة أصلًا بـCLAUDE.md، لا علاقة لها بهالجلسة).
- **إعادة فحص الهيدرز الثمانية عبر curl -I (dev وproduction) بعد تعديل `unsafe-eval` أكّدت صفر تراجع** — كل الهيدرز/التوجيهات الأخرى بقيت مطابقة تمامًا لما كانت عليه بالتدقيق الأصلي.
- **لا merge ولا push** — الجلسة توقفت على فرع `fix/security-audit-issues` بانتظار مراجعة المستخدم النهائية.
