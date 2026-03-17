import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb, toRow } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

// Simple in-memory rate limiter (use Redis in production for multi-instance)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_MS = 30 * 60 * 1000; // 30 minutes lockout

function getRateLimitKey(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
}

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
  const ip = getRateLimitKey(req);
  const limit = checkRateLimit(ip);

  if (!limit.allowed) {
    return NextResponse.json(
      { error: `تم تجاوز الحد المسموح به. حاول بعد ${limit.retryAfter} ثانية.` },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });

  const { username, password } = body;

  // Input validation + length limits
  if (!username || !password ||
      typeof username !== 'string' || typeof password !== 'string' ||
      username.length > 50 || password.length > 100) {
    return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
  }

  await initDb();
  const db = getDb();
  const result = await db.execute({ sql: 'SELECT * FROM admins WHERE username = ?', args: [username] });
  const admin = result.rows[0] ? toRow<{ id: number; username: string; password: string }>(result.rows[0]) : undefined;

  // Constant-time comparison to prevent timing attacks
  const validPassword = admin ? bcrypt.compareSync(password, String(admin.password)) : false;
  // Always do bcrypt even if user not found (prevents user enumeration via timing)
  if (!admin) bcrypt.compareSync(password, '$2b$10$invalidhashfortimingnormalization');

  if (!admin || !validPassword) {
    return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 });
  }

  // Clear rate limit on successful login
  loginAttempts.delete(ip);

  const token = await signToken({ id: admin.id, username: admin.username });
  const res = NextResponse.json({ success: true });

  // Cookie: httpOnly + secure + sameSite=strict - NO token in response body
  res.cookies.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });

  return res;
}
