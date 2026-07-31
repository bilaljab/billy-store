import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb, serializeProduct } from '@/lib/db';

export async function GET(req: NextRequest) {
  await initDb();
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const featured = searchParams.get('featured');

  let sql = 'SELECT * FROM products WHERE deleted_at IS NULL';
  const args: (string | number)[] = [];

  if (category && category !== 'all') { sql += ' AND category = ?'; args.push(category); }
  if (featured === '1') { sql += ' AND featured = 1'; }
  sql += ' ORDER BY RANDOM()';

  const result = await db.execute({ sql, args });
  const res = NextResponse.json(result.rows.map(serializeProduct));
  res.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=120');
  return res;
}
