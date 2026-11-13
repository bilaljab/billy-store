/**
 * PS Plus tiers as Sony sells them in Saudi Arabia (playstation.com/ar-sa/ps-plus, checked 2026-11-13):
 * three tiers, Essential / Extra / Deluxe. There is no Premium (cloud streaming) tier in this region.
 * Prices are NOT stored here: they come from catalogue products whose name mentions the tier.
 */
export type TierKey = 'essential' | 'extra' | 'deluxe';

export interface Tier {
  key: TierKey;
  en: string;
  ar: string;
  /** Names a catalogue product may use for this tier (case-insensitive substring). */
  aliases: string[];
  bestFor: string;
}

export const TIERS: Tier[] = [
  { key: 'essential', en: 'Essential', ar: 'أساسي', aliases: ['essential', 'أساسي', 'اساسي'], bestFor: 'لمن يريد اللعب أونلاين مع ألعاب شهرية.' },
  { key: 'extra', en: 'Extra', ar: 'إضافي', aliases: ['extra', 'إضافي', 'اضافي'], bestFor: 'لمن يريد مكتبة ألعاب كبيرة بدل شراء كل لعبة.' },
  { key: 'deluxe', en: 'Deluxe', ar: 'فاخر', aliases: ['deluxe', 'فاخر'], bestFor: 'لمن يريد الألعاب الكلاسيكية وتجربة الألعاب قبل شرائها.' },
];

/** Benefit rows of the comparison table: the lowest tier that includes it (higher tiers include it too). */
export const BENEFITS: { name: string; detail: string; from: TierKey }[] = [
  { name: 'اللعب الجماعي أونلاين', detail: 'العب مع أصدقائك وضد لاعبين حول العالم.', from: 'essential' },
  { name: 'الألعاب الشهرية', detail: 'ألعاب جديدة كل شهر تبقى في مكتبتك ما دام الاشتراك فعالًا.', from: 'essential' },
  { name: 'خصومات حصرية', detail: 'تخفيضات إضافية على متجر PlayStation للمشتركين.', from: 'essential' },
  { name: 'التخزين السحابي', detail: 'نسخة احتياطية من ملفات الحفظ تنزّلها على أي جهاز.', from: 'essential' },
  { name: 'مشاركة اللعب', detail: 'شارك شاشة لعبتك مع صديق ليلعبها معك أونلاين.', from: 'essential' },
  { name: 'المحتوى الحصري', detail: 'إضافات داخل الألعاب خاصة بالمشتركين.', from: 'essential' },
  { name: 'كتالوج الألعاب', detail: 'مكتبة من ألعاب PS5 وPS4 تحمّلها وتلعبها ما دام الاشتراك فعالًا.', from: 'extra' },
  // ⁦…⁩ isolates the LTR brand so RTL text doesn't render it as "+Ubisoft"
  { name: 'ألعاب ⁦Ubisoft+⁩ الكلاسيكية', detail: 'مجموعة من ألعاب Ubisoft ضمن الاشتراك.', from: 'extra' },
  { name: 'كتالوج الألعاب الكلاسيكية', detail: 'ألعاب من أجيال PlayStation السابقة مثل PS1 وPS2 وPSP.', from: 'deluxe' },
  { name: 'النسخ التجريبية للألعاب', detail: 'جرّب ألعابًا كاملة لفترة محدودة قبل شرائها.', from: 'deluxe' },
];

const ORDER: TierKey[] = ['essential', 'extra', 'deluxe'];
export const includes = (tier: TierKey, from: TierKey) => ORDER.indexOf(tier) >= ORDER.indexOf(from);

/** Tier a catalogue product belongs to, from its name; null if the name names no Saudi tier. */
export function tierOf(name: string): Tier | null {
  const n = name.toLowerCase();
  return TIERS.find(t => t.aliases.some(a => n.includes(a))) ?? null;
}
