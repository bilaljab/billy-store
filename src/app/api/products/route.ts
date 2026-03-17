import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  await initDb();
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const featured = searchParams.get('featured');

  let sql = 'SELECT * FROM products WHERE 1=1';
  const args: (string | number)[] = [];

  if (category && category !== 'all') {
    sql += ' AND category = ?';
    args.push(category);
  }
  if (featured === '1') {
    sql += ' AND featured = 1';
  }
  sql += ' ORDER BY created_at DESC';

  const result = await db.execute({ sql, args });
  const rows = result.rows.map(r => ({
    id: Number(r.id),
    name: String(r.name ?? ''),
    description: String(r.description ?? ''),
    price: Number(r.price),
    image: r.image ? String(r.image) : null,
    category: String(r.category ?? 'games'),
    featured: Number(r.featured ?? 0),
  }));
  return NextResponse.json(rows);
}
