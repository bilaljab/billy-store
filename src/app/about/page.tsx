import type { Metadata } from 'next';
import { og } from '@/lib/og';
import { CircleCheck, Gift, HandCoins, Handshake, Lock, Phone, Zap } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { NumberTicker } from '@/components/fx';
import { WhatsAppIcon, InstagramIcon, TelegramIcon } from '@/components/ui/BrandIcons';
import { whatsappLink, WHATSAPP_DISPLAY, INSTAGRAM_URL, INSTAGRAM_HANDLE, TELEGRAM_URL, TELEGRAM_HANDLE } from '@/lib/contact';

export const metadata: Metadata = {
  title: 'من نحن | Billy Store',
  description: 'قصة بيلي ستور: من شغف اللعب إلى متجر موثوق لآلاف اللاعبين في المملكة العربية السعودية منذ 2017.',
  alternates: { canonical: '/about' },
  openGraph: og('/about', 'من نحن | Billy Store', 'قصة بيلي ستور: من شغف اللعب إلى متجر موثوق لآلاف اللاعبين في المملكة العربية السعودية منذ 2017.'),
};

const STATS = [
  { num: 2017, suffix: '', label: 'سنة التأسيس' },
  { num: 7, suffix: '+', label: 'سنوات خبرة' },
  { num: 1000, suffix: '+', label: 'عميل راضٍ' },
  { num: 500, suffix: '+', label: 'لعبة متاحة' },
];

const MISSION = [
  { Icon: HandCoins, title: 'أسعار عادلة', desc: 'نؤمن أن كل لاعب يستحق الحصول على ألعابه المفضلة بسعر مناسب دون إنهاك ميزانيته' },
  { Icon: Handshake, title: 'خدمة صادقة', desc: 'نبني علاقات طويلة الأمد مع عملائنا مبنية على الصدق والشفافية والثقة المتبادلة' },
  { Icon: Zap, title: 'تجربة سلسة', desc: 'من التصفح حتى الاستلام، نضمن تجربة شراء سريعة وسهلة ومريحة لكل عميل' },
];

const TRUST = [
  { Icon: CircleCheck, title: 'سمعة لا تشترى', desc: 'أكثر من 7 سنوات في السوق مع سجل نظيف وتقييمات إيجابية متواصلة من عملائنا الكرام' },
  { Icon: Lock, title: 'أمان تام', desc: 'جميع المنتجات أصلية 100% ومضمونة. لا مخاطر، لا مشاكل، راحة بال كاملة' },
  { Icon: Phone, title: 'دعم حقيقي', desc: 'فريق دعم بشري حقيقي يرد عليك سريعاً ويحل مشكلتك بكل احترافية' },
  { Icon: Gift, title: 'عروض مستمرة', desc: 'عملاؤنا الدائمون يحصلون على عروض خاصة وأسعار مميزة مكافأة لولائهم' },
];

