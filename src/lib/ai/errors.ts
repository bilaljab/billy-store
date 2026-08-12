// Separate from ai-provider.ts's AIApiError on purpose — that class must keep working unmodified
// for the three Gemini functions staying out of this migration's scope (cleanPsnDescriptionAr,
// rewriteGameDescriptionAr, findWebUrl), so mixing the two hierarchies would create unwanted
// coupling between an unrelated legacy path and this new provider-agnostic one.
export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly retryable: boolean,
    public readonly provider: 'nim' | 'groq'
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}
