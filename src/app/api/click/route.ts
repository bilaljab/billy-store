import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

const CHANNELS = new Set(['whatsapp', 'telegram', 'instagram']);

/** Counts a click on a contact link (sent by VisitTracker via sendBeacon). Public, like /api/views. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const channel = String(body?.channel ?? '');
    const productId = Number(body?.productId ?? 0);
    if (!CHANNELS.has(channel) || !Number.isInteger(productId) || productId < 0 || productId > 999999) {
      return NextResponse.json({ success: false }, { status: 400 });
    }
    await initDb();
    await getDb().execute({
      sql: `INSERT INTO contact_clicks (day, channel, product_id, clicks) VALUES (DATE('now'), ?, ?, 1)
            ON CONFLICT(day, channel, product_id) DO UPDATE SET clicks = clicks + 1`,
      args: [channel, productId],
    });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ success: false }); }
}
