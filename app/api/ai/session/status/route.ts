/**
 * GET /api/ai/session/status
 *
 * Realtime session status check.
 * Called by the client on a 2-second interval to detect whether
 * an active session was revoked or ended by an administrator.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { terminateSession } from "@/lib/ai/session-store";
import { isOriginAllowed } from "@/lib/ai/security";

export async function GET(request: NextRequest) {
  if (!isOriginAllowed(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const sessionId = searchParams.get("sessionId");
  const conversationId = searchParams.get("conversationId");

  if (!sessionId && !conversationId) {
    return NextResponse.json({ error: "Missing sessionId or conversationId" }, { status: 400 });
  }

  try {
    const conv = await prisma.aiConversation.findFirst({
      where: {
        OR: [
          ...(sessionId ? [{ sessionId }] : []),
          ...(conversationId ? [{ id: conversationId }] : []),
        ],
      },
      select: {
        id: true,
        sessionId: true,
        endedAt: true,
      },
    });

    // If conversation record was deleted or not found
    if (!conv) {
      if (sessionId) terminateSession(sessionId);
      return NextResponse.json(
        { active: false, revoked: true, reason: "DELETED" },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
            Pragma: "no-cache",
          },
        }
      );
    }

    // If marked ended (e.g. revoked by admin or timed out)
    if (conv.endedAt !== null) {
      terminateSession(conv.sessionId);
      return NextResponse.json(
        { active: false, revoked: true, reason: "REVOKED", endedAt: conv.endedAt },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
            Pragma: "no-cache",
          },
        }
      );
    }

    // Session is active
    return NextResponse.json(
      { active: true },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      }
    );
  } catch (err) {
    console.error("[AI:SessionStatus] DB check failed:", err);
    // On unexpected DB error, return status 500 so client retries without disconnecting
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
