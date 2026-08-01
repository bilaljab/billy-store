import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { checkRateLimit, getClientIp, type RateLimitRecord } from '@/lib/rate-limit';
import { getTool } from '@/lib/assistant-tools';
import { executeTool, writeAuditLog, isSelfLoggingTool } from '@/lib/assistant-executor';
import { selfFetch } from '@/lib/self-fetch';

const confirmAttempts = new Map<string, RateLimitRecord>();
const MAX_ATTEMPTS = 20;
const WINDOW_MS = 60 * 1000;

export async function POST(req: NextRequest) {
  if (!await isAuthenticated(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ip = getClientIp(req);
  const limit = checkRateLimit(confirmAttempts, ip, MAX_ATTEMPTS, WINDOW_MS);
  if (!limit.allowed) {
    return NextResponse.json({ success: false, error: `تم تجاوز الحد المسموح، حاول بعد ${limit.retryAfter} ثانية` }, { status: 429 });
  }

  try {
    const body = await req.json();
    const toolName = String(body.toolName ?? '');
    const args = (body.args ?? {}) as Record<string, unknown>;
    const typedConfirmation = body.typedConfirmation !== undefined ? String(body.typedConfirmation) : undefined;

    const tool = getTool(toolName);
    if (!tool || tool.riskTier === 'safe') {
      return NextResponse.json({ success: false, error: 'أداة غير صالحة للتأكيد' }, { status: 400 });
    }

    if (tool.riskTier === 'double-confirm') {
      if (!tool.computeAffectedCount) {
        return NextResponse.json({ success: false, error: 'أداة غير مكتملة الإعداد' }, { status: 500 });
      }
      const freshCount = await tool.computeAffectedCount(args, req);
      if (typedConfirmation === undefined || typedConfirmation.trim() !== String(freshCount)) {
        return NextResponse.json({ success: false, error: 'العدد تغيّر أو القيمة غير صحيحة، أعد المحاولة' }, { status: 400 });
      }
    }

    const { ok, data } = await executeTool(tool, args, req);

    if (!isSelfLoggingTool(toolName)) {
      await writeAuditLog(toolName, args, ok ? 'success' : 'error', data);
    }

    if (!ok) {
      const errMsg = (data as { error?: string } | null)?.error ?? 'فشل التنفيذ';
      return NextResponse.json({ success: false, error: errMsg });
    }

    // updateTargetedDiscount silently no-ops if the id doesn't match any existing rule
    // (the underlying route still reports success) — verify it actually landed before
    // telling the admin it worked.
    if (toolName === 'updateTargetedDiscount') {
      const { data: rules } = await selfFetch('/api/admin/discounts/targeted', req);
      const stillExists = Array.isArray(rules) && rules.some((r: { id: unknown }) => r.id === args.id);
      if (!stillExists) {
        return NextResponse.json({
          success: true,
          reply: `تنفيذ الطلب اكتمل بدون خطأ، لكن لم يُعثر على قاعدة خصم برقم #${args.id} فعلياً — تأكد من الرقم.`,
          result: data,
        });
      }
    }

    return NextResponse.json({ success: true, reply: 'تم تنفيذ العملية بنجاح.', result: data });
  } catch {
    return NextResponse.json({ success: false, error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}
