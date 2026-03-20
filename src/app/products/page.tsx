'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import ScrollReveal from '@/components/ui/ScrollReveal';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/ui/ProductCard';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string | null;
  category: string;
  featured: number;
  release_date?: string | null;
  discountedPrice?: number | null;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [discountsData, setDiscountsData] = useState<{
    global: { percentage: number; label: string; active: boolean } | null;
    targeted: { id: number; type: string; percentage: number; label: string; active: boolean; productIds: number[]; minPrice: number | null; maxPrice: number | null }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'default' | 'asc' | 'desc' | 'discount'>('default');

  useEffect(() => {
    fetch('/api/discounts').then(r => r.json()).then(d => setDiscountsData(d)).catch(() => {});
  }, []);

  // Calculate discount for a specific product
  const getDiscount = (p: Product) => {
    if (!discountsData) return null;
    let best: { percentage: number; label: string } | null = null;
    for (const rule of discountsData.targeted || []) {
      if (!rule.active) continue;
      let applies = false;
      if (rule.type === 'product' && rule.productIds.includes(p.id)) applies = true;
      if (rule.type === 'range') {
        const aboveMin = rule.minPrice === null || p.price >= rule.minPrice;
        const belowMax = rule.maxPrice === null || p.price <= rule.maxPrice;
        if (aboveMin && belowMax) applies = true;
      }
      if (applies && (!best || rule.percentage > best.percentage)) {
        best = { percentage: rule.percentage, label: rule.label };
      }
    }
    if (!best && discountsData.global?.active) {
      best = { percentage: discountsData.global.percentage, label: discountsData.global.label };
    }
    return best;
  };

  useEffect(() => {
    const url = category === 'all' ? '/api/products' : `/api/products?category=${category}`;
    fetch(url)
      .then(r => r.json())
      .then(data => { setProducts(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [category]);

  const sorted = [...products].sort((a, b) => {
    if (sort === 'asc') return a.price - b.price;
    if (sort === 'desc') return b.price - a.price;
return 0;
  });
  const filtered = sorted.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [
    { value: 'all', label: 'الكل', icon: '🎯' },
    { value: 'games', label: 'الألعاب', icon: '🎮' },
    { value: 'subscription', label: 'الاشتراكات', icon: '⭐' },
  ];

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />

      {/* Header */}
      <div className="relative pt-24 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-50"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 max-w-7xl mx-auto">
          <span className="text-accent font-bold text-sm uppercase tracking-wider">المتجر</span>
          <h1 className="text-5xl font-black text-white mt-2 mb-4">
            جميع <span className="text-primary-light">المنتجات</span>
          </h1>
          <p className="text-slate-400 max-w-xl text-lg">
            تصفح مكتبتنا الكاملة من ألعاب PlayStation واشتراكات PS Plus بأفضل الأسعار
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-20">
        {/* Discount Banner */}
        {discountsData?.global?.active && (
          <div className="mb-6 bg-gradient-to-l from-red-500/20 to-amber-500/10 border border-red-500/30 rounded-2xl px-5 py-4 flex items-center gap-3">
            <span className="text-3xl">🔥</span>
            <div>
              <p className="text-white font-black text-lg">{discountsData.global.label}</p>
              <p className="text-red-400 text-sm">خصم <span className="font-black text-xl">{discountsData.global.percentage}%</span> على جميع المنتجات — عرض لفترة محدودة!</p>
            </div>
          </div>
        )}

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
            {[['default','الافتراضي'],['asc','الأرخص'],['desc','الأغلى'],['discount','أكبر خصم 🏷️']].map(([val,label]) => (
              <button key={val} onClick={() => setSort(val as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${sort === val ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}>
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
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-slate-500 text-sm mb-6">
            {filtered.length} منتج {search && `لـ "${search}"`}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-dark-border"></div>
                <div className="p-4 space-y-3">
                  <div className="h-3 bg-dark-border rounded w-1/3"></div>
                  <div className="h-4 bg-dark-border rounded"></div>
                  <div className="h-3 bg-dark-border rounded w-2/3"></div>
                  <div className="h-6 bg-dark-border rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🎮</div>
            <h3 className="text-xl font-bold text-slate-400 mb-2">لا توجد نتائج</h3>
            <p className="text-slate-600">جرب البحث بكلمة مختلفة أو تصفح فئة أخرى</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {filtered.map((product, i) => (
              <ScrollReveal key={product.id} direction="up" delay={i % 4 * 80}>
                <ProductCard product={product} />
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
