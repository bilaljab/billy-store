'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { Menu, Search, X } from 'lucide-react';
import {
  Navbar as ResizableNavbar, NavBody, MobileNav, MobileNavHeader, MobileNavMenu,
} from '@/components/vendor/resizable-navbar';
import { WhatsAppIcon, InstagramIcon, TelegramIcon } from '@/components/ui/BrandIcons';
import { WHATSAPP_URL, INSTAGRAM_URL, TELEGRAM_URL } from '@/lib/contact';

const LINKS = [
  { link: '/', name: 'الرئيسية' },
  { link: '/products', name: 'المتجر' },
  { link: '/about', name: 'من نحن' },
  { link: '/faq', name: 'الأسئلة الشائعة' },
];

const CHANNELS = [
  { href: WHATSAPP_URL, label: 'واتساب', Icon: WhatsAppIcon, hover: 'hover:text-green-400' },
  { href: INSTAGRAM_URL, label: 'إنستقرام', Icon: InstagramIcon, hover: 'hover:text-pink-400' },
  { href: TELEGRAM_URL, label: 'تيليجرام', Icon: TelegramIcon, hover: 'hover:text-sky-400' },
];

function Logo() {
  return (
    <Link href="/" className="relative z-20 flex shrink-0 items-center rounded-lg" aria-label="Billy Store — الرئيسية">
      <Image src="/logos/billy-store-logo.png" alt="Billy Store" width={1097} height={723} priority sizes="120px" className="h-9 w-auto" />
    </Link>
  );
}

/**
 * Site navigation built on Aceternity UI's original "resizable navbar" (components/vendor):
 * a full-width bar that contracts into a floating glass pill on scroll. The logo, the
 * accessible menu button and the contact channels are the store's own.
 */
export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [topOffset, setTopOffset] = useState(0);
  const [hovered, setHovered] = useState<string | null>(null);
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

  // AnnouncementBar sits in normal flow above the fixed navbar; the navbar's top
  // offset must shrink in lockstep as the bar scrolls away or a gap is left above it.
  useEffect(() => {
    const sync = () => {
      const bar = document.getElementById('announcement-bar');
      setTopOffset(Math.max(0, (bar ? bar.offsetHeight : 0) - window.scrollY));
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('scroll', sync, { passive: true });
    return () => {
      window.removeEventListener('scroll', sync);
      observer.disconnect();
    };
  }, []);

  // On Vercel the server-rendered HTML for `/` does not see pathname === '/', so a path-dependent
  // element (the active underline) differs from the client's first render and React discards the
  // tree (error #418). Resolving the active link only after mount keeps both renders identical.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isActive = (href: string) => mounted && (href === '/' ? pathname === '/' : pathname.startsWith(href));

  const channels = (
    <div className="relative z-20 flex items-center">
      <Link href="/products#product-search" aria-label="ابحث في المتجر" title="ابحث في المتجر"
        className="flex h-11 w-11 items-center justify-center rounded-full text-ink/75 transition-colors hover:bg-white/10 hover:text-ink">
        <Search size={20} aria-hidden="true" />
      </Link>
      {CHANNELS.map(({ href, label, Icon, hover }) => (
        <a key={href} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}
          className={`flex h-11 w-11 items-center justify-center rounded-full text-ink/75 transition-colors hover:bg-white/10 max-lg:hidden ${hover}`}>
          <Icon />
        </a>
      ))}
    </div>
  );

  return (
    <nav aria-label="التنقل الرئيسي" style={{ top: topOffset }} className="pointer-events-none fixed inset-x-0 z-50 px-3">
      <ResizableNavbar className="pointer-events-auto static top-0">
        {/* Desktop */}
        <NavBody className="min-w-0 px-4">
          <Logo />
          {/* Own links instead of the vendor NavItems: it renders plain <a> (full page reloads)
              and has no current-page state. Same sliding hover pill, via next/link. */}
          <div className="absolute inset-0 flex items-center justify-center gap-1" onMouseLeave={() => setHovered(null)}>
            {LINKS.map(item => {
              const active = isActive(item.link);
              return (
                <Link key={item.link} href={item.link} aria-current={active ? 'page' : undefined}
                  onMouseEnter={() => setHovered(item.link)}
                  className={`relative rounded-full px-4 py-2 text-sm font-bold transition-colors ${active ? 'text-ink' : 'text-ink/65 hover:text-ink'}`}>
                  {hovered === item.link && (
                    <motion.span layoutId="nav-hover" className="absolute inset-0 rounded-full bg-white/10"
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }} />
                  )}
                  <span className="relative">{item.name}</span>
                  {active && <span aria-hidden="true" className="absolute inset-x-4 bottom-0.5 h-0.5 rounded-full bg-ink" />}
                </Link>
              );
            })}
          </div>
          {channels}
        </NavBody>

        {/* Mobile */}
        <MobileNav className="mt-2 rounded-3xl px-3">
          <MobileNavHeader>
            <Logo />
            <div className="flex items-center">
              {channels}
              <button ref={menuButtonRef} onClick={() => setMenuOpen(!menuOpen)} id="mobile-menu-button" aria-controls="mobile-menu"
                className="flex h-11 w-11 items-center justify-center rounded-full text-ink"
                aria-label={menuOpen ? 'إغلاق القائمة' : 'فتح القائمة'} aria-expanded={menuOpen}>
                {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
              </button>
            </div>
          </MobileNavHeader>

          <MobileNavMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} className="top-16 gap-4 rounded-3xl border border-line px-4 py-5">
            <div id="mobile-menu" className="w-full space-y-4">
              <form action="/products" method="get" role="search" className="relative">
                <label htmlFor="nav-search-mobile" className="sr-only">ابحث في المتجر</label>
                <Search size={16} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
                <input id="nav-search-mobile" name="q" type="search" placeholder="ابحث عن لعبة أو اشتراك" className="field rounded-full! ps-10!" />
              </form>
              <div>
                {LINKS.map(item => (
                  <Link key={item.link} href={item.link} onClick={() => setMenuOpen(false)}
                    aria-current={isActive(item.link) ? 'page' : undefined}
                    className={`flex min-h-12 items-center rounded-2xl px-4 text-lg font-bold ${isActive(item.link) ? 'bg-white/10 text-ink' : 'text-ink/65'}`}>
                    {item.name}
                  </Link>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {CHANNELS.map(({ href, label, Icon }) => (
                  <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                    className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/10 text-sm font-bold text-ink">
                    <Icon className="h-4 w-4" /> {label}
                  </a>
                ))}
              </div>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </ResizableNavbar>
    </nav>
  );
}
