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
import { releaseVoiceSlot } from "@/lib/ai/concurrency";
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
    // ── Check Database (cross-instance source of truth) ────────────────────
    const conv = await prisma.aiConversation.findUnique({
      where: conversationId ? { id: conversationId } : { sessionId: sessionId! },
      select: {
        id: true,
        sessionId: true,
        ipHash: true,
        endedAt: true,
        mode: true,
        startedAt: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { role: true, content: true, createdAt: true },
        },
      },
    });

    if (!conv) {
      // Conversation not found in DB — session was wiped or never existed
      return NextResponse.json(
        { active: false, revoked: true, reason: "DELETED" },
        { status: 200, headers: NO_CACHE }
      );
    }

    // If already marked ended by any previous action
    if (conv.endedAt !== null) {
      terminateSession(conv.sessionId);
      if (conv.mode === "voice") {
        await releaseVoiceSlot();
      }

      const lastMsg = conv.messages[0];
      const isRevokedByAdmin =
        lastMsg?.role === "system" && lastMsg?.content === "REVOKED_BY_ADMIN";
      const isExplicitIdle =
        lastMsg?.role === "system" && lastMsg?.content === "IDLE_TIMEOUT";
      const isExplicitTimeLimit =
        lastMsg?.role === "system" && lastMsg?.content === "TIME_LIMIT";

      const voiceHardLimitMs = AI_CONFIG.maxVoiceSessionSeconds * 1000;
      const totalDurationMs = conv.endedAt.getTime() - conv.startedAt.getTime();
      const isTimeLimit =
        isExplicitTimeLimit ||
        (conv.mode === "voice" && totalDurationMs >= voiceHardLimitMs - 5000);

      // If an admin ended the session, it must return "REVOKED", not "IDLE_TIMEOUT"
      let reason = "REVOKED";
      if (isRevokedByAdmin) {
        reason = "REVOKED";
      } else if (isExplicitIdle) {
        reason = "IDLE_TIMEOUT";
      } else if (isTimeLimit) {
        reason = "TIME_LIMIT";
      } else {
        reason = "REVOKED";
      }

      return NextResponse.json(
        { active: false, revoked: true, reason, endedAt: conv.endedAt },
        { status: 200, headers: NO_CACHE }
      );
    }

    // ── Proactive voice idle timeout detection ─────────────────────────────
    if (conv.mode === "voice") {
      const voiceHardLimitMs = AI_CONFIG.maxVoiceSessionSeconds * 1000;
      const elapsedMs = Date.now() - conv.startedAt.getTime();
      const lastMessageAt = conv.messages[0]?.createdAt ?? null;
      const lastActivityMs = lastMessageAt
        ? lastMessageAt.getTime()
        : conv.startedAt.getTime();
      const idleMs = Date.now() - lastActivityMs;
      // 3 minutes (180s) of silence/inactivity in voice mode
      const voiceIdleLimitMs = 180 * 1000;

      if (elapsedMs > voiceHardLimitMs || idleMs > voiceIdleLimitMs) {
        const timeoutReason = elapsedMs > voiceHardLimitMs ? "TIME_LIMIT" : "IDLE_TIMEOUT";
        await prisma.aiConversation
          .update({
            where: { id: conv.id },
            data: { endedAt: new Date() },
          })
          .catch(() => {});

        await prisma.aiMessage
          .create({
            data: {
              conversationId: conv.id,
              role: "system",
              content: timeoutReason,
            },
          })
          .catch(() => {});

        terminateSession(conv.sessionId);
        await releaseVoiceSlot();
        return NextResponse.json(
          { active: false, revoked: true, reason: timeoutReason },
          { status: 200, headers: NO_CACHE }
        );
      }
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

        await prisma.aiMessage
          .create({
            data: {
              conversationId: conv.id,
              role: "system",
              content: "IDLE_TIMEOUT",
            },
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
