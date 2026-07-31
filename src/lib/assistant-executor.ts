import type { NextRequest } from 'next/server';
import { getDb, initDb } from './db';
import { selfFetch } from './self-fetch';
import type { ToolDef } from './assistant-tools';

// Tool names that write their own audit_log row (with undo_data) directly inside their
// route handler, so the recovery mechanism works regardless of whether the action was
// triggered via this assistant or the pre-existing manual dashboard buttons. The generic
// writeAuditLog below is skipped for these to avoid a duplicate row.
const SELF_LOGGING_TOOLS = new Set(['bulkDeleteProducts', 'bulkUpdatePrices', 'importProducts']);

export function isSelfLoggingTool(toolName: string): boolean {
  return SELF_LOGGING_TOOLS.has(toolName);
}

export async function executeTool(
  tool: ToolDef,
  args: unknown,
  req: NextRequest
): Promise<{ ok: boolean; status: number; data: unknown }> {
  if (tool.execute) return tool.execute(args as Record<string, unknown>, req);
  const { path, body } = await tool.buildRequest(args as Record<string, unknown>, req);
  return selfFetch(path, req, { method: tool.method, body });
}

export async function writeAuditLog(
  tool: string,
  input: unknown,
  status: 'success' | 'error',
  result: unknown,
  undoData?: unknown
): Promise<void> {
  await initDb();
  const db = getDb();
  await db.execute({
    sql: 'INSERT INTO audit_log (tool, input, status, result, undo_data) VALUES (?, ?, ?, ?, ?)',
    args: [
      tool,
      JSON.stringify(input),
      status,
      JSON.stringify(result ?? null),
      undoData !== undefined ? JSON.stringify(undoData) : null,
    ],
  });
}
