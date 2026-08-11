import Navbar from '@/components/layout/Navbar';

// ISR: revalidate home page every 60 seconds
export const revalidate = 60;
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/ui/ProductCard';
import ScrollReveal from '@/components/ui/ScrollReveal';
import PsGlyphField from '@/components/ui/PsGlyphField';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { FeatureCard } from '@/components/ui/Card';
import CategoryTiles, { type CategoryTile } from '@/components/ui/CategoryTiles';
import Link from 'next/link';
import { Zap, HandCoins, Lock, Smartphone, MessageCircle, ShieldCheck, Wallet, Gamepad2 } from 'lucide-react';
import { CATEGORY_TILES } from '@/lib/siteImages';

const WaIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.525 5.847L.057 23.516a.5.5 0 00.612.612l5.666-1.469A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.99 0-3.86-.538-5.468-1.476l-.392-.232-4.062 1.054 1.054-4.061-.232-.393A9.936 9.936 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
);
const IgIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
);
const TgIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
);

/**
 * كل بيانات الصفحة الرئيسية باستعلامات متوازية. تعمل مرة كل 60 ثانية فقط
 * بفضل revalidate أعلاه، لا لكل زائر.
 */
async function getHomeData() {
  try {
    const { getDb, initDb } = await import('@/lib/db');
    await initDb();
    const db = getDb();

    // بطاقات التصنيف تستخدم لوجوهات ثابتة، فلا حاجة لجلب غلاف لكل فئة —
    // العدّاد وحده هو ما يأتي من قاعدة البيانات
    const [featuredRes, countsRes] = await Promise.all([
      db.execute('SELECT * FROM products WHERE featured = 1 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 6'),
      db.execute('SELECT category, COUNT(*) AS n FROM products WHERE deleted_at IS NULL GROUP BY category'),
    ]);

    const featured = featuredRes.rows.map(r => ({
      id: Number(r.id),
      name: String(r.name ?? ''),
      description: String(r.description ?? ''),
      price: Number(r.price),
      image: r.image ? String(r.image) : null,
      category: String(r.category ?? 'games'),
      featured: Number(r.featured ?? 0),
    }));

    const counts = new Map(countsRes.rows.map(r => [String(r.category), Number(r.n ?? 0)]));

    const tiles: CategoryTile[] = CATEGORY_TILES.map(t => ({
      key: t.key,
      label: t.label,
      desc: t.desc,
      href: t.href,
      countText: t.countLabel(counts.get(t.key) ?? 0),
      logo: t.logo,
      // التصنيفات الفارغة تُستبعد أدناه حتى لا نرسل الزائر لصفحة بلا نتائج
    })).filter(t => (counts.get(t.key) ?? 0) > 0);

    return { featured, tiles };
  } catch {
    return { featured: [], tiles: [] as CategoryTile[] };
  }
}

