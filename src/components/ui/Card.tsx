import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import IconChip from './IconChip';

interface CardProps {
  variant?: 'surface' | 'interactive';
  href?: string;
  className?: string;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<NonNullable<CardProps['variant']>, string> = {
  surface: 'bg-surface border-2 border-black/15 hover:border-brand/40 rounded-card shadow-float card-hover transition-colors',
  interactive: 'bg-surface border-2 border-black/15 hover:border-brand/40 rounded-card shadow-float card-hover transition-colors cursor-pointer active:scale-[0.98]',
};

export default function Card({ variant = 'surface', href, className = '', children }: CardProps) {
  const classes = cn(VARIANT_CLASSES[variant], href && 'block', className);

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return <div className={classes}>{children}</div>;
}

interface FeatureCardProps {
  icon: ReactNode;
  iconTone?: 'brand' | 'gold';
  title: string;
  description?: string;
  href?: string;
  className?: string;
}

export function FeatureCard({ icon, iconTone = 'brand', title, description, href, className = '' }: FeatureCardProps) {
  return (
    <Card variant={href ? 'interactive' : 'surface'} href={href} className={cn('p-6 flex flex-col gap-3', className)}>
      <IconChip icon={icon} tone={iconTone} />
      <h3 className="font-normal text-ink text-lg">{title}</h3>
      {description && <p className="text-muted text-sm leading-relaxed min-h-12">{description}</p>}
    </Card>
  );
}
