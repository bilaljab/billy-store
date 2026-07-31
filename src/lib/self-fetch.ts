import type { NextRequest } from 'next/server';

// Internal server-to-server call to one of the app's own existing routes, forwarding the
// admin's cookie so the target route's own isAuthenticated()/validation runs unchanged.
// This is how the assistant "consumes existing routes as-is" instead of reimplementing them.
export async function selfFetch(
  path: string,
  req: NextRequest,
  init?: { method?: string; body?: unknown }
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const cookieHeader = req.headers.get('cookie') ?? '';
  const url = new URL(path, req.nextUrl.origin);
  const res = await fetch(url, {
    method: init?.method ?? 'GET',
    headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
  });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}
