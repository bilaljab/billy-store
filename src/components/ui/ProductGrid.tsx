'use client';
import { memo, useState } from 'react';
import ProductCard from './ProductCard';
import Button from './Button';
import type { CatalogProduct } from '@/lib/catalog';

const MemoCard = memo(ProductCard);
const PAGE_SIZE = 24;

// يعرض أول 24 كرت فقط بالـHTML الأولي ثم "عرض المزيد" — بدل رندر ~485 كرت دفعة وحدة (2MB HTML).
// الصفحات الأخرى تبقى قابلة للاكتشاف عبر الـsitemap. المستهلك يمرّر key يتغير مع الفلتر ليرجع العدّاد للبداية.
export default function ProductGrid({ products }: { products: CatalogProduct[] }) {
  const [shown, setShown] = useState(PAGE_SIZE);
  const remaining = products.length - shown;

  return (
    <>
      <div className="focus-grid grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 xl:grid-cols-5">
        {products.slice(0, shown).map((product, i) => (
          // content-visibility: المتصفح يتخطى layout/paint للكروت خارج الشاشة
          <div key={product.id} className="h-full" style={i < 8 ? undefined : { contentVisibility: 'auto', containIntrinsicSize: 'auto 280px' }}>
            <MemoCard product={product} priority={i === 0} />
          </div>
        ))}
      </div>
      {remaining > 0 && (
        <div className="mt-10 flex justify-center">
          <Button variant="secondary" onClick={() => setShown(n => n + PAGE_SIZE)}>
            عرض المزيد ({remaining})
          </Button>
        </div>
      )}
    </>
  );
}