export default async function HomePage() {
  const { featured, tiles } = await getHomeData();

  return (
    <div className="min-h-screen">
      <Navbar />

      <main>
      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden grid-bg">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-brand/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-gold/60 rounded-full blur-3xl animate-pulse" style={{animationDelay:'1s'}}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand/5 rounded-full blur-3xl"></div>
        </div>
        <PsGlyphField layout="ring" density="default" />

        <div className="relative z-10 text-center max-w-5xl mx-auto px-4">
          <Badge variant="gold" icon={<span className="w-2 h-2 bg-brand rounded-full animate-pulse" />}
            className="mt-16 sm:mt-4 mb-5 sm:mb-8 animate-fade-in">
            متجر موثوق منذ 2017
          </Badge>
          <h1 className="text-4xl/tight sm:text-6xl/tight md:text-7xl/tight font-bold font-display text-ink mb-4 animate-fade-in">
            نفس المتعة، نفس اللعبة
          </h1>
          <p className="text-2xl/relaxed sm:text-4xl/relaxed md:text-5xl/relaxed font-bold mb-4 py-1 text-brand animate-slide-up animation-delay-200">
            بسعر أقل من المتجر الرسمي بكثير
          </p>
          <p className="text-muted mb-12 max-w-xl mx-auto leading-relaxed animate-slide-up animation-delay-400">
            تشكيلة ضخمة من ألعاب PS4 و PS5 واشتراكات PS Plus. تسليم رقمي خلال دقائق وخدمة عملاء على مدار الساعة.
          </p>
          <div className="flex flex-col items-center gap-3 animate-slide-up animation-delay-600 w-full max-w-sm mx-auto">
            {/* Main button - full width */}
            <Button href="/products" variant="primary" size="lg" fullWidth>تصفح المنتجات</Button>
            {/* Social buttons - smaller, side by side */}
            <div className="flex gap-3 w-full">
              <a href="https://wa.me/966508949041" target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-green-700 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-pill transition-all duration-300 text-sm">
                <WaIcon />
                واتساب
              </a>
              <a href="https://ig.me/m/Billy_Store3" target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-l from-purple-600 to-pink-600 hover:opacity-90 text-white font-bold py-3 px-4 rounded-pill transition-all duration-300 text-sm">
                <IgIcon />
                إنستقرام
              </a>
              <a href="https://t.me/BillyStore1" target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-pill transition-all duration-300 text-sm">
                <TgIcon />
                تيليجرام
              </a>
            </div>
          </div>
          <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto">
            {[['7+','سنوات خبرة'],['+1000','عميل راضٍ'],['500+','لعبة متاحة']].map(([num,label]) => (
              <div key={label} className="text-center">
                <div className="text-xs text-muted mb-1">{label}</div>
                <div className="text-2xl sm:text-3xl font-bold text-brand leading-none">{num}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORY TILES ── */}
      {tiles.length > 0 && (
        <section className="py-16 px-4 max-w-7xl mx-auto">
          <ScrollReveal direction="up">
            <div className="text-center mb-10">
              <span className="text-brand font-bold text-sm uppercase tracking-wider">وش تدور عليه؟</span>
              <h2 className="text-3xl sm:text-4xl font-bold font-display text-ink mt-2">اختر من وين تبدأ</h2>
            </div>
          </ScrollReveal>
          <CategoryTiles tiles={tiles} />
        </section>
      )}

      {/* ── ABOUT PREVIEW ── */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <ScrollReveal direction="right">
              <span className="text-brand font-bold text-sm uppercase tracking-wider">من نحن</span>
              <h2 className="text-4xl font-bold font-display text-ink mt-2 mb-6">
                أكثر من مجرد متجر —<br />
                <span className="text-brand">نحن لاعبون نخدم لاعبين</span>
              </h2>
              <p className="text-muted leading-relaxed mb-6">
                بيلي ستور هو متجرك الموثوق لألعاب PlayStation منذ عام 2017. بدأنا بشغف حقيقي للألعاب ورغبة في توفير أسعار مناسبة للاعبين السعوديين، واليوم نخدم آلاف العملاء بأفضل الأسعار وأسرع التسليم.
              </p>
              <Link href="/about" className="inline-flex items-center gap-2 text-brand hover:text-brand-ink font-bold transition-colors group">
                اعرف أكثر عنا
                <span className="group-hover:translate-x-1 transition-transform">←</span>
              </Link>
            </ScrollReveal>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              {icon:<ShieldCheck size={28} />,tone:'gold' as const,title:'ضمان مدى الحياة',desc:'استبدال سريع لأي مشكلة'},
              {icon:<Zap size={28} />,tone:'brand' as const,title:'تفعيل بسيط',desc:'حساب جاهز بخطوة واحدة'},
              {icon:<Wallet size={28} />,tone:'brand' as const,title:'دفع سهل وآمن',desc:'تحويل بنكي أو STC Pay'},
              {icon:<Gamepad2 size={28} />,tone:'brand' as const,title:'مكتبة ضخمة',desc:'PS4 و PS5 وكل جديد'},
            ].map((item,i) => (
              <ScrollReveal key={item.title} direction="up" delay={i*100}>
                <FeatureCard icon={item.icon} iconTone={item.tone} title={item.title} description={item.desc} className="h-full !p-4" />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ── */}
      <section className="py-20 px-4 bg-surface/60">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal direction="up">
            <div className="flex items-center justify-between mb-12">
              <div>
                <span className="text-brand font-bold text-sm uppercase tracking-wider">أبرز المنتجات</span>
                <h2 className="text-4xl font-bold font-display text-ink mt-2">العروض المميزة</h2>
              </div>
              <Link href="/products" className="hidden sm:flex items-center gap-2 text-brand hover:text-brand-ink font-bold transition-colors group">
                عرض الكل <span className="group-hover:translate-x-1 transition-transform">←</span>
              </Link>
            </div>
          </ScrollReveal>

          {featured.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {featured.map((product, i) => (
                <ScrollReveal key={product.id} direction="up" delay={i * 80}>
                  <ProductCard product={product} />
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted">لا توجد منتجات مميزة حالياً</div>
          )}

          <div className="text-center mt-8 sm:hidden">
            <ScrollReveal direction="up">
              <Button href="/products" variant="primary">عرض كل المنتجات</Button>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── WHY BUY FROM US ── */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <ScrollReveal direction="up">
          <div className="text-center mb-14">
            <span className="text-brand font-bold text-sm uppercase tracking-wider">لماذا نحن؟</span>
            <h2 className="text-4xl font-bold font-display text-ink mt-2">لماذا تختار بيلي ستور؟</h2>
          </div>
        </ScrollReveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {icon:<HandCoins size={28} />,title:'أسعار لا تنافس',desc:'وفّر أكثر مع كل عملية شراء مقارنة بالمتجر الرسمي والسوق المحلي'},
            {icon:<Lock size={28} />,title:'متجر موثوق',desc:'أكثر من 7 سنوات من الخبرة وآلاف العملاء الراضين في المملكة'},
            {icon:<Smartphone size={28} />,title:'تسليم رقمي سريع',desc:'استلم منتجك في دقائق مباشرة على حسابك دون انتظار أو شحن'},
            {icon:<MessageCircle size={28} />,title:'دعم على مدار الساعة',desc:'فريقنا متاح دائماً عبر واتساب لمساعدتك والرد على استفساراتك'},
          ].map((item,i) => (
            <ScrollReveal key={item.title} direction="up" delay={i*120}>
              <FeatureCard icon={item.icon} title={item.title} description={item.desc} className="text-center items-center h-full" />
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-4">
        <ScrollReveal direction="scale">
          <div className="max-w-4xl mx-auto text-center bg-gradient-to-l from-brand/10 via-surface to-gold/20 border border-chip rounded-card p-12 relative overflow-hidden shadow-soft">
            <div className="absolute inset-0 grid-bg opacity-30"></div>
            <div className="relative z-10">
              <h2 className="text-4xl font-bold font-display text-ink mb-4">جاهز تبدأ تلعب؟</h2>
              <p className="text-muted mb-8 text-lg">تواصل معنا الآن واحصل على أفضل صفقة</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button href="https://wa.me/966508949041?text=مرحباً، أريد الاستفسار عن المنتجات" external size="lg"
                  icon={<WaIcon />} className="!bg-green-700 hover:!bg-green-600 hover:shadow-xl hover:shadow-green-500/30">
                  واتساب
                </Button>
                <Button href="https://ig.me/m/Billy_Store3" external size="lg" icon={<IgIcon />}
                  className="!bg-gradient-to-l !from-purple-600 !to-pink-600 hover:opacity-90 hover:shadow-xl hover:shadow-pink-500/30">
                  إنستقرام
                </Button>
                <Button href="https://t.me/BillyStore1" external size="lg" icon={<TgIcon />}
                  className="!bg-blue-600 hover:!bg-blue-700 hover:shadow-xl hover:shadow-blue-500/30">
                  تيليجرام
                </Button>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>
      </main>

      <Footer />
    </div>
  );
}
