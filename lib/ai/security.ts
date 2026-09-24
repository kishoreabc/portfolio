/**
 * lib/ai/security.ts
 *
 * Shared security utilities for the AI agent.
 * Centralised here so the hashing strategy is consistent everywhere.
 */

import { AI_CONFIG } from "./config";

/**
 * IP address handler. Returns the raw IP address directly without hashing,
 * e.g. "192.168.0.1" or "127.0.0.1".
 */
export function hashIp(ip: string): string {
  return ip?.trim() || "127.0.0.1";
}

/**
 * Extract the visitor's real client IP from a Next.js request.
 *
 * Priority order:
 *  1. x-real-ip          — set by reverse proxy / Vercel
 *  2. cf-connecting-ip   — set by Cloudflare
 *  3. x-forwarded-for    — client IP is the first entry
 *  4. request.ip         — NextRequest standard property
 *  5. "127.0.0.1"        — default local fallback
 */
export function extractIp(request: Request): string {
  const headers = request.headers;
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cfIp = headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const entries = xff.split(",").map((s) => s.trim()).filter(Boolean);
    if (entries.length > 0) return entries[0];
  }

  if ("ip" in request && typeof (request as { ip?: string }).ip === "string" && (request as { ip: string }).ip) {
    return (request as { ip: string }).ip.trim();
  }

  return "127.0.0.1";
}

/**
 * Validate the request Origin header against the configured allowlist.
 * If allowedOrigins is empty, all origins are permitted (development mode).
 * Returns true if the origin is allowed.
 */
export function isOriginAllowed(request: Request): boolean {
  if (process.env.NODE_ENV === "development") return true; // dev mode: allow all
  const { allowedOrigins } = AI_CONFIG;
  if (allowedOrigins.length === 0) return true;

  const origin = request.headers.get("origin") ?? "";
  if (!origin) return true;
  if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) return true;

  return allowedOrigins.some((allowed) => origin === allowed);
}

/**
 * Validate that the request Content-Type is application/json.
 */
export function isJsonContentType(request: Request): boolean {
  const ct = request.headers.get("content-type") ?? "";
  return ct.includes("application/json");
}

/**
 * Sanitize a string value retrieved from an external source (GitHub, search).
 * Strips common prompt injection patterns before the value is sent to the model.
 *
 * This is a best-effort defence — the system prompt is the primary guardrail.
 */
export function sanitizeExternalContent(raw: string): string {
  // Truncate excessively large content
  const maxLength = 6000;
  let content = raw.length > maxLength ? raw.slice(0, maxLength) + "\n[Content truncated]" : raw;

  // Remove lines that look like instruction injections
  const injectionPatterns = [
    /ignore\s+(your\s+)?(previous|prior|all|above|system)\s+instructions?/gi,
    /forget\s+(your\s+)?(previous|prior|all|above|system)\s+instructions?/gi,
    /you\s+are\s+now\s+a\s+(general|different|new)/gi,
    /reveal\s+(the\s+)?(api\s+key|token|secret|password|env)/gi,
    /show\s+(me\s+)?(your\s+)?(system\s+prompt|hidden\s+instructions?|api\s+key)/gi,
    /new\s+instructions?\s*:/gi,
    /\[\[.*?\]\]/g, // remove [[jailbreak]] style tags
    /<\|.*?\|>/g,   // remove <|im_start|> style tokens
  ];

  for (const pattern of injectionPatterns) {
    content = content.replace(pattern, "[redacted]");
  }

  return content;
}

/**
 * Produce a safe, user-facing error message.
 * Never exposes internal error details, stack traces, or provider errors.
 */
export function toSafeErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    RATE_LIMITED: "You've made too many requests. Please wait a moment before trying again.",
    DAILY_BUDGET_EXHAUSTED:
      "The AI assistant has reached its free usage limit for today. Please try again tomorrow.",
    QUEUE_FULL: "All conversation slots are currently occupied. Please try again in a few minutes.",
    SESSION_EXPIRED: "Your session has expired. Please start a new conversation.",
    SESSION_NOT_FOUND: "Session not found. Please start a new conversation.",
    SESSION_OWNERSHIP_MISMATCH: "Session validation failed. Please start a new conversation.",
    TOOL_NOT_ALLOWED: "That operation is not available.",
    TOOL_LIMIT_EXCEEDED: "Too many tool calls in this session. Please start a new conversation.",
    TOOL_TIMEOUT: "I couldn't retrieve that information in time. Please try again.",
    GITHUB_UNAVAILABLE:
      "I can't retrieve fresh GitHub information right now. Please try again later.",
    SEARCH_QUOTA_EXHAUSTED:
      "I can't perform a fresh web search right now, but I can still answer using portfolio and GitHub information.",
    GEMINI_UNAVAILABLE:
      "The AI assistant is temporarily unavailable. Please try again in a moment.",
    MIC_DENIED:
      "Microphone access was denied. Switching to text mode — you can type your questions instead.",
    VOICE_TIME_LIMIT_REACHED:
      `Your voice session has ended (${Math.round(AI_CONFIG.maxVoiceSessionSeconds / 60)}-minute limit). You can start a new session anytime.`,
    INTERNAL_ERROR: "Something went wrong. Please try again.",
  };
  return messages[code] ?? messages.INTERNAL_ERROR;
}
