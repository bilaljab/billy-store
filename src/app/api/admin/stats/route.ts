import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb, col } from '@/lib/db';
import { isAuthenticated } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!await isAuthenticated(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await initDb();
  const db = getDb();

  const [totalVisits, todayVisits, productViews] = await Promise.all([
    // Total site visits all time
    db.execute('SELECT COUNT(*) as count FROM site_visits'),
    // Today's visits
    db.execute("SELECT COUNT(*) as count FROM site_visits WHERE DATE(visited_at) = DATE('now')"),
    // Product views joined with product names - sorted by views desc
    db.execute(`
      SELECT p.id, p.name, p.category, p.price, p.image,
             COALESCE(pv.views, 0) as views
      FROM products p
      LEFT JOIN product_views pv ON p.id = pv.product_id
      WHERE p.deleted_at IS NULL
      ORDER BY views DESC
    `),
  ]);

  const total = Number(col(totalVisits.rows[0], 'count') ?? 0);
  const today = Number(col(todayVisits.rows[0], 'count') ?? 0);

  const views = productViews.rows.map(r => ({
    id: Number(col(r, 'id')),
    name: String(col(r, 'name') ?? ''),
    category: String(col(r, 'category') ?? ''),
    price: Number(col(r, 'price')),
    image: col(r, 'image') ? String(col(r, 'image')) : null,
    views: Number(col(r, 'views') ?? 0),
  }));

  return NextResponse.json({ totalVisits: total, todayVisits: today, productViews: views });
}
