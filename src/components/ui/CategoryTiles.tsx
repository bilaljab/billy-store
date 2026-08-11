import Image from 'next/image';
import Link from 'next/link';
import { Gamepad2, Star } from 'lucide-react';
import ScrollReveal from './ScrollReveal';
import Badge from './Badge';
import type { CategoryKey, CategoryTileLogo } from '@/lib/siteImages';

export interface CategoryTile {
  key: CategoryKey;
  label: string;
  desc: string;
  href: string;
  countText: string;
  logo: CategoryTileLogo;
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
            className="group relative block aspect-[3/4] sm:aspect-[16/9] rounded-card overflow-hidden border border-chip hover:border-brand/50 bg-surface card-hover"
          >
            {/* تدرّج بلون الفئة — يميّز البطاقتين ويمنع الخلفية من أن تكون مسطّحة */}
            <div className={`absolute inset-0 bg-gradient-to-br ${tile.logo.tintClass}`} />

            {/* اللوجو مرفوع فوق كتلة النص (وليس بمنتصف البطاقة) حتى لا يتزاحما،
                وخلفه توهج مموّه يدمجه بالخلفية بدل أن يبدو ملصقًا فوقها */}
            <div className="absolute inset-x-0 top-0 bottom-[38%] sm:bottom-[42%] flex items-center justify-center">
              <div className={`absolute w-20 h-20 sm:w-40 sm:h-40 rounded-full blur-2xl ${tile.logo.glowClass}`} />
              <Image
                src={tile.logo.src}
                alt=""
                width={tile.logo.width}
                height={tile.logo.height}
                sizes="(max-width: 640px) 30vw, 20vw"
                loading="lazy"
                className={`relative w-16 sm:w-32 h-auto object-contain transition-all duration-500 group-hover:scale-105 ${tile.logo.className}`}
              />
            </div>

            {/* يفصل النص عن اللوجو ويضمن تباينه */}
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/80 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-3 sm:p-7">
              <Badge
                variant="category"
                icon={tile.key === 'subscription' ? <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <Gamepad2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                className="text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 mb-1.5 sm:mb-3"
              >
                {tile.countText}
              </Badge>
              <h3 className="text-base sm:text-3xl font-normal text-ink leading-snug mb-1 group-hover:text-brand transition-colors">
                {tile.label}
              </h3>
              {/* الوصف مخفي على الموبايل: بعرض ~173px يطلع مزنوقًا ويزاحم العنوان
                  والعدّاد، وهما يكفيان لتوضيح البطاقة */}
              <p className="hidden sm:block text-muted text-sm leading-relaxed mb-3 line-clamp-2">{tile.desc}</p>
              <span className="inline-flex items-center gap-1.5 sm:gap-2 text-brand font-bold text-xs sm:text-sm">
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
