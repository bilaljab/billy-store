import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ success: false }, { status: 400 });
    const id = parseInt(body.productId, 10);
    if (!Number.isInteger(id) || id <= 0 || id > 999999) {
      return NextResponse.json({ success: false }, { status: 400 });
    }
    await initDb();
    const db = getDb();
    const exists = await db.execute({ sql: 'SELECT id FROM products WHERE id = ?', args: [id] });
    if (exists.rows.length === 0) return NextResponse.json({ success: false }, { status: 404 });
    await db.execute({
      sql: 'INSERT INTO product_views (product_id, views) VALUES (?, 1) ON CONFLICT(product_id) DO UPDATE SET views = views + 1',
      args: [id],
    });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ success: false }); }
}
