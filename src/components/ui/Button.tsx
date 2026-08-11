import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'default' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
  /** Internal Next.js route when set without `external`, or an external URL when `external` is true. Omit to render a <button>. */
  href?: string;
  external?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  'aria-label'?: string;
  title?: string;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white shadow-soft hover:bg-brand-ink hover:shadow-float',
  secondary: 'bg-surface text-ink border border-chip hover:border-brand',
  ghost: 'bg-transparent text-brand hover:bg-chip',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'text-sm px-4 py-2 gap-1.5',
  default: 'text-base px-6 py-3 gap-2',
  lg: 'text-lg px-8 py-4 gap-2.5',
};

export default function Button({
  variant = 'primary',
  size = 'default',
  icon,
  fullWidth,
  className,
  children,
  href,
  external,
  onClick,
  type = 'button',
  disabled,
  'aria-label': ariaLabel,
  title,
}: ButtonProps) {
  const classes = cn(
    'inline-flex items-center justify-center rounded-pill font-bold transition-all duration-300',
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    fullWidth && 'w-full',
    disabled && 'opacity-50 pointer-events-none',
    className
  );

  const content = (
    <>
      {icon}
      {children}
    </>
  );

  if (href && external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes} aria-label={ariaLabel} title={title}
        aria-disabled={disabled} tabIndex={disabled ? -1 : undefined}
        onClick={disabled ? (e) => e.preventDefault() : undefined}>
        {content}
      </a>
    );
  }

  if (href) {
    return (
      <Link href={href} className={classes} aria-label={ariaLabel} title={title}
        aria-disabled={disabled} tabIndex={disabled ? -1 : undefined}
        onClick={disabled ? (e) => e.preventDefault() : undefined}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes} aria-label={ariaLabel} title={title}>
      {content}
    </button>
  );
}
