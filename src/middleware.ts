import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

// Security headers (incl. CSP) are set in next.config.js headers(); this middleware only
// guards admin pages, so public pages never pay a middleware invocation.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

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

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/dashboard/:path*', '/admin/assistant/:path*', '/admin/login'],
};
