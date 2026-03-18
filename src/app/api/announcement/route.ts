import { NextResponse } from 'next/server';
import { getDb, initDb, col } from '@/lib/db';

export async function GET() {
  try {
    await initDb();
    const db = getDb();
    const result = await db.execute({ sql: "SELECT value FROM settings WHERE key = 'announcement'", args: [] });
    if (!result.rows[0]) return NextResponse.json(null);
    const data = JSON.parse(String(col(result.rows[0], 'value')));
    const res = NextResponse.json(data);
    res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res;
  } catch { return NextResponse.json(null); }
}
