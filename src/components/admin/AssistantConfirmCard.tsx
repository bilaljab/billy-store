import { AlertTriangle, Image as ImageIcon } from 'lucide-react';

interface AssistantConfirmCardProps {
  humanSummary: string;
  riskTier: 'single-confirm' | 'double-confirm';
  onPrimary: () => void;
  onCancel: () => void;
  confirming: boolean;
  showImageControls?: boolean;
  imageUrl?: string | null;
  onImageUpload?: (file: File) => void;
  uploadingImage?: boolean;
}

export default function AssistantConfirmCard({
  humanSummary,
  riskTier,
  onPrimary,
  onCancel,
  confirming,
  showImageControls,
  imageUrl,
  onImageUpload,
  uploadingImage,
}: AssistantConfirmCardProps) {
  const isDouble = riskTier === 'double-confirm';

  return (
    <div className={`rounded-2xl p-5 border ${isDouble ? 'bg-dark-card border-red-500/40' : 'bg-dark-card border-dark-border'}`}>
      {isDouble && (
        <div className="flex items-center gap-2 text-red-400 font-bold text-sm mb-2">
          <AlertTriangle size={18} className="text-current flex-shrink-0" />
          عملية واسعة النطاق — تحقق جيداً
        </div>
      )}
      <p className="text-slate-200 leading-relaxed whitespace-pre-line mb-4">{humanSummary}</p>

      {showImageControls && (
        <div className="flex items-center gap-3 mb-4 bg-dark border border-dark-border rounded-xl p-3">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="معاينة صورة المنتج" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-dark-card border border-dark-border flex items-center justify-center flex-shrink-0">
              <ImageIcon size={22} className="text-muted" />
            </div>
          )}
          <label className="flex-1 bg-dark-card hover:bg-dark-border border border-dark-border text-slate-300 font-semibold py-2.5 px-3 rounded-lg transition-all text-sm text-center cursor-pointer">
            {uploadingImage ? 'جارٍ الرفع...' : imageUrl ? 'استبدال الصورة' : 'إرفاق صورة'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              disabled={uploadingImage || confirming}
              onChange={e => {
                const file = e.target.files?.[0];
                if (file && onImageUpload) onImageUpload(file);
                e.target.value = '';
              }}
            />
          </label>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onPrimary}
          disabled={confirming}
          className={`flex-1 font-black py-3 rounded-xl transition-all disabled:opacity-50 ${
            isDouble ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-primary hover:bg-primary-dark text-white'
          }`}
        >
          {confirming ? 'جارٍ التنفيذ...' : isDouble ? 'متابعة للتأكيد النهائي' : 'تأكيد'}
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
  );
}
