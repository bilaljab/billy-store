import type { Metadata } from 'next';
import { og } from '@/lib/og';
import { Flame } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductsBrowser from '@/components/ui/ProductsBrowser';
import { getCatalog } from '@/lib/catalog';

// ISR: matches product-detail page's cadence (this is the primary shopping/catalog
// surface, so price/discount freshness matters as much as on a single product page)
export const revalidate = 30;

export const metadata: Metadata = {
  title: 'جميع المنتجات | Billy Store',
  description: 'تصفح مكتبتنا الكاملة من ألعاب PlayStation واشتراكات PS Plus بأفضل الأسعار.',
  alternates: { canonical: '/products' },
  openGraph: og('/products', 'جميع المنتجات | Billy Store', 'تصفح مكتبتنا الكاملة من ألعاب PlayStation واشتراكات PS Plus بأفضل الأسعار.'),
};

export default async function ProductsPage() {
  const { products, globalDiscount, error } = await getCatalog('random');

  return (
    <div className="min-h-screen">
      <Navbar />

      <main id="main" className="mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-6 sm:pt-36 lg:px-8">
        <header className="mb-6 sm:mb-8">
          <h1 className="font-display text-5xl font-bold leading-[1.3] text-ink sm:text-7xl sm:leading-[1.2]">المتجر</h1>
          <p className="mt-2 max-w-xl text-muted">
            تصفح مكتبتنا الكاملة من ألعاب PlayStation واشتراكات PS Plus بأفضل الأسعار
          </p>
        </header>

        {globalDiscount && (
          <div className="mb-6 flex items-center gap-3 rounded-full border border-sale/30 bg-sale/10 px-4 py-3 sm:px-5">
            <Flame size={26} className="shrink-0 text-sale" aria-hidden="true" />
            <p className="text-sm text-ink sm:text-base">
              <span className="font-bold">{globalDiscount.label}</span>
              <span className="text-muted"> — خصم </span>
              <span className="font-bold text-sale">{globalDiscount.percentage}%</span>
              <span className="text-muted"> على جميع المنتجات لفترة محدودة</span>
            </p>
          </div>
        )}

        <ProductsBrowser products={products} error={error} />
      </main>

      <Footer />
    </div>
  );
}