const CHANNELS = [
  { href: whatsappLink('مرحباً بيلي ستور'), name: 'واتساب', value: WHATSAPP_DISPLAY, Icon: WhatsAppIcon, tone: 'text-green-400', hover: 'hover:border-green-400/60' },
  { href: INSTAGRAM_URL, name: 'إنستقرام', value: `@${INSTAGRAM_HANDLE}`, Icon: InstagramIcon, tone: 'text-pink-400', hover: 'hover:border-pink-400/60' },
  { href: TELEGRAM_URL, name: 'تيليجرام', value: `@${TELEGRAM_HANDLE}`, Icon: TelegramIcon, tone: 'text-sky-400', hover: 'hover:border-sky-400/60' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <main id="main" className="mx-auto max-w-5xl px-4 pb-20 pt-28 sm:px-6 sm:pt-36">
        <header className="max-w-3xl">
          <h1 className="font-display text-5xl font-bold leading-[1.3] text-ink sm:text-8xl sm:leading-[1.2]">قصة بيلي ستور</h1>
          <p className="mt-5 text-lg leading-relaxed text-muted sm:text-xl">
            من شغف اللعب إلى منصة موثوقة لآلاف اللاعبين في المملكة العربية السعودية
          </p>
        </header>

        <dl className="mt-12 grid grid-cols-2 border-y border-line sm:grid-cols-4">
          {STATS.map(item => (
            <div key={item.label} className="flex flex-col-reverse gap-1 px-2 py-6 text-center">
              <dt className="text-sm text-muted">{item.label}</dt>
              <dd className="text-3xl font-bold tabular-nums text-ink sm:text-4xl" dir="ltr">{item.num === 2017 ? 2017 : <NumberTicker value={item.num} />}{item.suffix}</dd>
            </div>
          ))}
        </dl>

        <section className="mt-16 grid gap-6 lg:grid-cols-[1fr_2fr] lg:gap-12">
          <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">كيف بدأت الرحلة؟</h2>
          <div className="max-w-prose space-y-4 leading-loose text-muted">
            <p>
              بدأت قصة بيلي ستور عام <span className="font-bold text-ink">2017</span> من شغف حقيقي بعالم الألعاب الإلكترونية. لاحظنا أن أسعار ألعاب PlayStation في المتاجر الرسمية والسوق المحلي مرتفعة وغير مناسبة لكثير من اللاعبين السعوديين.
            </p>
            <p>
              قررنا أن نكون الحل. انطلقنا بهدف واضح: توفير أفضل ألعاب <span className="font-bold text-ink">PS4 وPS5</span> واشتراكات PS Plus بأسعار تنافسية وخدمة عملاء استثنائية.
            </p>
            <p>
              اليوم، بعد أكثر من 7 سنوات، أصبح بيلي ستور اسماً موثوقاً لدى آلاف اللاعبين في المملكة، نفتخر بكل عميل راضٍ وكل تقييم إيجابي نحصل عليه.
            </p>
          </div>
        </section>

        <section className="mt-16 grid gap-6 border-t border-line pt-16 lg:grid-cols-[1fr_2fr] lg:gap-12">
          <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">لماذا نحن هنا؟</h2>
          <ul className="space-y-8">
            {MISSION.map(({ Icon, title, desc }) => (
              <li key={title} className="flex gap-4">
                <Icon size={26} className="mt-1 shrink-0 text-accent" aria-hidden="true" />
                <div>
                  <h3 className="text-lg font-bold text-ink">{title}</h3>
                  <p className="mt-1 max-w-prose leading-relaxed text-muted">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16 border-t border-line pt-16">
          <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">لماذا يثق بنا عملاؤنا؟</h2>
          <ul className="mt-8 grid gap-x-12 gap-y-8 sm:grid-cols-2">
            {TRUST.map(({ Icon, title, desc }) => (
              <li key={title} className="flex gap-4">
                <Icon size={24} className="mt-1 shrink-0 text-gold" aria-hidden="true" />
                <div>
                  <h3 className="text-lg font-bold text-ink">{title}</h3>
                  <p className="mt-1 leading-relaxed text-muted">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16 rounded-3xl border border-line bg-surface p-6 sm:p-10">
          <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">نحن هنا من أجلك</h2>
          <p className="mt-2 text-muted">اختر القناة اللي تناسبك وراسلنا مباشرة.</p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-3">
            {CHANNELS.map(({ href, name, value, Icon, tone, hover }) => (
              <li key={href}>
                <a href={href} target="_blank" rel="noopener noreferrer"
                  className={`flex min-h-20 items-center gap-4 rounded-2xl border border-line bg-raised p-4 transition-colors ${hover}`}>
                  <Icon className={`h-8 w-8 shrink-0 ${tone}`} />
                  <span className="min-w-0">
                    <span className="block text-xs text-muted">{name}</span>
                    <span className="block truncate font-bold text-ink" dir="ltr">{value}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <Footer />
    </div>
  );
}
