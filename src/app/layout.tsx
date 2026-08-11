import type { Metadata } from 'next';
import './globals.css';
import { stc } from '@/lib/fonts';
import AnnouncementBar from '@/components/ui/AnnouncementBar';
import VisitTracker from '@/components/ui/VisitTracker';
import WhatsAppFloat from '@/components/ui/WhatsAppFloat';
import ScrollToTop from '@/components/ui/ScrollToTop';

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={stc.variable} data-scroll-behavior="smooth">
      <body className="min-h-screen font-sans">
        <AnnouncementBar />
        <VisitTracker />
        {children}
        <WhatsAppFloat />
        <ScrollToTop />
      </body>
    </html>
  );
}
