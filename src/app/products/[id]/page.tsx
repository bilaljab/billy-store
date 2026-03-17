import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import ProductActions from '@/components/ui/ProductActions';
import RelatedProducts from '@/components/ui/RelatedProducts';

async function getProduct(id: string) {
  try {
    const { getDb, initDb } = await import('@/lib/db');
    await initDb();
    const db = getDb();
    const result = await db.execute({ sql: 'SELECT * FROM products WHERE id = ?', args: [id] });
    const r = result.rows[0];
    if (!r) return null;
    return {
      id: Number(r.id), name: String(r.name ?? ''), description: String(r.description ?? ''),
      price: Number(r.price), image: r.image ? String(r.image) : null,
      category: String(r.category ?? 'games'), featured: Number(r.featured ?? 0),
    };
  } catch { return null; }
}

async function getDiscount() {
  try {
    const { getDb, initDb } = await import('@/lib/db');
    await initDb();
    const db = getDb();
    await db.execute('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
    const result = await db.execute({ sql: "SELECT value FROM settings WHERE key = 'discount'", args: [] });
    if (!result.rows[0]) return null;
    const d = JSON.parse(String(result.rows[0].value));
    return d.active ? d : null;
  } catch { return null; }
}

async function getViews(id: string) {
  try {
    const { getDb, initDb } = await import('@/lib/db');
    await initDb();
    const db = getDb();
    await db.execute(`CREATE TABLE IF NOT EXISTS product_views (product_id INTEGER PRIMARY KEY, views INTEGER NOT NULL DEFAULT 0)`);
    const result = await db.execute({ sql: 'SELECT views FROM product_views WHERE product_id = ?', args: [id] });
    return Number(result.rows[0]?.views ?? 0);
  } catch { return 0; }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, discount, views] = await Promise.all([getProduct(id), getDiscount(), getViews(id)]);
  if (!product) notFound();

  const categoryLabel = product.category === 'subscription' ? 'اشتراك PS Plus' : 'لعبة PlayStation';
  const discountedPrice = discount ? Math.round(product.price * (1 - discount.percentage / 100)) : null;
  const waMsg = encodeURIComponent(`مرحباً، أريد الاستفسار عن:\n🎮 ${product.name}\n💰 السعر: ${discountedPrice ?? product.price} ريال`);

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />
      <div className="pt-24 pb-20 px-4 max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-8">
          <Link href="/" className="hover:text-accent transition-colors">الرئيسية</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-accent transition-colors">المنتجات</Link>
          <span>/</span>
          <span className="text-slate-300 line-clamp-1">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Image */}
          <div className="relative aspect-square bg-gradient-to-br from-primary/20 to-dark-card border border-dark-border rounded-3xl overflow-hidden">
            {product.image ? (
              <Image src={product.image} alt={product.name} fill className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                {product.category === 'subscription' ? (
                  <div className="w-32 h-32 rounded-full bg-accent/20 border-2 border-accent/40 flex items-center justify-center animate-glow">
                    <span className="text-5xl text-accent font-black">PS+</span>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-2xl bg-primary/20 border-2 border-primary/40 flex items-center justify-center">
                    <span className="text-7xl">🎮</span>
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

          {/* Info */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
                product.category === 'subscription' ? 'text-accent bg-accent/10 border-accent/30' : 'text-primary-light bg-primary/10 border-primary/30'
              }`}>{categoryLabel}</span>
              {product.featured === 1 && (
                <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">⭐ منتج مميز</span>
              )}
              {views > 0 && (
                <span className="text-xs text-slate-500 flex items-center gap-1">
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

            {/* Price */}
            <div className="bg-gradient-to-l from-primary/10 to-dark-card border border-primary/30 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">السعر</p>
                {discount ? (
                  <>
                    <div className="text-slate-500 text-sm line-through">{product.price} ريال</div>
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
                <p className="text-slate-500 text-xs mt-1">تسليم رقمي فوري</p>
              </div>
            </div>

            {/* Client Actions */}
            <ProductActions product={{ id: product.id, name: product.name, price: discountedPrice ?? product.price }} waMsg={waMsg} />

            <Link href="/products" className="text-center text-slate-500 hover:text-accent text-sm transition-colors">
              ← العودة للمنتجات
            </Link>
          </div>
        </div>
        <RelatedProducts currentId={product.id} category={product.category} />
      </div>
      <Footer />
    </div>
  );
}
