# دليل النشر - Billy Store

## خيار 1: Vercel (موصى به للمبتدئين)

### المتطلبات الأولية
1. حساب على [vercel.com](https://vercel.com)
2. حساب على [github.com](https://github.com)
3. Node.js مثبت على جهازك

### الخطوات

**أ) رفع الكود على GitHub:**
```bash
cd billy-store
git init
git add .
git commit -m "Billy Store - Initial commit"
# أنشئ repo جديد على GitHub ثم:
git remote add origin https://github.com/USERNAME/billy-store.git
git push -u origin main
```

**ب) ربط Vercel بـ GitHub:**
1. اذهب لـ vercel.com وسجل دخول
2. اضغط "New Project"
3. اختر الـ repo من GitHub
4. أضف متغيرات البيئة:
   - `JWT_SECRET` = أي نص سري طويل
5. اضغط Deploy

### ملاحظة مهمة للإنتاج
SQLite لا يعمل على Vercel (serverless). استخدم:
- **Neon.tech** (PostgreSQL مجاني) - أسهل خيار
- **PlanetScale** (MySQL)
- **Supabase** (PostgreSQL)

---

## خيار 2: VPS / سيرفر عادي

```bash
# على السيرفر:
git clone YOUR_REPO
cd billy-store
npm install
npm run build
npm start
```

استخدم **PM2** للتشغيل الدائم:
```bash
npm install -g pm2
pm2 start npm --name "billy-store" -- start
pm2 save
pm2 startup
```

---

## متغيرات البيئة المطلوبة

```env
JWT_SECRET=your-super-secret-key-here-minimum-32-chars
```

