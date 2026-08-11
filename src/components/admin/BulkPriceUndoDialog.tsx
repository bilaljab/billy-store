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
      <div className="relative bg-surface border-2 border-black/15 rounded-3xl p-8 w-full max-w-lg max-h-[80vh] flex flex-col shadow-float">
        <h3 className="text-xl font-black text-ink mb-2">تراجع عن آخر تعديل جماعي للأسعار</h3>
        <p className="text-muted text-sm mb-4">
          سترجع أسعار {items.length} منتج للقيم التالية. راجع القائمة جيداً — أي منتج تغيّر سعره يدوياً بعد التعديل الجماعي سيظهر هنا بسعره الحالي الفعلي.
        </p>

        <div className="flex-1 overflow-y-auto -mx-2 px-2 mb-5">
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="bg-canvas-a border border-chip rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                <span className="text-ink text-sm font-semibold truncate">{item.name}</span>
                <span className="text-sm whitespace-nowrap flex items-center gap-1.5">
                  <span className="text-muted">{item.currentPrice ?? '—'}</span>
                  <span className="text-muted">←</span>
                  <span className="text-brand font-bold">{item.oldPrice}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={confirming}
            className="flex-1 min-h-11 bg-brand hover:bg-brand-ink disabled:opacity-50 text-white font-black py-3 rounded-xl transition-all"
          >
            {confirming ? 'جارٍ التراجع...' : 'تراجع'}
          </button>
          <button
            onClick={onCancel}
            disabled={confirming}
            className="min-h-11 bg-surface border-2 border-black/15 text-muted font-semibold py-3 px-5 rounded-xl transition-all hover:border-brand/50 hover:text-ink disabled:opacity-50"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
