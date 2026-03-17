'use client';
import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ScrollReveal from '@/components/ui/ScrollReveal';

const faqs = [
  { q: 'كيف أستلم المنتج بعد الشراء؟', a: 'بعد إتمام الدفع، نرسل لك حساباً PlayStation جاهزاً يحتوي على اللعبة. كل ما عليك هو تفعيله على جهازك، تحميل اللعبة من مكتبة الألعاب، والاستمتاع باللعب على جميع حساباتك الخاصة.', icon: '📦' },
  { q: 'كم يستغرق وقت التسليم؟', a: 'التسليم فوري في معظم الأحيان — دقائق معدودة بعد تأكيد الدفع. نحن متواجدون على مدار الساعة لضمان أسرع تسليم ممكن.', icon: '⚡' },
  { q: 'ما هي طرق الدفع المتاحة؟', a: 'نقبل التحويل البنكي المباشر وكذلك STC Pay. بعد اختيار منتجك، تواصل معنا عبر واتساب وسنرسل لك تفاصيل الدفع فوراً.', icon: '💳' },
  { q: 'هل تقدمون ضماناً على المنتجات؟', a: 'نعم، نقدم ضمان استبدال فوري ومدى الحياة على جميع منتجاتنا. في الحالة النادرة التي تواجه فيها أي مشكلة، نستبدل المنتج فوراً بدون أي تعقيدات.', icon: '🛡️' },
  { q: 'هل الألعاب رقمية أم فيزيائية؟', a: 'جميع ألعابنا رقمية 100%. لا حاجة لانتظار الشحن أو الخروج للمحل — تستلم اللعبة فوراً وتلعبها على جهازك مباشرة.', icon: '🎮' },
  { q: 'كيف يعمل اشتراك PS Plus؟', a: 'نوفر لك حساباً PlayStation جاهزاً بالاشتراك المطلوب. تقوم بتفعيله على جهازك وتستمتع باللعب أونلاين وجميع مزايا PS Plus على حساباتك الخاصة.', icon: '⭐' },
  { q: 'متى يمكنني التواصل مع الدعم؟', a: 'فريقنا متاح على مدار الساعة، 7 أيام في الأسبوع. تواصل معنا في أي وقت عبر واتساب أو إنستقرام وسنرد عليك في أقرب وقت ممكن.', icon: '💬' },
  { q: 'هل بيلي ستور موثوق؟', a: 'بيلي ستور يعمل منذ عام 2017 ويخدم آلاف العملاء الراضين في المملكة العربية السعودية. سمعتنا مبنية على الصدق والشفافية، وضماننا مدى الحياة هو دليل ثقتنا بجودة خدمتنا.', icon: '🏆' },
];

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="min-h-screen bg-dark">
      <Navbar />
      <div className="relative pt-24 pb-12 px-4 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-40"></div>
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <ScrollReveal direction="up">
            <span className="text-accent font-bold text-sm uppercase tracking-wider">مساعدة</span>
            <h1 className="text-4xl sm:text-5xl font-black text-white mt-2 mb-4">الأسئلة <span className="text-primary-light">الشائعة</span></h1>
            <p className="text-slate-400 text-lg">كل ما تحتاج معرفته قبل الشراء</p>
          </ScrollReveal>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 pb-20">
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <ScrollReveal key={i} direction="up" delay={i * 60}>
              <div className={`bg-dark-card border rounded-2xl overflow-hidden transition-all duration-300 ${open === i ? 'border-primary/50' : 'border-dark-border hover:border-primary/30'}`}>
                <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center gap-4 p-5 text-right">
                  <span className="text-2xl flex-shrink-0">{faq.icon}</span>
                  <span className="flex-1 font-bold text-white text-base text-right">{faq.q}</span>
                  <span className={`text-accent text-xl transition-transform duration-300 flex-shrink-0 ${open === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                {open === i && (
                  <div className="px-5 pb-5 pr-16">
                    <p className="text-slate-300 leading-loose text-sm">{faq.a}</p>
                  </div>
                )}
              </div>
            </ScrollReveal>
          ))}
        </div>
        <ScrollReveal direction="up" delay={200}>
          <div className="mt-12 text-center bg-dark-card border border-dark-border rounded-3xl p-8">
            <h3 className="text-xl font-black text-white mb-2">لم تجد إجابة لسؤالك؟</h3>
            <p className="text-slate-400 text-sm mb-6">تواصل معنا مباشرة وسنرد عليك فوراً</p>
            <a href="https://wa.me/966508949041" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-black py-3 px-8 rounded-xl transition-all">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.525 5.847L.057 23.516a.5.5 0 00.612.612l5.666-1.469A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.99 0-3.86-.538-5.468-1.476l-.392-.232-4.062 1.054 1.054-4.061-.232-.393A9.936 9.936 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
              تواصل معنا الآن
            </a>
          </div>
        </ScrollReveal>
      </div>
      <Footer />
    </div>
  );
}
