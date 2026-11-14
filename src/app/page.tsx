import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Clock, Headset, ShieldCheck, Wallet } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/ui/ProductCard';
import HeroSlider from '@/components/ui/HeroSlider';
import Rail from '@/components/ui/Rail';
import Button from '@/components/ui/Button';
import { WhatsAppIcon, InstagramIcon, TelegramIcon } from '@/components/ui/BrandIcons';
import { BlurFade, BorderBeam, Marquee, NumberTicker, Spotlight } from '@/components/fx';
import { getCatalog, type CatalogProduct } from '@/lib/catalog';
import { applyDiscount } from '@/lib/discounts';
import { TIERS, tierOf } from '@/lib/psplus';
import { whatsappLink, GENERAL_INQUIRY, INSTAGRAM_URL, TELEGRAM_URL } from '@/lib/contact';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://billy-store.vercel.app';

// ISR: the whole page is rebuilt at most once a minute, not per visitor
export const revalidate = 60;

const TICKER = ['ضمان مدى الحياة', 'تسليم رقمي خلال دقائق', 'تحويل بنكي أو STC Pay', 'دعم على مدار الساعة', 'متجر موثوق منذ 2017', 'ألعاب PS4 و PS5'];

const ASSURANCES = [
  { Icon: Clock, title: 'تسليم خلال دقائق', desc: 'رقمي بالكامل، بدون شحن أو انتظار.' },
  { Icon: Wallet, title: 'دفع سهل وآمن', desc: 'تحويل بنكي مباشر أو STC Pay.' },
  { Icon: Headset, title: 'دعم على مدار الساعة', desc: 'عبر واتساب، كل أيام الأسبوع.' },
];

const STEPS = [
  { title: 'اختر منتجك', desc: 'تصفح الألعاب والاشتراكات وافتح صفحة المنتج اللي يناسبك.' },
  { title: 'راسلنا', desc: 'زر واتساب يجهز لك رسالة باسم المنتج وسعره، وأرسلها كما هي.' },
  { title: 'ادفع', desc: 'نرسل لك تفاصيل الدفع: تحويل بنكي مباشر أو STC Pay.' },
  { title: 'استلم والعب', desc: 'تستلم بيانات حساب جاهز خلال دقائق، وتفعله على جهازك.' },
];


function Posters({ products }: { products: CatalogProduct[] }) {
  return <>{products.map(p => <ProductCard key={p.id} product={p} />)}</>;
}

