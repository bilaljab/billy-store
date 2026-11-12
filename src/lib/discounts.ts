/**
 * Single source of truth for discount priority: the highest applicable targeted
 * rule wins; the global discount is only a fallback when no targeted rule applies.
 * Used by the home page, the catalogue, the product page and ProductCard.
 */
export interface DiscountRule {
  id: number;
  type: 'product' | 'range';
  label: string;
  percentage: number;
  active: boolean;
  productIds: number[];
  minPrice: number | null;
  maxPrice: number | null;
}

export interface GlobalDiscount { percentage: number; label: string; active: boolean }

export interface AppliedDiscount { percentage: number; label: string }

export function getBestDiscount(
  product: { id: number; price: number },
  targeted: DiscountRule[] | null | undefined,
  global: GlobalDiscount | null | undefined,
): AppliedDiscount | null {
  let best: AppliedDiscount | null = null;

  for (const rule of targeted ?? []) {
    if (!rule.active) continue;
    let applies = false;
    if (rule.type === 'product' && rule.productIds.includes(product.id)) {
      applies = true;
    } else if (rule.type === 'range') {
      const aboveMin = rule.minPrice === null || product.price >= rule.minPrice;
      const belowMax = rule.maxPrice === null || product.price <= rule.maxPrice;
      applies = aboveMin && belowMax;
    }
    if (applies && (!best || rule.percentage > best.percentage)) {
      best = { percentage: rule.percentage, label: rule.label };
    }
  }

  if (!best && global?.active) best = { percentage: global.percentage, label: global.label };
  return best;
}

export function applyDiscount(price: number, discount: AppliedDiscount | null): number {
  return discount ? Math.round(price * (1 - discount.percentage / 100)) : price;
}
