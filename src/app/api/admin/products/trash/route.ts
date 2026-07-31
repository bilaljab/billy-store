import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb, serializeProduct, col } from '@/lib/db';
import { isAuthenticated } from '@/lib/auth';

const RECOVERY_WINDOW_DAYS = 7;

export async function GET(req: NextRequest) {
  if (!await isAuthenticated(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await initDb();
  const db = getDb();
  const result = await db.execute('SELECT * FROM products WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC');

  const items = result.rows.map(row => {
    const deletedAt = String(col(row, 'deleted_at'));
    const daysSince = (Date.now() - new Date(deletedAt).getTime()) / (1000 * 60 * 60 * 24);
    const daysRemaining = Math.max(0, Math.ceil(RECOVERY_WINDOW_DAYS - daysSince));
    return { ...serializeProduct(row), deleted_at: deletedAt, daysRemaining };
  });

  return NextResponse.json(items);
}
