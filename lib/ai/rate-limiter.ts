/**
 * lib/ai/rate-limiter.ts
 *
 * AI-specific in-memory rate limiter.
 * Follows the same pattern as the existing lib/rate-limit.ts but is
 * scoped to AI operations with independent limits.
 *
 * Limitations: resets on cold starts (Vercel serverless).
 * For a portfolio with moderate traffic, this is sufficient.
 * Upgrade path: Upstash Redis (free tier) via @upstash/ratelimit.
 */

import { AI_CONFIG } from "./config";
import { hashIp } from "./security";

interface RateLimitEntry {
  count: number;
  resetAt: number; // Unix ms
}

// Per-IP voice session creation: max N sessions per 24 hours
const voiceSessionStore = new Map<string, RateLimitEntry>();
const VOICE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

// Per-IP tool call rate (coarse guard against hammering /api/ai/tool)
const toolCallStore = new Map<string, RateLimitEntry>();
const TOOL_WINDOW_MS = 60 * 1000; // 1 minute
const TOOL_LIMIT_PER_MINUTE = 30; // max tool calls per IP per minute

// Cleanup stale entries every 10 minutes
function cleanup(store: Map<string, RateLimitEntry>): void {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(key);
  }
}

setInterval(() => {
  cleanup(voiceSessionStore);
  cleanup(toolCallStore);
}, 10 * 60 * 1000);

// ── Voice Session Rate Limit ──────────────────────────────────────────────────

/**
 * Check if the given IP can create a new voice session today.
 * Returns { allowed: true } or { allowed: false, retryAfterSeconds }.
 */
export function checkVoiceSessionRateLimit(ip: string): {
  allowed: boolean;
  retryAfterSeconds?: number;
} {
  const key = `vs:${hashIp(ip)}`;
  const now = Date.now();
  const entry = voiceSessionStore.get(key);
  const limit = AI_CONFIG.maxVoiceSessionsPerIpPerDay;

  if (!entry || now > entry.resetAt) {
    voiceSessionStore.set(key, { count: 1, resetAt: now + VOICE_WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= limit) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  entry.count++;
  return { allowed: true };
}

// ── Tool Call Rate Limit ──────────────────────────────────────────────────────

/**
 * Check if the given IP is hammering the tool endpoint.
 * Coarse guard — per-session limits are the primary mechanism.
 */
export function checkToolCallRateLimit(ip: string): {
  allowed: boolean;
  retryAfterSeconds?: number;
} {
  const key = `tc:${hashIp(ip)}`;
  const now = Date.now();
  const entry = toolCallStore.get(key);

  if (!entry || now > entry.resetAt) {
    toolCallStore.set(key, { count: 1, resetAt: now + TOOL_WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= TOOL_LIMIT_PER_MINUTE) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  entry.count++;
  return { allowed: true };
}
