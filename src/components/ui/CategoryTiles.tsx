import Image from 'next/image';
import Link from 'next/link';
import { Gamepad2, Star } from 'lucide-react';
import ScrollReveal from './ScrollReveal';
import type { CategoryKey } from '@/lib/siteImages';

export interface CategoryTile {
  key: CategoryKey;
  label: string;
  desc: string;
  href: string;
  countText: string;
  image: string | null;
}

export default function CategoryTiles({ tiles }: { tiles: CategoryTile[] }) {
  if (tiles.length === 0) return null;

  return (
    // عمودان على كل المقاسات — على الموبايل عرض البطاقة ~173px فكل المحتوى
    // بالداخل مُصغَّر، والنسبة طولية (3/4) لتبقى مساحة كافية للنص
    <div className="grid grid-cols-2 gap-3 sm:gap-6">
      {tiles.map((tile, i) => (
        <ScrollReveal key={tile.key} direction="up" delay={i * 120}>
          <Link
            href={tile.href}
            className="group relative block aspect-[3/4] sm:aspect-[16/9] rounded-2xl sm:rounded-3xl overflow-hidden border border-dark-border hover:border-primary/50 bg-dark-card card-hover"
          >
            {tile.image ? (
              <Image
                src={tile.image}
                alt=""
                fill
                sizes="(max-width: 640px) 50vw, 50vw"
                loading="lazy"
                className="object-cover opacity-55 group-hover:opacity-75 group-hover:scale-105 transition-all duration-700"
              />
            ) : (
              /* نفس مفردات الـfallback ببطاقة المنتج — لا صورة مكسورة ولا فراغ */
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-dark flex items-center justify-center">
                {tile.key === 'subscription' ? (
                  // dir=ltr وإلا انقلبت لـ"+PS" داخل صفحة RTL
                  <div dir="ltr" className="w-14 h-14 sm:w-24 sm:h-24 rounded-full bg-accent/20 border-2 border-accent/40 flex items-center justify-center text-accent font-black text-sm sm:text-2xl">
                    PS+
                  </div>
                ) : (
                  <div className="w-14 h-14 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl bg-primary/20 flex items-center justify-center">
                    {/* الحجم بكلاسات لا بـsize، حتى يتغيّر مع المقاس */}
                    <Gamepad2 className="w-7 h-7 sm:w-14 sm:h-14 text-primary-light" />
                  </div>
                )}
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-dark-card via-dark-card/70 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-3 sm:p-7">
              <div className="inline-flex items-center gap-1 sm:gap-2 bg-primary/20 border border-primary/40 text-primary-light text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full mb-1.5 sm:mb-3">
                {tile.key === 'subscription'
                  ? <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  : <Gamepad2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                {tile.countText}
              </div>
              <h3 className="text-base sm:text-3xl font-black text-white leading-snug mb-1 group-hover:text-accent transition-colors">
                {tile.label}
              </h3>
              {/* الوصف مخفي على الموبايل: بعرض ~173px يطلع مزنوقًا ويزاحم العنوان
                  والعدّاد، وهما يكفيان لتوضيح البطاقة */}
              <p className="hidden sm:block text-slate-400 text-sm leading-relaxed mb-3 line-clamp-2">{tile.desc}</p>
              <span className="inline-flex items-center gap-1.5 sm:gap-2 text-accent font-bold text-xs sm:text-sm">
                تصفّح الآن
                <span className="group-hover:translate-x-1 transition-transform">←</span>
              </span>
            </div>
          </Link>
        </ScrollReveal>
      ))}
    </div>
  );
}
