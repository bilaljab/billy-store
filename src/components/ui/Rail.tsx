'use client';
import { useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Titled horizontal shelf of posters: swipe on touch, arrow buttons on pointer devices. */
export default function Rail({ title, href, linkLabel, children }: { title: string; href?: string; linkLabel?: string; children: ReactNode }) {
  const track = useRef<HTMLDivElement>(null);
  // RTL: "next" content lies to the left, i.e. a negative scroll delta
  const scroll = (dir: 1 | -1) => track.current?.scrollBy({ left: -dir * track.current.clientWidth * 0.85, behavior: 'smooth' });

  return (
    <section>
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 className="font-display text-2xl font-bold text-ink sm:text-4xl">{title}</h2>
        <div className="flex shrink-0 items-center gap-2">
          {href && (
            <Link href={href} className="inline-flex min-h-11 items-center px-2 text-sm font-bold text-muted transition-colors hover:text-ink">
              {linkLabel}
            </Link>
          )}
          <button onClick={() => scroll(-1)} aria-label="السابق"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink transition-colors hover:bg-chip max-md:hidden">
            <ChevronRight size={20} aria-hidden="true" />
          </button>
          <button onClick={() => scroll(1)} aria-label="التالي"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink transition-colors hover:bg-chip max-md:hidden">
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div ref={track} className="rail focus-grid">{children}</div>
    </section>
  );
}
