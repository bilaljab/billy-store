'use client';
import { useEffect, useRef, useState } from 'react';
import { Check, Copy, MessageSquareText, Share2 } from 'lucide-react';
import { WhatsAppIcon, InstagramIcon, TelegramIcon } from './BrandIcons';
import { buildInquiryMessage } from '@/lib/messages';
import { WHATSAPP_URL, INSTAGRAM_URL, TELEGRAM_URL } from '@/lib/contact';

interface Props {
  product: { id: number; name: string; price: number };
  waMsg: string;
}

type Feedback = 'name' | 'msg' | 'share' | null;

export default function ProductActions({ product, waMsg }: Props) {
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [mainCtaVisible, setMainCtaVisible] = useState(true);
  const mainCtaRef = useRef<HTMLAnchorElement>(null);
  const waHref = `${WHATSAPP_URL}?text=${waMsg}`;

  // Track view
  useEffect(() => {
    fetch('/api/views', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: product.id }) });
  }, [product.id]);

  // The mobile buy bar only appears once the main WhatsApp button has scrolled out of view
  useEffect(() => {
    const el = mainCtaRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setMainCtaVisible(entry.intersectionRatio >= 0.5), { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const flash = (which: Feedback) => {
    setFeedback(which);
    setTimeout(() => setFeedback(null), 2000);
  };

  const copy = async (type: 'name' | 'msg') => {
    const text = type === 'name' ? product.name : buildInquiryMessage(product.name, product.price);
    try {
      await navigator.clipboard.writeText(text);
      flash(type);
    } catch { /* clipboard unavailable (insecure context / denied) — nothing to confirm */ }
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, text: `${product.name} - ${product.price} ريال`, url });
      } else {
        await navigator.clipboard.writeText(url);
        flash('share');
      }
    } catch { /* share sheet dismissed */ }
  };

  const quick = [
    { key: 'name' as const, label: 'نسخ الاسم', Icon: Copy, onClick: () => copy('name') },
    { key: 'msg' as const, label: 'نسخ رسالة', Icon: MessageSquareText, onClick: () => copy('msg') },
    { key: 'share' as const, label: 'مشاركة', Icon: Share2, onClick: share },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* WhatsApp stays first and largest (deliberate CRO decision, see CLAUDE.md Gotcha #22);
          Telegram and Instagram are equal-weight peers below it. */}
      <a ref={mainCtaRef} href={waHref} target="_blank" rel="noopener noreferrer"
        className="flex min-h-14 items-center justify-center gap-3 rounded-full bg-green-700 px-6 text-lg font-bold text-white transition-colors hover:bg-green-600 active:scale-[0.99]">
        <WhatsAppIcon className="h-6 w-6" />
        اطلب عبر واتساب
      </a>
      <div className="grid grid-cols-2 gap-3">
        <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer"
          className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-white/10 px-3 text-sm font-bold text-ink transition-colors hover:bg-white/20">
          <TelegramIcon className="h-5 w-5 text-sky-400" />
          تواصل عبر تيليجرام
        </a>
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer"
          className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-white/10 px-3 text-sm font-bold text-ink transition-colors hover:bg-white/20">
          <InstagramIcon className="h-5 w-5 text-pink-400" />
          راسلنا عبر إنستقرام
        </a>
      </div>

      <p className="mt-1 text-center text-xs text-muted">انسخ الرسالة وألصقها بمحادثة إنستقرام أو تيليجرام</p>
      <div className="grid grid-cols-3 gap-2" aria-live="polite">
        {quick.map(({ key, label, Icon, onClick }) => (
          <button key={key} onClick={onClick}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-bold text-muted transition-colors hover:bg-chip hover:text-ink">
            {feedback === key
              ? <><Check size={16} className="text-green-400" aria-hidden="true" /> تم النسخ</>
              : <><Icon size={16} aria-hidden="true" /> {label}</>}
          </button>
        ))}
      </div>

      {/* Mobile buy bar */}
      <div
        inert={mainCtaVisible}
        className={`navbar-glass fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-line bg-canvas-a/90 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md transition-transform duration-300 md:hidden ${
          mainCtaVisible ? 'translate-y-full' : 'translate-y-0'
        }`}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-muted">{product.name}</p>
          <p className="text-lg font-bold tabular-nums leading-tight text-ink">{product.price} <span className="text-xs font-normal text-muted">ر.س</span></p>
        </div>
        <a href={waHref} target="_blank" rel="noopener noreferrer"
          className="flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-green-700 px-5 font-bold text-white">
          <WhatsAppIcon />
          اطلب الآن
        </a>
      </div>
    </div>
  );
}
