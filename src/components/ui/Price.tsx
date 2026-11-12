import { cn } from '@/lib/utils';
import { applyDiscount, type AppliedDiscount } from '@/lib/discounts';

interface PriceProps {
  price: number;
  discount?: AppliedDiscount | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const AMOUNT: Record<NonNullable<PriceProps['size']>, string> = {
  sm: 'text-base sm:text-lg',
  md: 'text-xl sm:text-2xl',
  lg: 'text-4xl sm:text-5xl',
};

/** Price with optional discount: −X% chip, final amount, struck original. */
export default function Price({ price, discount, size = 'md', className }: PriceProps) {
  const final = applyDiscount(price, discount ?? null);
  const large = size === 'lg';
  return (
    <div className={cn('relative flex flex-wrap items-center gap-x-2 gap-y-1 tabular-nums', className)}>
      {discount && (
        <span dir="ltr" className={cn('rounded-md bg-sale font-bold text-canvas-a', large ? 'px-2.5 py-1 text-base' : 'px-1.5 py-0.5 text-xs')}>
          -{discount.percentage}%
        </span>
      )}
      <span className="flex items-baseline gap-1">
        <span className={cn('font-bold leading-none text-ink', AMOUNT[size])}>{final}</span>
        <span className={cn('text-muted', large ? 'text-base' : 'text-xs')}>ر.س</span>
      </span>
      {discount && (
        <span className={cn('text-muted line-through', large ? 'text-lg' : 'text-xs')}>
          <span className="sr-only">السعر قبل الخصم </span>{price}
        </span>
      )}
    </div>
  );
}
