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
import { AI_CONFIG } from "@/lib/ai/config";

// Common no-cache headers for status polling responses
const NO_CACHE = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
} as const;

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
        mode: true,
        startedAt: true,
        messages: {
          select: { createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    // If conversation record was deleted or not found
    if (!conv) {
      if (sessionId) terminateSession(sessionId);
      return NextResponse.json(
        { active: false, revoked: true, reason: "DELETED" },
        { status: 200, headers: NO_CACHE }
      );
    }

    // If already marked ended by any previous action
    if (conv.endedAt !== null) {
      terminateSession(conv.sessionId);
      // Distinguish between admin revoke and idle/timer expiry.
      // Sessions ended by the session-store purge or voice timer have
      // endedAt set without admin action; we can't tell definitively at this
      // layer, so we use the reason stored on the record if available.
      return NextResponse.json(
        { active: false, revoked: true, reason: "REVOKED", endedAt: conv.endedAt },
        { status: 200, headers: NO_CACHE }
      );
    }

    // ── Proactive chat idle timeout detection ──────────────────────────────
    // Even if endedAt is not yet set, check if a chat session has been idle
    // longer than maxChatSessionSeconds. The server-side purge only runs on
    // the next in-memory operation; the status endpoint is the fastest way
    // to notify the client during normal polling.
    if (conv.mode === "chat") {
      const idleLimitMs = AI_CONFIG.maxChatSessionSeconds * 1000;
      // Use the timestamp of the last message, or startedAt if no messages yet.
      const lastMessageAt = conv.messages[0]?.createdAt ?? null;
      const lastActivityMs = lastMessageAt
        ? lastMessageAt.getTime()
        : conv.startedAt.getTime();
      const idleMs = Date.now() - lastActivityMs;

      if (idleMs > idleLimitMs) {
        // Mark as ended in DB so future heartbeats skip the idle check.
        await prisma.aiConversation
          .update({
            where: { id: conv.id },
            data: { endedAt: new Date() },
          })
          .catch(() => {});

        terminateSession(conv.sessionId);
        return NextResponse.json(
          { active: false, revoked: true, reason: "IDLE_TIMEOUT" },
          { status: 200, headers: NO_CACHE }
        );
      }
    }

    // Session is active
    return NextResponse.json(
      { active: true },
      { status: 200, headers: NO_CACHE }
    );
  } catch (err) {
    console.error("[AI:SessionStatus] DB check failed:", err);
    // On unexpected DB error, return status 500 so client retries without disconnecting
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
