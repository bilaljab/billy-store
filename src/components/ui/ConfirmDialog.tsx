interface ConfirmDialogProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ title, message, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="relative bg-dark-card border border-dark-border rounded-3xl p-8 w-full max-w-sm">
        <h3 className="text-xl font-black text-white mb-2">{title}</h3>
        <p className="text-slate-400 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onConfirm}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-black py-3 rounded-xl transition-all">
            تأكيد الحذف
          </button>
          <button onClick={onCancel}
            className="bg-dark border border-dark-border text-slate-400 font-semibold py-3 px-5 rounded-xl transition-all hover:border-slate-500">
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
