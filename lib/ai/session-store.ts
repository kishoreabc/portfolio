/**
 * lib/ai/session-store.ts
 *
 * In-memory session registry for the AI agent.
 *
 * IMPORTANT: This is per-serverless-instance memory.
 * On Vercel, a new instance may not share sessions with another instance.
 * For this portfolio use-case (low traffic, short sessions) this is acceptable.
 * The DB (AiConversation) is the canonical source of truth for transcripts.
 *
 * Security:
 *  - Sessions are identified by an opaque UUID (crypto.randomUUID).
 *  - Every access validates sessionId AND ipHash together.
 *  - Expired sessions are automatically purged.
 */

import type { AgentSession, AgentMode } from "@/types/ai";
import { AI_CONFIG } from "./config";
import { hashIp } from "./security";
import { prisma } from "@/lib/db";

// Module-level Map — isolated per serverless instance.
// eslint-disable-next-line no-var
const sessions = new Map<string, AgentSession>();

// ── Cleanup ──────────────────────────────────────────────────────────────────

/**
 * Remove sessions that have exceeded their maximum allowed duration.
 * Called on every session operation to keep memory bounded.
 */
function purgeExpiredSessions(): void {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    const maxMs =
      session.mode === "voice"
        ? AI_CONFIG.maxVoiceSessionSeconds * 1000
        : AI_CONFIG.maxChatSessionSeconds * 1000;

    // Hard limit timeout or idle timeout (no activity for 90s on voice)
    const isOverMax = now - session.createdAt.getTime() > maxMs + 30_000;
    const isVoiceIdle =
      session.mode === "voice" &&
      now - session.lastActivity.getTime() > 120_000; // 2 min idle grace

    if (isOverMax || isVoiceIdle) {
      sessions.delete(sessionId);
    }
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Terminate all existing sessions associated with an IP hash.
 * Used when a visitor starts a fresh session so they don't block themselves.
 */
export function terminateSessionsForIp(ipHash: string): void {
  for (const [sessionId, session] of sessions.entries()) {
    if (session.ipHash === ipHash) {
      sessions.delete(sessionId);
    }
  }
}

/**
 * Create a new session record.
 * Returns the created session.
 */
export function createSession(
  sessionId: string,
  conversationId: string,
  ip: string,
  mode: AgentMode
): AgentSession {
  purgeExpiredSessions();

  const session: AgentSession = {
    sessionId,
    conversationId,
    ipHash: hashIp(ip),
    mode,
    createdAt: new Date(),
    lastActivity: new Date(),
    toolCallCount: 0,
    webSearchCount: 0,
    voiceStartedAt: mode === "voice" ? new Date() : null,
    state: "CONNECTING",
  };

  sessions.set(sessionId, session);
  return session;
}

/**
 * Retrieve a session by ID.
 * Returns null if not found or expired.
 */
export function getSession(sessionId: string): AgentSession | null {
  purgeExpiredSessions();
  return sessions.get(sessionId) ?? null;
}

/**
 * Validate that the sessionId belongs to the given IP.
 * Returns the session on success, null on failure (not found or IP mismatch).
 *
 * Checks in-memory registry first, then falls back to Prisma DB to survive
 * server restarts, Turbopack HMR reloads, and multi-worker serverless setups.
 */
export async function validateSession(
  sessionId: string,
  ip: string
): Promise<AgentSession | null> {
  purgeExpiredSessions();
  const ipH = hashIp(ip);
  let session = sessions.get(sessionId);

  if (!session) {
    try {
      const conv = await prisma.aiConversation.findUnique({
        where: { sessionId },
      });
      if (conv && conv.ipHash === ipH && !conv.endedAt) {
        const restoredSession: AgentSession = {
          sessionId,
          conversationId: conv.id,
          ipHash: conv.ipHash,
          mode: conv.mode as AgentMode,
          createdAt: conv.startedAt,
          lastActivity: new Date(),
          toolCallCount: 0,
          webSearchCount: 0,
          voiceStartedAt: conv.mode === "voice" ? conv.startedAt : null,
          state: "IDLE",
        };
        sessions.set(sessionId, restoredSession);
        session = restoredSession;
      }
    } catch (err) {
      console.error("[AI:SessionStore] DB fallback lookup failed:", err);
    }
  }

  if (!session) return null;
  if (session.ipHash !== ipH) return null;
  return session;
}

/**
 * Check if a voice session has exceeded the 10-minute limit.
 */
export function isVoiceSessionExpired(session: AgentSession): boolean {
  if (session.mode !== "voice" || !session.voiceStartedAt) return false;
  const elapsedMs = Date.now() - session.voiceStartedAt.getTime();
  return elapsedMs >= AI_CONFIG.maxVoiceSessionSeconds * 1000;
}

/**
 * Return the seconds remaining in a voice session.
 * Returns null for chat sessions.
 */
export function getVoiceSecondsRemaining(session: AgentSession): number | null {
  if (session.mode !== "voice" || !session.voiceStartedAt) return null;
  const elapsedMs = Date.now() - session.voiceStartedAt.getTime();
  const remaining = AI_CONFIG.maxVoiceSessionSeconds - Math.floor(elapsedMs / 1000);
  return Math.max(0, remaining);
}

/**
 * Update session activity timestamp and increment tool call count.
 */
export function recordToolCall(
  sessionId: string,
  isWebSearch: boolean
): void {
  const session = sessions.get(sessionId);
  if (!session) return;
  session.lastActivity = new Date();
  session.toolCallCount += 1;
  if (isWebSearch) session.webSearchCount += 1;
}

/**
 * Check if the session has hit its tool call limit.
 */
export function hasExceededToolLimit(session: AgentSession): boolean {
  return session.toolCallCount >= AI_CONFIG.maxToolCallsPerSession;
}

/**
 * Check if the session has hit its web search limit.
 */
export function hasExceededSearchLimit(session: AgentSession): boolean {
  return session.webSearchCount >= AI_CONFIG.maxWebSearchesPerSession;
}

/**
 * Terminate a session and remove it from memory.
 */
export function terminateSession(sessionId: string): void {
  sessions.delete(sessionId);
}

/**
 * Return the count of currently active voice sessions.
 */
export function getActiveVoiceSessionCount(): number {
  purgeExpiredSessions();
  let count = 0;
  for (const session of sessions.values()) {
    if (session.mode === "voice") count++;
  }
  return count;
}

/**
 * Snapshot of all active sessions (for admin/debug — never expose to browser).
 */
export function getActiveSessionCount(): number {
  purgeExpiredSessions();
  return sessions.size;
}
