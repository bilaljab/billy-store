import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { isAuthenticated } from '@/lib/auth';

const MAX_IMPORT_COUNT = 500;

function isValidImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const s = String(url).trim();
  if (s.startsWith('/uploads/') || s.startsWith('https://')) return s;
  return null;
}

export async function POST(req: NextRequest) {
  if (!await isAuthenticated(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    await initDb();
    const body = await req.json();
    const { products } = body as { products: unknown[] };
    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: 'لا توجد منتجات للاستيراد' }, { status: 400 });
    }
    if (products.length > MAX_IMPORT_COUNT) {
      return NextResponse.json({ error: `الحد الأقصى ${MAX_IMPORT_COUNT} منتج` }, { status: 400 });
    }
    const db = getDb();
    let imported = 0;
    const errors: string[] = [];
    const newIds: number[] = [];
    for (const p of products) {
      const item = p as Record<string, unknown>;
      const name = String(item.name || '').trim().slice(0, 200);
      const description = String(item.description || '').trim().slice(0, 2000);
      const price = parseFloat(String(item.price));
      const image = isValidImageUrl(String(item.image || ''));
      const category = ['games', 'subscription'].includes(String(item.category)) ? String(item.category) : 'games';
      const featured = item.featured ? 1 : 0;
      const release_date = item.release_date ? String(item.release_date).slice(0, 10) : null;
      if (!name || isNaN(price) || price <= 0 || price > 99999) {
        errors.push(`تم تخطي صف: بيانات غير صالحة`);
        continue;
      }
      try {
        const insertResult = await db.execute({
          sql: 'INSERT INTO products (name, description, price, image, category, featured, release_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
          args: [name, description, price, image, category, featured, release_date],
        });
        newIds.push(Number(insertResult.lastInsertRowid));
        imported++;
      } catch { errors.push(`خطأ في إضافة: ${name}`); }
    }

    await db.execute({
      sql: 'INSERT INTO audit_log (tool, input, status, result, undo_data) VALUES (?, ?, ?, ?, ?)',
      args: [
        'importProducts',
        JSON.stringify({ count: products.length }),
        'success',
        JSON.stringify({ imported, errors }),
        JSON.stringify({ newIds }),
      ],
    });

    return NextResponse.json({ success: true, imported, errors });
  } catch { return NextResponse.json({ error: 'خطأ في معالجة البيانات' }, { status: 500 }); }
}
