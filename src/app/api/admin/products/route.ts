import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb, serializeProduct } from '@/lib/db';
import { isAuthenticated } from '@/lib/auth';

function isValidImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const s = String(url).trim();
  if (s.startsWith('/uploads/') || s.startsWith('https://')) return s;
  return null;
}

export async function GET(req: NextRequest) {
  if (!await isAuthenticated(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await initDb();
  const db = getDb();
  const result = await db.execute('SELECT * FROM products WHERE deleted_at IS NULL ORDER BY created_at DESC');
  return NextResponse.json(result.rows.map(serializeProduct));
}

export async function POST(req: NextRequest) {
  if (!await isAuthenticated(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await initDb();
  const body = await req.json();
  const { name, description, price, image, category, featured, release_date } = body;
  if (!name || !price) return NextResponse.json({ error: 'الاسم والسعر مطلوبان' }, { status: 400 });
  if (typeof name !== 'string' || name.trim().length > 200) return NextResponse.json({ error: 'اسم غير صالح' }, { status: 400 });
  if (typeof price !== 'number' || price <= 0 || price > 99999) return NextResponse.json({ error: 'سعر غير صالح' }, { status: 400 });
  const safeReleaseDate = release_date ? String(release_date).slice(0, 10) : null;
  const db = getDb();
  const result = await db.execute({
    sql: 'INSERT INTO products (name, description, price, image, category, featured, release_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [name.trim().slice(0, 200), String(description || '').trim().slice(0, 2000), price, isValidImageUrl(image), category || 'games', featured ? 1 : 0, safeReleaseDate],
  });
  const newProduct = await db.execute({ sql: 'SELECT * FROM products WHERE id = ?', args: [result.lastInsertRowid!] });
  return NextResponse.json(serializeProduct(newProduct.rows[0]), { status: 201 });
}
