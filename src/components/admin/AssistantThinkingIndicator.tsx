// The current reasoning model (nvidia/llama-3.3-nemotron-super-49b-v1.5 via NVIDIA NIM) is
// noticeably slower than the previous Gemini Flash-Lite model, especially on multi-step
// tool-calling turns. This is a lightweight "still working"
// signal reusing the existing `sending` state in page.tsx, not real token streaming (no
// streaming transport exists in this feature — see the migration plan for why that scope was
// deliberately not taken on here).
export default function AssistantThinkingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-surface border border-line rounded-2xl p-5 max-w-[85%] flex items-center gap-2 text-muted">
        <span className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
        </span>
        <span className="text-sm">المساعد يفكّر...</span>
      </div>
    </div>
  );
}
