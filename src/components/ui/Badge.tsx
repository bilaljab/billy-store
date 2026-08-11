import type { ReactNode } from 'react';

interface BadgeProps {
  variant?: 'category' | 'discount' | 'gold' | 'neutral';
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

const VARIANT_CLASSES: Record<NonNullable<BadgeProps['variant']>, string> = {
  category: 'bg-chip text-brand',
  discount: 'bg-sale text-white',
  gold: 'bg-gold text-brand-ink',
  neutral: 'bg-surface text-muted border border-chip',
};

export default function Badge({ variant = 'neutral', icon, children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-bold ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {icon}
      {children}
    </span>
  );
}
