import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb, col } from '@/lib/db';
import { isAuthenticated } from '@/lib/auth';

// Targeted discounts: per-product or price-range based
// Stored as JSON array in settings table under key 'targeted_discounts'

export async function GET(req: NextRequest) {
  await initDb();
  const db = getDb();
  const result = await db.execute({ sql: "SELECT value FROM settings WHERE key = 'targeted_discounts'", args: [] });
  if (!result.rows[0]) return NextResponse.json([]);
  return NextResponse.json(JSON.parse(String(col(result.rows[0], 'value'))));
}

export async function POST(req: NextRequest) {
  if (!await isAuthenticated(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await initDb();
  const db = getDb();
  const body = await req.json();

  // Validate rule
  const rule = {
    id: Date.now(),
    type: body.type, // 'product' | 'range'
    label: String(body.label || '').slice(0, 100),
    percentage: Math.min(90, Math.max(1, Number(body.percentage))),
    active: Boolean(body.active),
    // For type='product'
    productIds: Array.isArray(body.productIds) ? body.productIds.map(Number).filter(n => n > 0) : [],
    // For type='range'
    minPrice: body.minPrice !== undefined ? Number(body.minPrice) : null,
    maxPrice: body.maxPrice !== undefined ? Number(body.maxPrice) : null,
  };

  // Get existing rules
  const existing = await db.execute({ sql: "SELECT value FROM settings WHERE key = 'targeted_discounts'", args: [] });
  const rules = existing.rows[0] ? JSON.parse(String(col(existing.rows[0], 'value'))) : [];
  rules.push(rule);

  await db.execute({
    sql: "INSERT INTO settings (key, value) VALUES ('targeted_discounts', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    args: [JSON.stringify(rules)],
  });
  return NextResponse.json({ success: true, rule });
}

export async function PUT(req: NextRequest) {
  if (!await isAuthenticated(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await initDb();
  const db = getDb();
  const body = await req.json();

  const existing = await db.execute({ sql: "SELECT value FROM settings WHERE key = 'targeted_discounts'", args: [] });
  let rules = existing.rows[0] ? JSON.parse(String(col(existing.rows[0], 'value'))) : [];

  // Update specific rule by id
  rules = rules.map((r: { id: number }) => r.id === body.id ? { ...r, ...body } : r);

  await db.execute({
    sql: "INSERT INTO settings (key, value) VALUES ('targeted_discounts', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    args: [JSON.stringify(rules)],
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  if (!await isAuthenticated(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await initDb();
  const db = getDb();
  const { id } = await req.json();

  const existing = await db.execute({ sql: "SELECT value FROM settings WHERE key = 'targeted_discounts'", args: [] });
  let rules = existing.rows[0] ? JSON.parse(String(col(existing.rows[0], 'value'))) : [];
  rules = rules.filter((r: { id: number }) => r.id !== id);

  await db.execute({
    sql: "INSERT INTO settings (key, value) VALUES ('targeted_discounts', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    args: [JSON.stringify(rules)],
  });
  return NextResponse.json({ success: true });
}
