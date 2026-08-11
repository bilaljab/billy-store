'use client';
import { useEffect, useState } from 'react';
import ProductCard from './ProductCard';

interface Product {
  id: number; name: string; description: string;
  price: number; image: string | null; category: string; featured: number;
}

export default function RelatedProducts({ currentId, category }: { currentId: number; category: string }) {
  // null = still loading (reserves layout space via skeleton); [] = confirmed empty (renders nothing)
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    fetch(`/api/products?category=${category}`)
      .then(r => r.json())
      .then(data => setProducts(data.filter((p: Product) => p.id !== currentId).slice(0, 4)))
      .catch(() => setProducts([]));
  }, [currentId, category]);

  if (products === null) {
    return (
      <div className="mt-16 border-t border-chip pt-12">
        <div className="h-8 w-48 bg-chip rounded-lg animate-pulse mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="aspect-square sm:aspect-[4/3] bg-chip rounded-xl sm:rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="mt-16 border-t border-chip pt-12">
      <h2 className="text-2xl font-bold font-display text-ink mb-6">
        منتجات <span className="text-brand">مشابهة</span>
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {products.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}
