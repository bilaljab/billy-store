import type { Metadata } from 'next';
import './globals.css';
import AnnouncementBar from '@/components/ui/AnnouncementBar';
import WhatsAppFloat from '@/components/ui/WhatsAppFloat';
import ScrollToTop from '@/components/ui/ScrollToTop';

export const metadata: Metadata = {
  title: 'Billy Store - متجر ألعاب بلايستيشن',
  description: 'تسوق أفضل ألعاب PlayStation 4 و 5 واشتراكات PS Plus بأسعار لا تُنافس. بيلي ستور - متجرك الموثوق للألعاب الرقمية.',
  keywords: 'بيلي ستور, ألعاب بلايستيشن, PS Plus, PS4, PS5, ألعاب رقمية, السعودية',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-dark text-slate-200 font-arabic">
        <AnnouncementBar />
        {children}
        <WhatsAppFloat />
        <ScrollToTop />
      </body>
    </html>
  );
}
