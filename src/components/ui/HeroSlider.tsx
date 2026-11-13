'use client';
import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';
import Price from './Price';
import ProductArt from './ProductArt';
import { WhatsAppIcon } from './BrandIcons';
import { BorderBeam } from '@/components/fx';
import { applyDiscount } from '@/lib/discounts';
import { buildInquiryMessage } from '@/lib/messages';
import { whatsappLink } from '@/lib/contact';
import type { CatalogProduct } from '@/lib/catalog';

const SLIDE_MS = 7000;

/** Full-bleed cinematic showcase: one catalogue product owns the whole first screen at a time. */
export default function HeroSlider({ products }: { products: CatalogProduct[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const count = products.length;
  const go = useCallback((i: number) => setIndex((i + count) % count), [count]);

  useEffect(() => {
    if (paused || reduce || count < 2) return;
    const t = setTimeout(() => go(index + 1), SLIDE_MS);
    return () => clearTimeout(t);
  }, [index, paused, reduce, count, go]);

  if (count === 0) return null;
  const product = products[index];
  const isSub = product.category === 'subscription';
  const finalPrice = applyDiscount(product.price, product.discount);

  return (
    <section
      aria-roledescription="carousel" aria-label="منتجات مختارة"
      className="relative isolate flex min-h-svh flex-col overflow-hidden"
      onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}
    >
      {/* Backdrop: the cover itself, enlarged and softened, cross-fading between slides */}
      <AnimatePresence initial={false}>
        <motion.div key={product.id} className="absolute inset-0 -z-10"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 1.1, ease: [0.16, 1, 0.3, 1] }}>
          {product.image ? (
            // Mobile: tiny 128px source, no filter — stays out of LCP (measured: bigger/blurred mobile
            // backdrop became the LCP element, +0.6-1.1s). Desktop: 640px + light blur so the
            // upscaled source shows the poster without JPEG blocks.
            <Image src={product.image} alt="" fill loading="eager" sizes="(max-width: 768px) 128px, 640px" quality={40} className="object-cover saturate-150 max-md:scale-150 md:scale-105 md:blur-sm" />
          ) : (
            <div className={`absolute inset-0 ${isSub
              ? 'bg-[radial-gradient(70%_70%_at_30%_30%,rgb(var(--gold-bg-rgb)/.35),transparent)]'
              : 'bg-[radial-gradient(70%_70%_at_30%_30%,rgb(var(--brand-rgb)/.5),transparent)]'}`} />
          )}
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 -z-10 bg-linear-to-t from-canvas-a via-canvas-a/70 to-canvas-a/30" aria-hidden="true" />
      <div className="absolute inset-0 -z-10 bg-linear-to-l from-canvas-a/80 via-transparent to-transparent max-md:hidden" aria-hidden="true" />

      <div className="mx-auto my-auto grid w-full max-w-7xl items-center gap-8 px-4 pb-8 pt-32 sm:px-6 md:grid-cols-[1.1fr_minmax(0,24rem)] md:gap-14 md:pb-12 lg:px-8">
        {/* Copy */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={product.id} aria-live="polite"
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -12 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="max-md:order-2">
            <p className={`mb-3 text-sm font-bold ${isSub ? 'text-gold' : 'text-accent'}`}>
              {isSub ? 'اشتراك PS Plus' : 'لعبة PlayStation'}{product.featured === 1 && ' · مميز'}
            </p>
            <h2 className="font-display text-4xl font-bold leading-[1.3] text-ink sm:text-6xl sm:leading-tight lg:text-7xl lg:leading-[1.2]">
              {product.name}
            </h2>
            {product.description && (
              <p className="mt-4 line-clamp-2 max-w-xl leading-relaxed text-ink/75 max-sm:text-sm">{product.description}</p>
            )}
            <Price price={product.price} discount={product.discount} size="lg" className="mt-6" />
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button href={whatsappLink(buildInquiryMessage(product.name, finalPrice))} external size="lg" icon={<WhatsAppIcon />}>
                اطلب الآن
              </Button>
              <Button href={`/products/${product.id}`} variant="secondary" size="lg">تفاصيل المنتج</Button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Sharp cover */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={product.id}
            initial={reduce ? false : { opacity: 0, scale: 0.94, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={reduce ? undefined : { opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto aspect-square w-full max-w-68 overflow-hidden rounded-3xl shadow-[0_40px_80px_-20px_rgba(0,0,0,.9)] ring-1 ring-white/15 max-md:order-1 md:max-w-none">
            <ProductArt product={product} priority={index === 0} eager sizes="(max-width: 768px) 70vw, 384px" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Thumbnails + controls */}
      {count > 1 && (
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 pb-8 sm:px-6 lg:px-8">
          <button onClick={() => go(index - 1)} aria-label="المنتج السابق"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-ink backdrop-blur-sm transition-colors hover:bg-white/20 max-sm:hidden">
            <ChevronRight size={20} aria-hidden="true" />
          </button>
          <div className="flex min-w-0 flex-1 gap-2 sm:gap-3">
            {products.map((p, i) => {
              const active = i === index;
              return (
                <button key={p.id} onClick={() => setIndex(i)} aria-label={p.name} aria-current={active}
                  className={`group relative min-w-0 flex-1 overflow-hidden rounded-xl text-start transition-[background-color,opacity] duration-300 sm:max-w-56 ${active ? 'bg-white/15' : 'bg-white/5 opacity-70 hover:opacity-100'}`}>
                  <span className="flex items-center gap-3 p-1.5 sm:p-2">
                    <span className="relative aspect-square w-full shrink-0 overflow-hidden rounded-lg sm:w-12">
                      <ProductArt product={p} sizes="64px" />
                    </span>
                    <span className="min-w-0 max-sm:hidden">
                      <span className="block truncate text-sm font-bold text-ink">{p.name}</span>
                      <span className="block text-xs tabular-nums text-muted">{applyDiscount(p.price, p.discount)} ر.س</span>
                    </span>
                  </span>
                  {active && !reduce && !paused && (
                    <span key={index} aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 origin-right bg-ink"
                      style={{ animation: `fillBar ${SLIDE_MS}ms linear forwards` }} />
                  )}
                  {active && <BorderBeam size={60} duration={6} />}
                </button>
              );
            })}
          </div>
          <button onClick={() => go(index + 1)} aria-label="المنتج التالي"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-ink backdrop-blur-sm transition-colors hover:bg-white/20 max-sm:hidden">
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
        </div>
      )}
    </section>
  );
}
