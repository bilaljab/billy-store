/**
 * إعدادات قسم التصنيفات بالصفحة الرئيسية — مصدر واحد للنصوص والروابط،
 * بدون لمس JSX.
 *
 * ملاحظة: الـhero يبقى بتصميمه الأصلي (كرات ضوء + رموز △○✕□، بلا صور) بقرار
 * صريح من المالك بعد تجربة خلفية مصوّرة والتراجع عنها. لا تُعد إضافة صورة
 * خلفية للـhero هنا بدون طلب صريح.
 */

/** الفئات الفعلية بقاعدة البيانات: 'games' و'subscription' فقط */
export type CategoryKey = 'games' | 'subscription';

export interface CategoryTileConfig {
  key: CategoryKey;
  label: string;
  desc: string;
  href: string;
  /** صيغة عدّاد المنتجات — تُستدعى بالعدد الحقيقي القادم من قاعدة البيانات */
  countLabel: (n: number) => string;
}

export const CATEGORY_TILES: CategoryTileConfig[] = [
  {
    key: 'games',
    label: 'ألعاب PS4 و PS5',
    desc: 'أحدث الإصدارات وكلاسيكيات ما تفوتك — بأسعار أقل من المتجر الرسمي',
    href: '/products?category=games',
    countLabel: (n) => `${n} لعبة متاحة`,
  },
  {
    key: 'subscription',
    label: 'اشتراكات PS Plus',
    desc: 'Essential و Extra و Premium — تفعيل خلال دقائق على حسابك',
    href: '/products?category=subscription',
    countLabel: (n) => `${n} اشتراك متاح`,
  },
];
