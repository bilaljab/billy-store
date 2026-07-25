import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb, col } from '@/lib/db';
import { isAuthenticated } from '@/lib/auth';

// Targeted discounts: per-product or price-range based
// Stored as JSON array in settings table under key 'targeted_discounts'

interface RuleInput {
  type: string;
  label: string;
  percentage: number;
  active: boolean;
  productIds: number[];
  minPrice: number | null;
  maxPrice: number | null;
}

function validateRuleInput(body: Record<string, unknown>): { valid: true; rule: RuleInput } | { valid: false; error: string } {
  if (body.type !== 'product' && body.type !== 'range') {
    return { valid: false, error: 'نوع القاعدة غير صالح' };
  }
  const percentage = Math.min(90, Math.max(1, Number(body.percentage)));
  const minPrice = body.minPrice !== undefined && body.minPrice !== null ? Number(body.minPrice) : null;
  const maxPrice = body.maxPrice !== undefined && body.maxPrice !== null ? Number(body.maxPrice) : null;
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    return { valid: false, error: 'السعر الأدنى يجب أن يكون أقل من أو يساوي السعر الأعلى' };
  }
  const rule: RuleInput = {
    type: body.type as string,
    label: String(body.label || '').slice(0, 100),
    percentage,
    active: Boolean(body.active),
    productIds: Array.isArray(body.productIds) ? (body.productIds as unknown[]).map(Number).filter((n) => n > 0) : [],
    minPrice,
    maxPrice,
  };
  return { valid: true, rule };
}

export async function GET(req: NextRequest) {
  if (!await isAuthenticated(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    await initDb();
    const db = getDb();
    const result = await db.execute({ sql: "SELECT value FROM settings WHERE key = 'targeted_discounts'", args: [] });
    if (!result.rows[0]) return NextResponse.json([]);
    return NextResponse.json(JSON.parse(String(col(result.rows[0], 'value'))));
  } catch {
    return NextResponse.json({ error: 'فشل جلب قواعد الخصم' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!await isAuthenticated(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
  }

  const result = validateRuleInput(body);
  if (!result.valid) return NextResponse.json({ error: result.error }, { status: 400 });
  const rule = { id: Date.now(), ...result.rule };

  try {
    await initDb();
    const db = getDb();
    const existing = await db.execute({ sql: "SELECT value FROM settings WHERE key = 'targeted_discounts'", args: [] });
    const rules = existing.rows[0] ? JSON.parse(String(col(existing.rows[0], 'value'))) : [];
    rules.push(rule);

    await db.execute({
      sql: "INSERT INTO settings (key, value) VALUES ('targeted_discounts', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      args: [JSON.stringify(rules)],
    });
    return NextResponse.json({ success: true, rule });
  } catch {
    return NextResponse.json({ error: 'فشل حفظ القاعدة' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!await isAuthenticated(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
  }

  const result = validateRuleInput(body);
  if (!result.valid) return NextResponse.json({ error: result.error }, { status: 400 });

  try {
    await initDb();
    const db = getDb();
    const existing = await db.execute({ sql: "SELECT value FROM settings WHERE key = 'targeted_discounts'", args: [] });
    let rules = existing.rows[0] ? JSON.parse(String(col(existing.rows[0], 'value'))) : [];

    // Update specific rule by id
    rules = rules.map((r: { id: number }) => r.id === body.id ? { id: r.id, ...result.rule } : r);

    await db.execute({
      sql: "INSERT INTO settings (key, value) VALUES ('targeted_discounts', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      args: [JSON.stringify(rules)],
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'فشل تعديل القاعدة' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!await isAuthenticated(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let id;
  try {
    ({ id } = await req.json());
  } catch {
    return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
  }

  try {
    await initDb();
    const db = getDb();
    const existing = await db.execute({ sql: "SELECT value FROM settings WHERE key = 'targeted_discounts'", args: [] });
    let rules = existing.rows[0] ? JSON.parse(String(col(existing.rows[0], 'value'))) : [];
    rules = rules.filter((r: { id: number }) => r.id !== id);

    await db.execute({
      sql: "INSERT INTO settings (key, value) VALUES ('targeted_discounts', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      args: [JSON.stringify(rules)],
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'فشل حذف القاعدة' }, { status: 500 });
  }
}
