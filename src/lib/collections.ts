import type { Faq } from './faqs';

/**
 * A game's platforms, read from the catalogue name ("… [PS5]", "… (PS4)", "PS4 & PS5").
 * Store convention: a game whose name carries no platform tag is PS5-only.
 */
export function platformsOf(name: string): ('PS5' | 'PS4')[] {
  const ps4 = /\bPS4\b/i.test(name);
  const ps5 = /\bPS5\b/i.test(name) || !ps4;
  return [...(ps5 ? ['PS5' as const] : []), ...(ps4 ? ['PS4' as const] : [])];
}

export interface Collection {
  slug: string;
  title: string;        // <title>
  description: string;  // meta description
  h1: string;
  intro: string[];
  match: (p: { name: string; category: string }) => boolean;
  faqs: Faq[];
}

const DELIVERY_FAQ: Faq = {
  q: 'كيف أستلم اللعبة؟',
  a: 'بعد الدفع نرسل لك بيانات حساب PlayStation جاهز فيه اللعبة. تسجّل الدخول به وتفعّله كحساب أساسي على جهازك، ثم تحمّل اللعبة وتلعبها من حسابك أنت. التسليم خلال دقائق في معظم الأحيان.',
};

export const COLLECTIONS: Collection[] = [
  {
    slug: 'ps5',
    // "العاب سوني 5" ~2.4k searches/month at KD 4 vs "العاب ps5" ~480 (OpenSEO, 2026-11-14)
    title: 'ألعاب سوني 5 (PS5) رقمية بأسعار أقل | Billy Store',
    description: 'ألعاب سوني 5 (PS5) رقمية بسعر أقل من المتجر الرسمي، تسليم خلال دقائق، دفع بتحويل بنكي أو STC Pay، وضمان استبدال مدى الحياة.',
    h1: 'ألعاب PS5',
    intro: [
      'تشكيلة من أحدث ألعاب سوني 5 (PlayStation 5) بنسخ رقمية، بسعر أقل من المتجر الرسمي بكثير.',
      'تستلم اللعبة على حساب PlayStation جاهز خلال دقائق من تأكيد الدفع، وتلعبها من حسابك أنت على نفس الجهاز.',
    ],
    match: p => p.category === 'games' && platformsOf(p.name).includes('PS5'),
    faqs: [
      DELIVERY_FAQ,
      { q: 'هل ألعاب PS5 تعمل على PS4؟', a: 'لا. نسخة PS5 تعمل على جهاز PS5 فقط. إذا كان جهازك PS4 فاختر نسخة PS4 من نفس اللعبة إن توفرت.' },
      { q: 'ما طرق الدفع؟', a: 'التحويل البنكي المباشر أو STC Pay. راسلنا على واتساب ونرسل لك تفاصيل الدفع.' },
    ],
  },
  {
    slug: 'ps4',
    title: 'ألعاب سوني 4 (PS4) رقمية بأسعار أقل | Billy Store',
    description: 'ألعاب سوني 4 (PS4) رقمية بسعر أقل من المتجر الرسمي، تسليم خلال دقائق، دفع بتحويل بنكي أو STC Pay، وضمان استبدال مدى الحياة.',
    h1: 'ألعاب PS4',
    intro: [
      'ألعاب سوني 4 (PlayStation 4) بنسخ رقمية، بسعر أقل من المتجر الرسمي بكثير.',
      'تستلم اللعبة على حساب PlayStation جاهز خلال دقائق من تأكيد الدفع، وتلعبها من حسابك أنت على نفس الجهاز.',
    ],
    match: p => p.category === 'games' && platformsOf(p.name).includes('PS4'),
    faqs: [
      DELIVERY_FAQ,
      { q: 'هل ألعاب PS4 تعمل على PS5؟', a: 'أغلب ألعاب PS4 تعمل على PS5 بفضل التوافق مع الإصدارات السابقة، مع استثناءات قليلة تحددها Sony. اسألنا عن اللعبة قبل الشراء إذا لم تكن متأكدًا.' },
      { q: 'ما طرق الدفع؟', a: 'التحويل البنكي المباشر أو STC Pay. راسلنا على واتساب ونرسل لك تفاصيل الدفع.' },
    ],
  },
  {
    slug: 'ps-plus',
    // "اشتراك بلس" ~2.4k searches/month at KD 0; its SERP is weak (OpenSEO, 2026-11-14)
    title: 'اشتراك بلس (PS Plus) بسعر أقل | Billy Store',
    description: 'اشتراك بلايستيشن بلس أساسي وإضافي وفاخر (Essential وExtra وDeluxe) بسعر أقل من المتجر الرسمي، مع مقارنة مزايا كل باقة وتفعيل خلال دقائق.',
    h1: 'اشتراك بلايستيشن بلس',
    intro: [
      'اشتراك بلس (PlayStation Plus) بسعر أقل من المتجر الرسمي، تفعّله على جهازك PS4 أو PS5 خلال دقائق.',
      'نوفر لك حساب PlayStation جاهزًا بالاشتراك. تفعّله كحساب أساسي على جهازك، فتستفيد من مزايا PS Plus من كل الحسابات المحلية على نفس الجهاز.',
    ],
    match: p => p.category === 'subscription',
    faqs: [
      { q: 'ما الفرق بين أساسي وإضافي وفاخر؟', a: 'أساسي (Essential) تعطيك اللعب الجماعي أونلاين، وألعابًا شهرية، وخصومات حصرية، والتخزين السحابي لملفات الحفظ. إضافي (Extra) تضيف كتالوج ألعاب PS5 وPS4 وألعاب ⁦Ubisoft+⁩ الكلاسيكية. فاخر (Deluxe) تضيف كتالوج الألعاب الكلاسيكية والنسخ التجريبية للألعاب.' },
      { q: 'أي باقة تناسبني؟', a: 'إذا كنت تريد اللعب أونلاين فقط فباقة أساسي تكفي. إذا كنت تريد مكتبة ألعاب تلعب منها بدل شراء كل لعبة فاختر إضافي. فاخر تناسب من يريد الألعاب الكلاسيكية وتجربة الألعاب قبل شرائها.' },
      { q: 'هل توجد باقة Premium؟', a: 'باقة Premium (مع البث السحابي) غير متوفرة في السعودية. أعلى باقة في المنطقة هي فاخر (Deluxe).' },
      { q: 'كيف أفعّل الاشتراك؟', a: 'نرسل لك بيانات حساب PlayStation فيه الاشتراك. تسجّل الدخول به على جهازك وتفعّله كحساب أساسي (Primary)، فتعمل مزايا الاشتراك من حسابك الشخصي أيضًا.' },
      { q: 'هل يعمل الاشتراك على PS4 وPS5؟', a: 'نعم، اشتراك PS Plus يعمل على الجهازين.' },
      { q: 'الباقة أو المدة التي أريدها غير موجودة، ماذا أفعل؟', a: 'راسلنا على واتساب بالباقة والمدة المطلوبة، ونرد عليك بالسعر والتوفر.' },
    ],
  },
];

export const getCollection = (slug: string) => COLLECTIONS.find(c => c.slug === slug);

/** Category page a product belongs to, for breadcrumbs. */
export function collectionFor(p: { name: string; category: string }) {
  return COLLECTIONS.find(c => c.match(p)) ?? null;
}
