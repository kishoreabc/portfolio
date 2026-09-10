/**
 * lib/ai/security.ts
 *
 * Shared security utilities for the AI agent.
 * Centralised here so the hashing strategy is consistent everywhere.
 */

import { createHash } from "crypto";
import { AI_CONFIG } from "./config";

/**
 * Hash an IP address with SHA-256 for privacy-safe storage.
 * We never store raw IPs in the DB.
 */
export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}

/**
 * Extract the visitor's real IP from a Next.js request.
 * Checks headers in priority order, falls back to "unknown".
 */
export function extractIp(request: Request): string {
  const headers = request.headers;
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    headers.get("cf-connecting-ip") ??
    "unknown"
  );
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
      "Your voice session has ended (10-minute limit). You can start a new session anytime.",
    INTERNAL_ERROR: "Something went wrong. Please try again.",
  };
  return messages[code] ?? messages.INTERNAL_ERROR;
}
