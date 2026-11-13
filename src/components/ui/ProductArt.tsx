import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ProductArtProps {
  product: { name: string; image: string | null; category: string };
  sizes: string;
  priority?: boolean;
  /** Load immediately without a preload hint (slides that are about to be shown) */
  eager?: boolean;
  /** Extra classes for the <Image> itself (hover zoom etc.) */
  imageClassName?: string;
  className?: string;
}

/**
 * Product artwork, filling its (positioned) parent. Products without an image
 * get a branded cover — the PlayStation / PS Plus mark on a tinted panel —
 * so image-less items still read as deliberate tiles, not broken ones.
 */
export default function ProductArt({ product, sizes, priority, eager, imageClassName, className }: ProductArtProps) {
  if (product.image) {
    return (
      <Image
        src={product.image}
        alt={product.name}
        fill
        sizes={sizes}
        className={cn('object-cover', imageClassName, className)}
        {...(priority ? { priority: true } : { loading: eager ? ('eager' as const) : ('lazy' as const) })}
      />
    );
  }

  const isSub = product.category === 'subscription';
  return (
    <div
      className={cn(
        'absolute inset-0 flex items-center justify-center bg-raised',
        isSub
          ? 'bg-[radial-gradient(120%_90%_at_50%_0%,rgb(var(--gold-bg-rgb)/.2),transparent_60%)]'
          : 'bg-[radial-gradient(120%_90%_at_50%_0%,rgb(var(--brand-rgb)/.34),transparent_60%)]',
        className,
      )}
    >
      <Image
        src={isSub ? '/logos/ps-plus.png' : '/logos/playstation-seeklogo.png'}
        alt=""
        width={isSub ? 640 : 2000}
        height={isSub ? 618 : 1549}
        sizes="(max-width: 640px) 20vw, 140px"
        className={cn('h-auto opacity-90', isSub ? 'w-[34%]' : 'w-[42%]', imageClassName)}
      />
    </div>
  );
}
