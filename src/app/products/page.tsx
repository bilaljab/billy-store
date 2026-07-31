import { Suspense } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductsBrowser from '@/components/ui/ProductsBrowser';
import { Flame } from 'lucide-react';

// ISR: matches product-detail page's cadence (this is the primary shopping/catalog
// surface, so price/discount freshness matters as much as on a single product page)
export const revalidate = 30;

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string | null;
  category: string;
  featured: number;
  release_date?: string | null;
}

interface GlobalDiscount { percentage: number; label: string; active: boolean }

async function getProductsWithDiscounts(): Promise<{
  products: (Product & { discount: { percentage: number; label: string } | null })[];
  globalDiscount: GlobalDiscount | null;
  error: boolean;
}> {
  try {
    const { getDb, initDb, serializeProduct, col } = await import('@/lib/db');
    await initDb();
    const db = getDb();

    const [productsResult, globalResult, targetedResult] = await Promise.all([
      db.execute('SELECT * FROM products WHERE deleted_at IS NULL ORDER BY RANDOM()'),
      db.execute({ sql: "SELECT value FROM settings WHERE key = 'discount'", args: [] }),
      db.execute({ sql: "SELECT value FROM settings WHERE key = 'targeted_discounts'", args: [] }),
    ]);

    const global: GlobalDiscount | null = globalResult.rows[0]
      ? JSON.parse(String(col(globalResult.rows[0], 'value')))
      : null;
    const targetedRules = targetedResult.rows[0]
      ? JSON.parse(String(col(targetedResult.rows[0], 'value')))
      : [];

    // Calculate best applicable discount per product (targeted takes priority over global) —
    // same priority logic as products/[id]/page.tsx's getPageData (duplicated by design, see CLAUDE.md Gotcha #9)
    const products = productsResult.rows.map(serializeProduct).map(product => {
      let discount: { percentage: number; label: string } | null = null;
      for (const rule of targetedRules) {
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
      if (!discount && global?.active) {
        discount = { percentage: global.percentage, label: global.label };
      }
      return { ...product, discount };
    });

    return { products, globalDiscount: global?.active ? global : null, error: false };
  } catch {
    return { products: [], globalDiscount: null, error: true };
  }
}

export default async function ProductsPage() {
  const { products, globalDiscount, error } = await getProductsWithDiscounts();

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />

      <main>
      {/* Header */}
      <div className="relative pt-24 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-50"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 max-w-7xl mx-auto">
          <span className="text-accent font-bold text-sm uppercase tracking-wider">المتجر</span>
          <h1 className="text-5xl font-black text-white mt-2 mb-4">
            جميع <span className="text-primary-light">المنتجات</span>
          </h1>
          <p className="text-slate-400 max-w-xl text-lg">
            تصفح مكتبتنا الكاملة من ألعاب PlayStation واشتراكات PS Plus بأفضل الأسعار
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-20">
        {/* Discount Banner */}
        {globalDiscount && (
          <div className="mb-6 bg-gradient-to-l from-red-500/20 to-amber-500/10 border border-red-500/30 rounded-2xl px-5 py-4 flex items-center gap-3">
            <Flame size={30} className="text-red-400" />
            <div>
              <p className="text-white font-black text-lg">{globalDiscount.label}</p>
              <p className="text-red-400 text-sm">خصم <span className="font-black text-xl">{globalDiscount.percentage}%</span> على جميع المنتجات — عرض لفترة محدودة!</p>
            </div>
          </div>
        )}

        {/* Suspense مطلوب لأن ProductsBrowser يقرأ useSearchParams — بدونه تسقط الصفحة
            لـdynamic rendering ويضيع revalidate أعلاه */}
        <Suspense fallback={null}>
          <ProductsBrowser products={products} error={error} />
        </Suspense>
      </div>
      </main>

      <Footer />
    </div>
  );
}
