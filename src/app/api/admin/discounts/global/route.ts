import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb, col } from '@/lib/db';
import { isAuthenticated } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!await isAuthenticated(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await initDb();
  const db = getDb();
  const result = await db.execute({ sql: "SELECT value FROM settings WHERE key = 'discount'", args: [] });
  if (!result.rows[0]) return NextResponse.json(null);
  return NextResponse.json(JSON.parse(String(col(result.rows[0], 'value'))));
}

export async function POST(req: NextRequest) {
  if (!await isAuthenticated(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await initDb();
  const db = getDb();
  const body = await req.json();
  const percentage = Number(body.percentage);
  if (!Number.isFinite(percentage)) return NextResponse.json({ error: 'نسبة الخصم غير صالحة' }, { status: 400 });
  const clamped = Math.min(90, Math.max(1, percentage));
  const value = JSON.stringify({ percentage: clamped, label: String(body.label || ''), active: Boolean(body.active) });
  await db.execute({ sql: "INSERT INTO settings (key, value) VALUES ('discount', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", args: [value] });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  if (!await isAuthenticated(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await initDb();
  const db = getDb();
  await db.execute({ sql: "DELETE FROM settings WHERE key = 'discount'", args: [] });
  return NextResponse.json({ success: true });
}
