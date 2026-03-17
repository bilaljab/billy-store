import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export async function GET() {
  try {
    await initDb();
    const db = getDb();
    await db.execute(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`);
    const result = await db.execute({ sql: "SELECT value FROM settings WHERE key = 'discount'", args: [] });
    if (!result.rows[0]) return NextResponse.json(null);
    const discount = JSON.parse(String(result.rows[0].value));
    if (!discount.active) return NextResponse.json(null);
    return NextResponse.json(discount);
  } catch {
    return NextResponse.json(null);
  }
}
