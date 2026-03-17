import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { isAuthenticated } from '@/lib/auth';

export async function GET(req: NextRequest) {
  await initDb();
  const db = getDb();
  await db.execute(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`);
  const result = await db.execute({ sql: "SELECT value FROM settings WHERE key = 'announcement'", args: [] });
  return NextResponse.json(result.rows[0] ? JSON.parse(String(result.rows[0].value)) : null);
}

export async function POST(req: NextRequest) {
  if (!await isAuthenticated(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await initDb();
  const db = getDb();
  await db.execute(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`);
  const body = await req.json();
  const text = String(body.text || '').trim().slice(0, 200); // Max 200 chars
  if (!text) return NextResponse.json({ error: 'النص مطلوب' }, { status: 400 });
  const value = JSON.stringify({ text, active: Boolean(body.active) });
  await db.execute({ sql: "INSERT INTO settings (key, value) VALUES ('announcement', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", args: [value] });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  if (!await isAuthenticated(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await initDb();
  const db = getDb();
  await db.execute({ sql: "DELETE FROM settings WHERE key = 'announcement'", args: [] });
  return NextResponse.json({ success: true });
}
