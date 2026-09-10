/**
 * lib/ai/config.ts
 *
 * Central configuration for the portfolio AI agent.
 * All limits are sourced from environment variables with safe defaults.
 * Never import this on the client — it reads server-only env vars.
 */

function envInt(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function envBool(key: string, fallback: boolean): boolean {
  const raw = process.env[key];
  if (!raw) return fallback;
  return raw.toLowerCase() !== "false";
}

export const AI_CONFIG = {
  // ── Model ────────────────────────────────────────────────────────
  model: "gemini-3.1-flash-live-preview" as const,

  // ── Concurrency (voice sessions only) ────────────────────────────
  maxConcurrentVoice: envInt("AI_MAX_CONCURRENT_VOICE", 2),

  // ── Session Limits ────────────────────────────────────────────────
  /** Voice session hard limit in seconds (default 10 min) */
  maxVoiceSessionSeconds: envInt("AI_MAX_VOICE_SESSION_SECONDS", 600),
  /** Warning shown N seconds before voice session ends (default 2 min) */
  voiceWarningBeforeEndSeconds: envInt("AI_VOICE_WARNING_SECONDS", 120),
  /** Chat session idle timeout in seconds (default 30 min) */
  maxChatSessionSeconds: envInt("AI_MAX_CHAT_SESSION_SECONDS", 600),
  /** Max messages per session (voice or chat) */
  maxMessagesPerSession: envInt("AI_MAX_MESSAGES_PER_SESSION", 30),
  /** Max tool calls per session */
  maxToolCallsPerSession: envInt("AI_MAX_TOOL_CALLS_PER_SESSION", 20),
  /** Max web searches (Tavily + grounding combined) per session */
  maxWebSearchesPerSession: envInt("AI_MAX_WEB_SEARCHES_PER_SESSION", 5),
  /** Max voice sessions per IP per day */
  maxVoiceSessionsPerIpPerDay: envInt("AI_MAX_SESSIONS_PER_IP_PER_DAY", 10),

  // ── Daily Global Budget (Prisma-backed) ──────────────────────────
  dailySessionLimit: envInt("AI_DAILY_SESSION_LIMIT", 100),
  dailyMessageLimit: envInt("AI_DAILY_MESSAGE_LIMIT", 1000),
  dailySearchLimit: envInt("AI_DAILY_SEARCH_LIMIT", 100),
  dailyGithubLimit: envInt("AI_DAILY_GITHUB_LIMIT", 500),

  // ── Ephemeral Token ──────────────────────────────────────────────
  /** How long an ephemeral Gemini token is valid (seconds) */
  ephemeralTokenTtlSeconds: envInt("AI_EPHEMERAL_TOKEN_TTL_SECONDS", 3600),

  // ── Tool Timeouts ────────────────────────────────────────────────
  portfolioToolTimeoutMs: envInt("AI_PORTFOLIO_TOOL_TIMEOUT_MS", 6000),
  githubToolTimeoutMs: envInt("AI_GITHUB_TOOL_TIMEOUT_MS", 8000),
  searchToolTimeoutMs: envInt("AI_SEARCH_TOOL_TIMEOUT_MS", 10000),

  // ── GitHub ───────────────────────────────────────────────────────
  githubUsername: process.env.GITHUB_USERNAME ?? "Kishoreabc",
  /** Cache TTLs in milliseconds */
  githubProfileCacheTtlMs: envInt("AI_GITHUB_PROFILE_CACHE_TTL_MS", 60 * 60 * 1000),    // 60 min
  githubRepoListCacheTtlMs: envInt("AI_GITHUB_REPOLIST_CACHE_TTL_MS", 30 * 60 * 1000),   // 30 min
  githubRepoCacheTtlMs: envInt("AI_GITHUB_REPO_CACHE_TTL_MS", 60 * 60 * 1000),           // 60 min
  githubReadmeCacheTtlMs: envInt("AI_GITHUB_README_CACHE_TTL_MS", 2 * 60 * 60 * 1000),   // 2 hours
  githubActivityCacheTtlMs: envInt("AI_GITHUB_ACTIVITY_CACHE_TTL_MS", 15 * 60 * 1000),   // 15 min

  // ── Public Profile URLs ──────────────────────────────────────────
  portfolioUrl: process.env.PORTFOLIO_URL ?? "https://www.kishoreabc.dev",
  linkedinUrl: process.env.LINKEDIN_URL ?? "https://www.linkedin.com/in/kishoreabc/",
  resumeUrl: process.env.RESUME_URL ?? "",

  // ── Search Providers ─────────────────────────────────────────────
  enableTavilySearch: envBool("AI_ENABLE_TAVILY_SEARCH", true),
  enableGoogleGrounding: envBool("AI_ENABLE_GOOGLE_GROUNDING", true),

  // ── Security ─────────────────────────────────────────────────────
  /**
   * Comma-separated list of allowed request origins.
   * Empty string = allow all (development). Set in production.
   */
  allowedOrigins: (process.env.AI_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),

  // ── Queue ────────────────────────────────────────────────────────
  /** How often the browser should poll queue status (ms) */
  queuePollIntervalMs: envInt("AI_QUEUE_POLL_INTERVAL_MS", 3000),
  /** Estimate: average voice session duration for wait-time calculation */
  estimatedSessionDurationSeconds: envInt("AI_ESTIMATED_SESSION_DURATION_SECONDS", 300),
} as const;
