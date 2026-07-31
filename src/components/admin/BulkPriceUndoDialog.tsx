interface BulkPriceUndoItem {
  id: number;
  name: string;
  currentPrice: number | null;
  oldPrice: number;
}

interface BulkPriceUndoDialogProps {
  items: BulkPriceUndoItem[];
  onConfirm: () => void;
  onCancel: () => void;
  confirming: boolean;
}

export default function BulkPriceUndoDialog({ items, onConfirm, onCancel, confirming }: BulkPriceUndoDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="relative bg-dark-card border border-dark-border rounded-3xl p-8 w-full max-w-lg max-h-[80vh] flex flex-col">
        <h3 className="text-xl font-black text-white mb-2">تراجع عن آخر تعديل جماعي للأسعار</h3>
        <p className="text-slate-400 text-sm mb-4">
          سترجع أسعار {items.length} منتج للقيم التالية. راجع القائمة جيداً — أي منتج تغيّر سعره يدوياً بعد التعديل الجماعي سيظهر هنا بسعره الحالي الفعلي.
        </p>

        <div className="flex-1 overflow-y-auto -mx-2 px-2 mb-5">
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="bg-dark border border-dark-border rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                <span className="text-slate-200 text-sm font-semibold truncate">{item.name}</span>
                <span className="text-sm whitespace-nowrap flex items-center gap-1.5">
                  <span className="text-slate-400">{item.currentPrice ?? '—'}</span>
                  <span className="text-muted">←</span>
                  <span className="text-accent font-bold">{item.oldPrice}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={confirming}
            className="flex-1 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-black py-3 rounded-xl transition-all"
          >
            {confirming ? 'جارٍ التراجع...' : 'تراجع'}
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
