import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const SECRET = process.env.JWT_SECRET;
if (!SECRET || SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set in environment variables and be at least 32 characters');
}

export function signToken(payload: object): string {
  return jwt.sign(payload, SECRET!, { expiresIn: '24h' }); // Reduced from 7d to 24h
}

export function verifyToken(token: string): { id: number; username: string } | null {
  try {
    return jwt.verify(token, SECRET!) as { id: number; username: string };
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: NextRequest): string | null {
  // Only accept from httpOnly cookie - NOT from Authorization header (prevents XSS token theft)
  const cookie = req.cookies.get('admin_token');
  return cookie?.value || null;
}

export function isAuthenticated(req: NextRequest): boolean {
  const token = getTokenFromRequest(req);
  if (!token) return false;
  return verifyToken(token) !== null;
}
