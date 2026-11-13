'use client';
import { useState } from 'react';
import { Plus, Package, Zap, CreditCard, ShieldCheck, Gamepad2, Star, MessageCircle, Trophy, CircleHelp } from 'lucide-react';
import { STORE_FAQS, type Faq } from '@/lib/faqs';

// Icons for STORE_FAQS by position; any other list falls back to a generic icon
const ICONS = [Package, Zap, CreditCard, ShieldCheck, Gamepad2, Star, MessageCircle, Trophy];

export default function FaqAccordion({ items }: { items?: Faq[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const faqs = (items ?? STORE_FAQS).map((f, i) => {
    const Icon = (!items && ICONS[i]) || CircleHelp;
    return { ...f, icon: <Icon size={20} /> };
  });
  return (
    <div className="divide-y divide-line border-y border-line">
      {faqs.map((faq, i) => {
        const isOpen = open === i;
        return (
          <div key={faq.q}>
            <h2>
              <button onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} aria-controls={`faq-panel-${i}`} id={`faq-button-${i}`}
                className="group flex min-h-16 w-full items-center gap-4 py-4 text-start">
                <span className={`shrink-0 transition-colors ${isOpen ? 'text-accent' : 'text-muted group-hover:text-ink'}`} aria-hidden="true">{faq.icon}</span>
                <span className={`flex-1 text-base font-bold transition-colors sm:text-lg ${isOpen ? 'text-ink' : 'text-ink/90 group-hover:text-ink'}`}>{faq.q}</span>
                <Plus size={20} aria-hidden="true" className={`shrink-0 text-muted transition-transform duration-300 ${isOpen ? 'rotate-45 text-accent' : ''}`} />
              </button>
            </h2>
            <div id={`faq-panel-${i}`} role="region" aria-labelledby={`faq-button-${i}`} inert={!isOpen}
              className={`collapse-grid grid ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
              <div className="overflow-hidden">
                <p className="max-w-prose pb-6 ps-9 leading-loose text-muted">{faq.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
