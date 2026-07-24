'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      if (res.ok) {
        router.push('/admin/dashboard');
      } else {
        const data = await res.json();
        setError(data.error || 'خطأ في تسجيل الدخول');
      }
    } catch {
      setError('حدث خطأ، حاول مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center px-4 grid-bg">
      <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/3 left-1/4 w-48 h-48 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/20 border-2 border-primary/40 flex items-center justify-center mb-4">
            <span className="text-accent font-black text-xl">BS</span>
          </div>
          <h1 className="text-3xl font-black text-white">لوحة التحكم</h1>
          <p className="text-slate-400 mt-2">بيلي ستور - Admin Panel</p>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-3xl p-8">
          {error && (
            <div role="alert" className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-6 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-username" className="block text-slate-400 text-sm font-semibold mb-2">اسم المستخدم</label>
              <input
                id="login-username"
                type="text"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                placeholder="admin"
                required
                className="w-full bg-dark border border-dark-border rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-slate-400 text-sm font-semibold mb-2">كلمة المرور</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="w-full bg-dark border border-dark-border rounded-xl px-4 py-3 pl-12 text-white placeholder-slate-600 focus:outline-none focus:border-primary transition-colors"
                />
                <button type="button" onClick={() => setShowPassword(s => !s)}
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  className="absolute left-1 top-1/2 -translate-y-1/2 min-w-11 min-h-11 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-black py-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 text-lg">
              {loading ? 'جاري التحقق...' : 'دخول'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
