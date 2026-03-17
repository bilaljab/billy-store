import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { isAuthenticated } from '@/lib/auth';

const MAX_IMPORT_COUNT = 500; // Max products per import batch
const MAX_FIELD_LENGTH = { name: 200, description: 2000, image: 500 };

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
    const { products } = body as { products: any[] };

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: 'لا توجد منتجات للاستيراد' }, { status: 400 });
    }

    // Limit batch size
    if (products.length > MAX_IMPORT_COUNT) {
      return NextResponse.json({ error: `الحد الأقصى ${MAX_IMPORT_COUNT} منتج لكل عملية استيراد` }, { status: 400 });
    }

    const db = getDb();
    let imported = 0;
    const errors: string[] = [];

    for (const p of products) {
      const name = String(p.name || '').trim().slice(0, MAX_FIELD_LENGTH.name);
      const description = String(p.description || '').trim().slice(0, MAX_FIELD_LENGTH.description);
      const price = parseFloat(p.price);
      const image = isValidImageUrl(p.image);
      const category = ['games', 'subscription'].includes(p.category) ? p.category : 'games';
      const featured = p.featured ? 1 : 0;

      if (!name || isNaN(price) || price <= 0 || price > 99999) {
        errors.push(`تم تخطي صف: بيانات غير صالحة`);
        continue;
      }

      try {
        await db.execute({
          sql: 'INSERT INTO products (name, description, price, image, category, featured) VALUES (?, ?, ?, ?, ?, ?)',
          args: [name, description, price, image, category, featured],
        });
        imported++;
      } catch {
        errors.push(`خطأ في إضافة: ${name}`);
      }
    }

    return NextResponse.json({ success: true, imported, errors });
  } catch {
    return NextResponse.json({ error: 'خطأ في معالجة البيانات' }, { status: 500 });
  }
}
