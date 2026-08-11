import type { ReactNode } from 'react';

interface IconChipProps {
  icon: ReactNode;
  tone?: 'brand' | 'gold';
  size?: 'sm' | 'default';
  className?: string;
}

const TONE_CLASSES: Record<NonNullable<IconChipProps['tone']>, string> = {
  brand: 'bg-chip text-brand',
  gold: 'bg-gold text-brand',
};

const SIZE_CLASSES: Record<NonNullable<IconChipProps['size']>, string> = {
  sm: 'w-10 h-10 text-lg',
  default: 'w-14 h-14 text-2xl',
};

export default function IconChip({ icon, tone = 'brand', size = 'default', className = '' }: IconChipProps) {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-full shrink-0 ${TONE_CLASSES[tone]} ${SIZE_CLASSES[size]} ${className}`}
    >
      {icon}
    </div>
  );
}
