'use client';
import Link from 'next/link';
import { useEffect, useState, memo } from 'react';
import { Star } from 'lucide-react';
import ProductArt from './ProductArt';
import { applyDiscount, getBestDiscount, type AppliedDiscount, type DiscountRule, type GlobalDiscount } from '@/lib/discounts';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string | null;
  category: string;
  featured: number;
  release_date?: string | null;
  /** Server-computed discount. When present (even null) the card skips the client fetch. */
  discount?: AppliedDiscount | null;
}

interface DiscountsData {
  global: GlobalDiscount | null;
  targeted: DiscountRule[];
}

// Module-level cache shared across all ProductCard instances
let discountsCache: DiscountsData | undefined = undefined;
let discountsPromise: Promise<void> | null = null;

async function loadDiscounts() {
  if (discountsCache !== undefined) return;
  if (discountsPromise) return discountsPromise;
  discountsPromise = fetch('/api/discounts')
    .then(r => r.json())
    .then(d => { discountsCache = d; })
    .catch(() => { discountsCache = { global: null, targeted: [] }; });
  return discountsPromise;
}

const ProductCard = memo(function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const serverDiscount = product.discount;
  const [fetched, setFetched] = useState<AppliedDiscount | null>(null);

  useEffect(() => {
    if (serverDiscount !== undefined) return;
    loadDiscounts().then(() => {
      if (discountsCache) setFetched(getBestDiscount(product, discountsCache.targeted, discountsCache.global));
    });
  }, [product, serverDiscount]);

  const discount = serverDiscount !== undefined ? serverDiscount : fetched;
  const isSub = product.category === 'subscription';

  return (
    <Link href={`/products/${product.id}`} className="poster group flex h-full flex-col gap-3 rounded-2xl active:scale-[0.98]">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-raised ring-1 ring-white/10 transition-[box-shadow,transform] duration-300 ease-out group-hover:-translate-y-1.5 group-hover:shadow-[0_24px_48px_-16px_rgba(0,0,0,.9)] group-hover:ring-2 group-hover:ring-white/70">
        <ProductArt
          product={product}
          sizes="(max-width: 640px) 46vw, (max-width: 1024px) 31vw, 20vw"
          priority={priority}
          imageClassName="transition-transform duration-700 ease-out group-hover:scale-[1.06]"
        />
        {discount && (
          <span dir="ltr" className="absolute inset-e-2 top-2 rounded-full bg-sale px-2 py-0.5 text-xs font-bold tabular-nums text-canvas-a">
            -{discount.percentage}%
          </span>
        )}
        {product.featured === 1 && (
          <span className="absolute inset-s-2 top-2 inline-flex items-center gap-1 rounded-full bg-canvas-a/80 px-2 py-1 text-[11px] font-bold text-gold backdrop-blur-sm">
            <Star size={12} fill="currentColor" aria-hidden="true" />
            مميز
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 px-1">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-ink sm:text-base">{product.name}</h3>
        <p className="relative mt-auto flex items-baseline gap-2 pt-1 tabular-nums">
          <span className={`text-base font-bold sm:text-lg ${discount ? 'text-sale' : 'text-ink'}`}>{applyDiscount(product.price, discount)}</span>
          <span className="text-xs text-muted">ر.س</span>
          {discount && <span className="text-xs text-muted line-through"><span className="sr-only">السعر قبل الخصم </span>{product.price}</span>}
          <span className={`ms-auto text-[11px] font-bold ${isSub ? 'text-gold' : 'text-muted'}`}>{isSub ? 'PS Plus' : 'PlayStation'}</span>
        </p>
      </div>
    </Link>
  );
});

export default ProductCard;
