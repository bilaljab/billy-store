'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Pencil, Save, Target, Tag, Trash2, Megaphone, TrendingUp, TrendingDown, AlertTriangle, BarChart3, Package, CheckCircle2, XCircle, X, Trophy, HandCoins, Pause, Play, Gamepad2, Star } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string | null;
  category: string;
  featured: number;
  release_date?: string | null;
}

interface TargetedRule {
  id: number;
  type: 'product' | 'range';
  label: string;
  percentage: number;
  active: boolean;
  productIds: number[];
  minPrice: number | null;
  maxPrice: number | null;
}

const EMPTY_FORM = { name: '', description: '', price: '', image: '', category: 'games', featured: false, release_date: '' };

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; errors: string[] } | null>(null);
  const [discount, setDiscount] = useState<{ percentage: number; label: string; active: boolean } | null>(null);
  const [discountForm, setDiscountForm] = useState({ percentage: '20', label: 'عرض خاص', active: true });
  const [discountModal, setDiscountModal] = useState(false);
  const [savingDiscount, setSavingDiscount] = useState(false);
  const [targetedRules, setTargetedRules] = useState<TargetedRule[]>([]);
  const [targetedModal, setTargetedModal] = useState(false);
  const [targetedForm, setTargetedForm] = useState({
    type: 'range' as 'range' | 'product',
    label: '',
    percentage: '15',
    active: true,
    productIds: [] as number[],
    minPrice: '',
    maxPrice: '',
  });
  const [savingTargeted, setSavingTargeted] = useState(false);
  const [editingRule, setEditingRule] = useState<TargetedRule | null>(null);
  const [priceModal, setPriceModal] = useState(false);
  const [priceForm, setPriceForm] = useState({ mode: 'percentage', value: '', direction: 'increase', category: 'all' });
  const [savingPrice, setSavingPrice] = useState(false);
  const [priceResult, setPriceResult] = useState<string | null>(null);
  const [stats, setStats] = useState<{ totalVisits: number; todayVisits: number; productViews: { id: number; name: string; category: string; price: number; image: string | null; views: number }[] } | null>(null);
  const [statsSort, setStatsSort] = useState<'views' | 'price'>('views');
  const [showStats, setShowStats] = useState(false);
  const [announcement, setAnnouncement] = useState<{ text: string; active: boolean } | null>(null);
  const [annForm, setAnnForm] = useState({ text: '', active: true });
  const [annModal, setAnnModal] = useState(false);
  const [savingAnn, setSavingAnn] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deletingSelected, setDeletingSelected] = useState(false);
  const router = useRouter();

  // Token is handled via httpOnly cookie automatically - no localStorage needed
  const getToken = () => '';

  const authHeaders = () => ({
    'Authorization': `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
  });

  const fetchDiscount = useCallback(async () => {
    const res = await fetch('/api/admin/discounts/global', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setDiscount(data);
      if (data) setDiscountForm({ percentage: String(data.percentage), label: data.label, active: data.active });
    }
  }, []);

  const fetchAnnouncement = useCallback(async () => {
    const res = await fetch('/api/admin/announcement', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setAnnouncement(data);
      if (data) setAnnForm({ text: data.text, active: data.active });
    }
  }, []);

  const fetchTargetedRules = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/discounts/targeted', { credentials: 'include' });
      const data = await res.json();
      setTargetedRules(data);
    } catch {}
  }, []);

  const saveTargetedRule = async () => {
    if (!targetedForm.label || !targetedForm.percentage) return;
    setSavingTargeted(true);
    const body = {
      ...targetedForm,
      percentage: parseFloat(targetedForm.percentage),
      minPrice: targetedForm.minPrice ? parseFloat(targetedForm.minPrice) : null,
      maxPrice: targetedForm.maxPrice ? parseFloat(targetedForm.maxPrice) : null,
    };
    if (editingRule) {
      // Update existing rule
      await fetch('/api/admin/discounts/targeted', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...body, id: editingRule.id }),
      });
    } else {
      await fetch('/api/admin/discounts/targeted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
    }
    setSavingTargeted(false);
    setTargetedModal(false);
    setEditingRule(null);
    setTargetedForm({ type: 'range', label: '', percentage: '15', active: true, productIds: [], minPrice: '', maxPrice: '' });
    fetchTargetedRules();
  };

  const deleteTargetedRule = async (id: number) => {
    await fetch('/api/admin/discounts/targeted', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id }),
    });
    fetchTargetedRules();
  };

  const toggleTargetedRule = async (rule: TargetedRule) => {
    await fetch('/api/admin/discounts/targeted', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...rule, active: !rule.active }),
    });
    fetchTargetedRules();
  };

  const fetchProducts = useCallback(async () => {
    const res = await fetch('/api/admin/products', { credentials: 'include' });
    if (res.status === 401) { router.push('/admin/login'); return; }
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  }, [router]);

  useEffect(() => { fetchProducts(); fetchDiscount(); fetchTargetedRules(); fetchAnnouncement(); }, [fetchProducts, fetchDiscount, fetchTargetedRules, fetchAnnouncement]);

  const openAdd = () => { setEditProduct(null); setForm(EMPTY_FORM); setError(''); setModalOpen(true); };
  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({ name: p.name, description: p.description || '', price: String(p.price), image: p.image || '', category: p.category, featured: p.featured === 1, release_date: p.release_date || '' });
    setError('');
    setModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch('/api/upload', { method: 'POST', credentials: 'include', body: fd });
      const data = await res.json();
      if (data.url) setForm(f => ({ ...f, image: data.url }));
      else setError(data.error || 'فشل رفع الصورة');
    } catch {
      setError('حدث خطأ أثناء رفع الصورة');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.price) { setError('الاسم والسعر مطلوبان'); return; }
    setSaving(true);
    setError('');
    const body = { ...form, price: parseFloat(form.price), featured: form.featured };
    const url = editProduct ? `/api/admin/products/${editProduct.id}` : '/api/admin/products';
    const method = editProduct ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });
    if (res.ok) { setModalOpen(false); fetchProducts(); }
    else { const d = await res.json(); setError(d.error || 'خطأ'); }
    setSaving(false);
  };

  const handleExport = () => {
    // Direct download via anchor - browser handles the file
    const a = document.createElement('a');
    a.href = '/api/admin/export';
    a.download = `billy-store-products-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', { credentials: 'include' });
      const data = await res.json();
      setStats(data);
      setShowStats(true);
    } catch {}
  };

  const handleBulkPrice = async () => {
    if (!priceForm.value) return;
    setSavingPrice(true);
    setPriceResult(null);
    try {
      const res = await fetch('/api/admin/products/bulk-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...priceForm, value: parseFloat(priceForm.value) }),
      });
      const data = await res.json();
      if (data.success) {
        setPriceResult(`✅ تم تعديل سعر ${data.updated} منتج`);
        fetchProducts();
      } else {
        setPriceResult(`❌ ${data.error}`);
      }
    } catch {
      setPriceResult('❌ حدث خطأ');
    }
    setSavingPrice(false);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    setDeletingSelected(true);
    // Single API call deletes all selected in one DB query
    await fetch('/api/admin/products/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ids: Array.from(selectedIds) }),
    });
    setSelectedIds(new Set());
    setDeletingSelected(false);
    fetchProducts();
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map(p => p.id)));
    }
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE', credentials: 'include' });
    setDeleteConfirm(null);
    fetchProducts();
  };

  const saveDiscount = async () => {
    setSavingDiscount(true);
    await fetch('/api/admin/discounts/global', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...discountForm, percentage: parseFloat(discountForm.percentage) }),
    });
    await fetchDiscount();
    setSavingDiscount(false);
    setDiscountModal(false);
  };

  const removeDiscount = async () => {
    await fetch('/api/admin/discounts/global', { method: 'DELETE', credentials: 'include' });
    setDiscount(null);
    setDiscountModal(false);
  };

  const toggleDiscount = async (active: boolean) => {
    if (!discount) return;
    await fetch('/api/admin/discounts/global', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...discount, active }),
    });
    await fetchDiscount();
  };

  const saveAnnouncement = async () => {
    setSavingAnn(true);
    await fetch('/api/admin/announcement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(annForm),
    });
    await fetchAnnouncement();
    setSavingAnn(false);
    setAnnModal(false);
  };

  const removeAnnouncement = async () => {
    await fetch('/api/admin/announcement', { method: 'DELETE', credentials: 'include' });
    setAnnouncement(null);
    setAnnModal(false);
  };

  const toggleAnnouncement = async (active: boolean) => {
    if (!announcement) return;
    await fetch('/api/admin/announcement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...announcement, active }),
    });
    await fetchAnnouncement();
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      // Read file as ArrayBuffer
      const buffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(buffer);

      // Parse XLSX manually using a simple approach
      // We'll send the file as base64 and parse server-side isn't needed
      // Instead parse client-side with a basic XLSX reader
      const { parseXlsx } = await import('@/lib/xlsxParser');
      const rows = parseXlsx(uint8);

      if (rows.length === 0) {
        setImportResult({ imported: 0, errors: ['الملف فارغ أو لا يحتوي على بيانات صحيحة'] });
        setImporting(false);
        return;
      }

      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: rows }),
      });
      const data = await res.json();
      setImportResult({ imported: data.imported || 0, errors: data.errors || [] });
      if (data.imported > 0) fetchProducts();
    } catch {
      setImportResult({ imported: 0, errors: ['حدث خطأ أثناء قراءة الملف'] });
    }
    setImporting(false);
    // Reset file input
    e.target.value = '';
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    // Token cleared by server cookie deletion
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-dark">
      {/* Header */}
      <header className="bg-dark-card border-b border-dark-border px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
            <span className="text-accent font-black text-xs">BS</span>
          </div>
          <div>
            <h1 className="font-black text-white text-sm" aria-label="لوحة تحكم Billy Store">Billy Store</h1>
            <p className="text-muted text-xs">لوحة التحكم</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a href="/" target="_blank" className="text-slate-400 hover:text-accent text-sm transition-colors">
            عرض الموقع ↗
          </a>
          <button onClick={handleLogout} className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-semibold px-4 min-h-11 rounded-lg transition-all">
            تسجيل خروج
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'إجمالي المنتجات', value: products.length, icon: <Package size={30} className="text-primary" />, color: 'primary' },
            { label: 'ألعاب', value: products.filter(p => p.category === 'games').length, icon: <Gamepad2 size={30} className="text-blue-400" />, color: 'blue' },
            { label: 'اشتراكات', value: products.filter(p => p.category === 'subscription').length, icon: <Star size={30} className="text-accent" />, color: 'accent' },
            { label: 'منتجات مميزة', value: products.filter(p => p.featured).length, icon: <Trophy size={30} className="text-amber-400" />, color: 'amber' },
          ].map(s => (
            <div key={s.label} className="bg-dark-card border border-dark-border rounded-2xl p-5">
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="text-3xl font-black text-white">{s.value}</div>
              <div className="text-muted text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Discount Banner */}
        <div className="mb-8 bg-dark-card border border-dark-border rounded-2xl p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Tag size={20} className="text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">الخصم العالمي على المنتجات</h3>
                {discount && discount.active ? (
                  <p className="text-amber-400 text-xs mt-0.5 flex items-center gap-1">
                    <CheckCircle2 size={16} className="text-current flex-shrink-0" /> خصم <span className="font-black">{discount.percentage}%</span> مفعّل — &quot;{discount.label}&quot;
                  </p>
                ) : discount && !discount.active ? (
                  <p className="text-muted text-xs mt-0.5 flex items-center gap-1"><Pause size={16} className="text-current flex-shrink-0" /> خصم {discount.percentage}% موقوف مؤقتاً</p>
                ) : (
                  <p className="text-muted text-xs mt-0.5">لا يوجد خصم مفعّل حالياً</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {discount && (
                <button onClick={() => toggleDiscount(!discount.active)}
                  className={`text-xs font-bold px-3 min-h-11 rounded-lg border transition-all inline-flex items-center justify-center gap-1 ${discount.active ? 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700' : 'bg-green-600/20 border-green-600/40 text-green-400 hover:bg-green-600/30'}`}>
                  {discount.active ? <><Pause size={16} className="text-current" /> إيقاف مؤقت</> : <><Play size={16} className="text-current" /> تفعيل</>}
                </button>
              )}
              <button onClick={() => setDiscountModal(true)}
                className="text-xs font-bold px-4 min-h-11 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:bg-amber-500/30 transition-all inline-flex items-center justify-center gap-1">
                {discount ? <><Pencil size={16} className="text-current" /> تعديل الخصم</> : '+ إضافة خصم'}
              </button>
              {discount && (
                <button onClick={removeDiscount}
                  className="text-xs font-bold px-3 min-h-11 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all inline-flex items-center justify-center gap-1">
                  <Trash2 size={16} className="text-current" /> حذف
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Targeted Discounts */}
        <div className="mb-8 bg-dark-card border border-dark-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Target size={20} className="text-purple-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">خصومات مستهدفة</h3>
                <p className="text-muted text-xs mt-0.5">خصم على منتجات محددة أو نطاق سعري معين</p>
              </div>
            </div>
            <button onClick={() => setTargetedModal(true)}
              className="bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary-light text-xs font-bold px-3 min-h-11 rounded-lg transition-all">
              + إضافة قاعدة
            </button>
          </div>
          {targetedRules.length === 0 ? (
            <p className="text-muted text-xs text-center py-4">لا توجد قواعد خصم مستهدفة</p>
          ) : (
            <div className="space-y-2">
              {targetedRules.map((rule) => (
                <div key={rule.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${rule.active ? 'bg-primary/5 border-primary/20' : 'bg-dark border-dark-border opacity-60'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${rule.type === 'product' ? 'bg-accent/20 text-accent' : 'bg-purple-500/20 text-purple-400'}`}>
                        {rule.type === 'product' ? '🎮 منتجات محددة' : <><HandCoins size={12} className="text-current" /> نطاق سعري</>}
                      </span>
                      <span className="text-red-400 font-black text-sm">-{rule.percentage}%</span>
                      <span className="text-slate-400 text-xs truncate">{rule.label}</span>
                    </div>
                    <p className="text-muted text-xs mt-1">
                      {rule.type === 'range' && (
                        <>
                          {rule.minPrice !== null && rule.maxPrice !== null ? `${rule.minPrice} - ${rule.maxPrice} ر.س` :
                           rule.minPrice !== null ? `فوق ${rule.minPrice} ر.س` :
                           rule.maxPrice !== null ? `تحت ${rule.maxPrice} ر.س` : ''}
                        </>
                      )}
                      {rule.type === 'product' && `${rule.productIds.length} منتج`}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => {
                        setEditingRule(rule);
                        setTargetedForm({
                          type: rule.type,
                          label: rule.label,
                          percentage: String(rule.percentage),
                          active: rule.active,
                          productIds: rule.productIds || [],
                          minPrice: rule.minPrice !== null && rule.minPrice !== undefined ? String(rule.minPrice) : '',
                          maxPrice: rule.maxPrice !== null && rule.maxPrice !== undefined ? String(rule.maxPrice) : '',
                        });
                        setTargetedModal(true);
                      }}
                      className="text-xs px-2 py-1 rounded-lg border border-primary/30 text-primary-light hover:bg-primary/20 transition-all">
                      <Pencil size={16} className="text-current" />
                    </button>
                    <button onClick={() => toggleTargetedRule(rule)}
                      className={`text-xs px-2 py-1 rounded-lg border transition-all ${rule.active ? 'bg-slate-700/50 border-slate-600 text-slate-400' : 'bg-green-600/20 border-green-600/40 text-green-400'}`}>
                      {rule.active ? <Pause size={16} className="text-current" /> : <Play size={16} className="text-current" />}
                    </button>
                    <button onClick={() => deleteTargetedRule(rule.id)}
                      className="text-xs px-2 py-1 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all">
                      <X size={16} className="text-current" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Announcement Bar */}
        <div className="mb-8 bg-dark-card border border-dark-border rounded-2xl p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Megaphone size={20} className="text-primary-light" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">الشريط الإعلاني</h3>
                {announcement && announcement.active ? (
                  <p className="text-primary-light text-xs mt-0.5 line-clamp-1 flex items-center gap-1">
                    <CheckCircle2 size={16} className="text-current flex-shrink-0" /> &quot;{announcement.text}&quot;
                  </p>
                ) : announcement && !announcement.active ? (
                  <p className="text-muted text-xs mt-0.5 flex items-center gap-1"><Pause size={16} className="text-current flex-shrink-0" /> موقوف — &quot;{announcement.text}&quot;</p>
                ) : (
                  <p className="text-muted text-xs mt-0.5">لا يوجد إعلان مفعّل</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {announcement && (
                <button onClick={() => toggleAnnouncement(!announcement.active)}
                  className={`text-xs font-bold px-3 min-h-11 rounded-lg border transition-all inline-flex items-center justify-center gap-1 ${announcement.active ? 'bg-slate-700/50 border-slate-600 text-slate-300' : 'bg-primary/20 border-primary/40 text-primary-light'}`}>
                  {announcement.active ? <><Pause size={16} className="text-current" /> إيقاف</> : <><Play size={16} className="text-current" /> تفعيل</>}
                </button>
              )}
              <button onClick={() => setAnnModal(true)}
                className="text-xs font-bold px-4 min-h-11 rounded-lg bg-primary/20 border border-primary/40 text-primary-light hover:bg-primary/30 transition-all inline-flex items-center justify-center gap-1">
                {announcement ? <><Pencil size={16} className="text-current" /> تعديل</> : '+ إضافة إعلان'}
              </button>
              {announcement && (
                <button onClick={removeAnnouncement}
                  className="text-xs font-bold px-3 min-h-11 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all inline-flex items-center justify-center gap-1">
                  <Trash2 size={16} className="text-current" /> حذف
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Import Result */}
        {importResult && (
          <div className={`mb-6 p-4 rounded-2xl border ${importResult.imported > 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
            <div className="flex items-center justify-between">
              <div>
                {importResult.imported > 0 && (
                  <p className="text-green-400 font-bold flex items-center gap-1">
                    <CheckCircle2 size={16} className="text-current flex-shrink-0" /> تم استيراد {importResult.imported} منتج بنجاح
                  </p>
                )}
                {importResult.errors.map((e, i) => (
                  <p key={i} className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <AlertTriangle size={16} className="text-current flex-shrink-0" /> {e}
                  </p>
                ))}
              </div>
              <button onClick={() => setImportResult(null)} className="text-muted hover:text-white text-xl min-w-11 min-h-11 inline-flex items-center justify-center">×</button>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-b border-dark-border">
            <h2 className="font-black text-white text-lg">إدارة المنتجات</h2>
            <div className="flex flex-wrap gap-2">
              <a href="/template.csv" download="billy-store-template.csv"
                className="bg-slate-700/50 hover:bg-slate-700 border border-slate-600/40 text-slate-300 font-bold py-2 px-3 rounded-xl transition-all flex items-center gap-1 text-xs">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                قالب CSV
              </a>
              <button onClick={handleExport}
                className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/40 text-blue-400 font-bold min-h-11 px-3 rounded-xl transition-all flex items-center gap-1 text-xs">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                تصدير CSV
              </button>
              <button onClick={fetchStats}
                className="bg-purple-600/20 hover:bg-purple-600/30 border border-purple-600/40 text-purple-400 font-bold min-h-11 px-3 rounded-xl transition-all flex items-center gap-1 text-xs">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                الإحصائيات
              </button>
              <button onClick={() => { setPriceModal(true); setPriceResult(null); }}
                className="bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/40 text-amber-400 font-bold min-h-11 px-3 rounded-xl transition-all flex items-center gap-1 text-xs">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                تعديل الأسعار
              </button>
              <label className="bg-green-600/20 hover:bg-green-600/30 border border-green-600/40 text-green-400 font-bold py-2 px-4 rounded-xl transition-all flex items-center gap-2 text-sm cursor-pointer">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {importing ? 'جاري الاستيراد...' : 'استيراد Excel / CSV'}
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelImport} className="hidden" disabled={importing} />
              </label>
              <button onClick={openAdd} className="bg-primary hover:bg-primary-dark text-white font-bold min-h-11 px-5 rounded-xl transition-all flex items-center gap-2 text-sm">
                <span className="text-lg leading-none">+</span>
                إضافة منتج
              </button>
            </div>
          </div>

          {/* Bulk action bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
              <span className="text-red-400 text-sm font-bold">تم تحديد {selectedIds.size} منتج</span>
              <div className="flex gap-2 mr-auto">
                <button onClick={() => setSelectedIds(new Set())}
                  className="text-slate-400 hover:text-white text-xs px-3 min-h-11 rounded-lg border border-dark-border transition-all">
                  إلغاء التحديد
                </button>
                <button onClick={handleDeleteSelected} disabled={deletingSelected}
                  className="bg-red-500 hover:bg-red-600 text-white text-xs font-black px-4 min-h-11 rounded-lg transition-all disabled:opacity-50 inline-flex items-center justify-center gap-1">
                  {deletingSelected ? 'جاري الحذف...' : <><Trash2 size={16} className="text-current" /> حذف المحدد ({selectedIds.size})</>}
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-16 text-muted">جاري التحميل...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <div className="mb-3 flex items-center justify-center"><Package size={48} className="text-muted" /></div>
              <p className="text-slate-400">لا توجد منتجات بعد</p>
              <button onClick={openAdd} className="mt-4 ps-btn text-sm">أضف أول منتج</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-border">
                    <th className="px-4 py-3 w-10">
                      <input type="checkbox"
                        checked={selectedIds.size === products.length && products.length > 0}
                        onChange={toggleSelectAll}
                        className="w-5 h-5 accent-primary cursor-pointer" />
                    </th>
                    <th className="text-right text-muted text-sm font-semibold px-6 py-3">المنتج</th>
                    <th className="hidden sm:table-cell text-right text-muted text-sm font-semibold px-4 py-3">الفئة</th>
                    <th className="text-right text-muted text-sm font-semibold px-4 py-3">السعر</th>
                    <th className="hidden sm:table-cell text-right text-muted text-sm font-semibold px-4 py-3">مميز</th>
                    <th className="text-right text-muted text-sm font-semibold px-6 py-3">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id} className={`border-b border-dark-border/50 hover:bg-dark/30 transition-colors ${selectedIds.has(product.id) ? 'bg-primary/5' : ''}`}>
                      <td className="px-4 py-4">
                        <input type="checkbox"
                          checked={selectedIds.has(product.id)}
                          onChange={() => toggleSelect(product.id)}
                          className="w-5 h-5 accent-primary cursor-pointer" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-dark border border-dark-border overflow-hidden flex-shrink-0">
                            {product.image ? (
                              <Image src={product.image} alt={product.name} width={48} height={48} className="object-cover w-full h-full" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xl">
                                {product.category === 'subscription' ? '⭐' : '🎮'}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-white font-semibold text-sm">{product.name}</p>
                            <p className="text-muted text-xs mt-0.5 line-clamp-1 max-w-[200px]">{product.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-4 py-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${product.category === 'subscription' ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-primary/10 text-primary-light border border-primary/20'}`}>
                          {product.category === 'subscription' ? 'اشتراك' : 'لعبة'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-accent font-black">{product.price}</span>
                        <span className="text-muted text-xs mr-1">ر.س</span>
                      </td>
                      <td className="hidden sm:table-cell px-4 py-4">
                        {product.featured ? (
                          <span className="text-amber-400 text-sm">⭐ نعم</span>
                        ) : (
                          <span className="text-muted text-sm">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(product)}
                            className="bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary-light text-xs font-bold px-3 min-h-11 rounded-lg transition-all">
                            تعديل
                          </button>
                          <button onClick={() => setDeleteConfirm(product.id)}
                            className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold px-3 min-h-11 rounded-lg transition-all">
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}></div>
          <div className="relative bg-dark-card border border-dark-border rounded-3xl p-8 w-full max-w-sm">
            <h3 className="text-xl font-black text-white mb-2">حذف المنتج</h3>
            <p className="text-slate-400 text-sm mb-6">
              هل تريد حذف &quot;{products.find(p => p.id === deleteConfirm)?.name}&quot;؟ هذا الإجراء لا يمكن التراجع عنه.
            </p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-black py-3 rounded-xl transition-all">
                تأكيد الحذف
              </button>
              <button onClick={() => setDeleteConfirm(null)}
                className="bg-dark border border-dark-border text-slate-400 font-semibold py-3 px-5 rounded-xl transition-all hover:border-slate-500">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Announcement Modal */}
      {annModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setAnnModal(false)}></div>
          <div className="relative bg-dark-card border border-dark-border rounded-3xl p-8 w-full max-w-md">
            <h3 className="text-xl font-black text-white mb-2 flex items-center gap-2"><Megaphone size={20} className="text-current" /> الشريط الإعلاني</h3>
            <p className="text-slate-400 text-sm mb-6">يظهر في أعلى الموقع لجميع الزوار</p>
            <div className="space-y-4">
              <div>
                <label htmlFor="announcement-text" className="block text-slate-400 text-sm font-semibold mb-2">نص الإعلان</label>
                <input id="announcement-text" type="text" value={annForm.text}
                  onChange={e => setAnnForm({...annForm, text: e.target.value})}
                  placeholder="مثال: 🔥 تسليم فوري خلال دقائق — تواصل معنا الآن!"
                  className="w-full bg-dark border border-dark-border rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-primary transition-colors text-sm" />
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setAnnForm({...annForm, active: !annForm.active})}
                  className="min-w-11 min-h-11 flex-shrink-0 inline-flex items-center justify-center">
                  <span className={`w-12 h-6 rounded-full transition-all duration-300 relative inline-block ${annForm.active ? 'bg-primary' : 'bg-dark-border'}`}>
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${annForm.active ? 'right-1' : 'left-1'}`}></span>
                  </span>
                </button>
                <span className="text-slate-300 text-sm font-semibold flex items-center gap-1">
                  {annForm.active ? <><CheckCircle2 size={16} className="text-current" /> مفعّل — يظهر للزوار</> : <><Pause size={16} className="text-current" /> موقوف</>}
                </span>
              </div>
              {annForm.text && (
                <div className="bg-gradient-to-l from-primary to-accent rounded-xl p-3 text-center text-white text-sm font-bold">
                  معاينة: {annForm.text}
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={saveAnnouncement} disabled={savingAnn || !annForm.text}
                className="flex-1 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-black py-3 rounded-xl transition-all inline-flex items-center justify-center gap-1">
                {savingAnn ? 'جاري الحفظ...' : <><Save size={16} className="text-current" /> حفظ</>}
              </button>
              <button onClick={() => setAnnModal(false)}
                className="bg-dark border border-dark-border text-slate-400 font-semibold py-3 px-5 rounded-xl transition-all hover:border-slate-500">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {showStats && stats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowStats(false)}></div>
          <div className="relative bg-dark-card border border-dark-border rounded-3xl p-6 w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-black text-white flex items-center gap-2"><BarChart3 size={20} className="text-current" /> إحصائيات الموقع</h3>
              <button onClick={() => setShowStats(false)} className="text-muted hover:text-white text-2xl leading-none min-w-11 min-h-11 inline-flex items-center justify-center">×</button>
            </div>

            {/* Visit counters */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-dark border border-dark-border rounded-2xl p-4 text-center">
                <p className="text-3xl font-black text-accent">{stats.totalVisits.toLocaleString()}</p>
                <p className="text-slate-400 text-xs mt-1">إجمالي الزيارات</p>
              </div>
              <div className="bg-dark border border-dark-border rounded-2xl p-4 text-center">
                <p className="text-3xl font-black text-green-400">{stats.todayVisits.toLocaleString()}</p>
                <p className="text-slate-400 text-xs mt-1">زيارات اليوم</p>
              </div>
            </div>

            {/* Sort tabs */}
            <div className="flex gap-2 mb-3">
              <button onClick={() => setStatsSort('views')}
                className={`text-xs font-bold px-3 min-h-11 rounded-lg border transition-all ${statsSort === 'views' ? 'bg-primary/20 border-primary/40 text-primary-light' : 'bg-dark border-dark-border text-slate-400'}`}>
                ترتيب حسب المشاهدات
              </button>
              <button onClick={() => setStatsSort('price')}
                className={`text-xs font-bold px-3 min-h-11 rounded-lg border transition-all ${statsSort === 'price' ? 'bg-primary/20 border-primary/40 text-primary-light' : 'bg-dark border-dark-border text-slate-400'}`}>
                ترتيب حسب السعر
              </button>
            </div>

            {/* Products table */}
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-dark-card">
                  <tr className="border-b border-dark-border">
                    <th className="text-right text-muted text-xs font-semibold py-2 px-3">#</th>
                    <th className="text-right text-muted text-xs font-semibold py-2 px-3">المنتج</th>
                    <th className="text-right text-muted text-xs font-semibold py-2 px-3">السعر</th>
                    <th className="text-right text-muted text-xs font-semibold py-2 px-3">المشاهدات</th>
                  </tr>
                </thead>
                <tbody>
                  {[...stats.productViews]
                    .sort((a, b) => statsSort === 'views' ? b.views - a.views : b.price - a.price)
                    .map((p, i) => (
                    <tr key={p.id} className="border-b border-dark-border/40 hover:bg-dark/40 transition-colors">
                      <td className="py-2.5 px-3 text-muted text-xs">{i + 1}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-dark-border flex items-center justify-center flex-shrink-0 text-sm">
                              {p.category === 'subscription' ? '⭐' : '🎮'}
                            </div>
                          )}
                          <span className="text-white text-xs font-semibold line-clamp-1">{p.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-accent font-bold text-xs">{p.price} ر.س</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-dark-border rounded-full h-1.5 max-w-16">
                            <div className="bg-primary rounded-full h-1.5 transition-all"
                              style={{ width: `${stats.productViews[0]?.views > 0 ? (p.views / stats.productViews[0].views) * 100 : 0}%` }}></div>
                          </div>
                          <span className={`font-black text-xs ${p.views > 0 ? 'text-primary-light' : 'text-muted'}`}>
                            {p.views > 0 ? p.views.toLocaleString() : '—'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Price Modal */}
      {priceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setPriceModal(false)}></div>
          <div className="relative bg-dark-card border border-dark-border rounded-3xl p-8 w-full max-w-md">
            <h3 className="text-xl font-black text-white mb-1 flex items-center gap-2"><HandCoins size={20} className="text-current" /> تعديل الأسعار بالجملة</h3>
            <p className="text-slate-400 text-sm mb-6">هذا الإجراء يعدّل الأسعار الفعلية في قاعدة البيانات بشكل دائم</p>

            <div className="space-y-4">
              {/* Direction */}
              <div>
                <label className="block text-slate-400 text-sm font-semibold mb-2">الاتجاه</label>
                <div className="flex gap-2">
                  <button onClick={() => setPriceForm({...priceForm, direction: 'increase'})}
                    className={`flex-1 min-h-11 rounded-xl text-sm font-bold border transition-all inline-flex items-center justify-center gap-1 ${priceForm.direction === 'increase' ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-dark border-dark-border text-slate-400'}`}>
                    <TrendingUp size={16} className="text-current" /> رفع السعر
                  </button>
                  <button onClick={() => setPriceForm({...priceForm, direction: 'decrease'})}
                    className={`flex-1 min-h-11 rounded-xl text-sm font-bold border transition-all inline-flex items-center justify-center gap-1 ${priceForm.direction === 'decrease' ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-dark border-dark-border text-slate-400'}`}>
                    <TrendingDown size={16} className="text-current" /> تخفيض السعر
                  </button>
                </div>
              </div>

              {/* Mode */}
              <div>
                <label className="block text-slate-400 text-sm font-semibold mb-2">نوع التعديل</label>
                <div className="flex gap-2">
                  <button onClick={() => setPriceForm({...priceForm, mode: 'percentage'})}
                    className={`flex-1 min-h-11 rounded-xl text-sm font-bold border transition-all ${priceForm.mode === 'percentage' ? 'bg-primary/20 border-primary/50 text-primary-light' : 'bg-dark border-dark-border text-slate-400'}`}>
                    % نسبة مئوية
                  </button>
                  <button onClick={() => setPriceForm({...priceForm, mode: 'fixed'})}
                    className={`flex-1 min-h-11 rounded-xl text-sm font-bold border transition-all ${priceForm.mode === 'fixed' ? 'bg-primary/20 border-primary/50 text-primary-light' : 'bg-dark border-dark-border text-slate-400'}`}>
                    ر.س مبلغ ثابت
                  </button>
                </div>
              </div>

              {/* Value */}
              <div>
                <label htmlFor="bulk-price-value" className="block text-slate-400 text-sm font-semibold mb-2">
                  {priceForm.mode === 'percentage' ? 'النسبة (%)' : 'المبلغ (ريال)'}
                </label>
                <div className="relative">
                  <input id="bulk-price-value" type="number" min="1" value={priceForm.value}
                    onChange={e => setPriceForm({...priceForm, value: e.target.value})}
                    placeholder={priceForm.mode === 'percentage' ? 'مثال: 20' : 'مثال: 30'}
                    className="w-full bg-dark border border-dark-border rounded-xl px-4 py-3 text-white text-2xl font-black focus:outline-none focus:border-amber-500 transition-colors" />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400 text-lg font-black">
                    {priceForm.mode === 'percentage' ? '%' : 'ر.س'}
                  </span>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-slate-400 text-sm font-semibold mb-2">تطبيق على</label>
                <div className="flex gap-2">
                  {[['all','كل المنتجات'],['games','الألعاب فقط'],['subscription','الاشتراكات فقط']].map(([val, label]) => (
                    <button key={val} onClick={() => setPriceForm({...priceForm, category: val})}
                      className={`flex-1 min-h-11 rounded-xl text-xs font-bold border transition-all ${priceForm.category === val ? 'bg-accent/20 border-accent/50 text-accent' : 'bg-dark border-dark-border text-slate-400'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              {priceForm.value && (
                <div className={`rounded-xl p-3 text-sm border ${priceForm.direction === 'increase' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                  <p className={`font-bold mb-1 ${priceForm.direction === 'increase' ? 'text-green-400' : 'text-red-400'}`}>معاينة:</p>
                  <p className="text-slate-300">
                    سعر 100 ر.س →{' '}
                    <span className={`font-black ${priceForm.direction === 'increase' ? 'text-green-400' : 'text-red-400'}`}>
                      {priceForm.mode === 'percentage'
                        ? Math.max(1, Math.round(priceForm.direction === 'increase'
                            ? 100 * (1 + parseFloat(priceForm.value || '0') / 100)
                            : 100 * (1 - parseFloat(priceForm.value || '0') / 100)))
                        : Math.max(1, Math.round(priceForm.direction === 'increase'
                            ? 100 + parseFloat(priceForm.value || '0')
                            : 100 - parseFloat(priceForm.value || '0')))} ر.س
                    </span>
                  </p>
                </div>
              )}

              {priceResult && (
                <div className={`rounded-xl p-3 text-sm font-bold flex items-center gap-1 ${priceResult.startsWith('✅') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  {priceResult.startsWith('✅')
                    ? <CheckCircle2 size={16} className="text-current flex-shrink-0" />
                    : <XCircle size={16} className="text-current flex-shrink-0" />}
                  {priceResult.replace(/^[✅❌]\s*/, '')}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleBulkPrice} disabled={savingPrice || !priceForm.value}
                className={`flex-1 disabled:opacity-50 text-white font-black py-3 rounded-xl transition-all inline-flex items-center justify-center gap-1 ${priceForm.direction === 'increase' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'}`}>
                {savingPrice ? 'جاري التعديل...' : priceForm.direction === 'increase' ? <><TrendingUp size={16} className="text-current" /> رفع الأسعار</> : <><TrendingDown size={16} className="text-current" /> تخفيض الأسعار</>}
              </button>
              <button onClick={() => setPriceModal(false)}
                className="bg-dark border border-dark-border text-slate-400 font-semibold py-3 px-5 rounded-xl">
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Targeted Discount Modal */}
      {targetedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { setTargetedModal(false); setEditingRule(null); setTargetedForm({ type: 'range', label: '', percentage: '15', active: true, productIds: [], minPrice: '', maxPrice: '' }); }}></div>
          <div className="relative bg-dark-card border border-dark-border rounded-3xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-black text-white mb-2 flex items-center gap-2">
              {editingRule ? <><Pencil size={20} className="text-current" /> تعديل الخصم المستهدف</> : <><Target size={20} className="text-current" /> خصم مستهدف جديد</>}
            </h3>
            <p className="text-slate-400 text-sm mb-6">خصم على منتجات محددة أو نطاق سعري معين</p>

            {/* Type selector */}
            <div className="flex gap-2 mb-5">
              <button onClick={() => setTargetedForm({...targetedForm, type: 'range', productIds: []})}
                className={`flex-1 min-h-11 rounded-xl text-sm font-bold border transition-all inline-flex items-center justify-center gap-1 ${targetedForm.type === 'range' ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' : 'bg-dark border-dark-border text-slate-400 hover:border-slate-500'}`}>
                <HandCoins size={16} className="text-current" /> نطاق سعري
              </button>
              <button onClick={() => setTargetedForm({...targetedForm, type: 'product', minPrice: '', maxPrice: ''})}
                className={`flex-1 min-h-11 rounded-xl text-sm font-bold border transition-all ${targetedForm.type === 'product' ? 'bg-accent/20 border-accent/50 text-accent' : 'bg-dark border-dark-border text-slate-400 hover:border-slate-500'}`}>
                🎮 منتجات محددة
              </button>
            </div>

            <div className="space-y-4">
              {/* Label */}
              <div>
                <label htmlFor="targeted-label" className="block text-slate-400 text-sm font-semibold mb-2">اسم العرض</label>
                <input id="targeted-label" type="text" value={targetedForm.label}
                  onChange={e => setTargetedForm({...targetedForm, label: e.target.value})}
                  placeholder="مثال: عرض الألعاب الغالية"
                  className="w-full bg-dark border border-dark-border rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-primary transition-colors text-sm" />
              </div>

              {/* Percentage */}
              <div>
                <label htmlFor="targeted-percentage" className="block text-slate-400 text-sm font-semibold mb-2">نسبة الخصم (%)</label>
                <div className="relative">
                  <input id="targeted-percentage" type="number" min="1" max="90" value={targetedForm.percentage}
                    onChange={e => setTargetedForm({...targetedForm, percentage: e.target.value})}
                    className="w-full bg-dark border border-dark-border rounded-xl px-4 py-3 text-white text-2xl font-black focus:outline-none focus:border-primary transition-colors"
                    placeholder="15" />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-light text-2xl font-black">%</span>
                </div>
              </div>

              {/* Range fields */}
              {targetedForm.type === 'range' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="targeted-min-price" className="block text-slate-400 text-sm font-semibold mb-2">السعر من (ر.س)</label>
                    <input id="targeted-min-price" type="number" value={targetedForm.minPrice}
                      onChange={e => setTargetedForm({...targetedForm, minPrice: e.target.value})}
                      placeholder="0 (بدون حد أدنى)"
                      className="w-full bg-dark border border-dark-border rounded-xl px-3 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-primary transition-colors text-sm" />
                  </div>
                  <div>
                    <label htmlFor="targeted-max-price" className="block text-slate-400 text-sm font-semibold mb-2">السعر إلى (ر.س)</label>
                    <input id="targeted-max-price" type="number" value={targetedForm.maxPrice}
                      onChange={e => setTargetedForm({...targetedForm, maxPrice: e.target.value})}
                      placeholder="∞ (بدون حد أعلى)"
                      className="w-full bg-dark border border-dark-border rounded-xl px-3 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-primary transition-colors text-sm" />
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted text-xs">
                      {targetedForm.minPrice && targetedForm.maxPrice && `سيُطبق على المنتجات من ${targetedForm.minPrice} إلى ${targetedForm.maxPrice} ر.س`}
                      {targetedForm.minPrice && !targetedForm.maxPrice && `سيُطبق على المنتجات فوق ${targetedForm.minPrice} ر.س`}
                      {!targetedForm.minPrice && targetedForm.maxPrice && `سيُطبق على المنتجات تحت ${targetedForm.maxPrice} ر.س`}
                    </p>
                  </div>
                </div>
              )}

              {/* Product selector */}
              {targetedForm.type === 'product' && (
                <div>
                  <label className="block text-slate-400 text-sm font-semibold mb-2">اختر المنتجات</label>
                  <div className="max-h-48 overflow-y-auto space-y-1 bg-dark rounded-xl border border-dark-border p-2">
                    {products.map(p => (
                      <label key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-card cursor-pointer">
                        <input type="checkbox"
                          checked={targetedForm.productIds.includes(p.id)}
                          onChange={() => {
                            const ids = targetedForm.productIds.includes(p.id)
                              ? targetedForm.productIds.filter(id => id !== p.id)
                              : [...targetedForm.productIds, p.id];
                            setTargetedForm({...targetedForm, productIds: ids});
                          }}
                          className="w-4 h-4 accent-primary" />
                        <span className="text-white text-sm">{p.name}</span>
                        <span className="text-muted text-xs mr-auto">{p.price} ر.س</span>
                      </label>
                    ))}
                  </div>
                  {targetedForm.productIds.length > 0 && (
                    <p className="text-primary-light text-xs mt-1">تم تحديد {targetedForm.productIds.length} منتج</p>
                  )}
                </div>
              )}

              {/* Preview */}
              {targetedForm.percentage && (
                <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 text-sm">
                  <p className="text-primary-light font-bold mb-1">معاينة:</p>
                  <p className="text-slate-300">سعر 100 ر.س → <span className="text-red-400 font-black">{(100 * (1 - parseFloat(targetedForm.percentage || '0') / 100)).toFixed(0)} ر.س</span></p>
                </div>
              )}

              {/* Active toggle */}
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setTargetedForm({...targetedForm, active: !targetedForm.active})}
                  className="min-w-11 min-h-11 flex-shrink-0 inline-flex items-center justify-center">
                  <span className={`w-12 h-6 rounded-full transition-all duration-300 relative inline-block ${targetedForm.active ? 'bg-primary' : 'bg-dark-border'}`}>
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${targetedForm.active ? 'right-1' : 'left-1'}`}></span>
                  </span>
                </button>
                <span className="text-slate-300 text-sm flex items-center gap-1">{targetedForm.active ? <><CheckCircle2 size={16} className="text-current" /> مفعّل</> : <><Pause size={16} className="text-current" /> موقوف</>}</span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={saveTargetedRule} disabled={savingTargeted}
                className="flex-1 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-black py-3 rounded-xl transition-all inline-flex items-center justify-center gap-1">
                {savingTargeted ? 'جاري الحفظ...' : <><Save size={16} className="text-current" /> {editingRule ? 'حفظ التعديل' : 'إضافة القاعدة'}</>}
              </button>
              <button onClick={() => setTargetedModal(false)}
                className="bg-dark border border-dark-border text-slate-400 font-semibold py-3 px-5 rounded-xl">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discount Modal */}
      {discountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDiscountModal(false)}></div>
          <div className="relative bg-dark-card border border-dark-border rounded-3xl p-8 w-full max-w-md">
            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2"><Tag size={20} className="text-current" /> إعداد الخصم العالمي</h3>
            <p className="text-slate-400 text-sm mb-6">سيُطبق هذا الخصم تلقائياً على جميع المنتجات دون تعديل الأسعار الأصلية</p>
            <div className="space-y-4">
              <div>
                <label htmlFor="global-discount-percentage" className="block text-slate-400 text-sm font-semibold mb-2">نسبة الخصم (%)</label>
                <div className="relative">
                  <input id="global-discount-percentage" type="number" min="1" max="90" value={discountForm.percentage}
                    onChange={e => setDiscountForm({...discountForm, percentage: e.target.value})}
                    className="w-full bg-dark border border-dark-border rounded-xl px-4 py-3 text-white text-2xl font-black focus:outline-none focus:border-amber-500 transition-colors"
                    placeholder="20" />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400 text-2xl font-black">%</span>
                </div>
              </div>
              <div>
                <label htmlFor="global-discount-label" className="block text-slate-400 text-sm font-semibold mb-2">اسم العرض (يظهر للزوار)</label>
                <input id="global-discount-label" type="text" value={discountForm.label}
                  onChange={e => setDiscountForm({...discountForm, label: e.target.value})}
                  placeholder="مثال: عرض رمضان، تخفيضات الصيف..."
                  className="w-full bg-dark border border-dark-border rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors text-sm" />
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setDiscountForm({...discountForm, active: !discountForm.active})}
                  className="min-w-11 min-h-11 flex-shrink-0 inline-flex items-center justify-center">
                  <span className={`w-12 h-6 rounded-full transition-all duration-300 relative inline-block ${discountForm.active ? 'bg-amber-500' : 'bg-dark-border'}`}>
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${discountForm.active ? 'right-1' : 'left-1'}`}></span>
                  </span>
                </button>
                <span className="text-slate-300 text-sm font-semibold flex items-center gap-1">
                  {discountForm.active ? <><CheckCircle2 size={16} className="text-current" /> مفعّل — سيظهر للزوار فوراً</> : <><Pause size={16} className="text-current" /> موقوف — لن يظهر للزوار</>}
                </span>
              </div>
              {discountForm.percentage && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-sm">
                  <p className="text-amber-400 font-bold mb-1">معاينة التأثير:</p>
                  <p className="text-slate-300">منتج بسعر <span className="line-through text-muted">100 ر.س</span> → <span className="text-amber-400 font-black">{(100 * (1 - parseFloat(discountForm.percentage || '0') / 100)).toFixed(0)} ر.س</span></p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={saveDiscount} disabled={savingDiscount}
                className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-dark font-black py-3 rounded-xl transition-all inline-flex items-center justify-center gap-1">
                {savingDiscount ? 'جاري الحفظ...' : <><Save size={16} className="text-current" /> حفظ الخصم</>}
              </button>
              <button onClick={() => setDiscountModal(false)}
                className="bg-dark border border-dark-border text-slate-400 font-semibold py-3 px-5 rounded-xl transition-all hover:border-slate-500">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setModalOpen(false)}></div>
          <div className="relative bg-dark-card border border-dark-border rounded-3xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-black text-white mb-6">
              {editProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
            </h3>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-5 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="product-name" className="block text-slate-400 text-sm font-semibold mb-2">اسم المنتج *</label>
                <input id="product-name" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="مثال: God of War Ragnarök"
                  className="w-full bg-dark border border-dark-border rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-primary transition-colors text-sm" />
              </div>

              <div>
                <label htmlFor="product-description" className="block text-slate-400 text-sm font-semibold mb-2">الوصف</label>
                <textarea id="product-description" value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  placeholder="وصف مختصر للمنتج..."
                  rows={3}
                  className="w-full bg-dark border border-dark-border rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-primary transition-colors text-sm resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="product-price" className="block text-slate-400 text-sm font-semibold mb-2">السعر (ريال) *</label>
                  <input id="product-price" type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})}
                    placeholder="0"
                    className="w-full bg-dark border border-dark-border rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-primary transition-colors text-sm" />
                </div>
                <div>
                  <label htmlFor="product-category" className="block text-slate-400 text-sm font-semibold mb-2">الفئة</label>
                  <select id="product-category" value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                    className="w-full bg-dark border border-dark-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors text-sm">
                    <option value="games">🎮 لعبة</option>
                    <option value="subscription">⭐ اشتراك PS Plus</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-sm font-semibold mb-2">صورة المنتج</label>
                <div className="flex gap-3">
                  <label className="flex-1 flex items-center justify-center gap-2 bg-dark border border-dark-border border-dashed rounded-xl px-4 py-3 text-muted hover:border-primary hover:text-primary-light transition-all cursor-pointer text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {uploading ? 'جاري الرفع...' : 'رفع صورة'}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  {form.image && (
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-dark-border flex-shrink-0">
                      <Image src={form.image} alt="preview" width={56} height={56} className="object-cover w-full h-full" />
                    </div>
                  )}
                </div>
                <input value={form.image} onChange={e => setForm({...form, image: e.target.value})}
                  placeholder="أو أدخل رابط الصورة مباشرة"
                  className="w-full mt-2 bg-dark border border-dark-border rounded-xl px-4 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-primary transition-colors text-xs" />
              </div>

              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setForm({...form, featured: !form.featured})}
                  className="min-w-11 min-h-11 flex-shrink-0 inline-flex items-center justify-center">
                  <span className={`w-12 h-6 rounded-full transition-all duration-300 relative inline-block ${form.featured ? 'bg-amber-500' : 'bg-dark-border'}`}>
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${form.featured ? 'right-1' : 'left-1'}`}></span>
                  </span>
                </button>
                <span className="text-slate-300 text-sm font-semibold">منتج مميز (يظهر في الصفحة الرئيسية)</span>
              </div>

              <div>
                <label htmlFor="product-release-date" className="block text-slate-400 text-sm font-semibold mb-2">تاريخ الإصدار (اختياري)</label>
                <input id="product-release-date" type="date" value={form.release_date || ''} onChange={e => setForm({...form, release_date: e.target.value})}
                  className="w-full bg-dark border border-dark-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors text-sm" />
                <p className="text-muted text-xs mt-1">يُستخدم لترتيب المنتجات حسب الأحدث</p>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={handleSave} disabled={saving}
                className="flex-1 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-black py-3 rounded-xl transition-all">
                {saving ? 'جاري الحفظ...' : editProduct ? 'حفظ التعديلات' : 'إضافة المنتج'}
              </button>
              <button onClick={() => setModalOpen(false)}
                className="bg-dark border border-dark-border hover:border-slate-500 text-slate-400 font-semibold py-3 px-6 rounded-xl transition-all">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
