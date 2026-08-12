// Provider-agnostic chat/tool-calling shapes shared by every AI provider client under this
// directory (currently NIM and Groq — see nim-client.ts / groq-client.ts). Modeled directly on
// the OpenAI-compatible chat-completions wire format since both current providers speak it
// natively; a future provider that doesn't would need its own client to translate into this shape,
// same as any other adapter.

export type AIRole = 'system' | 'user' | 'assistant' | 'tool';

export interface AIToolCall {
  id: string;
  name: string;
  // Raw JSON string as returned by the provider — parsed at the call site (assistant-tools.ts
  // consumers), not here, so this layer stays agnostic to what any given tool's args look like.
  arguments: string;
}

export type AIChatMessage =
  | { role: 'system' | 'user'; content: string }
  | { role: 'assistant'; content: string | null; toolCalls: AIToolCall[] | null }
  | { role: 'tool'; toolCallId: string; content: string };

export interface AIToolDeclaration {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface AIChatResult {
  content: string | null;
  toolCalls: AIToolCall[] | null;
  // Extracted reasoning/"thinking" text, normalized across providers (NIM: stripped out of
  // <think> tags in `content`; Groq: read from its own `reasoning` field). Never forwarded to
  // the admin UI — see chat/route.ts, which never reads this field into any response shape.
  reasoning: string | null;
  provider: 'nim' | 'groq';
  // The actual model id used for this call — lets callers/logs distinguish an A/B override
  // (ASSISTANT_MODEL) from each client's hardcoded default without needing to know the env
  // var itself.
  model: string;
}

export interface AIChatOptions {
  messages: AIChatMessage[];
  tools: AIToolDeclaration[];
  // Per-call override of the client's default MODEL constant — lets a caller route a specific
  // request to a different model on the same provider (e.g. an env-driven A/B comparison in
  // chat/route.ts) without changing the client's own default. Falls back to each client's
  // hardcoded MODEL when omitted.
  model?: string;
}

export interface AIProviderClient {
  readonly name: 'nim' | 'groq';
  chat(options: AIChatOptions): Promise<AIChatResult>;
}
