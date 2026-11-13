import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/ui/ProductCard';
import FaqAccordion from '@/components/ui/FaqAccordion';
import PsPlusTiers from '@/components/ui/PsPlusTiers';
import Button from '@/components/ui/Button';
import { WhatsAppIcon } from '@/components/ui/BrandIcons';
import { getCatalog } from '@/lib/catalog';
import { COLLECTIONS, getCollection } from '@/lib/collections';
import { faqJsonLd } from '@/lib/faqs';
import { applyDiscount } from '@/lib/discounts';
import { whatsappLink } from '@/lib/contact';

// Category landing pages (/ps5, /ps4, /ps-plus). Same ISR cadence as /products.
export const revalidate = 30;
export const dynamicParams = false; // anything else under /[x] is a 404

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://billy-store.vercel.app';

export function generateStaticParams() {
  return COLLECTIONS.map(c => ({ collection: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ collection: string }> }): Promise<Metadata> {
  const c = getCollection((await params).collection);
  if (!c) return {};
  return {
    title: c.title,
    description: c.description,
    alternates: { canonical: `/${c.slug}` },
    openGraph: { title: c.title, description: c.description, url: `/${c.slug}` },
  };
}

export default async function CollectionPage({ params }: { params: Promise<{ collection: string }> }) {
  const c = getCollection((await params).collection);
  if (!c) notFound();

  const { products, error } = await getCatalog('newest');
  const items = products.filter(c.match).sort((a, b) => a.price - b.price);
  const url = `${SITE_URL}/${c.slug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage', name: c.h1, url, description: c.description, inLanguage: 'ar',
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: items.length,
          itemListElement: items.slice(0, 50).map((p, i) => ({
            '@type': 'ListItem', position: i + 1, url: `${SITE_URL}/products/${p.id}`, name: p.name,
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: c.h1, item: url },
        ],
      },
      faqJsonLd(c.faqs),
    ],
  };

  const from = items.length ? Math.min(...items.map(p => applyDiscount(p.price, p.discount))) : null;

  return (
    <div className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <Navbar />

      <main id="main" className="mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-6 sm:pt-36 lg:px-8">
        <nav aria-label="مسار التنقل" className="mb-4 flex items-center gap-1.5 text-sm text-muted">
          <Link href="/" className="inline-flex min-h-11 items-center transition-colors hover:text-ink">الرئيسية</Link>
          <ChevronLeft size={14} aria-hidden="true" />
          <span className="font-bold text-ink" aria-current="page">{c.h1}</span>
        </nav>

        <header className="mb-10 max-w-3xl">
          <h1 className="font-display text-5xl font-bold leading-[1.3] text-ink sm:text-7xl sm:leading-[1.2]">{c.h1}</h1>
          {c.intro.map(t => <p key={t} className="mt-3 leading-relaxed text-muted">{t}</p>)}
          {from !== null && (
            <p className="mt-4 text-sm text-ink">
              <span className="tabular-nums font-bold">{items.length}</span> منتج، تبدأ الأسعار من{' '}
              <span className="tabular-nums font-bold">{from}</span> ر.س
            </p>
          )}
        </header>

        {c.slug === 'ps-plus' && <PsPlusTiers subscriptions={items} />}

        <h2 className={c.slug === 'ps-plus' ? 'mb-6 font-display text-3xl font-bold text-ink sm:text-4xl' : 'sr-only'}>
          {c.slug === 'ps-plus' ? 'كل الاشتراكات' : 'المنتجات'}
        </h2>
        {error || items.length === 0 ? (
          <div className="rounded-2xl border border-line bg-surface px-6 py-16 text-center">
            <p className="mb-6 text-muted">{error ? 'تعذّر تحميل المنتجات. حدّث الصفحة.' : 'لا توجد منتجات هنا حاليًا. راسلنا ونوفر لك ما تبحث عنه.'}</p>
            <Button href={whatsappLink(`مرحباً، أبحث عن ${c.h1}`)} external variant="whatsapp" icon={<WhatsAppIcon />}>راسلنا على واتساب</Button>
          </div>
        ) : (
          <div className="focus-grid grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((p, i) => (
              <div key={p.id} className="h-full" style={i < 8 ? undefined : { contentVisibility: 'auto', containIntrinsicSize: 'auto 280px' }}>
                <ProductCard product={p} priority={i === 0} />
              </div>
            ))}
          </div>
        )}

        <section className="mx-auto mt-20 max-w-3xl">
          <h2 className="mb-6 font-display text-3xl font-bold text-ink sm:text-4xl">أسئلة شائعة</h2>
          <FaqAccordion items={c.faqs} />
          <p className="mt-6 text-sm text-muted">
            عندك سؤال آخر؟ <Link href="/faq" className="font-bold text-accent underline-offset-4 hover:underline">كل الأسئلة الشائعة</Link>
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
