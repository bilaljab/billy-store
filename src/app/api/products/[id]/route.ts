import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb, serializeProduct } from '@/lib/db';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await initDb();
  const db = getDb();
  const result = await db.execute({ sql: 'SELECT * FROM products WHERE id = ? AND deleted_at IS NULL', args: [id] });
  if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(serializeProduct(result.rows[0]));
}
