import Navbar from '@/components/layout/Navbar';
import { cache } from 'react';
import type { Metadata } from 'next';

// ISR: serve from cache, rebuild in background every 30 seconds
// This means near-instant page loads after first visit
export const revalidate = 30;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://billy-store.vercel.app';

// Pre-render all product pages at build time for instant loads
export async function generateStaticParams() {
  try {
    const { getDb, initDb } = await import('@/lib/db');
    await initDb();
    const db = getDb();
    const result = await db.execute('SELECT id FROM products WHERE deleted_at IS NULL');
    return result.rows.map(r => ({ id: String((r as Record<string, unknown>)['id']) }));
  } catch {
    return [];
  }
}
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import ProductActions from '@/components/ui/ProductActions';
import RelatedProducts from '@/components/ui/RelatedProducts';
import ProductArt from '@/components/ui/ProductArt';
import Price from '@/components/ui/Price';
import { Backlight, BorderBeam } from '@/components/fx';
import Badge from '@/components/ui/Badge';
import { ChevronLeft, CircleCheck, Clock, Eye, Headset, ShieldCheck, Star, Wallet } from 'lucide-react';
import { getBestDiscount, applyDiscount } from '@/lib/discounts';
import { buildInquiryMessage } from '@/lib/messages';

// Single DB connection for all data on this page
// cache() shares one result between generateMetadata and the page component per request
const getPageData = cache(async (id: string) => {
  try {
    const { getDb, initDb, col } = await import('@/lib/db');
    await initDb();
    const db = getDb();

    // Run all 3 queries in parallel with single DB connection
    const [productResult, globalDiscountResult, targetedDiscountResult, viewsResult] = await Promise.all([
      db.execute({ sql: 'SELECT * FROM products WHERE id = ? AND deleted_at IS NULL', args: [id] }),
      db.execute({ sql: "SELECT value FROM settings WHERE key = 'discount'", args: [] }),
      db.execute({ sql: "SELECT value FROM settings WHERE key = 'targeted_discounts'", args: [] }),
      db.execute({ sql: 'SELECT views FROM product_views WHERE product_id = ?', args: [id] }),
    ]);

    const r = productResult.rows[0];
    if (!r) return null;

    const product = {
      id: Number(col(r, 'id')),
      name: String(col(r, 'name') ?? ''),
      description: String(col(r, 'description') ?? ''),
      price: Number(col(r, 'price')),
      image: col(r, 'image') ? String(col(r, 'image')) : null,
      category: String(col(r, 'category') ?? 'games'),
      featured: Number(col(r, 'featured') ?? 0),
    };

    // Best applicable discount (targeted beats global) — shared rule in lib/discounts
    const targeted = targetedDiscountResult.rows[0]
      ? JSON.parse(String(col(targetedDiscountResult.rows[0], 'value')))
      : [];
    const global = globalDiscountResult.rows[0]
      ? JSON.parse(String(col(globalDiscountResult.rows[0], 'value')))
      : null;
    const discount = getBestDiscount(product, targeted, global);

    const vRow = viewsResult.rows[0];
    const views = vRow ? Number((vRow as Record<string, unknown>)['views'] ?? 0) : 0;

    return { product, discount, views };
  } catch { return null; }
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const data = await getPageData(id);
  if (!data) return {};

  const { product } = data;
  const description = product.description
    ? product.description.slice(0, 160)
    : `تسوق ${product.name} بأفضل سعر من بيلي ستور — تسليم رقمي بدون انتظار.`;
  const url = `${SITE_URL}/products/${product.id}`;
  const image = product.image || `${SITE_URL}/logos/billy-store-icon.png`;

  return {
    title: `${product.name} | Billy Store`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: product.name,
      description,
      url,
      images: [{ url: image }],
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getPageData(id);
  if (!data) notFound();

  const { product, discount, views } = data;
  const categoryLabel = product.category === 'subscription' ? 'اشتراك PS Plus' : 'لعبة PlayStation';
  const discountedPrice = discount ? applyDiscount(product.price, discount) : null;
  const waMsg = encodeURIComponent(buildInquiryMessage(product.name, discountedPrice ?? product.price));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || undefined,
    image: product.image || `${SITE_URL}/logos/billy-store-icon.png`,
    category: categoryLabel,
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/products/${product.id}`,
      priceCurrency: 'SAR',
      price: discountedPrice ?? product.price,
      availability: 'https://schema.org/InStock',
    },
  };

  const isSub = product.category === 'subscription';
  const assurances = [
    { Icon: Clock, text: 'تسليم رقمي خلال دقائق بعد تأكيد الدفع' },
    { Icon: ShieldCheck, text: 'ضمان استبدال مدى الحياة' },
    { Icon: Wallet, text: 'الدفع بتحويل بنكي أو STC Pay' },
    { Icon: Headset, text: 'دعم على مدار الساعة عبر واتساب' },
  ];

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main id="main" className="relative">
        {/* The cover's own colours, blurred, light the top of the page */}
        {product.image && (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-184 overflow-hidden" aria-hidden="true">
            <Image src={product.image} alt="" fill sizes="40vw" className="scale-125 object-cover opacity-50 blur-3xl saturate-150" />
            <div className="absolute inset-0 bg-linear-to-b from-canvas-a/20 via-canvas-a/70 to-canvas-a" />
          </div>
        )}

        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-24 sm:px-6 sm:pt-28">
          <nav aria-label="مسار التنقل" className="mb-6 flex items-center gap-1.5 text-sm text-muted">
            <Link href="/" className="inline-flex min-h-11 items-center transition-colors hover:text-ink">الرئيسية</Link>
            <ChevronLeft size={14} aria-hidden="true" />
            <Link href="/products" className="inline-flex min-h-11 items-center transition-colors hover:text-ink">المنتجات</Link>
            <ChevronLeft size={14} aria-hidden="true" />
            <span className="line-clamp-1 font-bold text-ink" aria-current="page">{product.name}</span>
          </nav>

          <div className="grid items-start gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-12">
            <div className="max-md:mx-auto max-md:w-full max-md:max-w-xs md:sticky md:top-24">
              <Backlight blur={product.image ? 30 : 0}>
                <div className="relative aspect-square overflow-hidden rounded-3xl bg-raised ring-1 ring-white/15">
                  <ProductArt product={product} priority sizes="(max-width: 768px) 92vw, 44vw" />
                </div>
              </Backlight>
            </div>

            <div className="flex flex-col gap-6">
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge variant={isSub ? 'gold' : 'category'}>{categoryLabel}</Badge>
                  {product.featured === 1 && (
                    <Badge variant="gold" icon={<Star size={14} fill="currentColor" aria-hidden="true" />}>منتج مميز</Badge>
                  )}
                  {views > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted">
                      <Eye size={14} aria-hidden="true" />
                      <span className="tabular-nums">{views}</span> مشاهدة
                    </span>
                  )}
                </div>
                <h1 className="font-display text-4xl font-bold leading-[1.3] text-ink sm:text-5xl sm:leading-tight">{product.name}</h1>
              </div>

              <div className="relative rounded-3xl border border-line bg-surface/80 p-6 backdrop-blur-sm">
                <BorderBeam size={100} duration={9} />
                <Price price={product.price} discount={discount} size="lg" />
                {discount && <p className="mt-3 text-sm font-bold text-sale">{discount.label}</p>}
                <p className="mt-3 flex items-center gap-2 text-sm text-green-400">
                  <CircleCheck size={16} aria-hidden="true" />
                  متوفر — تسليم رقمي سريع
                </p>
              </div>

              <ProductActions product={{ id: product.id, name: product.name, price: discountedPrice ?? product.price }} waMsg={waMsg} />

              <ul className="divide-y divide-line rounded-3xl border border-line">
                {assurances.map(({ Icon, text }) => (
                  <li key={text} className="flex items-center gap-3 px-4 py-3 text-sm text-ink">
                    <Icon size={18} className="shrink-0 text-accent" aria-hidden="true" />
                    {text}
                  </li>
                ))}
              </ul>

              {product.description && (
                <section>
                  <h2 className="mb-2 text-lg font-bold text-ink">الوصف</h2>
                  <p className="max-w-prose whitespace-pre-line leading-loose text-muted">{product.description}</p>
                </section>
              )}

              <section>
                <h2 className="mb-2 text-lg font-bold text-ink">طريقة الاستلام</h2>
                <p className="max-w-prose leading-loose text-muted">
                  {isSub
                    ? 'نوفر لك بيانات حساب PlayStation جاهز بالاشتراك المطلوب. تسجّل الدخول به وتفعّله كحساب أساسي (Primary) على جهازك، فتستفيد من مزايا PS Plus من كل الحسابات المحلية على نفس الجهاز.'
                    : 'بعد إتمام الدفع نرسل لك بيانات حساب PlayStation جاهز يحتوي على اللعبة. تسجّل الدخول به وتفعّله كحساب أساسي (Primary) على جهازك، ثم تحمّل اللعبة وتلعبها من حسابك أنت.'}
                  {' '}
                  <Link href="/faq" className="font-bold text-accent underline-offset-4 hover:underline">تفاصيل أكثر في الأسئلة الشائعة</Link>
                </p>
              </section>
            </div>
          </div>

          <RelatedProducts currentId={product.id} category={product.category} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
