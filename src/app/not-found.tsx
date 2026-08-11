import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { Gamepad2 } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="relative mb-8">
            <div className="text-[120px] font-bold text-brand/10 leading-none select-none">404</div>
            <div className="absolute inset-0 flex items-center justify-center text-brand" aria-hidden="true">
              <Gamepad2 size={64} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-ink mb-3">الصفحة غير موجودة</h1>
          <p className="text-muted mb-8 leading-relaxed">يبدو أن هذه الصفحة اختفت مثل حياة اللاعب الأخيرة. دعنا نعيدك للصفحة الرئيسية.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="ps-btn text-base px-8 py-3">العودة للرئيسية</Link>
            <Link href="/products" className="flex items-center justify-center gap-2 bg-surface border-2 border-black/15 hover:border-brand/50 text-muted hover:text-ink font-bold py-3 px-8 rounded-lg transition-all">
              تصفح المنتجات
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
