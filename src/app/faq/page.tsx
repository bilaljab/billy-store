import type { Metadata } from 'next';
import { og } from '@/lib/og';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import FaqAccordion from '@/components/ui/FaqAccordion';
import Button from '@/components/ui/Button';
import { WhatsAppIcon, InstagramIcon, TelegramIcon } from '@/components/ui/BrandIcons';
import { WHATSAPP_URL, INSTAGRAM_URL, TELEGRAM_URL } from '@/lib/contact';
import { STORE_FAQS, faqJsonLd } from '@/lib/faqs';

export const metadata: Metadata = {
  title: 'الأسئلة الشائعة | Billy Store',
  description: 'كل ما تحتاج معرفته قبل الشراء من بيلي ستور: التسليم، الدفع، الضمان، وطريقة عمل اشتراكات PS Plus.',
  alternates: { canonical: '/faq' },
  openGraph: og('/faq', 'الأسئلة الشائعة | Billy Store', 'كل ما تحتاج معرفته قبل الشراء من بيلي ستور: التسليم، الدفع، الضمان، وطريقة عمل اشتراكات PS Plus.'),
};

export default function FAQPage() {
  return (
    <div className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', ...faqJsonLd(STORE_FAQS) }).replace(/</g, '\\u003c') }} />
      <Navbar />
      <main id="main" className="mx-auto max-w-3xl px-4 pb-20 pt-28 sm:px-6 sm:pt-36">
        <header className="mb-10">
          <h1 className="font-display text-5xl font-bold leading-[1.3] text-ink sm:text-7xl sm:leading-[1.2]">الأسئلة الشائعة</h1>
          <p className="mt-3 text-lg text-muted">كل ما تحتاج معرفته قبل الشراء</p>
        </header>

        <FaqAccordion />

        <section className="mt-12 rounded-3xl border border-line bg-surface p-6 text-center sm:p-10">
          <h2 className="text-xl font-bold text-ink">لم تجد إجابة لسؤالك؟</h2>
          <p className="mb-6 mt-2 text-sm text-muted">تواصل معنا مباشرة وسنرد عليك بدون تأخير</p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button href={WHATSAPP_URL} external variant="whatsapp" icon={<WhatsAppIcon />}>تواصل معنا الآن</Button>
            <Button href={INSTAGRAM_URL} external variant="secondary" icon={<InstagramIcon className="h-5 w-5 text-pink-400" />}>إنستقرام</Button>
            <Button href={TELEGRAM_URL} external variant="secondary" icon={<TelegramIcon className="h-5 w-5 text-sky-400" />}>تيليجرام</Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
