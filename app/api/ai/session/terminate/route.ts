/**
 * DELETE /api/ai/session/terminate
 *
 * Terminates a session: marks AiConversation.endedAt, releases the voice slot,
 * and removes the in-memory session entry.
 * Called by the browser when the panel is closed or session ends.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateSession, terminateSession } from "@/lib/ai/session-store";
import { releaseVoiceSlot } from "@/lib/ai/concurrency";
import { extractIp, isJsonContentType, isOriginAllowed } from "@/lib/ai/security";

export async function DELETE(request: NextRequest) {
  if (!isJsonContentType(request)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!isOriginAllowed(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { sessionId?: string; conversationId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { sessionId, conversationId } = body;
  if (!sessionId || !conversationId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const ip = extractIp(request);
  const session = await validateSession(sessionId, ip);

  let wasVoice = session ? session.mode === "voice" : false;
  let foundInDb = false;

  if (session) {
    terminateSession(sessionId);
    foundInDb = true; // session exists — DB record will also exist
  } else {
    // Fallback to database record if session was already evicted from memory
    try {
      const conv = await prisma.aiConversation.findUnique({
        where: { id: conversationId },
      });
      if (conv && conv.sessionId === sessionId) {
        wasVoice = conv.mode === "voice";
        foundInDb = true;
      }
    } catch {}
  }

  // If we found no session in memory AND no matching DB record, the IDs are
  // completely unknown — return 404 so callers can detect the difference.
  if (!foundInDb) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Mark conversation as ended in DB
  try {
    await prisma.aiConversation.update({
      where: { id: conversationId },
      data: { endedAt: new Date() },
    });
  } catch (err) {
    console.error("[AI:Session] Failed to update endedAt:", err);
  }

  // Release voice slot and promote next queued visitor
  if (wasVoice) {
    void releaseVoiceSlot();
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

export const POST = DELETE;

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

