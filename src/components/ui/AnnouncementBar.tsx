'use client';
import { useState, useEffect } from 'react';

export default function AnnouncementBar() {
  const [announcement, setAnnouncement] = useState<{ text: string; active: boolean } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch('/api/announcement')
      .then(r => r.json())
      .then(d => { if (d && d.active) setAnnouncement(d); })
      .catch(() => {});
  }, []);

  if (!announcement || dismissed) return null;

  return (
    <div id="announcement-bar" className="bg-gradient-to-l from-brand to-brand-ink text-white text-sm font-bold py-2 px-4 text-center relative z-[60]">
      <span>{announcement.text}</span>
      <button
        onClick={() => setDismissed(true)}
        aria-label="إغلاق الإعلان"
        className="absolute left-1 top-1/2 -translate-y-1/2 min-w-11 min-h-11 flex items-center justify-center text-white/70 hover:text-white transition-colors text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
}
