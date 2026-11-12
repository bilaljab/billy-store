'use client';
import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';
import { useOnProductPage } from './WhatsAppFloat';

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const offset = useOnProductPage() ? 'max-md:bottom-24' : '';

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-line bg-raised text-ink shadow-float transition-[opacity,transform,border-color] duration-300 hover:border-accent/60 ${offset} ${visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-10 opacity-0'}`}
      aria-label="العودة لأعلى"
    >
      <ChevronUp size={22} aria-hidden="true" />
    </button>
  );
}
