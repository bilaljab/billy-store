'use client';
import { useState } from 'react';
import { Package, Zap, CreditCard, ShieldCheck, Gamepad2, Star, MessageCircle, Trophy } from 'lucide-react';
import IconChip from './IconChip';

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
    <div className="space-y-3">
      {faqs.map((faq, i) => (
        <div key={i} className={`bg-surface border rounded-2xl overflow-hidden transition-all duration-300 shadow-soft ${open === i ? 'border-brand/50' : 'border-chip hover:border-brand/30'}`}>
          <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="w-full flex items-center gap-4 p-5 text-right">
            <IconChip icon={faq.icon} size="sm" />
            <span className="flex-1 font-bold text-ink text-base text-right">{faq.q}</span>
            <span className={`text-brand text-xl transition-transform duration-300 flex-shrink-0 ${open === i ? 'rotate-45' : ''}`}>+</span>
          </button>
          <div className={`grid faq-answer-grid ${open === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`} aria-hidden={open !== i}>
            <div className="overflow-hidden">
              <p className="px-5 pb-5 pr-16 text-ink leading-loose text-sm">{faq.a}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
