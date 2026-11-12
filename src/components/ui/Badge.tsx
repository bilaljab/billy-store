import type { ReactNode } from 'react';

interface BadgeProps {
  variant?: 'category' | 'discount' | 'gold' | 'neutral';
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

const VARIANT_CLASSES: Record<NonNullable<BadgeProps['variant']>, string> = {
  category: 'bg-chip text-accent',
  discount: 'bg-sale text-canvas-a',
  gold: 'bg-gold/15 text-gold',
  neutral: 'bg-raised text-muted border border-line',
};

export default function Badge({ variant = 'neutral', icon, children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {icon}
      {children}
    </span>
  );
}
