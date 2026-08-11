import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Redirect favicon requests to logo - prevents 404 errors inflating error rate
  if (pathname === '/favicon.ico' || pathname === '/favicon.png') {
    return NextResponse.redirect(new URL('/logos/billy-store-icon.png', req.url));
  }

  const res = NextResponse.next();

  // ── Security Headers (applied to ALL responses) ──
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  const isDev = process.env.NODE_ENV !== 'production';
  res.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`, // unsafe-eval only in dev (webpack HMR)
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self'",
      "img-src 'self' data: blob: https:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join('; ')
  );

  // ── Admin page protection ──
  if (pathname.startsWith('/admin/dashboard') || pathname.startsWith('/admin/assistant')) {
    const token = req.cookies.get('admin_token');
    if (!token?.value) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
    // Actually VERIFY the token, not just check it exists
    const payload = await verifyToken(token.value);
    if (!payload) {
      const redirectRes = NextResponse.redirect(new URL('/admin/login', req.url));
      redirectRes.cookies.delete('admin_token'); // clear invalid cookie
      return redirectRes;
    }
  }

  // ── Prevent direct access to /admin/login if already logged in ──
  if (pathname === '/admin/login') {
    const token = req.cookies.get('admin_token');
    if (token?.value && await verifyToken(token.value)) {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    }
  }

  return res;
}

export const config = {
  // Only run middleware on page routes and API routes that need protection
  // Skip: static files, images, fonts, icons
  matcher: [
    '/((?!_next/static|_next/image|.*\.(?:ico|png|jpg|jpeg|svg|webp|woff|woff2|ttf)).*)',
  ],
};