export default async function HomePage() {
  const { products } = await getCatalog('newest');

  const hasArt = (p: CatalogProduct) => (p.image ? 1 : 0);
  // The showcase leads with real artwork: products with a cover first, featured breaking ties
  const showcase = [...products].sort((a, b) => hasArt(b) - hasArt(a) || b.featured - a.featured).slice(0, 4);
  const offers = products.filter(p => p.discount).sort((a, b) => b.discount!.percentage - a.discount!.percentage).slice(0, 12);
  const featured = products.filter(p => p.featured === 1)
    .sort((a, b) => (a.featured_order ?? 1e9) - (b.featured_order ?? 1e9)).slice(0, 12);
  const newest = products.slice(0, 12);
  const games = products.filter(p => p.category === 'games');
  const subscriptions = products.filter(p => p.category === 'subscription').sort((a, b) => a.price - b.price);
  const tiers = TIERS.map(t => ({ tier: t.en, plans: subscriptions.filter(p => tierOf(p.name)?.key === t.key) })).filter(t => t.plans.length > 0);
  const untiered = subscriptions.filter(p => !tierOf(p.name));
  const counters = [
    { n: games.length, label: 'لعبة' },
    { n: subscriptions.length, label: 'اشتراك' },
    { n: offers.length, label: 'عرض الآن' },
  ].filter(c => c.n > 0);

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            { '@type': 'Organization', name: 'Billy Store', alternateName: 'بيلي ستور', url: SITE_URL, logo: `${SITE_URL}/logos/billy-store-logo.png`, sameAs: [INSTAGRAM_URL, TELEGRAM_URL] },
            { '@type': 'WebSite', name: 'Billy Store', url: SITE_URL, inLanguage: 'ar' },
          ],
        }).replace(/</g, '\\u003c') }}
      />
      <Navbar />

      <main id="main">

        {showcase.length > 0 ? (
          <HeroSlider products={showcase} />
        ) : (
          <section className="flex min-h-[70svh] items-center justify-center px-4 pt-28 text-center">
            <p className="max-w-md text-muted">لا توجد منتجات متاحة حالياً — تواصل معنا وسنساعدك مباشرة.</p>
          </section>
        )}

        {/* ── TICKER (Magic UI marquee) ── */}
        <Marquee className="border-y border-line bg-canvas-b py-4" duration={45}>
          {TICKER.map(item => (
            <span key={item} className="flex items-center gap-10 whitespace-nowrap text-sm font-bold text-ink/80 sm:text-base">
              {item}
              <span aria-hidden="true" className="h-1.5 w-1.5 rotate-45 bg-accent" />
            </span>
          ))}
        </Marquee>

        <div className="mx-auto max-w-7xl space-y-20 px-4 pt-16 sm:px-6 lg:space-y-28 lg:px-8 lg:pt-24">
          {/* ── STATEMENT ── */}
          <BlurFade>
            <section className="grid items-end gap-8 lg:grid-cols-[1.4fr_1fr]">
              {/* The page's visible H1 (the hero above is a product carousel, its titles are h2) */}
              <h1 className="font-display text-4xl font-bold leading-[1.35] text-ink text-balance sm:text-6xl sm:leading-[1.3]">
                نفس المتعة، نفس اللعبة
                <span className="block text-accent">بسعر أقل من المتجر الرسمي بكثير</span>
              </h1>
              <div>
                <p className="max-w-md leading-relaxed text-muted">
                  بيلي ستور (Billy Store): تشكيلة ضخمة من ألعاب PS4 و PS5 واشتراكات PS Plus. تسليم رقمي خلال دقائق وخدمة عملاء على مدار الساعة.
                </p>
                <dl className="mt-6 flex gap-8">
                  {counters.map(({ n, label }) => (
                    <div key={label} className="flex flex-col-reverse">
                      <dt className="text-sm text-muted">{label}</dt>
                      <dd className="text-4xl font-bold text-ink"><NumberTicker value={n} /></dd>
                    </div>
                  ))}
                </dl>
              </div>
            </section>
          </BlurFade>

          {offers.length > 0 && (
            <BlurFade><Rail title="عروض وخصومات" href="/products?sort=discount" linkLabel="كل العروض"><Posters products={offers} /></Rail></BlurFade>
          )}

          {featured.length > 0 && (
            <BlurFade><Rail title="المنتجات المميزة" href="/products" linkLabel="عرض الكل"><Posters products={featured} /></Rail></BlurFade>
          )}

          {/* ── PS PLUS: one column per tier, every row a real catalogue item ── */}
          {subscriptions.length > 0 && (
            <BlurFade>
              <section>
                <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center">
                  <Image src="/logos/ps-plus.png" alt="" width={640} height={618} sizes="80px" className="h-20 w-auto self-start" />
                  <div className="flex-1">
                    <h2 className="font-display text-3xl font-bold text-ink sm:text-5xl">اشتراكات PS Plus</h2>
                    <p className="mt-2 max-w-xl leading-relaxed text-muted">اختر الباقة والمدة — تفعيل خلال دقائق على حسابك.</p>
                  </div>
                  <Button href="/ps-plus" variant="secondary">كل الاشتراكات</Button>
                </div>

                <div className={`grid gap-4 ${tiers.length >= 3 ? 'lg:grid-cols-3' : tiers.length === 2 ? 'sm:grid-cols-2' : ''}`}>
                  {tiers.map(({ tier, plans }, i) => (
                    <Spotlight key={tier} tone="gold" className="rounded-3xl">
                      <div className="p-6">
                        <p className="text-sm font-bold text-gold">PS Plus</p>
                        <h3 dir="ltr" className="text-end text-3xl font-bold text-ink">{tier}</h3>
                        <ul className="mt-5 space-y-2">
                          {plans.map(p => (
                            <li key={p.id}>
                              <Link href={`/products/${p.id}`} className="group flex min-h-14 items-center gap-3 rounded-2xl bg-white/5 px-4 text-ink transition-colors hover:bg-gold hover:text-canvas-a">
                                <span className="min-w-0 flex-1 truncate text-sm font-bold">{p.name}</span>
                                {p.discount && <span className="text-xs tabular-nums line-through opacity-60">{p.price}</span>}
                                <span className="shrink-0 text-lg font-bold tabular-nums">{applyDiscount(p.price, p.discount)} <span className="text-xs font-normal">ر.س</span></span>
                                <ArrowLeft size={16} className="shrink-0 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {i === tiers.length - 1 && <BorderBeam colorFrom="var(--gold-bg)" colorTo="#fff" size={110} duration={9} />}
                    </Spotlight>
                  ))}
                </div>
                {untiered.length > 0 && <div className="rail focus-grid mt-6"><Posters products={untiered} /></div>}
              </section>
            </BlurFade>
          )}

          {newest.length > 0 && (
            <BlurFade><Rail title="وصل حديثاً" href="/products" linkLabel="كل المنتجات"><Posters products={newest} /></Rail></BlurFade>
          )}

          {/* ── WHY + HOW: bento (after the Aceternity / Magic UI bento grids) ── */}
          <BlurFade>
            <section>
              <h2 className="mb-8 font-display text-3xl font-bold text-ink sm:text-5xl">تشتري وأنت مطمئن</h2>
              <div className="grid gap-4 md:grid-cols-6">
                <Spotlight className="rounded-3xl md:col-span-4">
                  <div className="flex h-full flex-col justify-between gap-10 p-6 sm:p-8">
                    <ShieldCheck size={40} className="text-accent" aria-hidden="true" />
                    <div>
                      <h3 className="text-2xl font-bold text-ink sm:text-3xl">ضمان استبدال مدى الحياة</h3>
                      <p className="mt-2 max-w-lg leading-relaxed text-muted">في الحالة النادرة التي تواجه فيها أي مشكلة، نستبدل المنتج خلال دقائق بدون أي تعقيدات.</p>
                    </div>
                  </div>
                </Spotlight>
                <div className="flex flex-col justify-between gap-6 rounded-3xl bg-ink p-6 text-canvas-a sm:p-8 md:col-span-2">
                  <p className="text-sm font-bold">متجر موثوق منذ</p>
                  <p dir="ltr" className="text-end text-7xl font-bold leading-none">2017</p>
                  <Link href="/about" className="inline-flex min-h-11 items-center gap-2 font-bold underline-offset-4 hover:underline">
                    قصة بيلي ستور <ArrowLeft size={16} aria-hidden="true" />
                  </Link>
                </div>
                {ASSURANCES.map(({ Icon, title, desc }) => (
                  <Spotlight key={title} className="rounded-3xl md:col-span-2">
                    <div className="flex h-full flex-col justify-between gap-10 p-6 sm:p-8">
                      <Icon size={40} className="text-accent" aria-hidden="true" />
                      <div>
                        <h3 className="text-2xl font-bold text-ink">{title}</h3>
                        <p className="mt-2 leading-relaxed text-muted">{desc}</p>
                      </div>
                    </div>
                  </Spotlight>
                ))}
              </div>

              <h2 className="mb-6 mt-16 font-display text-3xl font-bold text-ink sm:text-5xl">كيف تطلب؟</h2>
              <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {STEPS.map((step, i) => (
                  <li key={step.title} className="rounded-3xl border border-line p-6">
                    <span className="block text-5xl font-bold tabular-nums leading-none text-white/20">{i + 1}</span>
                    <h3 className="mb-1.5 mt-5 text-lg font-bold text-ink">{step.title}</h3>
                    <p className="text-sm leading-relaxed text-muted">{step.desc}</p>
                  </li>
                ))}
              </ol>
            </section>
          </BlurFade>

          {/* ── CONTACT ── */}
          <BlurFade>
            <section className="relative overflow-hidden rounded-4xl border border-line bg-surface px-6 py-14 text-center sm:px-10 sm:py-20">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_0%,rgb(var(--brand-rgb)/.25),transparent_70%)]" aria-hidden="true" />
              <div className="relative">
                <h2 className="font-display text-4xl font-bold text-ink sm:text-6xl">جاهز تبدأ تلعب؟</h2>
                <p className="mx-auto mt-4 max-w-md text-muted">تواصل معنا الآن واحصل على أفضل صفقة</p>
                <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                  <Button href={whatsappLink(GENERAL_INQUIRY)} external variant="whatsapp" size="lg" icon={<WhatsAppIcon />}>واتساب</Button>
                  <Button href={INSTAGRAM_URL} external variant="secondary" size="lg" icon={<InstagramIcon className="h-5 w-5 text-pink-400" />}>إنستقرام</Button>
                  <Button href={TELEGRAM_URL} external variant="secondary" size="lg" icon={<TelegramIcon className="h-5 w-5 text-sky-400" />}>تيليجرام</Button>
                </div>
              </div>
              <BorderBeam size={140} duration={12} />
            </section>
          </BlurFade>
        </div>
      </main>

      <Footer />
    </div>
  );
}
