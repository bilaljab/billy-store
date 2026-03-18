import { NextResponse } from 'next/server';
import { getDb, initDb, col } from '@/lib/db';

export async function GET() {
  try {
    await initDb();
    const db = getDb();

    const [globalResult, targetedResult] = await Promise.all([
      db.execute({ sql: "SELECT value FROM settings WHERE key = 'discount'", args: [] }),
      db.execute({ sql: "SELECT value FROM settings WHERE key = 'targeted_discounts'", args: [] }),
    ]);

    const global = globalResult.rows[0]
      ? JSON.parse(String(col(globalResult.rows[0], 'value')))
      : null;

    const targeted = targetedResult.rows[0]
      ? JSON.parse(String(col(targetedResult.rows[0], 'value')))
      : [];

    const res = NextResponse.json({
      global: global?.active ? global : null,
      targeted: targeted.filter((r: { active: boolean }) => r.active),
    });
    res.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=120');
    return res;
  } catch {
    return NextResponse.json({ global: null, targeted: [] });
  }
}
