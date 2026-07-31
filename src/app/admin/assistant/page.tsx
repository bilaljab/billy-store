'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Send, Bot } from 'lucide-react';
import AssistantConfirmCard from '@/components/admin/AssistantConfirmCard';
import AssistantFinalConfirmModal from '@/components/admin/AssistantFinalConfirmModal';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

interface PendingConfirm {
  toolName: string;
  args: Record<string, unknown>;
  riskTier: 'single-confirm' | 'double-confirm';
  humanSummary: string;
  confirmValue?: number;
}

export default function AssistantPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const [finalConfirmOpen, setFinalConfirmOpen] = useState(false);
  const [finalConfirmError, setFinalConfirmError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const handleSend = async () => {
    const message = input.trim();
    if (!message || sending) return;

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', text: message }];
    setMessages(nextMessages);
    setInput('');
    setSending(true);
    setError('');

    try {
      const res = await fetch('/api/admin/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message, history: messages }),
      });
      const data = await res.json();

      if (data.type === 'text' || data.type === 'result') {
        setMessages(prev => [...prev, { role: 'model', text: data.reply }]);
      } else if (data.type === 'confirm') {
        setPendingConfirm({
          toolName: data.toolName,
          args: data.args,
          riskTier: data.riskTier,
          humanSummary: data.humanSummary,
          confirmValue: data.confirmValue,
        });
      } else {
        setError(data.error || 'حدث خطأ غير متوقع');
      }
    } catch {
      setError('تعذّر الاتصال بالخادم');
    }
    setSending(false);
  };

  const doConfirm = async (typedConfirmation?: string) => {
    if (!pendingConfirm) return;
    setConfirming(true);
    setFinalConfirmError('');
    try {
      const res = await fetch('/api/admin/assistant/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          toolName: pendingConfirm.toolName,
          args: pendingConfirm.args,
          typedConfirmation,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setMessages(prev => [...prev, { role: 'model', text: data.reply }]);
        setPendingConfirm(null);
        setFinalConfirmOpen(false);
      } else if (finalConfirmOpen) {
        setFinalConfirmError(data.error || 'فشل التنفيذ');
      } else {
        setError(data.error || 'فشل التنفيذ');
      }
    } catch {
      const msg = 'تعذّر الاتصال بالخادم';
      if (finalConfirmOpen) setFinalConfirmError(msg); else setError(msg);
    }
    setConfirming(false);
  };

  const handlePrimary = () => {
    if (!pendingConfirm) return;
    if (pendingConfirm.riskTier === 'double-confirm') {
      setFinalConfirmOpen(true);
    } else {
      doConfirm();
    }
  };

  const handleCancel = () => {
    setPendingConfirm(null);
    setFinalConfirmOpen(false);
    setFinalConfirmError('');
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch('/api/upload', { method: 'POST', credentials: 'include', body: fd });
      const data = await res.json();
      if (data.url) {
        setPendingConfirm(prev => (prev ? { ...prev, args: { ...prev.args, image: data.url } } : prev));
      } else {
        setError(data.error || 'فشل رفع الصورة');
      }
    } catch {
      setError('حدث خطأ أثناء رفع الصورة');
    }
    setUploadingImage(false);
  };

  const showImageControls = pendingConfirm?.toolName === 'createProduct' || pendingConfirm?.toolName === 'updateProduct';

  return (
    <div className="min-h-screen bg-dark flex flex-col">
      <header className="bg-dark-card border-b border-dark-border px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
            <Bot size={18} className="text-accent" />
          </div>
          <div>
            <h1 className="font-black text-white text-sm">المساعد الذكي</h1>
            <p className="text-muted text-xs">لوحة التحكم</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="text-slate-400 hover:text-accent text-sm transition-colors">
            ← الداشبورد
          </Link>
          <button onClick={handleLogout} className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-semibold px-4 min-h-11 rounded-lg transition-all">
            تسجيل خروج
          </button>
        </div>
      </header>

      {/* pb-24 clears the site-wide fixed WhatsAppFloat button (bottom-6 left-6, 56px) so it
          never overlaps or intercepts clicks on the send button below */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 pt-8 pb-24 flex flex-col gap-4">
        {error && (
          <div role="alert" className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm text-center">
            {error}
          </div>
        )}

        <div className="flex-1 flex flex-col gap-4">
          {messages.length === 0 && !pendingConfirm && (
            <div className="text-center text-muted py-16">
              اكتب أمراً بالعربي، مثل &quot;أضف لعبة FIFA 25 بسعر 199&quot; أو &quot;فعّل خصم 20% على الاشتراكات&quot;.
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div
                className={
                  m.role === 'user'
                    ? 'bg-primary/10 border border-primary/30 rounded-2xl p-4 max-w-[85%] text-slate-100'
                    : 'bg-dark-card border border-dark-border rounded-2xl p-5 max-w-[85%] text-slate-200'
                }
              >
                <p className="whitespace-pre-line leading-relaxed">{m.text}</p>
              </div>
            </div>
          ))}

          {pendingConfirm && !finalConfirmOpen && (
            <AssistantConfirmCard
              humanSummary={pendingConfirm.humanSummary}
              riskTier={pendingConfirm.riskTier}
              onPrimary={handlePrimary}
              onCancel={handleCancel}
              confirming={confirming}
              showImageControls={showImageControls}
              imageUrl={typeof pendingConfirm.args.image === 'string' ? pendingConfirm.args.image : null}
              onImageUpload={handleImageUpload}
              uploadingImage={uploadingImage}
            />
          )}
        </div>

        <div className="flex gap-3">
          <label htmlFor="assistant-input" className="sr-only">اكتب رسالتك للمساعد</label>
          <input
            id="assistant-input"
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
            disabled={sending || !!pendingConfirm}
            placeholder="اكتب أمرك هنا..."
            className="flex-1 bg-dark-card border border-dark-border rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={sending || !input.trim() || !!pendingConfirm}
            className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-bold px-5 rounded-xl transition-all flex items-center gap-2"
          >
            <Send size={18} className="text-current" />
            {sending ? 'جارٍ الإرسال...' : 'إرسال'}
          </button>
        </div>
      </main>

      {pendingConfirm && finalConfirmOpen && pendingConfirm.confirmValue !== undefined && (
        <AssistantFinalConfirmModal
          humanSummary={pendingConfirm.humanSummary}
          confirmValue={pendingConfirm.confirmValue}
          onConfirm={(typed) => doConfirm(typed)}
          onCancel={handleCancel}
          confirming={confirming}
          error={finalConfirmError}
        />
      )}
    </div>
  );
}
