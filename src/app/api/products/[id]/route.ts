import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  await initDb();
  const db = getDb();
  const result = await db.execute({ sql: 'SELECT * FROM products WHERE id = ?', args: [params.id] });
  if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(result.rows[0]);
}
