import { COLLECTIONS } from '@/lib/collections';
import { TIERS } from '@/lib/psplus';
import { STORE_FAQS } from '@/lib/faqs';

// llms.txt (llmstxt.org): a plain-text site overview for AI assistants.
// A route, not a static file, so links follow NEXT_PUBLIC_SITE_URL when the domain changes.
export const dynamic = 'force-static';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://billy-store.vercel.app';

export function GET() {
  const body = `# Billy Store (بيلي ستور)

> متجر سعودي للألعاب الرقمية منذ 2017: ألعاب PS5 وPS4 واشتراكات PlayStation Plus بسعر أقل من المتجر الرسمي. التسليم رقمي خلال دقائق، والدفع بتحويل بنكي أو STC Pay، مع ضمان استبدال مدى الحياة.

طريقة الشراء: يختار العميل المنتج من الموقع ويراسل المتجر على واتساب، فيدفع ويستلم بيانات حساب PlayStation جاهز فيه اللعبة أو الاشتراك، ثم يفعّله كحساب أساسي (Primary) على جهازه.

## التصنيفات

${COLLECTIONS.map(c => `- [${c.h1}](${SITE_URL}/${c.slug}): ${c.description}`).join('\n')}
- [كل المنتجات](${SITE_URL}/products): الكتالوج الكامل مع الأسعار بالريال السعودي

## باقات PS Plus المتوفرة بالسعودية

${TIERS.map(t => `- ${t.ar} (${t.en}): ${t.bestFor}`).join('\n')}

المقارنة الكاملة للمزايا: ${SITE_URL}/ps-plus

## أسئلة شائعة

${STORE_FAQS.map(f => `- ${f.q} ${f.a}`).join('\n')}

## صفحات أخرى

- [من نحن](${SITE_URL}/about)
- [الأسئلة الشائعة](${SITE_URL}/faq)
- [خريطة الموقع](${SITE_URL}/sitemap.xml)
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
