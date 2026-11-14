'use client';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Search, SearchX, TriangleAlert, X } from 'lucide-react';
import ProductGrid from './ProductGrid';
import Button from './Button';
import type { CatalogProduct } from '@/lib/catalog';
import { arabicNameOf } from '@/lib/arabic-names';

const CATEGORIES = [
  { value: 'all', label: 'الكل' },
  { value: 'games', label: 'الألعاب' },
  { value: 'subscription', label: 'الاشتراكات' },
] as const;

const SORTS = [
  { value: 'default', label: 'الترتيب الافتراضي' },
  { value: 'asc', label: 'السعر: من الأرخص' },
  { value: 'desc', label: 'السعر: من الأغلى' },
  { value: 'discount', label: 'أكبر خصم' },
] as const;

type Category = typeof CATEGORIES[number]['value'];
type Sort = typeof SORTS[number]['value'];

export default function ProductsBrowser({ products, error }: { products: CatalogProduct[]; error: boolean }) {
  const [category, setCategory] = useState<Category>('all');
  const [sort, setSort] = useState<Sort>('default');
  const [search, setSearch] = useState('');

  // قراءة ?category/?sort/?q بعد الـmount (لا useSearchParams ولا searchParams بالسيرفر):
  // بهالشكل يبقى الـHTML الأولي فيه كل المنتجات (بدون CSR bailout) والصفحة ISR.
  // كل قيمة تمر عبر allow-list؛ أي قيمة غير معروفة تسقط للافتراضي.
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setCategory(CATEGORIES.find(c => c.value === sp.get('category'))?.value ?? 'all');
    setSort(SORTS.find(s => s.value === sp.get('sort'))?.value ?? 'default');
    setSearch((sp.get('q') ?? '').slice(0, 100));
  }, []);

  const deferredSearch = useDeferredValue(search);
  const term = deferredSearch.trim().toLowerCase();

  const searched = useMemo(
    () => products.filter(p => !term || p.name.toLowerCase().includes(term) || arabicNameOf(p.name)?.includes(term) || p.description?.toLowerCase().includes(term)),
    [products, term]
  );
  const counts: Record<Category, number> = useMemo(() => ({
    all: searched.length,
    games: searched.filter(p => p.category === 'games').length,
    subscription: searched.filter(p => p.category === 'subscription').length,
  }), [searched]);

  const filtered = useMemo(() => searched
    .filter(p => category === 'all' || p.category === category)
    .sort((a, b) => {
      if (sort === 'asc') return a.price - b.price;
      if (sort === 'desc') return b.price - a.price;
      if (sort === 'discount') return (b.discount?.percentage ?? 0) - (a.discount?.percentage ?? 0);
      return 0;
    }), [searched, category, sort]);

  const reset = () => { setSearch(''); setCategory('all'); setSort('default'); };

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div role="group" aria-label="الفئة" className="flex rounded-full bg-white/5 p-1">
          {CATEGORIES.map(cat => {
            const active = category === cat.value;
            return (
              <button key={cat.value} onClick={() => setCategory(cat.value)} aria-pressed={active}
                className={`relative flex min-h-10 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 text-sm font-bold transition-colors lg:px-5 ${active ? 'text-canvas-a' : 'text-muted hover:text-ink'}`}>
                {active && <motion.span layoutId="category-pill" className="absolute inset-0 rounded-full bg-ink" transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }} />}
                <span className="relative">{cat.label}</span>
                {/* no opacity: dimmed digits failed contrast on the active (light) pill */}
                <span className="relative text-xs tabular-nums">{counts[cat.value]}</span>
              </button>
            );
          })}
        </div>

        <div className="relative lg:flex-1">
          <label htmlFor="product-search" className="sr-only">ابحث عن لعبة أو اشتراك</label>
          <Search size={16} className="pointer-events-none absolute inset-s-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            type="search"
            id="product-search"
            name="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث عن لعبة أو اشتراك..."
            className="field rounded-full! ps-10!"
          />
        </div>
      </div>

      <div className="relative mb-5 flex items-center justify-between gap-3">
        <p className="text-sm text-muted" role="status">
          {!error && <><span className="tabular-nums">{filtered.length}</span> منتج{term && <> لـ «{deferredSearch.trim()}»</>}</>}
        </p>
        <label htmlFor="product-sort" className="sr-only">ترتيب المنتجات</label>
        <select id="product-sort" value={sort} onChange={e => setSort(e.target.value as Sort)}
          className="field w-auto! cursor-pointer rounded-full! font-bold">
          {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <h2 className="sr-only">نتائج البحث</h2>
      {error ? (
        <div className="rounded-2xl border border-line bg-surface px-6 py-16 text-center">
          <TriangleAlert size={40} className="mx-auto mb-4 text-gold" aria-hidden="true" />
          <h3 className="mb-2 text-xl font-bold text-ink">حدث خطأ بتحميل المنتجات</h3>
          <p className="mb-6 text-muted">حاول تحديث الصفحة</p>
          <Button variant="secondary" onClick={() => window.location.reload()}>تحديث الصفحة</Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface px-6 py-16 text-center">
          <SearchX size={40} className="mx-auto mb-4 text-muted" aria-hidden="true" />
          <h3 className="mb-2 text-xl font-bold text-ink">لا توجد نتائج</h3>
          <p className="mb-6 text-muted">جرب البحث بكلمة مختلفة أو تصفح فئة أخرى</p>
          <Button variant="secondary" onClick={reset} icon={<X size={16} aria-hidden="true" />}>مسح البحث والفلاتر</Button>
        </div>
      ) : (
        <ProductGrid key={`${category}|${sort}|${term}`} products={filtered} />
      )}
    </>
  );
}
