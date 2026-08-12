import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { checkRateLimit, getClientIp, type RateLimitRecord } from '@/lib/rate-limit';
import { callAI, AIProviderError, type AIChatMessage } from '@/lib/ai';
import { ADMIN_ASSISTANT_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { getTool, toAIDeclarations, BATCHABLE_TOOLS, type ToolDef } from '@/lib/assistant-tools';
import { executeTool } from '@/lib/assistant-executor';
import { resolveBatchedItems } from '@/lib/ai/batch';
import { extractCandidateNames, mergeNameLists } from '@/lib/ai/name-extract';
import { findForeignScriptViolation } from '@/lib/ai/text-safety';

const chatAttempts = new Map<string, RateLimitRecord>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 60 * 1000;

const MAX_HISTORY_TURNS = 20;
// Raised from 2000 (2026-08-10): a realistic 80-item bulk request ("طبّق خصم على: " + 80 game
// names averaging ~20-30 chars each with separators) lands well past the old cap for anything but
// unusually short titles — e.g. 80 names averaging 24+ chars already exceeds 2000, and real
// titles like "Call of Duty: Modern Warfare III" (32 chars) push it further. 8000 comfortably
// covers 80 long titles with room to spare.
const MAX_MESSAGE_LENGTH = 8000;
// Caps chained safe-tool calls within a single user turn (e.g. "look up the id, then act on
// it" can take 2+ hops) — not a conversation-length limit, just a runaway-loop guard. The batch
// layer's name resolution (resolveBatchedItems) does NOT count against this — it's a synchronous,
// non-LLM computation within a single hop, not an additional hop.
const MAX_TOOL_HOPS = 5;

// Cross-checks a tool call's args against that tool's own JSON-schema `required` list. The
// system prompt tells the model to ask a clarifying question instead of calling a tool with a
// missing required field, but live testing found it doesn't always comply (a no-price
// createProduct call produced a confirm screen reading "بسعر undefined ر.س") — this is the
// server-side backstop for when it doesn't.
function getMissingRequiredFields(tool: ToolDef, args: Record<string, unknown>): string[] {
  const required = (tool.parameters as { required?: unknown }).required;
  if (!Array.isArray(required)) return [];
  return required.filter((key): key is string => {
    if (typeof key !== 'string') return false;
    const value = args[key];
    return value === undefined || value === null || value === '';
  });
}

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
    const rawHistory = Array.isArray(body.history) ? body.history : [];
    const isValidTurn = (h: unknown): h is HistoryTurn =>
      typeof h === 'object' && h !== null &&
      ((h as HistoryTurn).role === 'user' || (h as HistoryTurn).role === 'model') &&
      typeof (h as HistoryTurn).text === 'string';

    if (!message || message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ type: 'error', error: 'رسالة غير صالحة' }, { status: 400 });
    }
    if (!rawHistory.every(isValidTurn)) {
      return NextResponse.json({ type: 'error', error: 'سجل محادثة غير صالح' }, { status: 400 });
    }
    const history = rawHistory as HistoryTurn[];

    const trimmedHistory = history.slice(-MAX_HISTORY_TURNS);
    const aiHistory: AIChatMessage[] = [
      { role: 'system', content: ADMIN_ASSISTANT_SYSTEM_PROMPT },
      ...trimmedHistory.map(h => ({ role: h.role === 'model' ? 'assistant' : 'user', content: h.text } as AIChatMessage)),
      { role: 'user', content: message },
    ];

    let lastToolName: string | null = null;
    let lastToolResult: unknown = null;

    for (let hop = 0; hop < MAX_TOOL_HOPS; hop++) {
      const modelStart = Date.now();
      const result = await callAI({ messages: aiHistory, tools: toAIDeclarations() });
      console.log(`[assistant] hop ${hop}: model call took ${Date.now() - modelStart}ms, toolCall=${result.toolCalls?.[0]?.name ?? 'none'}`);

      const toolCall = result.toolCalls?.[0] ?? null;
      if (result.toolCalls && result.toolCalls.length > 1) {
        console.warn(`[assistant] model requested ${result.toolCalls.length} parallel tool calls — only acting on the first`);
      }

      if (!toolCall) {
        if (lastToolName) {
          return NextResponse.json({
            type: 'result',
            reply: result.content ?? 'تم التنفيذ.',
            toolName: lastToolName,
            toolResult: lastToolResult,
          });
        }
        return NextResponse.json({ type: 'text', reply: result.content ?? '' });
      }

      const tool = getTool(toolCall.name);
      if (!tool) {
        return NextResponse.json({ type: 'error', error: 'أداة غير معروفة' }, { status: 500 });
      }

      let args: Record<string, unknown>;
      try {
        args = toolCall.arguments ? JSON.parse(toolCall.arguments) : {};
      } catch {
        return NextResponse.json({ type: 'error', error: 'تعذّر تفسير معطيات الأداة المُرسَلة من الذكاء الاصطناعي' }, { status: 500 });
      }

      // Batchable tools (see BATCHABLE_TOOLS) accept a companion productNames/itemNames list for
      // admin requests that name items by text rather than numeric id — resolve those names to
      // confirmed ids via deterministic fuzzy-match BEFORE the normal riskTier confirm-breakout
      // below, so summarize()/computeAffectedCount() downstream see a fully-resolved call exactly
      // like any other. This does not consume the outer hop budget.
      const nameListArg = (args.productNames ?? args.itemNames) as unknown;
      if (BATCHABLE_TOOLS.has(tool.name) && Array.isArray(nameListArg) && nameListArg.length > 0) {
        const modelNames = nameListArg.filter((n): n is string => typeof n === 'string');

        // Deterministic safeguard against the model itself truncating a long name list while
        // copying it into this argument (the original failure this whole migration targets —
        // the prior Gemini model reportedly stopped around 20-22 of 50). Over-extraction here is
        // safe: every candidate still has to survive matchProductNames against the real catalog
        // before it can affect anything, so a false-positive "name" just becomes another
        // unmatched entry shown to the admin.
        const serverNames = extractCandidateNames(message);
        const { names: rawNames, serverRecoveredMore } = mergeNameLists(modelNames, serverNames);
        if (serverRecoveredMore) {
          console.log(`[assistant] name-list safeguard: model=${modelNames.length} server=${serverNames.length} union=${rawNames.length}`);
        }

        const { resolvedIds, unmatchedNames, flaggedForReview } = await resolveBatchedItems(rawNames, req);

        delete args.productNames;
        delete args.itemNames;

        if (resolvedIds.length === 0) {
          const names = unmatchedNames.join('، ') || rawNames.join('، ');
          return NextResponse.json({ type: 'text', reply: `لم أتمكن من مطابقة أي من الأسماء بكتالوج المنتجات الحالي بثقة كافية: ${names}. تأكد من الأسماء وحاول مرة أخرى.` });
        }

        const targetField = BATCHABLE_TOOLS.get(tool.name);
        if (targetField) args[targetField] = resolvedIds;

        const truncateList = (list: string[]) =>
          list.length > 15 ? `${list.slice(0, 15).join('، ')}، و${list.length - 15} أخرى` : list.join('، ');

        const notes: string[] = [`طابقت ${resolvedIds.length} من أصل ${rawNames.length} اسماً`];
        if (unmatchedNames.length > 0) notes.push(`أسماء غير مطابقة بالكتالوج (تُركت بدون تنفيذ): ${truncateList(unmatchedNames)}`);
        if (flaggedForReview.length > 0) notes.push(`أسماء طابقت أكثر من منتج بشكل متقارب — حدّدها بدقة أكثر: ${truncateList(flaggedForReview)}`);
        (args as Record<string, unknown>).__batchNote = notes.join(' | ');
      }

      if (tool.riskTier !== 'safe') {
        const batchNote = typeof args.__batchNote === 'string' ? args.__batchNote : null;
        delete args.__batchNote;

        // Defensive backstop for a real failure observed live: the system prompt explicitly
        // tells the model to ask a clarifying question in plain text instead of calling a tool
        // with a missing required field (e.g. no price given) — but it doesn't always comply,
        // and calling summarize() on an incomplete args object produced a confirm screen reading
        // literally "بسعر undefined ر.س". Check each tool's own JSON-schema `required` list
        // before building any confirm text, and bail to a clarifying question instead.
        const missingRequired = getMissingRequiredFields(tool, args);
        if (missingRequired.length > 0) {
          return NextResponse.json({
            type: 'text',
            reply: `محتاج توضيح قبل ما أكمل: ${missingRequired.join('، ')} غير محدَّد. ممكن تزوّدني فيه؟`,
          });
        }

        const humanSummary = (await tool.summarize(args, req)) + (batchNote ? `\n\n${batchNote}` : '');

        // Backstop against model-generated free text leaking an unexpected script (observed live:
        // a hallucinated "expanded" product name containing Vietnamese words) — never show a
        // corrupted confirm screen to the admin. See text-safety.ts for exactly what this does
        // and does not catch. Root-cause mitigations (prompt wording, lower temperature) live in
        // prompts.ts/assistant-tools.ts and nim-client.ts/groq-client.ts respectively.
        const violation = findForeignScriptViolation(args, humanSummary);
        if (violation) {
          console.warn(`[assistant] blocked a confirm screen — foreign script detected in "${violation.field}": ${violation.value}`);
          return NextResponse.json({
            type: 'error',
            error: 'تعذّر توليد نص تأكيد سليم لهذا الطلب (احتمال خلل بالنص المولَّد). حاول صياغة الطلب بشكل أوضح أو أكثر تحديداً وأعد المحاولة.',
          }, { status: 502 });
        }

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

      const toolStart = Date.now();
      const { ok, data } = await executeTool(tool, args, req);
      console.log(`[assistant] hop ${hop}: executeTool(${tool.name}) took ${Date.now() - toolStart}ms, ok=${ok}`);
      if (!ok) {
        // findGameInfo's "not found" is a normal, documented business outcome — both the system
        // prompt and the tool's own description explicitly tell the model to fall back to the
        // admin's literal name when this happens — not a hard system failure. Feed it back into
        // the conversation as a tool result so the model gets another turn to react, instead of
        // hard-erroring the whole request before the model ever sees the failure. This was a
        // real bug found live: a nonexistent game name terminated with a raw "لم يُعثر على لعبة
        // مطابقة" error shown to the admin, even though the fallback instruction exists
        // specifically for this case — the hop loop was returning before the model could act on
        // it. Every other tool keeps the immediate hard-error: their failures are genuine
        // unexpected system errors (auth/DB/etc.), not a "try something else" signal the model
        // is equipped to act on.
        if (tool.name === 'findGameInfo') {
          const errMsg = (data as { error?: string } | null)?.error ?? 'لم يُعثر على نتيجة';
          aiHistory.push({ role: 'assistant', content: result.content, toolCalls: [toolCall] });
          aiHistory.push({ role: 'tool', toolCallId: toolCall.id, content: JSON.stringify({ error: errMsg }) });
          continue;
        }
        const errMsg = (data as { error?: string } | null)?.error ?? 'حدث خطأ أثناء التنفيذ';
        return NextResponse.json({ type: 'error', error: errMsg });
      }

      // Flow-A latency shortcut: if the model called findGameInfo AND already included a price
      // in that same call (meaning the admin's message specified one up front), skip the second
      // hop that would otherwise exist purely to decide "call createProduct with this data" —
      // build that confirm deterministically instead. This is the dominant cost in Flow A
      // (measured baseline: the second hop alone ~45s of a ~68s total, see CLAUDE.md) — both
      // model-swap candidates tried to cut it failed correctness outright (also in CLAUDE.md), so
      // this is a narrower, purely additive alternative that doesn't touch model selection at
      // all. Reuses the exact same summarize()/safety-check/response-shape path as the normal
      // riskTier confirm-breakout above — falls through unchanged to the normal second hop if
      // price is absent or the lookup found nothing (already handled by the `!ok` branch above).
      if (tool.name === 'findGameInfo' && typeof args.price === 'number') {
        const gameData = data as { name?: string; description?: string; imageUrl?: string | null; released?: string | null } | null;
        const createProductTool = gameData?.name ? getTool('createProduct') : undefined;
        if (createProductTool) {
          const shortcutArgs: Record<string, unknown> = {
            name: gameData!.name,
            description: gameData!.description ?? '',
            price: args.price,
            image: gameData!.imageUrl ?? null,
            category: typeof args.category === 'string' ? args.category : 'games',
            featured: !!args.featured,
            release_date: gameData!.released ?? null,
          };
          const humanSummary = await createProductTool.summarize(shortcutArgs, req);
          const violation = findForeignScriptViolation(shortcutArgs, humanSummary);
          if (!violation) {
            console.log('[assistant] Flow A shortcut: skipped second hop (price was already known)');
            return NextResponse.json({
              type: 'confirm',
              toolName: 'createProduct',
              args: shortcutArgs,
              riskTier: createProductTool.riskTier,
              humanSummary,
              confirmValue: undefined,
            });
          }
          console.warn(`[assistant] Flow A shortcut blocked — foreign script in "${violation.field}", falling through to normal second hop`);
        }
      }

      lastToolName = tool.name;
      lastToolResult = data;

      aiHistory.push({ role: 'assistant', content: result.content, toolCalls: [toolCall] });
      aiHistory.push({ role: 'tool', toolCallId: toolCall.id, content: JSON.stringify(data) });
    }

    return NextResponse.json({ type: 'error', error: 'تعذّر إكمال الطلب — عدد كبير جداً من الخطوات المتسلسلة' }, { status: 500 });
  } catch (err) {
    console.error('[assistant] unexpected error in chat route:', err);
    if (err instanceof AIProviderError) {
      return NextResponse.json({ type: 'error', error: 'تعذّر الاتصال بمساعد الذكاء الاصطناعي، حاول لاحقاً' }, { status: 502 });
    }
    return NextResponse.json({ type: 'error', error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}
