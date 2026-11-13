'use client';
/**
 * Thin, project-facing wrappers around the ORIGINAL registry components installed
 * with the shadcn CLI into `components/vendor` (Magic UI + Aceternity UI). The vendor
 * files stay untouched so they can be re-pulled; anything project-specific — RTL,
 * design tokens, reduced motion — lives here.
 */
import { useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { useReducedMotion } from 'motion/react';
import { Marquee as VendorMarquee } from '@/components/vendor/marquee';
import { BorderBeam as VendorBorderBeam } from '@/components/vendor/border-beam';
import { MagicCard } from '@/components/vendor/magic-card';
import { NumberTicker as VendorNumberTicker } from '@/components/vendor/number-ticker';
import { BlurFade as VendorBlurFade } from '@/components/vendor/blur-fade';
import { Backlight as VendorBacklight } from '@/components/vendor/backlight';
import { cn } from '@/lib/utils';

/** Magic UI marquee. The track runs LTR so its translate maths holds on an RTL page; items stay RTL. */
export function Marquee({ children, className, duration = 40 }: { children: ReactNode; className?: string; duration?: number }) {
  return (
    <VendorMarquee dir="ltr" pauseOnHover className={cn('p-0 [--gap:2.5rem]', className)} style={{ '--duration': `${duration}s` } as React.CSSProperties}>
      <span dir="rtl" className="flex items-center gap-10">{children}</span>
    </VendorMarquee>
  );
}

/** Magic UI border beam, tinted with the store palette and silenced for reduced motion. */
export function BorderBeam({ size = 90, duration = 8, colorFrom = 'var(--accent)', colorTo = 'var(--brand)', delay = 0 }:
  { size?: number; duration?: number; colorFrom?: string; colorTo?: string; delay?: number }) {
  const reduce = useReducedMotion();
  // JS-driven infinite loop: only mount where there is room for it (md+), never for reduced motion.
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  if (reduce || !wide) return null;
  return <VendorBorderBeam size={size} duration={duration} colorFrom={colorFrom} colorTo={colorTo} delay={delay} />;
}

/** Magic UI magic-card: pointer-following glow and lit border. */
export function Spotlight({ children, className, tone = 'accent' }: { children: ReactNode; className?: string; tone?: 'accent' | 'gold' }) {
  const from = tone === 'gold' ? 'rgb(245 185 58)' : 'rgb(138 180 255)';
  const to = tone === 'gold' ? 'rgb(255 255 255)' : 'rgb(31 91 255)';
  return (
    <MagicCard className={cn('h-full', className)} gradientFrom={from} gradientTo={to}
      gradientColor={tone === 'gold' ? 'rgb(245 185 58 / .12)' : 'rgb(138 180 255 / .12)'} gradientOpacity={1} gradientSize={320}>
      {children}
    </MagicCard>
  );
}

/** Magic UI number ticker. */
export function NumberTicker({ value, className }: { value: number; className?: string }) {
  return <VendorNumberTicker value={value} className={cn('tracking-normal text-inherit dark:text-inherit', className)} />;
}

/** Magic UI blur fade, triggered when the block scrolls into view. */
export function BlurFade({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  // blur 0: animating `filter` over whole rails/grids is costly; opacity + y is enough.
  return (
    <VendorBlurFade inView direction="up" offset={14} blur="0px" duration={0.55} delay={delay} className={className}>
      {children}
    </VendorBlurFade>
  );
}

/** Magic UI backlight: the child glows with its own colours. */
export function Backlight({ children, className, blur = 28 }: { children: ReactElement; className?: string; blur?: number }) {
  return <VendorBacklight blur={blur} className={className}>{children}</VendorBacklight>;
}
