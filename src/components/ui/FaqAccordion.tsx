'use client';
import { useState } from 'react';
import { Plus, Package, Zap, CreditCard, ShieldCheck, Gamepad2, Star, MessageCircle, Trophy } from 'lucide-react';

const faqs = [
  { q: 'كيف أستلم المنتج بعد الشراء؟', a: 'بعد إتمام الدفع، نرسل لك بيانات حساب PlayStation جاهز يحتوي على اللعبة. تسجّل الدخول به وتفعّله كحساب أساسي (Primary) على جهازك — خطوة تتيح لعب اللعبة من كل الحسابات المحلية على نفس الجهاز، حتى بدون اتصال بالإنترنت لاحقاً. بعدها حمّل اللعبة من مكتبة الألعاب واستمتع باللعب من حسابك أنت.', icon: <Package size={20} /> },
  { q: 'كم يستغرق وقت التسليم؟', a: 'التسليم يتم خلال دقائق في معظم الأحيان بعد تأكيد الدفع. نحن متواجدون على مدار الساعة لضمان أسرع تسليم ممكن.', icon: <Zap size={20} /> },
  { q: 'ما هي طرق الدفع المتاحة؟', a: 'نقبل التحويل البنكي المباشر وكذلك STC Pay. بعد اختيار منتجك، تواصل معنا عبر واتساب وسنرسل لك تفاصيل الدفع بدون انتظار.', icon: <CreditCard size={20} /> },
  { q: 'هل تقدمون ضماناً على المنتجات؟', a: 'نعم، نقدم ضمان استبدال سريع ومدى الحياة على جميع منتجاتنا. في الحالة النادرة التي تواجه فيها أي مشكلة، نستبدل المنتج خلال دقائق بدون أي تعقيدات.', icon: <ShieldCheck size={20} /> },
  { q: 'هل الألعاب رقمية أم فيزيائية؟', a: 'جميع ألعابنا رقمية 100%. لا حاجة لانتظار الشحن أو الخروج للمحل — تستلم اللعبة من لحظة الدفع وتلعبها على جهازك مباشرة.', icon: <Gamepad2 size={20} /> },
  { q: 'كيف يعمل اشتراك PS Plus؟', a: 'نوفر لك بيانات حساب PlayStation جاهز بالاشتراك المطلوب. تسجّل الدخول به وتفعّله كحساب أساسي (Primary) على جهازك — نفس آلية الألعاب، تتيح اللعب أونلاين والاستفادة من مزايا PS Plus من كل الحسابات المحلية على نفس الجهاز.', icon: <Star size={20} /> },
  { q: 'متى يمكنني التواصل مع الدعم؟', a: 'فريقنا متاح على مدار الساعة، 7 أيام في الأسبوع. تواصل معنا في أي وقت عبر واتساب أو إنستقرام وسنرد عليك في أقرب وقت ممكن.', icon: <MessageCircle size={20} /> },
  { q: 'هل بيلي ستور موثوق؟', a: 'بيلي ستور يعمل منذ عام 2017 ويخدم آلاف العملاء الراضين في المملكة العربية السعودية. سمعتنا مبنية على الصدق والشفافية، وضماننا مدى الحياة هو دليل ثقتنا بجودة خدمتنا.', icon: <Trophy size={20} /> },
];

export default function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-line border-y border-line">
      {faqs.map((faq, i) => {
        const isOpen = open === i;
        return (
          <div key={faq.q}>
            <h2>
              <button onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} aria-controls={`faq-panel-${i}`} id={`faq-button-${i}`}
                className="group flex min-h-16 w-full items-center gap-4 py-4 text-start">
                <span className={`shrink-0 transition-colors ${isOpen ? 'text-accent' : 'text-muted group-hover:text-ink'}`} aria-hidden="true">{faq.icon}</span>
                <span className={`flex-1 text-base font-bold transition-colors sm:text-lg ${isOpen ? 'text-ink' : 'text-ink/90 group-hover:text-ink'}`}>{faq.q}</span>
                <Plus size={20} aria-hidden="true" className={`shrink-0 text-muted transition-transform duration-300 ${isOpen ? 'rotate-45 text-accent' : ''}`} />
              </button>
            </h2>
            <div id={`faq-panel-${i}`} role="region" aria-labelledby={`faq-button-${i}`} inert={!isOpen}
              className={`collapse-grid grid ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
              <div className="overflow-hidden">
                <p className="max-w-prose pb-6 ps-9 leading-loose text-muted">{faq.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
