import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { isAuthenticated } from '@/lib/auth';

export async function GET(req: NextRequest) {
  await initDb();
  const db = getDb();
  // Ensure settings table exists
  await db.execute(`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`);
  const result = await db.execute({ sql: "SELECT value FROM settings WHERE key = 'discount'", args: [] });
  const discount = result.rows[0] ? JSON.parse(String(result.rows[0].value)) : null;
  return NextResponse.json(discount);
}

export async function POST(req: NextRequest) {
  if (!isAuthenticated(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await initDb();
  const db = getDb();
  await db.execute(`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`);
  const body = await req.json();
  const { percentage, label, active } = body;
  const value = JSON.stringify({ percentage: Number(percentage), label: String(label || ''), active: Boolean(active) });
  await db.execute({
    sql: "INSERT INTO settings (key, value) VALUES ('discount', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    args: [value],
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  if (!isAuthenticated(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await initDb();
  const db = getDb();
  await db.execute({ sql: "DELETE FROM settings WHERE key = 'discount'", args: [] });
  return NextResponse.json({ success: true });
}
