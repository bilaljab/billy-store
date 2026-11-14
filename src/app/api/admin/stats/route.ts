import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb, col } from '@/lib/db';
import { isAuthenticated } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!await isAuthenticated(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await initDb();
  const db = getDb();

  const [totalVisits, todayVisits, productViews, clicksByChannel, clicksByProduct] = await Promise.all([
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
    db.execute(`SELECT channel, SUM(clicks) AS total,
                       SUM(CASE WHEN day = DATE('now') THEN clicks ELSE 0 END) AS today,
                       SUM(CASE WHEN day >= DATE('now', '-6 days') THEN clicks ELSE 0 END) AS week
                FROM contact_clicks GROUP BY channel`),
    db.execute('SELECT product_id, SUM(clicks) AS clicks FROM contact_clicks WHERE product_id > 0 GROUP BY product_id'),
  ]);

  const clicks = { today: 0, week: 0, total: 0, byChannel: {} as Record<string, { today: number; week: number; total: number }> };
  for (const r of clicksByChannel.rows) {
    const c = { today: Number(col(r, 'today') ?? 0), week: Number(col(r, 'week') ?? 0), total: Number(col(r, 'total') ?? 0) };
    clicks.byChannel[String(col(r, 'channel'))] = c;
    clicks.today += c.today; clicks.week += c.week; clicks.total += c.total;
  }
  const productClicks = new Map(clicksByProduct.rows.map(r => [Number(col(r, 'product_id')), Number(col(r, 'clicks') ?? 0)]));

  const total = Number(col(totalVisits.rows[0], 'count') ?? 0);
  const today = Number(col(todayVisits.rows[0], 'count') ?? 0);

  const views = productViews.rows.map(r => ({
    id: Number(col(r, 'id')),
    name: String(col(r, 'name') ?? ''),
    category: String(col(r, 'category') ?? ''),
    price: Number(col(r, 'price')),
    image: col(r, 'image') ? String(col(r, 'image')) : null,
    views: Number(col(r, 'views') ?? 0),
    clicks: productClicks.get(Number(col(r, 'id'))) ?? 0,
  }));

  return NextResponse.json({ totalVisits: total, todayVisits: today, productViews: views, clicks });
}
