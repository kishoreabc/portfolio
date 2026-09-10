/**
 * POST /api/ai/conversation/message
 *
 * Appends a single conversation turn (user or assistant) to the AiConversation record.
 * Called by the browser after each speech/text turn.
 *
 * Security:
 *  - Session ownership validated (sessionId + IP)
 *  - Content truncated to prevent excessively large DB writes
 *  - No raw errors exposed to client
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateSession } from "@/lib/ai/session-store";
import { extractIp, isJsonContentType, isOriginAllowed, toSafeErrorMessage } from "@/lib/ai/security";
import { incrementMessageCount } from "@/lib/ai/usage-limit";

const MAX_CONTENT_LENGTH = 8000; // chars — prevents huge DB writes

export async function POST(request: NextRequest) {
  if (!isJsonContentType(request)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!isOriginAllowed(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    sessionId?: string;
    conversationId?: string;
    role?: string;
    content?: string;
    toolsUsed?: string[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { sessionId, conversationId, role, content, toolsUsed } = body;

  if (!sessionId || !conversationId || !role || !content) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (role !== "user" && role !== "assistant") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Validate session ownership
  const ip = extractIp(request);
  const session = await validateSession(sessionId, ip);
  if (!session) {
    return NextResponse.json(
      { error: toSafeErrorMessage("SESSION_OWNERSHIP_MISMATCH") },
      { status: 403 }
    );
  }

  // Validate conversationId matches session
  if (session.conversationId !== conversationId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Truncate excessively long content
  const safeContent = content.slice(0, MAX_CONTENT_LENGTH);
  const safeToolsUsed = Array.isArray(toolsUsed)
    ? toolsUsed.filter((t) => typeof t === "string").slice(0, 20)
    : [];

  try {
    await prisma.$transaction([
      prisma.aiMessage.create({
        data: {
          conversationId,
          role,
          content: safeContent,
          toolsUsed: safeToolsUsed,
        },
      }),
      prisma.aiConversation.update({
        where: { id: conversationId },
        data: { messageCount: { increment: 1 } },
      }),
    ]);

    // Async — don't block
    void incrementMessageCount();

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[AI:Message] DB write error:", err);
    // Non-critical — transcript saving failure shouldn't break the conversation
    return NextResponse.json({ ok: false, error: "Failed to save message" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
