import { createClient, type Client, type Row } from '@libsql/client';
import bcrypt from 'bcryptjs';

// Safely extract a value from a libsql Row field
export function col(row: Row, key: string): unknown {
  return (row as Record<string, unknown>)[key];
}

export function serializeProduct(r: Row) {
  return {
    id: Number(col(r, 'id')),
    name: String(col(r, 'name') ?? ''),
    description: String(col(r, 'description') ?? ''),
    price: Number(col(r, 'price')),
    image: col(r, 'image') ? String(col(r, 'image')) : null,
    category: String(col(r, 'category') ?? 'games'),
    featured: Number(col(r, 'featured') ?? 0),
    release_date: col(r, 'release_date') ? String(col(r, 'release_date')) : null,
  };
}

let _client: Client | null = null;
let _initialized = false;

export function getDb(): Client {
  if (!_client) {
    const url = process.env.TURSO_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (url && authToken) {
      // Production: Turso cloud - no filesystem needed
      _client = createClient({ url, authToken });
    } else {
      // Development only: local SQLite
      // Dynamic require prevents bundler from including fs/path in production bundle
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const path = require('path') as typeof import('path');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fs = require('fs') as typeof import('fs');
      const dataDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      _client = createClient({ url: 'file:' + path.join(process.cwd(), 'data', 'billy.db') });
    }
  }
  return _client;
}

export async function initDb() {
  if (_initialized) return;
  _initialized = true;
  const db = getDb();

  await db.execute(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    image TEXT,
    category TEXT NOT NULL DEFAULT 'games',
    featured INTEGER NOT NULL DEFAULT 0,
    release_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Add release_date column if it doesn't exist (migration for existing DBs)
  try {
    await db.execute('ALTER TABLE products ADD COLUMN release_date TEXT');
  } catch { /* column already exists */ }

  await db.execute(`CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS product_views (
    product_id INTEGER PRIMARY KEY,
    views INTEGER NOT NULL DEFAULT 0
  )`);

  const a = await db.execute({ sql: 'SELECT id FROM admins WHERE username = ?', args: ['admin'] });
  if (a.rows.length === 0) {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) throw new Error('ADMIN_PASSWORD environment variable is required');
    const hash = bcrypt.hashSync(adminPassword, 12);
    await db.execute({ sql: 'INSERT INTO admins (username, password) VALUES (?, ?)', args: ['admin', hash] });
  }

  const c = await db.execute('SELECT COUNT(*) as c FROM products');
  const count = Number(col(c.rows[0], 'c') ?? 0);
  if (count === 0) {
    const ps: [string, string, number, string, number][] = [
      ['God of War Ragnarok', 'المغامرة الملحمية الأسطورية مع كريتوس وأتريوس في عالم الأساطير النوردية.', 149, 'games', 1],
      ['Spider-Man 2', 'العودة مع بيتر باركر وميلز موراليس في مغامرة مذهلة عبر نيويورك.', 189, 'games', 1],
      ['FIFA 25', 'أحدث إصدار من سلسلة كرة القدم الأشهر مع تحسينات ضخمة.', 159, 'games', 1],
      ['PS Plus Essential - شهر', 'اشتراك PS Plus لمدة شهر. العب أونلاين واحصل على ألعاب مجانية شهرياً.', 29, 'subscription', 1],
      ['PS Plus Extra - 3 أشهر', 'اشتراك PS Plus Extra لمدة 3 أشهر مع مكتبة ضخمة من الألعاب.', 89, 'subscription', 0],
      ['PS Plus Premium - سنة', 'الباقة الشاملة لمدة سنة مع مكتبة ألعاب كلاسيكية وتجربة لا تتوقف.', 249, 'subscription', 1],
      ['Hogwarts Legacy', 'عيش قصتك في عالم هاري بوتر السحري واستكشف هوجوورتس.', 139, 'games', 0],
      ['Elden Ring', 'لعبة الأكشن RPG الأسطورية. عالم مفتوح شاسع وتحديات لا نهاية لها.', 129, 'games', 0],
    ];
    for (const p of ps) {
      await db.execute({
        sql: 'INSERT INTO products (name, description, price, image, category, featured) VALUES (?, ?, ?, ?, ?, ?)',
        args: [p[0], p[1], p[2], null, p[3], p[4]],
      });
    }
  }
}
