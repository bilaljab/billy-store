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
    <div className="bg-gradient-to-l from-primary to-accent text-white text-sm font-bold py-2 px-4 text-center relative z-[60]">
      <span>{announcement.text}</span>
      <button
        onClick={() => setDismissed(true)}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
}
