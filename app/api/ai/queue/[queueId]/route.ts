/**
 * GET /api/ai/queue/[queueId]
 *
 * Queue status polling endpoint.
 * Visitors who were queued (voice concurrency full) poll this every 3 seconds.
 *
 * Returns:
 *  - { ready: false, position, estimatedWaitSeconds }  — still waiting
 *  - { ready: true, sessionId, token, ... }           — slot granted, create session
 *
 * Security:
 *  - IP ownership validated on every poll (queueId + IP must match)
 *  - Once promoted, issues a real ephemeral token and creates the session
 *  - Opaque queueId (UUID) — position not guessable
 */

import { NextRequest, NextResponse } from "next/server";
import { getQueueStatus, leaveQueue } from "@/lib/ai/concurrency";
import { createEphemeralToken, getEffectiveGeminiConfig } from "@/lib/ai/ephemeral-token";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { createSession } from "@/lib/ai/session-store";
import { prisma } from "@/lib/db";
import { extractIp, hashIp, isOriginAllowed, toSafeErrorMessage } from "@/lib/ai/security";
import { AI_CONFIG } from "@/lib/ai/config";
import { incrementSessionCount } from "@/lib/ai/usage-limit";
import { getKnownPortfolioResources } from "@/lib/ai/resources";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ queueId: string }> }
) {
  const { queueId } = await params;

  if (!queueId || typeof queueId !== "string") {
    return NextResponse.json({ error: "Invalid queue ID" }, { status: 400 });
  }

  if (!isOriginAllowed(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip = extractIp(request);
  const success = await leaveQueue(queueId, ip);

  if (!success) {
    return NextResponse.json(
      { error: "Queue entry not found or unauthorized" },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ queueId: string }> }
) {
  const { queueId } = await params;

  if (!queueId || typeof queueId !== "string") {
    return NextResponse.json({ error: "Invalid queue ID" }, { status: 400 });
  }

  if (!isOriginAllowed(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip = extractIp(request);
  const status = await getQueueStatus(queueId, ip);

  if (!status) {
    return NextResponse.json(
      { error: "Queue entry not found or expired. Please start a new session." },
      { status: 404 }
    );
  }

  // Still waiting — return position info
  if (!status.ready) {
    return NextResponse.json(
      {
        ready: false,
        position: status.position,
        estimatedWaitSeconds: status.estimatedWaitSeconds,
        pollIntervalMs: AI_CONFIG.queuePollIntervalMs,
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  // Slot granted — create ephemeral token and session
  const [{ model }, systemPrompt, tokenResult] = await Promise.all([
    getEffectiveGeminiConfig(),
    buildSystemPrompt(),
    createEphemeralToken("voice"),
  ]);

  if (!tokenResult) {
    return NextResponse.json(
      { error: toSafeErrorMessage("GEMINI_UNAVAILABLE") },
      { status: 503 }
    );
  }

  const sessionId = crypto.randomUUID();

  let conversationId: string;
  try {
    const conversation = await prisma.aiConversation.create({
      data: {
        sessionId,
        mode: "voice",
        ipHash: hashIp(ip),
      },
    });
    conversationId = conversation.id;
  } catch (err) {
    console.error("[AI:Queue] Failed to create conversation record:", err);
    return NextResponse.json(
      { error: toSafeErrorMessage("INTERNAL_ERROR") },
      { status: 500 }
    );
  }

  createSession(sessionId, conversationId, ip, "voice");
  void incrementSessionCount();

  const resources = await getKnownPortfolioResources();

  return NextResponse.json(
    {
      ready: true,
      sessionId,
      conversationId,
      token: tokenResult.token,
      expiresAt: tokenResult.expiresAt.toISOString(),
      systemInstruction: systemPrompt,
      model,
      mode: "voice",
      voiceTimeoutSeconds: AI_CONFIG.maxVoiceSessionSeconds,
      voiceWarningSeconds: AI_CONFIG.voiceWarningBeforeEndSeconds,
      resources,
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
