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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAuthenticated(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await initDb();
  const body = await req.json();
  const { name, description, price, image, category, featured } = body;
  const db = getDb();
  await db.execute({
    sql: 'UPDATE products SET name=?, description=?, price=?, image=?, category=?, featured=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
    args: [name, description, price, isValidImageUrl(image), category, featured ? 1 : 0, id],
  });
  const result = await db.execute({ sql: 'SELECT * FROM products WHERE id = ?', args: [id] });
  const r = result.rows[0];
  return NextResponse.json({ id: Number(r.id), name: String(r.name ?? ''), description: String(r.description ?? ''), price: Number(r.price), image: r.image ? String(r.image) : null, category: String(r.category ?? 'games'), featured: Number(r.featured ?? 0) });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAuthenticated(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await initDb();
  const db = getDb();
  await db.execute({ sql: 'DELETE FROM products WHERE id = ?', args: [id] });
  return NextResponse.json({ success: true });
}
