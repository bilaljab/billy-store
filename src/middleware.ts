import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const res = NextResponse.next();

  // ── Security Headers (applied to ALL responses) ──
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval needed for Next.js dev; tighten in prod
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join('; ')
  );

  // ── Admin page protection ──
  if (pathname.startsWith('/admin/dashboard')) {
    const token = req.cookies.get('admin_token');
    if (!token?.value) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
    // Actually VERIFY the token, not just check it exists
    const payload = verifyToken(token.value);
    if (!payload) {
      const redirectRes = NextResponse.redirect(new URL('/admin/login', req.url));
      redirectRes.cookies.delete('admin_token'); // clear invalid cookie
      return redirectRes;
    }
  }

  // ── Prevent direct access to /admin/login if already logged in ──
  if (pathname === '/admin/login') {
    const token = req.cookies.get('admin_token');
    if (token?.value && verifyToken(token.value)) {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
