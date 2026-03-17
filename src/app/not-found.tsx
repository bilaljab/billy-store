import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-dark flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="relative mb-8">
            <div className="text-[120px] font-black text-primary/10 leading-none select-none">404</div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl">🎮</span>
            </div>
          </div>
          <h1 className="text-3xl font-black text-white mb-3">الصفحة غير موجودة</h1>
          <p className="text-slate-400 mb-8 leading-relaxed">يبدو أن هذه الصفحة اختفت مثل حياة اللاعب الأخيرة. دعنا نعيدك للصفحة الرئيسية.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="ps-btn text-base px-8 py-3">العودة للرئيسية</Link>
            <Link href="/products" className="flex items-center justify-center gap-2 bg-dark-card border border-dark-border hover:border-primary/50 text-slate-300 hover:text-white font-bold py-3 px-8 rounded-lg transition-all">
              تصفح المنتجات
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
