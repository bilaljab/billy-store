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

  await db.execute(`CREATE TABLE IF NOT EXISTS site_visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT NOT NULL DEFAULT 'unknown',
    visited_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Add ip column if upgrading from old schema
  try {
    await db.execute("ALTER TABLE site_visits ADD COLUMN ip TEXT NOT NULL DEFAULT 'unknown'");
  } catch { /* column already exists */ }

  // Soft-delete support for products (used by bulk-delete + trash recovery section)
  try {
    await db.execute('ALTER TABLE products ADD COLUMN deleted_at DATETIME');
  } catch { /* column already exists */ }

  await db.execute(`CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor TEXT NOT NULL DEFAULT 'admin',
    tool TEXT NOT NULL,
    input TEXT NOT NULL,
    status TEXT NOT NULL,
    result TEXT,
    undo_data TEXT,
    undone_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  const a = await db.execute({ sql: 'SELECT id FROM admins WHERE username = ?', args: ['admin'] });
  if (a.rows.length === 0) {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) throw new Error('ADMIN_PASSWORD environment variable is required');
    const hash = bcrypt.hashSync(adminPassword, 12);
    await db.execute({ sql: 'INSERT INTO admins (username, password) VALUES (?, ?)', args: ['admin', hash] });
  }

}
