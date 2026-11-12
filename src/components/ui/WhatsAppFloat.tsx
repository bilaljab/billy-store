'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { WhatsAppIcon } from './BrandIcons';
import { whatsappLink, GENERAL_INQUIRY } from '@/lib/contact';

/** Product pages carry their own sticky mobile WhatsApp buy bar. */
export const useOnProductPage = () => /^\/products\/[^/]+/.test(usePathname());

export default function WhatsAppFloat() {
  const [visible, setVisible] = useState(false);
  const inAdmin = usePathname().startsWith('/admin');
  // The buy bar already is the WhatsApp action there, so the float would only duplicate it
  const offset = useOnProductPage() ? 'max-md:hidden' : '';

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(t);
  }, []);

  if (inAdmin) return null;

  return (
    <a
      href={whatsappLink(GENERAL_INQUIRY)}
      target="_blank"
      rel="noopener noreferrer"
      title="تواصل معنا على واتساب"
      aria-label="تواصل معنا على واتساب"
      className={`fixed bottom-6 left-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-float transition-[opacity,transform,background-color] duration-500 hover:scale-105 hover:bg-green-500 ${offset} ${visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-10 opacity-0'}`}
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}
