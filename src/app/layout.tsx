import type { Metadata } from 'next';
import './globals.css';
import { stc } from '@/lib/fonts';
import { getDb, initDb, col } from '@/lib/db';
import AnnouncementBar from '@/components/ui/AnnouncementBar';
import VisitTracker from '@/components/ui/VisitTracker';
import WhatsAppFloat from '@/components/ui/WhatsAppFloat';
import ScrollToTop from '@/components/ui/ScrollToTop';

export const revalidate = 60;

async function getAnnouncement(): Promise<{ text: string; active: boolean } | null> {
  try {
    await initDb();
    const db = getDb();
    const result = await db.execute({ sql: "SELECT value FROM settings WHERE key = 'announcement'", args: [] });
    if (!result.rows[0]) return null;
    return JSON.parse(String(col(result.rows[0], 'value')));
  } catch { return null; }
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://billy-store.vercel.app'),
  title: 'Billy Store - متجر ألعاب بلايستيشن',
  description: 'تسوق أفضل ألعاب PlayStation 4 و 5 واشتراكات PS Plus بأسعار لا تنافس. بيلي ستور - متجرك الموثوق للألعاب الرقمية.',
  keywords: 'بيلي ستور, ألعاب بلايستيشن, PS Plus, PS4, PS5, ألعاب رقمية, السعودية',
  icons: {
    icon: '/logos/billy-store-icon.png',
    shortcut: '/logos/billy-store-icon.png',
    apple: '/logos/billy-store-icon.png',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const announcement = await getAnnouncement();
  return (
    <html lang="ar" dir="rtl" className={stc.variable} data-scroll-behavior="smooth">
      <body className="min-h-screen font-sans">
        <AnnouncementBar initialAnnouncement={announcement} />
        <VisitTracker />
        {children}
        <WhatsAppFloat />
        <ScrollToTop />
      </body>
    </html>
  );
}
