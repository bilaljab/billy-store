import type { MetadataRoute } from 'next';

// Crawlers (Googlebot etc.) hit /sitemap.xml far more often than a normal page,
// so cache this for an hour instead of querying Turso on every request.
export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://billy-store.vercel.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = ['', '/products', '/about', '/faq'].map(path => ({
    url: `${SITE_URL}${path}`,
  }));

  try {
    const { getDb, initDb } = await import('@/lib/db');
    await initDb();
    const db = getDb();
    const result = await db.execute('SELECT id FROM products WHERE deleted_at IS NULL');
    const productRoutes: MetadataRoute.Sitemap = result.rows.map(r => ({
      url: `${SITE_URL}/products/${(r as Record<string, unknown>)['id']}`,
    }));
    return [...staticRoutes, ...productRoutes];
  } catch {
    return staticRoutes;
  }
}
