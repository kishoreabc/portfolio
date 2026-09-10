/**
 * POST /api/ai/tool
 *
 * Tool execution bridge.
 * The browser receives a toolCall event from Gemini Live, relays it here,
 * we execute the tool securely server-side, and return the result.
 * The browser then calls session.sendToolResponse(callId, result).
 *
 * Security layers enforced:
 *  1. Content-Type validation
 *  2. Origin check
 *  3. IP rate limit (tool calls/minute)
 *  5. Session + IP ownership validation
 *  6. Tool name allowlist (in tool-executor.ts)
 *  7. Per-session tool call limits (in tool-executor.ts)
 *  8. Output sanitization (in each tool)
 */

import { NextRequest, NextResponse } from "next/server";
import { executeTool } from "@/lib/ai/tools/tool-executor";
import { validateSession } from "@/lib/ai/session-store";
import { checkToolCallRateLimit } from "@/lib/ai/rate-limiter";
import {
  extractIp,
  isOriginAllowed,
  isJsonContentType,
  toSafeErrorMessage,
} from "@/lib/ai/security";

export async function POST(request: NextRequest) {
  // ── Layer 1: Content-Type ───────────────────────────────────────────────────
  if (!isJsonContentType(request)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // ── Layer 2: Origin ─────────────────────────────────────────────────────────
  if (!isOriginAllowed(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip = extractIp(request);

  // ── Layer 3: IP tool call rate limit ────────────────────────────────────────
  const rateCheck = checkToolCallRateLimit(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: toSafeErrorMessage("RATE_LIMITED"), retryAfterSeconds: rateCheck.retryAfterSeconds },
      { status: 429, headers: { "Retry-After": String(rateCheck.retryAfterSeconds ?? 60) } }
    );
  }

  // ── Parse body ──────────────────────────────────────────────────────────────
  let body: { sessionId?: string; toolName?: string; args?: Record<string, unknown>; callId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { sessionId, toolName, args, callId } = body;

  if (!sessionId || !toolName || !callId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // ── Layer 5: Session + IP ownership ─────────────────────────────────────────
  const session = await validateSession(sessionId, ip);
  if (!session) {
    return NextResponse.json(
      { error: toSafeErrorMessage("SESSION_OWNERSHIP_MISMATCH"), revoked: true },
      { status: 403 }
    );
  }

  // ── Execute (layers 6–8 enforced inside executeTool) ─────────────────────────
  const result = await executeTool(
    {
      sessionId,
      toolName,
      args: args ?? {},
      callId,
    },
    session
  );

  return NextResponse.json(result, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
