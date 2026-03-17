const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(path.join(dbDir, 'billy.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    category TEXT NOT NULL DEFAULT 'games',
    image TEXT,
    featured INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const existing = db.prepare('SELECT * FROM admins WHERE username = ?').get('admin');
if (!existing) {
  const hashed = bcrypt.hashSync('Bilal2026*', 10);
  db.prepare('INSERT INTO admins (username, password) VALUES (?, ?)').run('admin', hashed);
  console.log('✅ Admin created: admin / Bilal2026*');
}

// Sample products
const count = db.prepare('SELECT COUNT(*) as c FROM products').get();
if (count.c === 0) {
  const samples = [
    { name: 'God of War Ragnarök', description: 'استمر رحلة كريتوس وأتريوس في عالم الأساطير الإسكندنافية', price: 89, category: 'games', featured: 1, image: null },
    { name: 'Spider-Man 2', description: 'العب بشخصيتي بيتر باركر ومايلز موراليس في مغامرة جديدة', price: 99, category: 'games', featured: 1, image: null },
    { name: 'PS Plus Essential - شهر', description: 'اشتراك شهري يتيح اللعب أونلاين وألعاب مجانية شهرياً', price: 25, category: 'psplus', featured: 1, image: null },
    { name: 'PS Plus Extra - 3 أشهر', description: 'اشتراك 3 أشهر مع مكتبة ألعاب ضخمة تضم أكثر من 400 لعبة', price: 65, category: 'psplus', featured: 1, image: null },
    { name: 'FIFA 25', description: 'تجربة كرة القدم الأكثر واقعية مع وضع Career الجديد', price: 79, category: 'games', featured: 0, image: null },
    { name: 'Hogwarts Legacy', description: 'عش مغامرتك في عالم هاري بوتر داخل قلعة هوغوورتس', price: 75, category: 'games', featured: 0, image: null },
  ];
  const insert = db.prepare('INSERT INTO products (name, description, price, category, featured, image) VALUES (?, ?, ?, ?, ?, ?)');
  samples.forEach(p => insert.run(p.name, p.description, p.price, p.category, p.featured, p.image));
  console.log('✅ Sample products added');
}

db.close();
console.log('✅ Database initialized successfully');
