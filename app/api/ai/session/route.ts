/**
 * POST /api/ai/session
 *
 * Creates an authenticated AI agent session and returns an ephemeral Gemini token.
 * For voice sessions, enforces concurrency limit and returns queue position if full.
 *
 * Security layers:
 *  1. Content-Type validation
 *  2. Origin allowlist check
 *  3. IP rate limit (sessions/IP/day)
 *  4. Daily global budget check
 *  5. Concurrency check + queue (voice only)
 *  6. AiConversation DB record created (transcript anchored to session)
 *  7. Gemini ephemeral token creation (server-side, key never leaves)
 *     → on failure, DB record is rolled back (endedAt set) to prevent zombie sessions
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createEphemeralToken, isGeminiConfigured, getEffectiveGeminiConfig } from "@/lib/ai/ephemeral-token";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { createSession } from "@/lib/ai/session-store";
import { checkDailyBudget, incrementSessionCount } from "@/lib/ai/usage-limit";
import { checkVoiceSessionRateLimit } from "@/lib/ai/rate-limiter";
import { tryAcquireVoiceSlot, releaseVoiceSlot } from "@/lib/ai/concurrency";
import { extractIp, isOriginAllowed, isJsonContentType, hashIp, toSafeErrorMessage } from "@/lib/ai/security";
import { AI_CONFIG } from "@/lib/ai/config";
import { getKnownPortfolioResources } from "@/lib/ai/resources";
import type { AgentMode } from "@/types/ai";

export async function POST(request: NextRequest) {
  // ── Security Layer 1: Content-Type ──────────────────────────────────────────
  if (!isJsonContentType(request)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // ── Security Layer 2: Origin check ─────────────────────────────────────────
  if (!isOriginAllowed(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── Gemini config check ─────────────────────────────────────────────────────
  if (!(await isGeminiConfigured())) {
    console.error("[AI:Session] GEMINI_API_KEY not configured");
    return NextResponse.json(
      { error: toSafeErrorMessage("GEMINI_UNAVAILABLE") },
      { status: 503 }
    );
  }

  // ── Parse body ──────────────────────────────────────────────────────────────
  let mode: AgentMode = "voice";
  try {
    const body = await request.json();
    if (body?.mode === "chat") mode = "chat";
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const ip = extractIp(request);

  // ── Security Layer 3: IP rate limit (voice only) ────────────────────────────
  if (mode === "voice") {
    const rateCheck = checkVoiceSessionRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: toSafeErrorMessage("RATE_LIMITED"),
          retryAfterSeconds: rateCheck.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateCheck.retryAfterSeconds ?? 3600),
          },
        }
      );
    }
  }

  // ── Security Layer 4: Daily budget ─────────────────────────────────────────
  const budget = await checkDailyBudget();
  if (!budget.allowed) {
    return NextResponse.json(
      { error: toSafeErrorMessage("DAILY_BUDGET_EXHAUSTED") },
      { status: 429 }
    );
  }

  // ── Security Layer 5: Voice concurrency + queue ────────────────────────────
  if (mode === "voice") {
    const slotResult = await tryAcquireVoiceSlot(ip);

    if (!slotResult.acquired) {
      // Visitor is queued — return queue info (no token yet)
      return NextResponse.json(
        {
          queued: true,
          queueId: slotResult.queueId,
          position: slotResult.position,
          estimatedWaitSeconds: slotResult.estimatedWaitSeconds,
          pollIntervalMs: AI_CONFIG.queuePollIntervalMs,
        },
        { status: 202 }
      );
    }
  }

  // ── Build dynamic system prompt & get model ─────────────────────────────────
  const [{ model }, systemPrompt] = await Promise.all([
    getEffectiveGeminiConfig(),
    buildSystemPrompt(),
  ]);

  // ── Create session IDs ──────────────────────────────────────────────────────
  const sessionId = crypto.randomUUID();

  // ── Create AiConversation DB record ────────────────────────────────────────
  // Created BEFORE the ephemeral token so we can roll it back (set endedAt)
  // if token creation fails — preventing zombie "active" sessions in the dashboard.
  let conversationId: string;
  try {
    const conversation = await prisma.aiConversation.create({
      data: {
        sessionId,
        mode,
        ipHash: hashIp(ip),
      },
    });
    conversationId = conversation.id;
  } catch (err) {
    console.error("[AI:Session] Failed to create conversation record:", err);
    return NextResponse.json(
      { error: toSafeErrorMessage("INTERNAL_ERROR") },
      { status: 500 }
    );
  }

  // ── Create ephemeral Gemini token ───────────────────────────────────────────
  const tokenResult = await createEphemeralToken(mode);
  if (!tokenResult) {
    // Roll back the DB record so it doesn't appear as a zombie active session
    // in the admin dashboard or inflate the DB-backed concurrency count.
    await prisma.aiConversation
      .update({
        where: { id: conversationId },
        data: { endedAt: new Date() },
      })
      .catch(() => {});

    if (mode === "voice") {
      void releaseVoiceSlot();
    }

    return NextResponse.json(
      { error: toSafeErrorMessage("GEMINI_UNAVAILABLE") },
      { status: 503 }
    );
  }

  // ── Register in-memory session ──────────────────────────────────────────────
  createSession(sessionId, conversationId, ip, mode);

  // ── Increment daily counter (async, don't block) ────────────────────────────
  void incrementSessionCount();

  const resources = await getKnownPortfolioResources();

  // ── Return token & session configuration to client ──────────────────────────
  return NextResponse.json(
    {
      sessionId,
      conversationId,
      token: tokenResult.token,
      expiresAt: tokenResult.expiresAt.toISOString(),
      systemInstruction: systemPrompt,
      model,
      mode,
      voiceTimeoutSeconds: mode === "voice" ? AI_CONFIG.maxVoiceSessionSeconds : null,
      voiceWarningSeconds: mode === "voice" ? AI_CONFIG.voiceWarningBeforeEndSeconds : null,
      resources,
    },
    {
      status: 200,
      headers: {
        // Prevent caching of session tokens
        "Cache-Control": "no-store",
        "Pragma": "no-cache",
      },
    }
  );
}

// GET /api/ai/session returns public AI session limits & configuration
export async function GET() {
  return NextResponse.json(
    {
      maxVoiceSessionSeconds: AI_CONFIG.maxVoiceSessionSeconds,
      voiceWarningSeconds: AI_CONFIG.voiceWarningBeforeEndSeconds,
      maxChatSessionSeconds: AI_CONFIG.maxChatSessionSeconds,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    }
  );
}
