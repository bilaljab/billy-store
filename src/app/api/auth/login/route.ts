import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb, col } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }
  if (record.count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfter: Math.ceil((record.resetAt - now) / 1000) };
  }
  record.count++;
  return { allowed: true };
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  const limit = checkRateLimit(ip);
  if (!limit.allowed) {
    return NextResponse.json({ error: `حاول بعد ${limit.retryAfter} ثانية` }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });

  const { username, password } = body;
  if (!username || !password || typeof username !== 'string' || typeof password !== 'string' ||
      username.length > 50 || password.length > 100) {
    return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
  }

  await initDb();
  const db = getDb();
  const result = await db.execute({ sql: 'SELECT * FROM admins WHERE username = ?', args: [username] });
  const row = result.rows[0];

  const storedPassword = row ? String(col(row, 'password') ?? '') : '';
  const validPassword = row ? bcrypt.compareSync(password, storedPassword) : false;
  if (!row) bcrypt.compareSync(password, '$2b$12$invalidhashfortimingprotection000');

  if (!row || !validPassword) {
    return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 });
  }

  loginAttempts.delete(ip);
  const token = await signToken({ id: Number(col(row, 'id')), username: String(col(row, 'username')) });
  const res = NextResponse.json({ success: true });
  res.cookies.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24,
    path: '/',
  });
  return res;
}
