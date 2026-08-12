import type { AIChatOptions, AIChatResult } from './types';
import { AIProviderError } from './errors';
import { nimClient } from './nim-client';
import { groqClient } from './groq-client';

export type { AIChatMessage, AIChatOptions, AIChatResult, AIToolCall, AIToolDeclaration } from './types';
export { AIProviderError } from './errors';

// Single entry point every caller (chat/route.ts, the batch layer) uses instead of talking to a
// specific provider client directly. Falls back to Groq once on ANY NIM failure — not just
// retryable ones, since a hard NIM failure (bad key, full outage) doesn't imply Groq will also
// fail. Does not retry NIM itself first: "retry once against Groq" per the task spec means try
// NIM once, then Groq once, then surface an error — not retry NIM before falling back.
export async function callAI(options: AIChatOptions): Promise<AIChatResult> {
  try {
    const result = await nimClient.chat(options);
    console.log(`[ai] served by nim (model=${result.model})`);
    return result;
  } catch (err) {
    if (err instanceof AIProviderError) {
      console.warn(`[ai] nim failed (retryable=${err.retryable}): ${err.message} — falling back to groq`);
    } else {
      console.warn('[ai] nim failed with an unexpected error — falling back to groq', err);
    }

    try {
      const result = await groqClient.chat(options);
      console.log(`[ai] served by groq (fallback, model=${result.model})`);
      return result;
    } catch (fallbackErr) {
      console.error('[ai] groq fallback also failed');
      throw fallbackErr;
    }
  }
}
