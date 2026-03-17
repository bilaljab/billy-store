import { SignJWT, jwtVerify } from 'jose';
import { NextRequest } from 'next/server';

const SECRET_STRING = process.env.JWT_SECRET;
if (!SECRET_STRING || SECRET_STRING.length < 32) {
  throw new Error('JWT_SECRET must be set and be at least 32 characters');
}

const SECRET = new TextEncoder().encode(SECRET_STRING);

export async function signToken(payload: Record<string, unknown>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<{ id: number; username: string } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as { id: number; username: string };
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: NextRequest): string | null {
  const cookie = req.cookies.get('admin_token');
  return cookie?.value || null;
}

export async function isAuthenticated(req: NextRequest): Promise<boolean> {
  const token = getTokenFromRequest(req);
  if (!token) return false;
  const result = await verifyToken(token);
  return result !== null;
}
