import Navbar from '@/components/layout/Navbar';

// ISR: serve from cache, rebuild in background every 30 seconds
// This means near-instant page loads after first visit
export const revalidate = 30;

// Pre-render all product pages at build time for instant loads
export async function generateStaticParams() {
  try {
    const { getDb, initDb } = await import('@/lib/db');
    await initDb();
    const db = getDb();
    const result = await db.execute('SELECT id FROM products');
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
import { Gamepad2, Star } from 'lucide-react';

// Single DB connection for all data on this page
async function getPageData(id: string) {
  try {
    const { getDb, initDb, col } = await import('@/lib/db');
    await initDb();
    const db = getDb();

    // Run all 3 queries in parallel with single DB connection
    const [productResult, globalDiscountResult, targetedDiscountResult, viewsResult] = await Promise.all([
      db.execute({ sql: 'SELECT * FROM products WHERE id = ?', args: [id] }),
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

    // Calculate best applicable discount (targeted takes priority over global)
    let discount: { percentage: number; label: string } | null = null;

    // Check targeted discounts first
    if (targetedDiscountResult.rows[0]) {
      const rules = JSON.parse(String(col(targetedDiscountResult.rows[0], 'value')));
      for (const rule of rules) {
        if (!rule.active) continue;
        let applies = false;
        if (rule.type === 'product' && rule.productIds.includes(product.id)) applies = true;
        if (rule.type === 'range') {
          const aboveMin = rule.minPrice === null || product.price >= rule.minPrice;
          const belowMax = rule.maxPrice === null || product.price <= rule.maxPrice;
          if (aboveMin && belowMax) applies = true;
        }
        if (applies && (!discount || rule.percentage > discount.percentage)) {
          discount = { percentage: rule.percentage, label: rule.label };
        }
      }
    }

    // Fall back to global discount
    if (!discount && globalDiscountResult.rows[0]) {
      const d = JSON.parse(String(col(globalDiscountResult.rows[0], 'value')));
      if (d.active) discount = { percentage: d.percentage, label: d.label };
    }

    const vRow = viewsResult.rows[0];
    const views = vRow ? Number((vRow as Record<string, unknown>)['views'] ?? 0) : 0;

    return { product, discount, views };
  } catch { return null; }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getPageData(id);
  if (!data) notFound();

  const { product, discount, views } = data;
  const categoryLabel = product.category === 'subscription' ? 'اشتراك PS Plus' : 'لعبة PlayStation';
  const discountedPrice = discount ? Math.round(product.price * (1 - discount.percentage / 100)) : null;
  const waMsg = encodeURIComponent(`مرحباً، أريد الاستفسار عن:\n🎮 ${product.name}\n💰 السعر: ${discountedPrice ?? product.price} ريال`);

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />
      <div className="pt-24 pb-20 px-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 text-sm text-muted mb-8">
          <Link href="/" className="hover:text-accent transition-colors">الرئيسية</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-accent transition-colors">المنتجات</Link>
          <span>/</span>
          <span className="text-slate-300 line-clamp-1">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div className="relative aspect-square bg-gradient-to-br from-primary/20 to-dark-card border border-dark-border rounded-3xl overflow-hidden">
            {product.image ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                {product.category === 'subscription' ? (
                  <div className="w-32 h-32 rounded-full bg-accent/20 border-2 border-accent/40 flex items-center justify-center animate-glow">
                    <span className="text-5xl text-accent font-black">PS+</span>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-2xl bg-primary/20 border-2 border-primary/40 flex items-center justify-center">
                    <Gamepad2 size={72} className="text-primary-light" />
                  </div>
                )}
              </div>
            )}
            {discount && (
              <div className="absolute top-4 right-4 bg-red-500 text-white font-black text-lg px-3 py-1.5 rounded-xl">
                -{discount.percentage}%
              </div>
            )}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {['△','○','✕','□'].map((s,i) => (
                <div key={i} className="absolute text-primary/10 font-black text-3xl animate-float"
                  style={{top:`${15+i*20}%`,right:`${10+i*20}%`,animationDelay:`${i*0.4}s`}}>{s}</div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
                product.category === 'subscription' ? 'text-accent bg-accent/10 border-accent/30' : 'text-primary-light bg-primary/10 border-primary/30'
              }`}>{categoryLabel}</span>
              {product.featured === 1 && (
                <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 inline-flex items-center gap-1">
                  <Star size={16} className="text-current" /> منتج مميز
                </span>
              )}
              {views > 0 && (
                <span className="text-xs text-muted flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  {views} مشاهدة
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">{product.name}</h1>

            <div className="bg-dark-card border border-dark-border rounded-2xl p-5">
              <h3 className="text-slate-400 text-sm font-semibold mb-3">الوصف</h3>
              <p className="text-slate-200 leading-loose">{product.description}</p>
            </div>

            <div className="bg-gradient-to-l from-primary/10 to-dark-card border border-primary/30 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">السعر</p>
                {discount ? (
                  <>
                    <div className="text-muted text-sm line-through">{product.price} ريال</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black text-red-400">{discountedPrice}</span>
                      <span className="text-slate-300 text-lg font-semibold">ريال سعودي</span>
                    </div>
                    <span className="inline-block mt-1.5 bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold px-2 py-1 rounded-full">
                      خصم {discount.percentage}% — {discount.label}
                    </span>
                  </>
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-accent">{product.price}</span>
                    <span className="text-slate-300 text-lg font-semibold">ريال سعودي</span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-green-400 text-sm font-bold">✓ متوفر</p>
                <p className="text-muted text-xs mt-1">تسليم رقمي فوري</p>
              </div>
            </div>

            <ProductActions product={{ id: product.id, name: product.name, price: discountedPrice ?? product.price }} waMsg={waMsg} />
            <Link href="/products" className="text-center text-muted hover:text-accent text-sm transition-colors">← العودة للمنتجات</Link>
          </div>
        </div>
        <RelatedProducts currentId={product.id} category={product.category} />
      </div>
      <Footer />
    </div>
  );
}
