'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, memo } from 'react';
import { Gamepad2, Star } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { Tilt } from '@/components/motion-primitives/tilt';
import Badge from './Badge';

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

interface DiscountRule {
  id: number;
  type: 'product' | 'range';
  label: string;
  percentage: number;
  active: boolean;
  productIds: number[];
  minPrice: number | null;
  maxPrice: number | null;
}

interface DiscountsData {
  global: { percentage: number; label: string; active: boolean } | null;
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

// Calculate the best applicable discount for a product
function getProductDiscount(product: Product, discounts: DiscountsData): { percentage: number; label: string } | null {
  if (!discounts) return null;

  let best: { percentage: number; label: string } | null = null;

  // Check targeted discounts first (higher priority)
  for (const rule of discounts.targeted) {
    if (!rule.active) continue;
    let applies = false;

    if (rule.type === 'product' && rule.productIds.includes(product.id)) {
      applies = true;
    } else if (rule.type === 'range') {
      const aboveMin = rule.minPrice === null || product.price >= rule.minPrice;
      const belowMax = rule.maxPrice === null || product.price <= rule.maxPrice;
      if (aboveMin && belowMax) applies = true;
    }

    if (applies && (!best || rule.percentage > best.percentage)) {
      best = { percentage: rule.percentage, label: rule.label };
    }
  }

  // Fall back to global discount if no targeted applies
  if (!best && discounts.global?.active) {
    best = { percentage: discounts.global.percentage, label: discounts.global.label };
  }

  return best;
}

const ProductCard = memo(function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const [discount, setDiscount] = useState<{ percentage: number; label: string } | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    loadDiscounts().then(() => {
      if (discountsCache) {
        setDiscount(getProductDiscount(product, discountsCache));
      }
    });
  }, [product]);

  const discountedPrice = discount ? Math.round(product.price * (1 - discount.percentage / 100)) : null;

  return (
    <Tilt rotationFactor={reduceMotion ? 0 : 6} className="h-full">
      <Link href={`/products/${product.id}`} className="block h-full">
        <div className="group bg-surface border-2 border-black/15 rounded-xl sm:rounded-2xl overflow-hidden card-hover cursor-pointer h-full flex flex-col">
          <div className="relative aspect-square sm:aspect-[4/3] bg-gradient-to-br from-chip to-surface overflow-hidden">
            {product.image ? (
              <Image src={product.image} alt={product.name} fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                {...(priority ? { priority: true } : { loading: 'lazy' as const })} />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                {product.category === 'subscription' ? (
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gold border-2 border-gold flex items-center justify-center">
                    <span className="text-lg sm:text-2xl text-brand-ink font-bold">PS+</span>
                  </div>
                ) : (
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-chip border-2 border-brand/30 flex items-center justify-center">
                    <Gamepad2 className="w-6 h-6 sm:w-8 sm:h-8 text-brand" />
                  </div>
                )}
              </div>
            )}
            <div className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3 flex flex-col gap-1">
              {discount && (
                <span className="bg-sale text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  -{discount.percentage}%
                </span>
              )}
              {product.featured === 1 && !discount && (
                <span className="bg-gold text-brand-ink px-1.5 py-0.5 rounded-full inline-flex items-center justify-center" aria-label="منتج مميز">
                  <Star size={16} className="text-current" />
                </span>
              )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-brand/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>

          <div className="p-2.5 sm:p-4 flex flex-col flex-1">
            <Badge variant="category" className="w-fit mb-1.5 sm:mb-2 text-xs px-1.5 py-0.5">
              {product.category === 'subscription' ? 'PS Plus' : 'PlayStation'}
            </Badge>
            <h3 className="font-normal text-ink text-xs sm:text-base mb-1 sm:mb-2 group-hover:text-brand transition-colors line-clamp-2 leading-tight">
              {product.name}
            </h3>
            <p className="text-muted text-xs leading-relaxed mb-2 sm:mb-4 flex-1 line-clamp-2 hidden sm:block">
              {product.description}
            </p>
            <div className="flex items-end justify-between mt-auto gap-1">
              <div>
                {discount ? (
                  <>
                    <div className="text-muted text-xs line-through leading-none mb-0.5">{product.price} ر.س</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg sm:text-2xl font-bold text-sale">{discountedPrice}</span>
                      <span className="text-muted text-xs">ر.س</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-lg sm:text-2xl font-bold text-brand">{product.price}</span>
                    <span className="text-muted text-xs">ر.س</span>
                  </div>
                )}
              </div>
              <span className="text-xs text-brand bg-chip px-2 py-1 rounded-lg group-hover:bg-brand group-hover:text-white transition-all duration-300 whitespace-nowrap flex-shrink-0">
                تفاصيل ←
              </span>
            </div>
          </div>
        </div>
      </Link>
    </Tilt>
  );
});

export default ProductCard;
