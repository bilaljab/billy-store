import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb, serializeProduct } from '@/lib/db';
import { isAuthenticated } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!await isAuthenticated(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await initDb();
  const db = getDb();
  const result = await db.execute('SELECT * FROM products ORDER BY created_at DESC');
  const products = result.rows.map(serializeProduct);

  // Build CSV
  const headers = ['id', 'name', 'description', 'price', 'category', 'featured', 'release_date', 'image'];
  const escape = (val: unknown) => {
    const s = String(val ?? '');
    // Wrap in quotes if contains comma, newline, or quote
    if (s.includes(',') || s.includes('\n') || s.includes('"')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const rows = products.map(p => [
    p.id,
    p.name,
    p.description,
    p.price,
    p.category,
    p.featured ? 'true' : 'false',
    p.release_date || '',
    p.image || '',
  ].map(escape).join(','));

  const csv = [headers.join(','), ...rows].join('\n');

  // Add BOM for Excel UTF-8 compatibility (Arabic text)
  const bom = '\uFEFF';
  const csvWithBom = bom + csv;

  return new NextResponse(csvWithBom, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="billy-store-products-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
