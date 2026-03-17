'use client';
import { useEffect, useState } from 'react';
import ProductCard from './ProductCard';

interface Product {
  id: number; name: string; description: string;
  price: number; image: string | null; category: string; featured: number;
}

export default function RelatedProducts({ currentId, category }: { currentId: number; category: string }) {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch(`/api/products?category=${category}`)
      .then(r => r.json())
      .then(data => setProducts(data.filter((p: Product) => p.id !== currentId).slice(0, 4)))
      .catch(() => {});
  }, [currentId, category]);

  if (products.length === 0) return null;

  return (
    <div className="mt-16 border-t border-dark-border pt-12">
      <h2 className="text-2xl font-black text-white mb-6">
        منتجات <span className="text-accent">مشابهة</span>
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {products.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}
