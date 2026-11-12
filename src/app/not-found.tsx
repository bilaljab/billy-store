import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main id="main" className="flex flex-1 items-center justify-center px-4 py-32">
        <div className="max-w-md text-center">
          <p className="select-none text-8xl font-bold leading-none tabular-nums text-chip sm:text-9xl" aria-hidden="true">404</p>
          <h1 className="mt-6 text-3xl font-bold text-ink">الصفحة غير موجودة</h1>
          <p className="mb-8 mt-3 leading-relaxed text-muted">يبدو أن هذه الصفحة اختفت مثل حياة اللاعب الأخيرة. دعنا نعيدك للصفحة الرئيسية.</p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button href="/">العودة للرئيسية</Button>
            <Button href="/products" variant="secondary">تصفح المنتجات</Button>
          </div>
        </div>
      </main>
    </div>
  );
}
