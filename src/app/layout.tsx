import type { Metadata } from 'next';
import './globals.css';
import { stc } from '@/lib/fonts';
import { getDb, initDb, col } from '@/lib/db';
import AnnouncementBar from '@/components/ui/AnnouncementBar';
import VisitTracker from '@/components/ui/VisitTracker';
import WhatsAppFloat from '@/components/ui/WhatsAppFloat';
import ScrollToTop from '@/components/ui/ScrollToTop';
import { Analytics } from '@vercel/analytics/next';
import { og } from '@/lib/og';

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
  title: 'بيلي ستور Billy Store | ألعاب PS5 وPS4 واشتراك PS Plus',
  description: 'بيلي ستور: ألعاب PS5 وPS4 رقمية واشتراكات PS Plus بسعر أقل من المتجر الرسمي. تسليم خلال دقائق، دفع بتحويل بنكي أو STC Pay، منذ 2017.',
  keywords: 'بيلي ستور, ألعاب بلايستيشن, PS Plus, PS4, PS5, ألعاب رقمية, السعودية',
  alternates: { canonical: '/' }, // pages with their own alternates override this
  openGraph: og('/', 'بيلي ستور Billy Store | ألعاب PS5 وPS4 واشتراك PS Plus', 'ألعاب PS4 و PS5 واشتراكات PS Plus بأسعار أقل من المتجر الرسمي، تسليم رقمي خلال دقائق.'),
  twitter: { card: 'summary' },
  verification: { google: 'GnpBPqp19SiNuY2iYHk6xSNZVpxwEuLGHS9Na2DF2vM' },
  icons: {
    icon: '/logos/billy-store-icon.png',
    shortcut: '/logos/billy-store-icon.png',
    apple: '/logos/billy-store-icon.png',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const announcement = await getAnnouncement();
  return (
    <html lang="ar" dir="rtl" className={`${stc.className} ${stc.variable}`} data-scroll-behavior="smooth">
      <body className="min-h-screen font-sans">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:inset-s-4 focus:top-4 focus:z-70 focus:rounded-xl focus:bg-brand focus:px-4 focus:py-3 focus:font-bold focus:text-white">
          تخطي إلى المحتوى
        </a>
        <AnnouncementBar initialAnnouncement={announcement} />
        <VisitTracker />
        {children}
        <WhatsAppFloat />
        <ScrollToTop />
        <Analytics />
      </body>
    </html>
  );
}
