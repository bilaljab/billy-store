import { createClient, type Client } from '@libsql/client';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';


// Type-safe helper to convert libsql Row to a plain typed object
// Needed because libsql Row is not directly castable with TypeScript strict mode
export function toRow<T extends Record<string, unknown>>(row: unknown): T {
  return row as unknown as T;
}

export function toRows<T extends Record<string, unknown>>(rows: unknown[]): T[] {
  return rows as unknown as T[];
}

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

let _client: Client | null = null;
let _initialized = false;

export function getDb(): Client {
  if (!_client) {
    const url = process.env.TURSO_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (url && authToken) {
      // Production: Turso cloud database
      _client = createClient({ url, authToken });
    } else {
      // Development: local SQLite file
      _client = createClient({
        url: 'file:' + path.join(process.cwd(), 'data', 'billy.db'),
      });
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  const a = await db.execute({ sql: 'SELECT id FROM admins WHERE username = ?', args: ['admin'] });
  if (a.rows.length === 0) {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) throw new Error('ADMIN_PASSWORD environment variable is required');
    const hash = bcrypt.hashSync(adminPassword, 12); // Increased cost from 10 to 12
    await db.execute({ sql: 'INSERT INTO admins (username, password) VALUES (?, ?)', args: ['admin', hash] });
  }

  const c = await db.execute('SELECT COUNT(*) as c FROM products');
  const countRow = c.rows[0] as unknown as { c: number } | undefined;
  if (Number(countRow?.c ?? 0) === 0) {
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
