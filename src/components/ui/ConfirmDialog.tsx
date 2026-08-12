'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ title, message, onConfirm, onCancel }: ConfirmDialogProps) {
  const [closing, setClosing] = useState<'confirm' | 'cancel' | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const reduceMotion = useReducedMotion();
  const isOpen = closing === null;

  // Capture the trigger element on open, restore focus to it on unmount
  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    cancelRef.current?.focus();
    return () => previousFocusRef.current?.focus();
  }, []);

  const startClose = (which: 'confirm' | 'cancel') => setClosing(which);

  // Escape cancels; Tab traps focus between the two buttons (only two exist, so
  // alternating on every Tab press — regardless of direction — is a correct ring)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        startClose('cancel');
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const target = document.activeElement === cancelRef.current ? confirmRef : cancelRef;
        target.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePanelAnimationComplete = () => {
    if (closing === 'confirm') onConfirm();
    else if (closing === 'cancel') onCancel();
  };

  const panelInitial = reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 8 };
  const panelAnimate = reduceMotion
    ? { opacity: isOpen ? 1 : 0 }
    : { opacity: isOpen ? 1 : 0, scale: isOpen ? 1 : 0.95, y: isOpen ? 0 : 8 };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 modal-scrim bg-black/70 backdrop-blur-sm"
        onClick={() => startClose('cancel')}
        initial={{ opacity: 0 }}
        animate={{ opacity: isOpen ? 1 : 0 }}
        transition={{ duration: reduceMotion ? 0.15 : 0.35, ease: 'easeOut' }}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        className="relative bg-surface border-2 border-black/15 rounded-3xl p-8 w-full max-w-sm"
        initial={panelInitial}
        animate={panelAnimate}
        transition={reduceMotion ? { duration: 0.15, ease: 'easeOut' } : { type: 'spring', bounce: 0, duration: 0.35 }}
        onAnimationComplete={() => { if (!isOpen) handlePanelAnimationComplete(); }}
      >
        <h3 id="confirm-dialog-title" className="text-xl font-black text-ink mb-2">{title}</h3>
        <p id="confirm-dialog-message" className="text-muted text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button ref={confirmRef} onClick={() => startClose('confirm')}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-black py-3 rounded-xl transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:ring-offset-2">
            تأكيد الحذف
          </button>
          <button ref={cancelRef} onClick={() => startClose('cancel')}
            className="bg-surface border-2 border-black/15 text-muted font-semibold py-3 px-5 rounded-xl transition-all hover:border-brand/50 hover:text-ink active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2">
            إلغاء
          </button>
        </div>
      </motion.div>
    </div>
  );
}
