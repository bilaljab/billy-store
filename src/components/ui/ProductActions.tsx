'use client';
import { useEffect, useState } from 'react';

interface Props {
  product: { id: number; name: string; price: number };
  waMsg: string;
}

export default function ProductActions({ product, waMsg }: Props) {
  const [copied, setCopied] = useState<'name' | 'msg' | null>(null);
  const [shared, setShared] = useState(false);

  // Track view
  useEffect(() => {
    fetch('/api/views', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: product.id }) });
  }, [product.id]);

  const copy = async (type: 'name' | 'msg') => {
    const text = type === 'name' ? product.name : `أريد الاستفسار عن:\n🎮 ${product.name}\n💰 السعر: ${product.price} ريال`;
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: product.name, text: `${product.name} - ${product.price} ريال`, url });
    } else {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Main CTA buttons */}
      <div className="flex flex-col lg:flex-row gap-3">
        <a href={`https://wa.me/966508949041?text=${waMsg}`} target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-3 bg-green-600 hover:bg-green-500 text-white font-black py-4 px-6 rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-green-500/30 text-lg">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.525 5.847L.057 23.516a.5.5 0 00.612.612l5.666-1.469A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.99 0-3.86-.538-5.468-1.476l-.392-.232-4.062 1.054 1.054-4.061-.232-.393A9.936 9.936 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
          </svg>
          اطلب عبر واتساب
        </a>
        <a href="https://t.me/BillyStore1" target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-blue-500/20 hover:bg-blue-500 border border-blue-500/30 text-blue-400 hover:text-white font-bold py-3 px-4 rounded-xl transition-all text-sm">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
          تواصل عبر تيليجرام
        </a>
        <a href="https://ig.me/m/Billy_Store3" target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-gradient-to-l from-purple-600 to-pink-600 hover:opacity-90 text-white font-bold py-4 px-5 rounded-xl transition-all duration-300">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
          راسلنا عبر إنستقرام
        </a>
      </div>

      {/* Quick action buttons */}
      <p className="text-xs text-muted text-center">💡 انسخ الرسالة وألصقها بمحادثة إنستقرام</p>
      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => copy('name')}
          className="flex items-center justify-center gap-2 bg-dark-card border border-dark-border hover:border-primary/50 text-slate-300 hover:text-white font-semibold py-2.5 px-3 rounded-xl transition-all text-xs">
          {copied === 'name' ? (
            <><span className="text-green-400">✓</span> تم النسخ</>
          ) : (
            <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>نسخ الاسم</>
          )}
        </button>
        <button onClick={() => copy('msg')}
          className="flex items-center justify-center gap-2 bg-dark-card border border-dark-border hover:border-green-500/50 text-slate-300 hover:text-white font-semibold py-2.5 px-3 rounded-xl transition-all text-xs">
          {copied === 'msg' ? (
            <><span className="text-green-400">✓</span> تم النسخ</>
          ) : (
            <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>نسخ رسالة</>
          )}
        </button>
        <button onClick={share}
          className="flex items-center justify-center gap-2 bg-dark-card border border-dark-border hover:border-accent/50 text-slate-300 hover:text-white font-semibold py-2.5 px-3 rounded-xl transition-all text-xs">
          {shared ? (
            <><span className="text-green-400">✓</span> تم النسخ</>
          ) : (
            <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>مشاركة</>
          )}
        </button>
      </div>
    </div>
  );
}
