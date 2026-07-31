import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { isAuthenticated } from '@/lib/auth';

export async function POST(req: NextRequest) {
  if (!await isAuthenticated(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { ids } = body as { ids: number[] };

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'لا توجد منتجات للحذف' }, { status: 400 });
  }

  if (!ids.every(id => Number.isInteger(id) && id > 0)) {
    return NextResponse.json({ error: 'معرفات غير صالحة' }, { status: 400 });
  }

  await initDb();
  const db = getDb();

  // Soft delete: mark deleted_at instead of removing the row, so this is recoverable for
  // 7 days from the trash section — applies regardless of caller (this route, not a
  // separate assistant-only path), so the manual dashboard button gets recovery too.
  const placeholders = ids.map(() => '?').join(',');
  const result = await db.execute({
    sql: `UPDATE products SET deleted_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders}) AND deleted_at IS NULL`,
    args: ids,
  });
  const deleted = Number(result.rowsAffected ?? 0);

  await db.execute({
    sql: 'INSERT INTO audit_log (tool, input, status, result, undo_data) VALUES (?, ?, ?, ?, ?)',
    args: [
      'bulkDeleteProducts',
      JSON.stringify({ ids }),
      'success',
      JSON.stringify({ deleted }),
      JSON.stringify({ ids }),
    ],
  });

  return NextResponse.json({ success: true, deleted });
}
