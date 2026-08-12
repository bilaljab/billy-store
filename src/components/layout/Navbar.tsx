'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const WaIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.525 5.847L.057 23.516a.5.5 0 00.612.612l5.666-1.469A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.99 0-3.86-.538-5.468-1.476l-.392-.232-4.062 1.054 1.054-4.061-.232-.393A9.936 9.936 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
  </svg>
);

const IgIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const TgIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/></svg>
);

export default function Navbar() {
  const [visible, setVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [topOffset, setTopOffset] = useState(0);
  const pathname = usePathname();
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Escape closes the mobile menu and returns focus to the button that opened it
  useEffect(() => {
    if (!menuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    let lastY = window.scrollY;
    let barHeight = 0;

    // AnnouncementBar sits in normal flow above the fixed navbar, so as the
    // page scrolls it moves out of view — the navbar's top offset must shrink
    // in lockstep (viewport-relative `top`, not document-relative) or a gap
    // the size of the bar's height is left exposed above the navbar forever.
    const updateBarHeight = () => {
      const bar = document.getElementById('announcement-bar');
      barHeight = bar ? bar.offsetHeight : 0;
      setTopOffset(Math.max(0, barHeight - window.scrollY));
    };
    updateBarHeight();

    const observer = new MutationObserver(updateBarHeight);
    observer.observe(document.body, { childList: true, subtree: true });

    const handleScroll = () => {
      const currentY = window.scrollY;
      setScrolled(currentY > 20);
      setTopOffset(Math.max(0, barHeight - currentY));
      // Hide on scroll down, show on scroll up
      if (currentY > lastY && currentY > 80) {
        setVisible(false);
        setMenuOpen(false);
      } else {
        setVisible(true);
      }
      lastY = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  const links = [
    { href: '/', label: 'الرئيسية' },
    { href: '/products', label: 'المنتجات' },
    { href: '/about', label: 'من نحن' },
    { href: '/faq', label: 'الأسئلة الشائعة' },
  ];

  return (
    <nav
      style={{ top: visible ? `${topOffset}px` : `-80px` }}
      className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'navbar-glass bg-surface/90 backdrop-blur-md border-b border-chip shadow-soft' : 'bg-transparent'}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center">
            <Image src="/logos/billy-store-logo.png" alt="Billy Store" width={1097} height={723} priority className="h-10 sm:h-12 w-auto" />
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {links.map(link => (
              <Link key={link.href} href={link.href}
                className={`font-bold transition-all duration-200 hover:text-brand relative rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 after:absolute after:bottom-0 after:right-0 after:h-0.5 after:bg-brand after:transition-all after:duration-300 ${pathname === link.href ? 'text-brand after:w-full' : 'text-muted after:w-0 hover:after:w-full'}`}>
                {link.label}
              </Link>
            ))}
            <a href="https://wa.me/966508949041" target="_blank" rel="noopener noreferrer"
              className="w-11 h-11 bg-green-700 hover:bg-green-600 text-white rounded-lg transition-all flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2" aria-label="واتساب">
              <WaIcon />
            </a>
            <a href="https://ig.me/m/Billy_Store3" target="_blank" rel="noopener noreferrer"
              className="w-11 h-11 bg-gradient-to-l from-purple-600 to-pink-600 hover:opacity-90 text-white rounded-lg transition-all flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2" aria-label="إنستقرام">
              <IgIcon />
            </a>
            <a href="https://t.me/BillyStore1" target="_blank" rel="noopener noreferrer"
              className="w-11 h-11 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2" aria-label="تيليجرام">
              <TgIcon />
            </a>
          </div>

          <button ref={menuButtonRef} onClick={() => setMenuOpen(!menuOpen)} id="mobile-menu-button" aria-controls="mobile-menu"
            className="md:hidden text-ink min-w-11 min-h-11 flex flex-col items-center justify-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
            aria-label={menuOpen ? 'إغلاق القائمة' : 'فتح القائمة'} aria-expanded={menuOpen}>
            <div className={`w-6 h-0.5 bg-ink transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></div>
            <div className={`w-6 h-0.5 bg-ink my-1 transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`}></div>
            <div className={`w-6 h-0.5 bg-ink transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></div>
          </button>
        </div>
      </div>

      <div id="mobile-menu" role="region" aria-label="القائمة" inert={!menuOpen}
        className={`md:hidden grid collapse-grid ${menuOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="bg-surface border-b border-chip shadow-soft px-4 pb-4">
            {links.map(link => (
              <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
                className={`block py-3 font-bold border-b border-chip/50 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 ${pathname === link.href ? 'text-brand' : 'text-muted'}`}>
                {link.label}
              </Link>
            ))}
            <div className="flex gap-2 mt-3">
              <a href="https://wa.me/966508949041" target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 min-h-11 bg-green-700 text-white font-bold py-2.5 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2">
                <WaIcon /> واتساب
              </a>
              <a href="https://ig.me/m/Billy_Store3" target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 min-h-11 bg-gradient-to-l from-purple-600 to-pink-600 text-white font-bold py-2.5 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2">
                <IgIcon /> إنستقرام
              </a>
              <a href="https://t.me/BillyStore1" target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 min-h-11 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2">
                <TgIcon /> تيليجرام
              </a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
