import Link from 'next/link';
import { Check, Minus, ArrowLeft } from 'lucide-react';
import Button from './Button';
import { WhatsAppIcon } from './BrandIcons';
import { TIERS, BENEFITS, includes, tierOf } from '@/lib/psplus';
import { applyDiscount } from '@/lib/discounts';
import { whatsappLink } from '@/lib/contact';
import type { CatalogProduct } from '@/lib/catalog';

/** PS Plus tiers (Saudi region) with prices from the catalogue, plus a benefit comparison table. */
export default function PsPlusTiers({ subscriptions }: { subscriptions: CatalogProduct[] }) {
  const plans = (key: string) =>
    subscriptions.filter(p => tierOf(p.name)?.key === key).sort((a, b) => a.price - b.price);

  return (
    <>
      <section aria-labelledby="tiers-heading" className="mb-20">
        <h2 id="tiers-heading" className="mb-6 font-display text-3xl font-bold text-ink sm:text-4xl">الباقات والأسعار</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {TIERS.map((tier, i) => {
            const own = BENEFITS.filter(b => b.from === tier.key);
            const list = plans(tier.key);
            return (
              <article key={tier.key} className="flex flex-col rounded-3xl border border-line bg-surface p-6">
                <h3 className="text-3xl font-bold text-ink">
                  {tier.ar} <span dir="ltr" className="text-lg font-normal text-gold">{tier.en}</span>
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{tier.bestFor}</p>

                <ul className="mt-5 space-y-2 text-sm text-ink">
                  {i > 0 && <li className="font-bold text-gold">كل مزايا {TIERS[i - 1].ar}، وأيضًا:</li>}
                  {own.map(b => (
                    <li key={b.name} className="flex items-start gap-2">
                      <Check size={16} className="mt-1 shrink-0 text-gold" aria-hidden="true" />
                      {b.name}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-6">
                  {list.length > 0 ? (
                    <ul className="space-y-2">
                      {list.map(p => (
                        <li key={p.id}>
                          <Link href={`/products/${p.id}`}
                            className="group flex min-h-14 items-center gap-3 rounded-2xl bg-white/5 px-4 text-ink transition-colors hover:bg-gold hover:text-canvas-a">
                            <span className="min-w-0 flex-1 truncate text-sm font-bold">{p.name}</span>
                            {p.discount && <span className="text-xs tabular-nums line-through opacity-60">{p.price}</span>}
                            <span className="shrink-0 text-lg font-bold tabular-nums">{applyDiscount(p.price, p.discount)} <span className="text-xs font-normal">ر.س</span></span>
                            <ArrowLeft size={16} className="shrink-0 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <Button href={whatsappLink(`مرحباً، أريد سعر اشتراك PS Plus ${tier.en}`)} external variant="whatsapp" icon={<WhatsAppIcon />} className="w-full">
                      اسأل عن السعر
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="compare-heading" className="mb-20">
        <h2 id="compare-heading" className="mb-2 font-display text-3xl font-bold text-ink sm:text-4xl">مقارنة الباقات</h2>
        <p className="mb-6 text-sm text-muted">كل باقة تشمل مزايا الباقة التي قبلها.</p>
        {/* relative: keeps the sr-only cell labels inside the scroll box (see Gotcha #32) */}
        <div className="relative overflow-x-auto rounded-3xl border border-line">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-surface">
                <th scope="col" className="px-4 py-4 text-start font-bold text-muted">الميزة</th>
                {TIERS.map(t => (
                  <th key={t.key} scope="col" className="w-16 px-1 py-4 text-center font-bold text-ink sm:w-24 sm:px-2">
                    {t.ar}<span dir="ltr" className="block text-xs font-normal text-gold">{t.en}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {BENEFITS.map(b => (
                <tr key={b.name}>
                  <th scope="row" className="px-3 py-3 text-start font-normal sm:px-4">
                    <span className="block font-bold leading-relaxed text-ink">{b.name}</span>
                    <span className="hidden leading-relaxed text-muted sm:block">{b.detail}</span>
                  </th>
                  {TIERS.map(t => (
                    <td key={t.key} className="px-1 py-3 text-center sm:px-2">
                      {includes(t.key, b.from)
                        ? <Check size={20} className="mx-auto text-gold" aria-hidden="true" />
                        : <Minus size={20} className="mx-auto text-muted/50" aria-hidden="true" />}
                      <span className="sr-only">{includes(t.key, b.from) ? 'متاح' : 'غير متاح'}</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted">
          المزايا حسب صفحة PlayStation Plus الرسمية للسعودية. قائمة الألعاب في كل باقة تتغير شهريًا، ومنذ يناير 2026 تضيف Sony ألعاب PS4 للكتالوج على فترات متقطعة فقط.
        </p>
      </section>
    </>
  );
}
