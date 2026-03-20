'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Don't track admin pages
    if (pathname.startsWith('/admin')) return;
    // Track visit silently
    fetch('/api/visit', { method: 'POST' }).catch(() => {});
  }, [pathname]);

  return null;
}
