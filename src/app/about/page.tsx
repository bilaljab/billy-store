import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ScrollReveal from '@/components/ui/ScrollReveal';
import PsGlyphField from '@/components/ui/PsGlyphField';
import { FeatureCard } from '@/components/ui/Card';
import { Calendar, Trophy, Smile, Gamepad2, HandCoins, Handshake, Zap, CircleCheck, Lock, Phone, Gift } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <div className="relative pt-24 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-40"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-gold/40 rounded-full blur-3xl"></div>
        <PsGlyphField layout="scatter" density="sparse" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <ScrollReveal direction="up">
            <span className="text-brand font-bold text-sm uppercase tracking-wider">من نحن</span>
            <h1 className="text-5xl sm:text-6xl tracking-tight font-bold font-display text-ink mt-2 mb-6">
              قصة <span className="text-brand">بيلي ستور</span>
            </h1>
            <p className="text-muted text-xl leading-relaxed max-w-2xl mx-auto">
              من شغف اللعب إلى منصة موثوقة لآلاف اللاعبين في المملكة العربية السعودية
            </p>
          </ScrollReveal>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-20">

        {/* Story */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <ScrollReveal direction="right">
            <h2 className="text-3xl font-bold font-display text-ink mb-6">
              كيف بدأت <span className="text-brand">الرحلة؟</span>
            </h2>
            <div className="space-y-4 text-muted leading-loose">
              <p>
                بدأت قصة بيلي ستور عام <span className="text-ink font-bold">2017</span> من شغف حقيقي بعالم الألعاب الإلكترونية. لاحظنا أن أسعار ألعاب PlayStation في المتاجر الرسمية والسوق المحلي مرتفعة وغير مناسبة لكثير من اللاعبين السعوديين.
              </p>
              <p>
                قررنا أن نكون الحل. انطلقنا بهدف واضح: توفير أفضل ألعاب <span className="text-ink font-bold">PS4 وPS5</span> واشتراكات PS Plus بأسعار تنافسية وخدمة عملاء استثنائية.
              </p>
              <p>
                اليوم، بعد أكثر من 7 سنوات، أصبح بيلي ستور اسماً موثوقاً لدى آلاف اللاعبين في المملكة، نفتخر بكل عميل راضٍ وكل تقييم إيجابي نحصل عليه.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 gap-4">
            {[
              { num: '2017', label: 'سنة التأسيس', icon: <Calendar size={32} /> },
              { num: '7+', label: 'سنوات خبرة', icon: <Trophy size={32} /> },
              { num: '1000+', label: 'عميل راضٍ', icon: <Smile size={32} /> },
              { num: '500+', label: 'لعبة متاحة', icon: <Gamepad2 size={32} /> },
            ].map((item, i) => (
              <ScrollReveal key={item.label} direction="up" delay={i * 100}>
                <div className="bg-surface border-2 border-black/15 rounded-card p-6 text-center hover:border-brand/50 transition-all card-hover shadow-soft">
                  <div className="flex justify-center text-brand mb-3">{item.icon}</div>
                  <div className="text-3xl font-bold text-brand mb-1">{item.num}</div>
                  <div className="text-muted text-sm">{item.label}</div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>

        {/* Mission */}
        <ScrollReveal direction="up">
          <div className="bg-gradient-to-l from-brand/10 via-surface to-gold/20 border border-chip rounded-card p-10 mb-20 relative overflow-hidden shadow-soft">
            <div className="absolute inset-0 grid-bg opacity-20"></div>
            <div className="relative z-10">
              <span className="text-brand font-bold text-sm uppercase tracking-wider">رسالتنا</span>
              <h2 className="text-3xl font-bold font-display text-ink mt-3 mb-6">لماذا نحن هنا؟</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: <HandCoins size={24} />, title: 'أسعار عادلة', desc: 'نؤمن أن كل لاعب يستحق الحصول على ألعابه المفضلة بسعر مناسب دون إنهاك ميزانيته' },
                  { icon: <Handshake size={24} />, title: 'خدمة صادقة', desc: 'نبني علاقات طويلة الأمد مع عملائنا مبنية على الصدق والشفافية والثقة المتبادلة' },
                  { icon: <Zap size={24} />, title: 'تجربة سلسة', desc: 'من التصفح حتى الاستلام، نضمن تجربة شراء سريعة وسهلة ومريحة لكل عميل' },
                ].map(item => (
                  <FeatureCard key={item.title} icon={item.icon} title={item.title} description={item.desc} className="text-center items-center" />
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Why Trust Us */}
        <div className="mb-20">
          <ScrollReveal direction="up">
            <div className="text-center mb-10">
              <span className="text-brand font-bold text-sm uppercase tracking-wider">الثقة</span>
              <h2 className="text-3xl font-bold font-display text-ink mt-2">لماذا يثق بنا عملاؤنا؟</h2>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: <CircleCheck size={24} />, title: 'سمعة لا تشترى', desc: 'أكثر من 7 سنوات في السوق مع سجل نظيف وتقييمات إيجابية متواصلة من عملائنا الكرام' },
              { icon: <Lock size={24} />, title: 'أمان تام', desc: 'جميع المنتجات أصلية 100% ومضمونة. لا مخاطر، لا مشاكل، راحة بال كاملة' },
              { icon: <Phone size={24} />, title: 'دعم حقيقي', desc: 'فريق دعم بشري حقيقي يرد عليك سريعاً ويحل مشكلتك بكل احترافية' },
              { icon: <Gift size={24} />, title: 'عروض مستمرة', desc: 'عملاؤنا الدائمون يحصلون على عروض خاصة وأسعار مميزة مكافأة لولائهم' },
            ].map((item, i) => (
              <ScrollReveal key={item.title} direction="up" delay={i * 100}>
                <FeatureCard icon={item.icon} title={item.title} description={item.desc} />
              </ScrollReveal>
            ))}
          </div>
        </div>

        {/* Contact */}
        <ScrollReveal direction="scale">
          <div className="bg-surface border-2 border-black/15 rounded-card p-10 shadow-soft">
            <div className="text-center mb-10">
              <span className="text-brand font-bold text-sm uppercase tracking-wider">تواصل</span>
              <h2 className="text-3xl font-bold font-display text-ink mt-2">نحن هنا من أجلك</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <a href="https://wa.me/966508949041?text=مرحباً بيلي ستور" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-4 bg-surface border-2 border-black/15 hover:border-green-300 rounded-card shadow-soft hover:shadow-float transition-all p-6 group">
                <div className="w-14 h-14 rounded-xl bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-all flex-shrink-0">
                  <svg className="w-7 h-7 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.525 5.847L.057 23.516a.5.5 0 00.612.612l5.666-1.469A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.99 0-3.86-.538-5.468-1.476l-.392-.232-4.062 1.054 1.054-4.061-.232-.393A9.936 9.936 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-muted text-xs mb-1">واتساب</p>
                  <p className="text-ink font-bold text-lg">+966 50 894 9041</p>
                  <p className="text-green-600 text-xs mt-1">متاح الآن ✓</p>
                </div>
              </a>

              <a href="https://ig.me/m/Billy_Store3" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-4 bg-surface border-2 border-black/15 hover:border-pink-300 rounded-card shadow-soft hover:shadow-float transition-all p-6 group">
                <div className="w-14 h-14 rounded-xl bg-pink-50 flex items-center justify-center group-hover:bg-pink-100 transition-all flex-shrink-0">
                  <svg className="w-7 h-7 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-muted text-xs mb-1">إنستقرام</p>
                  <p className="text-ink font-bold text-lg">@Billy_Store3</p>
                  <p className="text-pink-600 text-xs mt-1">تابعنا الآن ✓</p>
                </div>
              </a>

              <a href="https://t.me/BillyStore1" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-4 bg-surface border-2 border-black/15 hover:border-blue-300 rounded-card shadow-soft hover:shadow-float transition-all p-6 group">
                <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-all flex-shrink-0">
                  <svg className="w-7 h-7 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/></svg>
                </div>
                <div>
                  <p className="text-muted text-xs mb-1">تيليجرام</p>
                  <p className="text-ink font-bold text-lg" dir="ltr">@BillyStore1</p>
                  <p className="text-blue-600 text-xs mt-1">تواصل معنا ✓</p>
                </div>
              </a>
            </div>
          </div>
        </ScrollReveal>
      </div>

      <Footer />
    </div>
  );
}
