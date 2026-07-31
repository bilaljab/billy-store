'use client';
import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface AssistantFinalConfirmModalProps {
  humanSummary: string;
  confirmValue: number;
  onConfirm: (typed: string) => void;
  onCancel: () => void;
  confirming: boolean;
  error?: string;
}

export default function AssistantFinalConfirmModal({
  humanSummary,
  confirmValue,
  onConfirm,
  onCancel,
  confirming,
  error,
}: AssistantFinalConfirmModalProps) {
  const [typed, setTyped] = useState('');
  const matches = typed.trim() === String(confirmValue);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="relative bg-dark-card border border-red-500/40 rounded-3xl p-8 w-full max-w-md">
        <div className="flex items-center gap-2 text-red-400 mb-2">
          <AlertTriangle size={22} className="text-current flex-shrink-0" />
          <h3 className="text-xl font-black">تأكيد نهائي — عملية لا يمكن التراجع عنها فوراً</h3>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed mb-5 whitespace-pre-line">{humanSummary}</p>

        <label htmlFor="assistant-final-confirm-input" className="block text-slate-400 text-sm mb-2">
          اكتب الرقم <span className="font-black text-white">{confirmValue}</span> لتأكيد التنفيذ
        </label>
        <input
          id="assistant-final-confirm-input"
          type="text"
          value={typed}
          onChange={e => setTyped(e.target.value)}
          className="w-full bg-dark border border-dark-border rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-primary transition-colors mb-4"
          autoFocus
        />

        {error && (
          <p className="text-red-400 text-sm mb-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => onConfirm(typed.trim())}
            disabled={!matches || confirming}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white font-black py-3 rounded-xl transition-all"
          >
            {confirming ? 'جارٍ التنفيذ...' : 'نعم، نفّذ الآن'}
          </button>
          <button
            onClick={onCancel}
            disabled={confirming}
            className="bg-dark border border-dark-border text-slate-400 font-semibold py-3 px-5 rounded-xl transition-all hover:border-slate-500 disabled:opacity-50"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
