'use client';
import { useEffect, useState } from 'react';
import ProductCard from './ProductCard';

interface Product {
  id: number; name: string; description: string;
  price: number; image: string | null; category: string; featured: number;
}

const GRID = 'focus-grid grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-4';

export default function RelatedProducts({ currentId, category }: { currentId: number; category: string }) {
  // null = still loading (reserves layout space via skeleton); [] = confirmed empty (renders nothing)
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    fetch(`/api/products?category=${category}`)
      .then(r => r.json())
      .then(data => setProducts(data.filter((p: Product) => p.id !== currentId).slice(0, 4)))
      .catch(() => setProducts([]));
  }, [currentId, category]);

  if (products?.length === 0) return null;

  return (
    <section className="mt-16 border-t border-line pt-10 sm:mt-20">
      <h2 className="mb-6 font-display text-2xl font-bold text-ink sm:text-4xl">منتجات مشابهة</h2>
      {products === null ? (
        <div className={GRID} aria-hidden="true">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i}>
              <div className="aspect-square animate-pulse rounded-2xl bg-chip" />
              <div className="space-y-2 px-1 pt-3">
                <div className="h-3 w-1/3 animate-pulse rounded-sm bg-chip" />
                <div className="h-4 w-4/5 animate-pulse rounded-sm bg-chip" />
                <div className="h-5 w-1/2 animate-pulse rounded-sm bg-chip" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={GRID}>
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </section>
  );
}
