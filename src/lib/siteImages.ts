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

export interface CategoryTileLogo {
  /** PNG بشفافية داخل public/logos/ — يخضع لـ img-src 'self' بالـCSP */
  src: string;
  width: number;
  height: number;
  /**
   * كلاسات المظهر. لوجو PlayStation أسود، و`brightness-0 invert` تحوّله أبيض
   * نقيًا مع الحفاظ على الشفافية — لذلك لم نحتج نسخة بيضاء منه.
   * لوجو PS Plus ذهبي أصلًا فيُترك بلونه.
   */
  className: string;
  /** لون التوهج خلف اللوجو — يدمجه بالخلفية بدل أن يبدو ملصقًا فوقها */
  glowClass: string;
  /** تدرّج خفيف بلون الفئة يميّز البطاقتين عن بعضهما */
  tintClass: string;
}

export interface CategoryTileConfig {
  key: CategoryKey;
  label: string;
  desc: string;
  href: string;
  /** صيغة عدّاد المنتجات — تُستدعى بالعدد الحقيقي القادم من قاعدة البيانات */
  countLabel: (n: number) => string;
  /**
   * لوجو ثابت بدل غلاف منتج من الكتالوج. مقصود: الغلاف كان يُختار بـ
   * `ORDER BY created_at DESC LIMIT 1` فيتغيّر تلقائيًا مع كل منتج جديد
   * يُضاف — أي أن هوية القسم كانت رهينة آخر منتج أُدخل.
   */
  logo: CategoryTileLogo;
}

export const CATEGORY_TILES: CategoryTileConfig[] = [
  {
    key: 'games',
    label: 'ألعاب PS4 و PS5',
    desc: 'أحدث الإصدارات وكلاسيكيات ما تفوتك — بأسعار أقل من المتجر الرسمي',
    href: '/products?category=games',
    countLabel: (n) => `${n} لعبة متاحة`,
    logo: {
      src: '/logos/playstation.png',
      width: 640,
      height: 496,
      className: 'brightness-0 invert opacity-80 group-hover:opacity-100',
      glowClass: 'bg-primary/25',
      tintClass: 'from-primary/25 via-dark-card to-dark-card',
    },
  },
  {
    key: 'subscription',
    label: 'اشتراكات PS Plus',
    desc: 'Essential و Extra و Premium — تفعيل خلال دقائق على حسابك',
    href: '/products?category=subscription',
    countLabel: (n) => `${n} اشتراك متاح`,
    logo: {
      src: '/logos/ps-plus.png',
      width: 640,
      height: 618,
      className: 'opacity-90 group-hover:opacity-100',
      glowClass: 'bg-amber-400/20',
      tintClass: 'from-amber-500/15 via-dark-card to-dark-card',
    },
  },
];
