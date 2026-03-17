import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { isAuthenticated } from '@/lib/auth';

function isValidImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const s = String(url).trim();
  if (!s) return null;
  // Allow relative /uploads/ paths or https:// URLs only - block javascript: data: etc
  if (s.startsWith('/uploads/') || s.startsWith('https://')) return s;
  return null; // reject anything else
}

export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await initDb();
  const db = getDb();
  const result = await db.execute('SELECT * FROM products ORDER BY created_at DESC');
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

export async function POST(req: NextRequest) {
  if (!isAuthenticated(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await initDb();
  const body = await req.json();
  const { name, description, price, image, category, featured } = body;
  if (!name || !price) return NextResponse.json({ error: 'الاسم والسعر مطلوبان' }, { status: 400 });
  if (typeof name !== 'string' || name.trim().length > 200) return NextResponse.json({ error: 'اسم غير صالح' }, { status: 400 });
  if (typeof price !== 'number' || price <= 0 || price > 99999) return NextResponse.json({ error: 'سعر غير صالح' }, { status: 400 });
  const safeName = name.trim().slice(0, 200);
  const safeDesc = String(description || '').trim().slice(0, 2000);
  const db = getDb();
  const result = await db.execute({
    sql: 'INSERT INTO products (name, description, price, image, category, featured) VALUES (?, ?, ?, ?, ?, ?)',
    args: [name, description || '', price, isValidImageUrl(image), category || 'games', featured ? 1 : 0],
  });
  const newProduct = await db.execute({ sql: 'SELECT * FROM products WHERE id = ?', args: [result.lastInsertRowid!] });
  const r = newProduct.rows[0];
  return NextResponse.json({ id: Number(r.id), name: String(r.name ?? ''), description: String(r.description ?? ''), price: Number(r.price), image: r.image ? String(r.image) : null, category: String(r.category ?? 'games'), featured: Number(r.featured ?? 0) }, { status: 201 });
}
