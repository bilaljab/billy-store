import type { AIChatMessage, AIChatOptions, AIChatResult, AIProviderClient, AIToolCall } from './types';
import { AIProviderError } from './errors';

// Fallback provider — tried once if the primary NIM client fails (see ./index.ts). Confirmed
// via Groq's own docs: openai/gpt-oss-120b has strong native tool-calling support, and returns
// reasoning in a separate `reasoning` field (not `reasoning_content`, not <think> tags — and
// `reasoning_format` is explicitly unsupported for this model, so don't set it).
const BASE_URL = 'https://api.groq.com/openai/v1';
// Deliberately hardcoded with no override path (unlike nim-client.ts's ASSISTANT_MODEL) — this is
// the fallback provider, and a NIM model id would be invalid on Groq's API if it ever leaked
// across the index.ts fallback boundary. The A/B model comparison (CLAUDE.md) only ever targets
// NIM candidates; Groq's model is not part of that measurement.
const MODEL = 'openai/gpt-oss-120b';
// Kept in sync with nim-client.ts's timeout for consistent fallback behavior.
const TIMEOUT_MS = 60_000;

interface OpenAIToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

interface OpenAIMessage {
  role: string;
  content: string | null;
  reasoning?: string | null;
  tool_calls?: OpenAIToolCall[];
  tool_call_id?: string;
}

function toWireMessage(m: AIChatMessage): OpenAIMessage {
  if (m.role === 'assistant') {
    return {
      role: 'assistant',
      content: m.content,
      tool_calls: m.toolCalls?.map(tc => ({
        id: tc.id,
        type: 'function',
        function: { name: tc.name, arguments: tc.arguments },
      })),
    };
  }
  if (m.role === 'tool') {
    return { role: 'tool', content: m.content, tool_call_id: m.toolCallId };
  }
  return { role: m.role, content: m.content };
}

export const groqClient: AIProviderClient = {
  name: 'groq',

  async chat(options: AIChatOptions): Promise<AIChatResult> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new AIProviderError('GROQ_API_KEY غير مُعرَّف بمتغيرات البيئة', false, 'groq');

    const body: Record<string, unknown> = {
      model: MODEL,
      messages: options.messages.map(toWireMessage),
      // Kept in sync with nim-client.ts's rationale — low, not default, to reduce free-text
      // hallucination risk in generated tool arguments (e.g. invented product name text).
      temperature: 0.1,
    };
    if (options.tools.length > 0) {
      body.tools = options.tools.map(t => ({
        type: 'function',
        function: { name: t.name, description: t.description, parameters: t.parameters },
      }));
      body.tool_choice = 'auto';
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch {
      throw new AIProviderError('تعذّر الاتصال بخدمة Groq', true, 'groq');
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      const retryable = res.status === 429 || res.status >= 500;
      throw new AIProviderError(`Groq API responded with ${res.status}`, retryable, 'groq');
    }

    const data = await res.json();
    const message: OpenAIMessage | undefined = data?.choices?.[0]?.message;

    const toolCalls: AIToolCall[] | null = message?.tool_calls?.length
      ? message.tool_calls.map(tc => ({ id: tc.id, name: tc.function.name, arguments: tc.function.arguments }))
      : null;

    return {
      content: message?.content ?? null,
      toolCalls,
      reasoning: message?.reasoning ?? null,
      provider: 'groq',
      model: MODEL,
    };
  },
};
