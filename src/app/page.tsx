import Navbar from '@/components/layout/Navbar';

// ISR: revalidate home page every 60 seconds
export const revalidate = 60;
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/ui/ProductCard';
import ScrollReveal from '@/components/ui/ScrollReveal';
import Link from 'next/link';
import { Trophy, Zap, HandCoins, Lock, Smartphone, MessageCircle } from 'lucide-react';

async function getFeaturedProducts() {
  try {
    const { getDb, initDb } = await import('@/lib/db');
    await initDb();
    const db = getDb();
    const result = await db.execute('SELECT * FROM products WHERE featured = 1 ORDER BY created_at DESC LIMIT 6');
    return result.rows.map(r => ({
      id: Number(r.id),
      name: String(r.name ?? ''),
      description: String(r.description ?? ''),
      price: Number(r.price),
      image: r.image ? String(r.image) : null,
      category: String(r.category ?? 'games'),
      featured: Number(r.featured ?? 0),
    }));
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const featured = await getFeaturedProducts();

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden grid-bg">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{animationDelay:'1s'}}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl"></div>
        </div>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {['△','○','✕','□'].map((sym,i) => (
            <div key={i} className="absolute text-primary/10 font-black text-6xl animate-float"
              style={{top:`${20+i*18}%`,right:`${5+i*8}%`,animationDelay:`${i*0.5}s`}}>{sym}</div>
          ))}
          {['△','○','✕','□'].map((sym,i) => (
            <div key={i+4} className="absolute text-primary/10 font-black text-4xl animate-float"
              style={{top:`${30+i*15}%`,left:`${3+i*7}%`,animationDelay:`${i*0.7}s`}}>{sym}</div>
          ))}
        </div>

        <div className="relative z-10 text-center max-w-5xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary-light text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mt-16 sm:mt-4 mb-5 sm:mb-8 animate-fade-in">
            <span className="w-2 h-2 bg-accent rounded-full animate-pulse"></span>
            متجر موثوق منذ 2017
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white mb-5 leading-tight animate-slide-up">
            <span className="block">أفضل ألعاب</span>
            <span className="block bg-gradient-to-l from-accent via-primary-light to-primary bg-clip-text text-transparent text-glow">
              PlayStation
            </span>
          </h1>
          <p className="text-xl sm:text-2xl text-slate-300 mb-4 font-semibold animate-slide-up animation-delay-200">
            بأسعار أرخص من السوق والمتجر الرسمي
          </p>
          <p className="text-slate-400 mb-12 max-w-xl mx-auto leading-relaxed animate-slide-up animation-delay-400">
            تشكيلة ضخمة من ألعاب PS4 و PS5 واشتراكات PS Plus. تسليم رقمي فوري وخدمة عملاء على مدار الساعة.
          </p>
          <div className="flex flex-col items-center gap-3 animate-slide-up animation-delay-600 w-full max-w-sm mx-auto">
            {/* Main button - full width */}
            <Link href="/products" className="w-full text-center ps-btn text-xl py-5 glow-blue">
              تصفح المنتجات
            </Link>
            {/* Social buttons - smaller, side by side */}
            <div className="flex gap-3 w-full">
              <a href="https://wa.me/966508949041" target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-green-600/20 hover:bg-green-600 border border-green-600/50 text-green-400 hover:text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.525 5.847L.057 23.516a.5.5 0 00.612.612l5.666-1.469A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.99 0-3.86-.538-5.468-1.476l-.392-.232-4.062 1.054 1.054-4.061-.232-.393A9.936 9.936 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                واتساب
              </a>
              <a href="https://instagram.com/Billy_Store3" target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-l from-purple-600/20 to-pink-500/20 hover:from-purple-600 hover:to-pink-500 border border-pink-500/50 text-pink-400 hover:text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                إنستقرام
              </a>
              <a href="https://t.me/BillyStore1" target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-blue-500/20 hover:bg-blue-500 border border-blue-500/50 text-blue-400 hover:text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                تيليجرام
              </a>
            </div>
          </div>
          <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto">
            {[['7+','سنوات خبرة'],['+1000','عميل راضٍ'],['500+','لعبة متاحة']].map(([num,label]) => (
              <div key={label} className="text-center">
                <div className="text-xs text-slate-400 mb-1">{label}</div>
                <div className="text-2xl sm:text-3xl font-black text-accent leading-none">{num}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT PREVIEW ── */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <ScrollReveal direction="right">
              <span className="text-accent font-bold text-sm uppercase tracking-wider">من نحن</span>
              <h2 className="text-4xl font-black text-white mt-2 mb-6">
                أكثر من مجرد متجر —<br />
                <span className="text-primary-light">نحن مجتمع لاعبين</span>
              </h2>
              <p className="text-slate-400 leading-relaxed mb-6">
                بيلي ستور هو متجرك الموثوق لألعاب PlayStation منذ عام 2017. بدأنا بشغف حقيقي للألعاب ورغبة في توفير أسعار مناسبة للاعبين السعوديين، واليوم نخدم آلاف العملاء بأفضل الأسعار وأسرع التسليم.
              </p>
              <Link href="/about" className="inline-flex items-center gap-2 text-accent hover:text-white font-bold transition-colors group">
                اعرف أكثر عنا
                <span className="group-hover:translate-x-1 transition-transform">←</span>
              </Link>
            </ScrollReveal>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              {icon:<Trophy size={30} className="text-amber-400" />,title:'موثوقية عالية',desc:'أكثر من 7 سنوات في السوق'},
              {icon:<Zap size={30} className="text-accent" />,title:'تسليم فوري',desc:'رقمي وسريع 24/7'},
              {icon:'💰',title:'أسعار منافسة',desc:'أرخص من المتجر الرسمي'},
              {icon:'🎮',title:'مكتبة ضخمة',desc:'PS4 و PS5 وكل جديد'},
            ].map((item,i) => (
              <ScrollReveal key={item.title} direction="up" delay={i*100}>
                <div className="bg-dark-card border border-dark-border rounded-xl p-4 hover:border-primary/50 transition-colors h-full">
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h4 className="font-bold text-white text-sm mb-1">{item.title}</h4>
                  <p className="text-muted text-xs">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ── */}
      <section className="py-20 px-4 bg-dark-card/30">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal direction="up">
            <div className="flex items-center justify-between mb-12">
              <div>
                <span className="text-accent font-bold text-sm uppercase tracking-wider">أبرز المنتجات</span>
                <h2 className="text-4xl font-black text-white mt-2">العروض المميزة</h2>
              </div>
              <Link href="/products" className="hidden sm:flex items-center gap-2 text-primary-light hover:text-accent font-semibold transition-colors group">
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
              <Link href="/products" className="ps-btn">عرض كل المنتجات</Link>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── WHY BUY FROM US ── */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <ScrollReveal direction="up">
          <div className="text-center mb-14">
            <span className="text-accent font-bold text-sm uppercase tracking-wider">لماذا نحن؟</span>
            <h2 className="text-4xl font-black text-white mt-2">لماذا تختار بيلي ستور؟</h2>
          </div>
        </ScrollReveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {icon:<HandCoins size={48} className="text-accent" />,title:'أسعار لا تُنافس',desc:'وفّر أكثر مع كل عملية شراء مقارنة بالمتجر الرسمي والسوق المحلي'},
            {icon:<Lock size={48} className="text-accent" />,title:'متجر موثوق',desc:'أكثر من 7 سنوات من الخبرة وآلاف العملاء الراضين في المملكة'},
            {icon:<Smartphone size={48} className="text-accent" />,title:'تسليم رقمي فوري',desc:'استلم منتجك في دقائق مباشرة على حسابك دون انتظار أو شحن'},
            {icon:<MessageCircle size={48} className="text-accent" />,title:'دعم على مدار الساعة',desc:'فريقنا متاح دائماً عبر واتساب لمساعدتك والرد على استفساراتك'},
          ].map((item,i) => (
            <ScrollReveal key={item.title} direction="up" delay={i*120}>
              <div className="bg-dark-card border border-dark-border rounded-2xl p-6 text-center group hover:border-primary/50 hover:bg-dark-card/80 transition-all duration-300 card-hover h-full">
                <div className="text-5xl mb-4">{item.icon}</div>
                <h3 className="font-black text-white text-lg mb-3 group-hover:text-accent transition-colors">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-4">
        <ScrollReveal direction="scale">
          <div className="max-w-4xl mx-auto text-center bg-gradient-to-l from-primary/20 via-dark-card to-accent/10 border border-primary/30 rounded-3xl p-12 relative overflow-hidden">
            <div className="absolute inset-0 grid-bg opacity-30"></div>
            <div className="relative z-10">
              <h2 className="text-4xl font-black text-white mb-4">جاهز تبدأ تلعب؟</h2>
              <p className="text-slate-300 mb-8 text-lg">تواصل معنا الآن واحصل على أفضل صفقة</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a href="https://wa.me/966508949041?text=مرحباً، أريد الاستفسار عن المنتجات" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-3 bg-green-600 hover:bg-green-500 text-white font-black py-4 px-10 rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-green-500/30 text-lg">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.525 5.847L.057 23.516a.5.5 0 00.612.612l5.666-1.469A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.99 0-3.86-.538-5.468-1.476l-.392-.232-4.062 1.054 1.054-4.061-.232-.393A9.936 9.936 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                  واتساب
                </a>
                <a href="https://instagram.com/Billy_Store3" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-3 bg-gradient-to-l from-purple-600 to-pink-500 hover:opacity-90 text-white font-black py-4 px-10 rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-pink-500/30 text-lg">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  إنستقرام
                </a>
                <a href="https://t.me/BillyStore1" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-3 bg-blue-500/20 hover:bg-blue-500 border border-blue-500/50 text-blue-400 hover:text-white font-black py-4 px-10 rounded-xl transition-all duration-300 text-lg">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                  تيليجرام
                </a>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      <Footer />
    </div>
  );
}
