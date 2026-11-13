import ProductCard from './ProductCard';
import { getCatalog } from '@/lib/catalog';

/** Server component: related items come from the same ISR render as the product page (no client fetches). */
export default async function RelatedProducts({ currentId, category }: { currentId: number; category: string }) {
  const { products } = await getCatalog('newest');
  const related = products.filter(p => p.category === category && p.id !== currentId).slice(0, 4);
  if (related.length === 0) return null;

  return (
    <section className="mt-16 border-t border-line pt-10 sm:mt-20">
      <h2 className="mb-6 font-display text-2xl font-bold text-ink sm:text-4xl">منتجات مشابهة</h2>
      <div className="focus-grid grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-4">
        {related.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}
