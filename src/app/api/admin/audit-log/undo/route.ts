import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb, col } from '@/lib/db';
import { isAuthenticated } from '@/lib/auth';

interface PricePoint { id: number; oldPrice: number }

// GET ?tool=bulkUpdatePrices|importProducts — preview data for the dashboard's undo buttons.
// Only bulkUpdatePrices returns `items` (name + live current price vs. recorded old price),
// per the explicit decision that this specific undo needs a visual review dialog before
// executing; importProducts stays a single direct click and only needs the auditLogId.
export async function GET(req: NextRequest) {
  if (!await isAuthenticated(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tool = req.nextUrl.searchParams.get('tool');
  if (tool !== 'bulkUpdatePrices' && tool !== 'importProducts') {
    return NextResponse.json({ error: 'أداة غير صالحة' }, { status: 400 });
  }

  await initDb();
  const db = getDb();
  const latest = await db.execute({
    sql: "SELECT * FROM audit_log WHERE tool = ? AND status = 'success' AND undone_at IS NULL ORDER BY created_at DESC LIMIT 1",
    args: [tool],
  });
  const row = latest.rows[0];
  if (!row) return NextResponse.json({ auditLogId: null, items: [] });

  const auditLogId = Number(col(row, 'id'));

  if (tool === 'bulkUpdatePrices') {
    const snapshot = JSON.parse(String(col(row, 'undo_data') ?? '[]')) as PricePoint[];
    const ids = snapshot.map(s => s.id);
    if (ids.length === 0) return NextResponse.json({ auditLogId, items: [] });
    const placeholders = ids.map(() => '?').join(',');
    const current = await db.execute({
      sql: `SELECT id, name, price FROM products WHERE id IN (${placeholders})`,
      args: ids,
    });
    const currentById = new Map(current.rows.map(r => [Number(col(r, 'id')), r]));
    const items = snapshot.map(s => {
      const r = currentById.get(s.id);
      return {
        id: s.id,
        name: r ? String(col(r, 'name')) : `#${s.id}`,
        currentPrice: r ? Number(col(r, 'price')) : null,
        oldPrice: s.oldPrice,
      };
    });
    return NextResponse.json({ auditLogId, items });
  }

  return NextResponse.json({ auditLogId, items: [] });
}

export async function POST(req: NextRequest) {
  if (!await isAuthenticated(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const auditLogId = Number(body.auditLogId);
  if (!Number.isInteger(auditLogId) || auditLogId <= 0) {
    return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });
  }

  await initDb();
  const db = getDb();
  const result = await db.execute({ sql: 'SELECT * FROM audit_log WHERE id = ?', args: [auditLogId] });
  const row = result.rows[0];
  if (!row) return NextResponse.json({ error: 'السجل غير موجود' }, { status: 404 });
  if (col(row, 'undone_at')) return NextResponse.json({ error: 'تم التراجع عن هذه العملية مسبقاً' }, { status: 400 });

  const tool = String(col(row, 'tool'));
  const undoData = JSON.parse(String(col(row, 'undo_data') ?? 'null'));

  if (tool === 'bulkUpdatePrices' && Array.isArray(undoData)) {
    for (const point of undoData as PricePoint[]) {
      await db.execute({
        sql: 'UPDATE products SET price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        args: [point.oldPrice, point.id],
      });
    }
  } else if (tool === 'bulkDeleteProducts' && Array.isArray(undoData?.ids)) {
    for (const id of undoData.ids as number[]) {
      await db.execute({ sql: 'UPDATE products SET deleted_at = NULL WHERE id = ?', args: [id] });
    }
  } else if (tool === 'importProducts' && Array.isArray(undoData?.newIds)) {
    for (const id of undoData.newIds as number[]) {
      await db.execute({ sql: 'UPDATE products SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?', args: [id] });
    }
  } else {
    return NextResponse.json({ error: 'لا توجد بيانات تراجع صالحة لهذه العملية' }, { status: 400 });
  }

  await db.execute({ sql: 'UPDATE audit_log SET undone_at = CURRENT_TIMESTAMP WHERE id = ?', args: [auditLogId] });

  return NextResponse.json({ success: true });
}
