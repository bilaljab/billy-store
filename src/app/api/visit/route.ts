import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    // Don't count admin visits
    const referer = req.headers.get('referer') || '';
    if (referer.includes('/admin')) return NextResponse.json({ success: false });

    await initDb();
    const db = getDb();
    await db.execute('INSERT INTO site_visits (visited_at) VALUES (CURRENT_TIMESTAMP)');
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false });
  }
}
