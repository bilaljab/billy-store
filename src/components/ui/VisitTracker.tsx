'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const CHANNEL_OF: [RegExp, string][] = [
  [/\/\/(wa\.me|api\.whatsapp\.com)\//, 'whatsapp'],
  [/\/\/t\.me\//, 'telegram'],
  [/\/\/(ig\.me|(www\.)?instagram\.com)\//, 'instagram'],
];

export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Don't track admin pages
    if (pathname.startsWith('/admin')) return;
    // Track visit silently
    fetch('/api/visit', { method: 'POST' }).catch(() => {});
  }, [pathname]);

  // One listener for every contact link on the site (buttons, floating button, footer…)
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (location.pathname.startsWith('/admin')) return;
      const href = (e.target as Element | null)?.closest('a')?.href ?? '';
      const channel = CHANNEL_OF.find(([re]) => re.test(href))?.[1];
      if (!channel) return;
      const productId = Number(location.pathname.match(/^\/products\/(\d+)/)?.[1] ?? 0);
      // sendBeacon survives the page navigating away to WhatsApp
      navigator.sendBeacon?.('/api/click', new Blob([JSON.stringify({ channel, productId })], { type: 'application/json' }));
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
}
