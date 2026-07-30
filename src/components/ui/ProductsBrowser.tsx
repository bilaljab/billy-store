'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ScrollReveal from './ScrollReveal';
import ProductCard from './ProductCard';
import { Gamepad2, Star, Target } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string | null;
  category: string;
  featured: number;
  release_date?: string | null;
  discount: { percentage: number; label: string } | null;
}

const CATEGORY_VALUES = ['all', 'games', 'subscription'] as const;

export default function ProductsBrowser({ products, error }: { products: Product[]; error: boolean }) {
  // القراءة من جهة العميل (لا searchParams بالـServer Component) حتى تبقى الصفحة static/ISR
  const searchParams = useSearchParams();
  const requested = searchParams.get('category');
  const initialCategory = CATEGORY_VALUES.find(v => v === requested) ?? 'all';

  const [category, setCategory] = useState<string>(initialCategory);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'default' | 'asc' | 'desc' | 'discount'>('default');

  const sorted = [...products].sort((a, b) => {
    if (sort === 'asc') return a.price - b.price;
    if (sort === 'desc') return b.price - a.price;
    if (sort === 'discount') {
      const dA = a.discount;
      const dB = b.discount;
      // Products with discount first, sorted by discount percentage desc
      if (dA && !dB) return -1;
      if (!dA && dB) return 1;
      if (dA && dB) return dB.percentage - dA.percentage;
    }
    return 0;
  });
  const filtered = sorted.filter(p =>
    (category === 'all' || p.category === category) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase()))
  );

  const categories = [
    { value: 'all', label: 'الكل', icon: <Target size={16} className="text-current" /> },
    { value: 'games', label: 'الألعاب', icon: <Gamepad2 size={16} className="text-current" /> },
    { value: 'subscription', label: 'الاشتراكات', icon: <Star size={16} className="text-current" /> },
  ];

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-10">
        {/* Category tabs */}
        <div className="flex gap-2 bg-dark-card border border-dark-border rounded-xl p-1.5">
          {categories.map(cat => (
            <button key={cat.value} onClick={() => setCategory(cat.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${
                category === cat.value
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'text-slate-400 hover:text-white'
              }`}>
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex gap-1 bg-dark-card border border-dark-border rounded-xl p-1.5">
          {([['default','الافتراضي'],['asc','الأرخص'],['desc','الأغلى'],['discount','أكبر خصم 🏷️']] as const).map(([val,label]) => (
            <button key={val} onClick={() => setSort(val)}
              className={`min-h-11 inline-flex items-center justify-center px-3 rounded-lg text-xs font-semibold transition-all ${sort === val ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث عن لعبة أو اشتراك..."
            className="w-full bg-dark-card border border-dark-border rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors text-sm"
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Results count */}
      {!error && (
        <p className="text-muted text-sm mb-6">
          {filtered.length} منتج {search && `لـ "${search}"`}
        </p>
      )}

      {/* Grid */}
      <h2 className="sr-only">نتائج البحث</h2>
      {error ? (
        <div className="text-center py-24">
          <div className="mb-4 flex items-center justify-center"><Gamepad2 size={60} className="text-muted" /></div>
          <h3 className="text-xl font-bold text-slate-400 mb-2">حدث خطأ بتحميل المنتجات</h3>
          <p className="text-muted">حاول تحديث الصفحة</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24">
          <div className="mb-4 flex items-center justify-center"><Gamepad2 size={60} className="text-muted" /></div>
          <h3 className="text-xl font-bold text-slate-400 mb-2">لا توجد نتائج</h3>
          <p className="text-muted">جرب البحث بكلمة مختلفة أو تصفح فئة أخرى</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
          {filtered.map((product, i) => (
            i < 4 ? (
              <ProductCard key={product.id} product={product} priority={i === 0} />
            ) : (
              <ScrollReveal key={product.id} direction="up" delay={i % 4 * 80}>
                <ProductCard product={product} />
              </ScrollReveal>
            )
          ))}
        </div>
      )}
    </>
  );
}
