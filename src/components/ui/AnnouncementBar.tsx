'use client';
import { useState } from 'react';
import { X } from 'lucide-react';

export default function AnnouncementBar({ initialAnnouncement }: { initialAnnouncement: { text: string; active: boolean } | null }) {
  const [dismissed, setDismissed] = useState(false);

  if (!initialAnnouncement?.active || dismissed) return null;

  return (
    <div id="announcement-bar" className="relative z-60 bg-brand px-12 py-2 text-center text-sm font-bold text-white">
      <span>{initialAnnouncement.text}</span>
      <button
        onClick={() => setDismissed(true)}
        aria-label="إغلاق الإعلان"
        className="absolute inset-e-0 top-1/2 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center text-white/80 transition-colors hover:text-white"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
