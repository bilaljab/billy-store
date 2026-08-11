import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ScrollReveal from '@/components/ui/ScrollReveal';
import FaqAccordion from '@/components/ui/FaqAccordion';
import PsGlyphField from '@/components/ui/PsGlyphField';
import Button from '@/components/ui/Button';

const WaIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.525 5.847L.057 23.516a.5.5 0 00.612.612l5.666-1.469A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.99 0-3.86-.538-5.468-1.476l-.392-.232-4.062 1.054 1.054-4.061-.232-.393A9.936 9.936 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
);

export default function FAQPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="relative pt-24 pb-12 px-4 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-40"></div>
        <PsGlyphField layout="scatter" density="sparse" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <ScrollReveal direction="up">
            <span className="text-brand font-bold text-sm uppercase tracking-wider">مساعدة</span>
            <h1 className="text-4xl sm:text-5xl font-bold font-display text-ink mt-2 mb-4">الأسئلة <span className="text-brand">الشائعة</span></h1>
            <p className="text-muted text-lg">كل ما تحتاج معرفته قبل الشراء</p>
          </ScrollReveal>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 pb-20">
        <FaqAccordion />
        <ScrollReveal direction="up" delay={200}>
          <div className="mt-12 text-center bg-surface border-2 border-black/15 rounded-card p-8 shadow-soft">
            <h2 className="text-xl font-bold text-ink mb-2">لم تجد إجابة لسؤالك؟</h2>
            <p className="text-muted text-sm mb-6">تواصل معنا مباشرة وسنرد عليك بدون تأخير</p>
            <Button href="https://wa.me/966508949041" external icon={<WaIcon />} className="!bg-green-700 hover:!bg-green-600">
              تواصل معنا الآن
            </Button>
            <div className="flex items-center justify-center gap-5 mt-4">
              <a href="https://t.me/BillyStore1" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted hover:text-blue-600 transition-colors text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/></svg>
                تيليجرام
              </a>
              <a href="https://ig.me/m/Billy_Store3" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted hover:text-pink-600 transition-colors text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                إنستقرام
              </a>
            </div>
          </div>
        </ScrollReveal>
      </div>
      <Footer />
    </div>
  );
}
