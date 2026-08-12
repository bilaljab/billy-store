import type { AIChatMessage, AIChatOptions, AIChatResult, AIProviderClient, AIToolCall } from './types';
import { AIProviderError } from './errors';

// Primary provider. nvidia/llama-3.3-nemotron-super-49b-v1.5 — NOT DeepSeek R1 as originally
// specified. Live verification against this account's actual NVIDIA NIM catalog
// (GET /v1/models) found neither deepseek-ai/deepseek-r1 nor deepseek-ai/deepseek-r1-0528
// exist there at all (R1 has apparently been retired from NIM's hosted lineup since the
// planning-stage doc research found it listed) — only deepseek-ai/deepseek-coder-6.7b-instruct
// (old, code-only) and deepseek-ai/deepseek-v4-flash-0731 (a newer DeepSeek generation, not R1)
// remain under that namespace. Live-tested three real alternatives with actual tool-calling
// requests against this key: deepseek-v4-flash-0731 worked but returned an empty reasoning
// field (unclear if it reasons step-by-step at all); nvidia/nemotron-3-nano-omni-30b-a3b-reasoning
// and this model both returned correct tool_calls plus a populated, separate reasoning field.
// User chose this one (49B) over the nano/omni variant for the larger/more-trusted reasoning
// capacity, given the original problem being solved is reliability on long structured tasks.
const BASE_URL = 'https://integrate.api.nvidia.com/v1';
const MODEL = 'nvidia/llama-3.3-nemotron-super-49b-v1.5';
// 60s, not 45s — live testing during the batch-layer acceptance test found forced-tool-call
// requests with a full item chunk occasionally push close to/past a tighter timeout on this 49B
// reasoning model, triggering unnecessary Groq fallbacks. See also batch.ts's
// INTENT_SUMMARY_MAX_LENGTH, which cuts prompt bloat that was the other contributor.
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
  reasoning_content?: string | null;
  tool_calls?: OpenAIToolCall[];
  tool_call_id?: string;
}

// A/B model override, env-driven — see Phase 6 measurement writeup in CLAUDE.md. Read here
// (rather than relying solely on the generic AIChatOptions.model plumbing) so this stays
// NIM-specific: groq-client.ts intentionally does NOT read this env var, since a NIM model id
// would be invalid on Groq's API if it ever leaked across the fallback boundary in index.ts.
const MODEL_OVERRIDE = process.env.ASSISTANT_MODEL;

// Optional reasoning-off directive for this specific model, controlled via env so it can be A/B
// measured without a code change (see chat/route.ts's [ai] logging and CLAUDE.md for the
// measurement writeup). NVIDIA's own docs for this model family are thin and inconsistent on the
// exact literal: the model card says `/no_think` in the system prompt; other NVIDIA
// documentation for sibling Nemotron models says "detailed thinking off" — and neither source
// confirms tool-calling reliability with reasoning disabled, or how the toggle interacts with a
// second, longer custom system prompt (this admin assistant's actual system prompt is far more
// than the bare toggle). ASSISTANT_THINKING_DIRECTIVE lets either literal (or any other) be
// tried live as a SEPARATE leading system message, ahead of the real system prompt, rather than
// replacing it — unset (the default) sends no such message and behaves exactly as before.
const THINKING_DIRECTIVE = process.env.ASSISTANT_THINKING_DIRECTIVE;

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

export const nimClient: AIProviderClient = {
  name: 'nim',

  async chat(options: AIChatOptions): Promise<AIChatResult> {
    const apiKey = process.env.NVIDIA_NIM_API_KEY;
    if (!apiKey) throw new AIProviderError('NVIDIA_NIM_API_KEY غير مُعرَّف بمتغيرات البيئة', false, 'nim');

    const wireMessages = options.messages.map(toWireMessage);
    if (THINKING_DIRECTIVE) {
      wireMessages.unshift({ role: 'system', content: THINKING_DIRECTIVE });
    }

    const resolvedModel = options.model ?? MODEL_OVERRIDE ?? MODEL;
    const body: Record<string, unknown> = {
      model: resolvedModel,
      messages: wireMessages,
      // Low, not default — this is a business admin tool, not a creative chat interface. Live
      // testing (2026-08-09) found the previously-unset (provider-default) temperature let the
      // model occasionally invent an expanded/embellished product name text containing stray
      // non-Arabic/non-English tokens when generating free-text tool arguments (e.g. createProduct
      // name) from a short admin input. Not fully deterministic (0 can cause degenerate repetition
      // on some models) but close to it.
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
      throw new AIProviderError('تعذّر الاتصال بخدمة NVIDIA NIM', true, 'nim');
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      const retryable = res.status === 429 || res.status >= 500;
      throw new AIProviderError(`NVIDIA NIM API responded with ${res.status}`, retryable, 'nim');
    }

    const data = await res.json();
    const message: OpenAIMessage | undefined = data?.choices?.[0]?.message;

    const toolCalls: AIToolCall[] | null = message?.tool_calls?.length
      ? message.tool_calls.map(tc => ({ id: tc.id, name: tc.function.name, arguments: tc.function.arguments }))
      : null;

    // This model returns reasoning as its own clean field (both `reasoning` and
    // `reasoning_content` observed populated with identical text in live testing) — no <think>
    // tag stripping needed, unlike the DeepSeek R1 behavior this client was originally written
    // against before live verification found R1 unavailable on this NIM account (see MODEL
    // comment above).
    return {
      content: message?.content ?? null,
      toolCalls,
      reasoning: message?.reasoning_content ?? message?.reasoning ?? null,
      provider: 'nim',
      model: resolvedModel,
    };
  },
};
