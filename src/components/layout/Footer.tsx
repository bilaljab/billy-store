import Link from 'next/link';
import Image from 'next/image';
import { WhatsAppIcon, InstagramIcon, TelegramIcon } from '@/components/ui/BrandIcons';
import { WHATSAPP_URL, WHATSAPP_DISPLAY, INSTAGRAM_URL, INSTAGRAM_HANDLE, TELEGRAM_URL, TELEGRAM_HANDLE } from '@/lib/contact';

const SHOP = [
  ['/products', 'كل المنتجات'],
  ['/products?category=games', 'ألعاب PS4 و PS5'],
  ['/products?category=subscription', 'اشتراكات PS Plus'],
  ['/products?sort=discount', 'العروض والخصومات'],
];

const STORE = [
  ['/', 'الرئيسية'],
  ['/about', 'من نحن'],
  ['/faq', 'الأسئلة الشائعة'],
];

const CHANNELS = [
  { href: WHATSAPP_URL, text: WHATSAPP_DISPLAY, label: 'واتساب', Icon: WhatsAppIcon, tone: 'text-green-400' },
  { href: INSTAGRAM_URL, text: `@${INSTAGRAM_HANDLE}`, label: 'إنستقرام', Icon: InstagramIcon, tone: 'text-pink-400' },
  { href: TELEGRAM_URL, text: `@${TELEGRAM_HANDLE}`, label: 'تيليجرام', Icon: TelegramIcon, tone: 'text-sky-400' },
];

function LinkList({ title, links }: { title: string; links: string[][] }) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-bold text-ink">{title}</h2>
      <ul>
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="inline-flex min-h-10 items-center text-sm text-muted transition-colors hover:text-ink">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="mt-28 overflow-hidden border-t border-line bg-canvas-b">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-[1.6fr_1fr_1fr_1.3fr]">
          <div className="col-span-2 md:col-span-1">
            <Image src="/logos/billy-store-logo.png" alt="Billy Store" width={1097} height={723} sizes="150px" className="mb-4 h-12 w-auto" />
            <p className="max-w-sm text-sm leading-relaxed text-muted">
              متجرك الموثوق لألعاب PlayStation 4 و 5 واشتراكات PS Plus منذ عام 2017. أسعار أرخص من السوق، ودعم عملاء على مدار الساعة.
            </p>
          </div>

          <LinkList title="تسوق" links={SHOP} />
          <LinkList title="المتجر" links={STORE} />

          <div className="col-span-2 md:col-span-1">
            <h2 className="mb-3 text-sm font-bold text-ink">تواصل معنا</h2>
            <ul>
              {CHANNELS.map(({ href, text, label, Icon, tone }) => (
                <li key={href}>
                  <a href={href} target="_blank" rel="noopener noreferrer"
                    className="group inline-flex min-h-11 items-center gap-3 text-sm text-muted transition-colors hover:text-ink">
                    <Icon className={`h-5 w-5 ${tone}`} />
                    <span className="sr-only">{label}: </span>
                    <span dir="ltr">{text}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p aria-hidden="true" dir="ltr"
          className="mt-12 select-none whitespace-nowrap text-center text-[17vw] font-bold leading-none text-transparent transition-all duration-700 [-webkit-text-stroke:1px_rgb(var(--line-rgb))] hover:[-webkit-text-stroke:1px_rgb(var(--accent-rgb))] lg:text-[13rem]">
          BILLY STORE
        </p>

        <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 text-xs text-muted sm:flex-row">
          <p>© 2026 Billy Store. جميع الحقوق محفوظة.</p>
          <p>الدفع بتحويل بنكي أو STC Pay · تسليم رقمي</p>
        </div>
      </div>
    </footer>
  );
}
