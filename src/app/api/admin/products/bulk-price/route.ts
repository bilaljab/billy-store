import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { isAuthenticated } from '@/lib/auth';

export async function POST(req: NextRequest) {
  if (!await isAuthenticated(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { mode, value, direction, category } = body;

  if (!['percentage', 'fixed'].includes(mode)) return NextResponse.json({ error: 'نوع غير صالح' }, { status: 400 });
  if (!['increase', 'decrease'].includes(direction)) return NextResponse.json({ error: 'اتجاه غير صالح' }, { status: 400 });
  if (!value || isNaN(Number(value)) || Number(value) <= 0 || Number(value) > 99999) {
    return NextResponse.json({ error: 'قيمة غير صالحة' }, { status: 400 });
  }

  await initDb();
  const db = getDb();

  const sql = category === 'all'
    ? 'SELECT id, price FROM products WHERE deleted_at IS NULL'
    : 'SELECT id, price FROM products WHERE category = ? AND deleted_at IS NULL';
  const args = category === 'all' ? [] : [category];
  const result = await db.execute({ sql, args });

  // Snapshot old prices before touching anything, so this batch can be undone later
  // regardless of who triggered it (manual dashboard button or the AI assistant).
  const snapshot: { id: number; oldPrice: number }[] = [];

  let updated = 0;
  for (const row of result.rows) {
    const r = row as Record<string, unknown>;
    const oldPrice = Number(r.price);
    let newPrice: number;

    if (mode === 'percentage') {
      const change = oldPrice * (Number(value) / 100);
      newPrice = direction === 'increase' ? oldPrice + change : oldPrice - change;
    } else {
      newPrice = direction === 'increase' ? oldPrice + Number(value) : oldPrice - Number(value);
    }

    newPrice = Math.max(1, Math.round(newPrice));

    await db.execute({
      sql: 'UPDATE products SET price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [newPrice, Number(r.id)],
    });
    snapshot.push({ id: Number(r.id), oldPrice });
    updated++;
  }

  await db.execute({
    sql: 'INSERT INTO audit_log (tool, input, status, result, undo_data) VALUES (?, ?, ?, ?, ?)',
    args: [
      'bulkUpdatePrices',
      JSON.stringify({ mode, value, direction, category }),
      'success',
      JSON.stringify({ updated }),
      JSON.stringify(snapshot),
    ],
  });

  return NextResponse.json({ success: true, updated });
}
