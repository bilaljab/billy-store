import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const referer = req.headers.get('referer') || '';
    if (referer.includes('/admin')) return NextResponse.json({ success: false });

    await initDb();
    const db = getDb();

    // Get visitor IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
      || req.headers.get('x-real-ip')
      || 'unknown';

    // Check if this IP visited in the last 30 minutes
    const recent = await db.execute({
      sql: `SELECT id FROM site_visits 
            WHERE ip = ? 
            AND visited_at > datetime('now', '-30 minutes')
            LIMIT 1`,
      args: [ip],
    });

    // Already visited recently - don't count
    if (recent.rows.length > 0) {
      return NextResponse.json({ success: false, reason: 'recent' });
    }

    // New visit - record it
    await db.execute({
      sql: 'INSERT INTO site_visits (ip, visited_at) VALUES (?, CURRENT_TIMESTAMP)',
      args: [ip],
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false });
  }
}
