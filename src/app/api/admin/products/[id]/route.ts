import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb, serializeProduct } from '@/lib/db';
import { isAuthenticated } from '@/lib/auth';

function isValidImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const s = String(url).trim();
  if (s.startsWith('/uploads/') || s.startsWith('https://')) return s;
  return null;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAuthenticated(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await initDb();
  const body = await req.json();
  const { name, description, price, image, category, featured, release_date } = body;
  const safeReleaseDate = release_date ? String(release_date).slice(0, 10) : null;
  const db = getDb();
  await db.execute({
    sql: 'UPDATE products SET name=?, description=?, price=?, image=?, category=?, featured=?, release_date=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
    args: [name, description, price, isValidImageUrl(image), category, featured ? 1 : 0, safeReleaseDate, id],
  });
  const result = await db.execute({ sql: 'SELECT * FROM products WHERE id = ?', args: [id] });
  return NextResponse.json(serializeProduct(result.rows[0]));
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAuthenticated(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await initDb();
  const db = getDb();
  await db.execute({ sql: 'DELETE FROM products WHERE id = ?', args: [id] });
  return NextResponse.json({ success: true });
}
