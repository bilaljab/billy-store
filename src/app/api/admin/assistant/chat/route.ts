import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { checkRateLimit, getClientIp, type RateLimitRecord } from '@/lib/rate-limit';
import { callAI, AIApiError, type AIMessage } from '@/lib/ai-provider';
import { getTool, toAIDeclarations } from '@/lib/assistant-tools';
import { executeTool } from '@/lib/assistant-executor';

const chatAttempts = new Map<string, RateLimitRecord>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 60 * 1000;

const MAX_HISTORY_TURNS = 20;
const MAX_MESSAGE_LENGTH = 2000;
// Caps chained safe-tool calls within a single user turn (e.g. "look up the id, then act on
// it" can take 2+ hops) — not a conversation-length limit, just a runaway-loop guard.
const MAX_TOOL_HOPS = 5;

interface HistoryTurn {
  role: 'user' | 'model';
  text: string;
}

export async function POST(req: NextRequest) {
  if (!await isAuthenticated(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ip = getClientIp(req);
  const limit = checkRateLimit(chatAttempts, ip, MAX_ATTEMPTS, WINDOW_MS);
  if (!limit.allowed) {
    return NextResponse.json({ type: 'error', error: `تم تجاوز الحد المسموح، حاول بعد ${limit.retryAfter} ثانية` }, { status: 429 });
  }

  try {
    const body = await req.json();
    const message = String(body.message ?? '').trim();
    const history = Array.isArray(body.history) ? (body.history as HistoryTurn[]) : [];

    if (!message || message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ type: 'error', error: 'رسالة غير صالحة' }, { status: 400 });
    }

    const trimmedHistory = history.slice(-MAX_HISTORY_TURNS);
    const aiHistory: AIMessage[] = [
      ...trimmedHistory.map(h => ({ role: h.role, parts: [{ text: h.text }] } as AIMessage)),
      { role: 'user', parts: [{ text: message }] },
    ];

    let lastToolName: string | null = null;
    let lastToolResult: unknown = null;

    for (let hop = 0; hop < MAX_TOOL_HOPS; hop++) {
      const result = await callAI(aiHistory, toAIDeclarations());

      if (!result.functionCall) {
        if (lastToolName) {
          return NextResponse.json({
            type: 'result',
            reply: result.text ?? 'تم التنفيذ.',
            toolName: lastToolName,
            toolResult: lastToolResult,
          });
        }
        return NextResponse.json({ type: 'text', reply: result.text ?? '' });
      }

      const tool = getTool(result.functionCall.name);
      if (!tool) {
        return NextResponse.json({ type: 'error', error: 'أداة غير معروفة' }, { status: 500 });
      }

      const args = result.functionCall.args ?? {};

      if (tool.riskTier !== 'safe') {
        const humanSummary = await tool.summarize(args, req);
        const confirmValue = tool.riskTier === 'double-confirm' && tool.computeAffectedCount
          ? await tool.computeAffectedCount(args, req)
          : undefined;

        return NextResponse.json({
          type: 'confirm',
          toolName: tool.name,
          args,
          riskTier: tool.riskTier,
          humanSummary,
          confirmValue,
        });
      }

      const { ok, data } = await executeTool(tool, args, req);
      if (!ok) {
        const errMsg = (data as { error?: string } | null)?.error ?? 'حدث خطأ أثناء التنفيذ';
        return NextResponse.json({ type: 'error', error: errMsg });
      }

      lastToolName = tool.name;
      lastToolResult = data;

      aiHistory.push({
        role: 'model',
        parts: [{ functionCall: result.functionCall, thoughtSignature: result.thoughtSignature ?? undefined }],
      });
      aiHistory.push({
        role: 'user',
        parts: [{ functionResponse: { name: tool.name, id: result.functionCall.id, response: { data } } }],
      });
    }

    return NextResponse.json({ type: 'error', error: 'تعذّر إكمال الطلب — عدد كبير جداً من الخطوات المتسلسلة' }, { status: 500 });
  } catch (err) {
    if (err instanceof AIApiError) {
      return NextResponse.json({ type: 'error', error: 'تعذّر الاتصال بمساعد الذكاء الاصطناعي، حاول لاحقاً' }, { status: 502 });
    }
    return NextResponse.json({ type: 'error', error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}
