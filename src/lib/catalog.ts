import { getBestDiscount, type AppliedDiscount, type DiscountRule, type GlobalDiscount } from './discounts';

export interface CatalogProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string | null;
  category: string;
  featured: number;
  release_date: string | null;
  featured_order: number | null;
  discount: AppliedDiscount | null;
}

export interface Catalog {
  products: CatalogProduct[];
  globalDiscount: GlobalDiscount | null;
  error: boolean;
}

/**
 * Every visible product with its applicable discount already resolved, in three
 * parallel queries. Server-only; call from ISR pages so it runs per revalidation,
 * not per visitor. Never throws — a DB failure returns `error: true` and no products.
 */
export async function getCatalog(order: 'newest' | 'random' = 'newest'): Promise<Catalog> {
  try {
    const { getDb, initDb, serializeProduct, col } = await import('./db');
    await initDb();
    const db = getDb();
    const orderBy = order === 'random' ? 'RANDOM()' : 'created_at DESC, id DESC';

    const [productsResult, globalResult, targetedResult] = await Promise.all([
      db.execute(`SELECT * FROM products WHERE deleted_at IS NULL ORDER BY ${orderBy}`),
      db.execute({ sql: "SELECT value FROM settings WHERE key = 'discount'", args: [] }),
      db.execute({ sql: "SELECT value FROM settings WHERE key = 'targeted_discounts'", args: [] }),
    ]);

    const global: GlobalDiscount | null = globalResult.rows[0]
      ? JSON.parse(String(col(globalResult.rows[0], 'value')))
      : null;
    const targeted: DiscountRule[] = targetedResult.rows[0]
      ? JSON.parse(String(col(targetedResult.rows[0], 'value')))
      : [];

    const products = productsResult.rows.map(serializeProduct).map(product => ({
      ...product,
      discount: getBestDiscount(product, targeted, global),
    }));

    return { products, globalDiscount: global?.active ? global : null, error: false };
  } catch {
    return { products: [], globalDiscount: null, error: true };
  }
}
