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

  // Delete all in ONE query instead of N separate requests
  const placeholders = ids.map(() => '?').join(',');
  await db.execute({
    sql: `DELETE FROM products WHERE id IN (${placeholders})`,
    args: ids,
  });

  return NextResponse.json({ success: true, deleted: ids.length });
}
