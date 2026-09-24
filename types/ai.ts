/**
 * AI Agent — TypeScript Types
 *
 * Strict types for the portfolio AI agent system.
 * No `any` usage. All shapes are validated at runtime via API routes.
 */

// ─────────────────────────────────────────────
// ENUMS / UNIONS
// ─────────────────────────────────────────────

/** Current state of the AI agent UI. */
export type SessionState =
  | "IDLE"
  | "CONNECTING"
  | "LISTENING"
  | "THINKING"
  | "SPEAKING"
  | "INTERRUPTED"
  | "ERROR"
  | "DISCONNECTED";

/** Interaction mode — voice uses microphone + audio playback; chat is text only. */
export type AgentMode = "voice" | "chat";

/** Source attribution for a tool response. */
export type ToolSource = "portfolio" | "github" | "tavily" | "grounding" | "none";

// ─────────────────────────────────────────────
// SESSION
// ─────────────────────────────────────────────

/** In-memory session record (not persisted — DB uses AiConversation). */
export interface AgentSession {
  sessionId: string;
  conversationId: string;
  ipHash: string; // SHA-256 of real IP
  mode: AgentMode;
  createdAt: Date;
  lastActivity: Date;
  toolCallCount: number;
  webSearchCount: number;
  voiceStartedAt: Date | null; // null for chat mode
  state: SessionState;
  revoked?: boolean;
  revokeReason?: string;
}

export interface KnownPortfolioProject {
  title: string;
  slug: string;
  shortDescription?: string | null;
  technologies?: string[];
  githubUrl?: string | null;
  liveUrl?: string | null;
}

export interface KnownPortfolioBlogPost {
  title: string;
  slug: string;
  summary: string;
  tags: string[];
  readTime?: string | null;
  canonicalUrl?: string | null;
  url: string;
  publishedAt?: string | null;
}

export interface KnownPortfolioResources {
  resumeUrl?: string;
  githubUrl?: string;
  leetcodeUrl?: string;
  linkedinUrl?: string;
  projects?: KnownPortfolioProject[];
  blogPosts?: KnownPortfolioBlogPost[];
}

/** Response returned by POST /api/ai/session when slot is available. */
export interface EphemeralTokenResponse {
  sessionId: string;
  conversationId: string;
  token: string;
  expiresAt: string; // ISO timestamp
  systemInstruction?: string;
  model?: string;
  voiceTimeoutSeconds: number; // how long the voice session will last
  voiceWarningSeconds?: number;
  resources?: KnownPortfolioResources;
}

/** Response returned by POST /api/ai/session when all slots are taken (voice). */
export interface QueuedResponse {
  queued: true;
  queueId: string; // opaque UUID to poll with
  position: number; // 1-indexed position in queue
  estimatedWaitSeconds: number;
}

/** Union of possible /api/ai/session responses. */
export type SessionResponse = EphemeralTokenResponse | QueuedResponse;

/** Response from GET /api/ai/queue/:queueId while still waiting. */
export interface QueueStatusWaiting {
  ready: false;
  position: number;
  estimatedWaitSeconds: number;
}

/** Response from GET /api/ai/queue/:queueId when slot is now available. */
export interface QueueStatusReady {
  ready: true;
  sessionId: string;
  conversationId: string;
  token: string;
  expiresAt: string;
  voiceTimeoutSeconds: number;
  voiceWarningSeconds?: number;
  resources?: KnownPortfolioResources;
}

export type QueueStatusResponse = QueueStatusWaiting | QueueStatusReady;

// ─────────────────────────────────────────────
// TOOLS
// ─────────────────────────────────────────────

/** Exhaustive allowlist of tool names. Nothing outside this list can be invoked. */
export const ALLOWED_TOOLS = [
  "get_my_profile",
  "get_my_projects",
  "get_my_skills",
  "get_my_education",
  "get_my_certifications",
  "get_my_social_links",
  "get_my_resume",
  "get_my_blog_posts",
  "get_my_github",
  "get_my_github_repositories",
  "get_github_repository",
  "get_github_repository_readme",
  "get_github_activity",
  "search_my_public_web_presence",
] as const;

export type AllowedToolName = (typeof ALLOWED_TOOLS)[number];

/** Inbound tool call request from the browser (relayed from Gemini). */
export interface ToolRequest {
  sessionId: string;
  toolName: AllowedToolName;
  args: Record<string, unknown>;
  callId: string;
}

/** Successful tool response. */
export interface ToolSuccess {
  callId: string;
  result: unknown;
  toolsUsed: AllowedToolName[];
  source: ToolSource;
  durationMs: number;
}

/** Tool failure response (user-friendly error only, no stack trace). */
export interface ToolFailure {
  callId: string;
  error: string; // safe user-facing message
}

export type ToolResponse = ToolSuccess | ToolFailure;

// ─────────────────────────────────────────────
// TRANSCRIPT
// ─────────────────────────────────────────────

/** A single turn in the conversation transcript. */
export interface TranscriptEntry {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  toolsUsed?: AllowedToolName[];
  source?: ToolSource;
}

/** Request body for POST /api/ai/conversation/message */
export interface SaveMessageRequest {
  sessionId: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  toolsUsed?: string[];
}

// ─────────────────────────────────────────────
// ERRORS
// ─────────────────────────────────────────────

export type AIErrorCode =
  | "RATE_LIMITED"
  | "DAILY_BUDGET_EXHAUSTED"
  | "QUEUE_FULL"
  | "SESSION_EXPIRED"
  | "SESSION_NOT_FOUND"
  | "SESSION_OWNERSHIP_MISMATCH"
  | "TOOL_NOT_ALLOWED"
  | "TOOL_LIMIT_EXCEEDED"
  | "TOOL_TIMEOUT"
  | "GITHUB_UNAVAILABLE"
  | "SEARCH_QUOTA_EXHAUSTED"
  | "GEMINI_UNAVAILABLE"
  | "MIC_DENIED"
  | "VOICE_TIME_LIMIT_REACHED"
  | "INTERNAL_ERROR";

/** Structured AI error — never exposed raw to the browser. */
export interface AIError {
  code: AIErrorCode;
  userMessage: string; // safe, friendly message for UI display
  retryAfterSeconds?: number;
}

// ─────────────────────────────────────────────
// PORTFOLIO DATA SHAPES (returned by tools)
// ─────────────────────────────────────────────

export interface PortfolioProfile {
  name: string;
  headline: string;
  bio: string;
  location: string;
  contactEmail: string;
  portfolioUrl: string;
  linkedinUrl: string;
  resumeUrl: string;
  availabilityStatus: string;
  achievements?: Array<{
    id?: string;
    title: string;
    metric?: string;
    description?: string;
    url?: string;
  }> | string[];
  journey?: Array<{
    id?: string;
    title: string;
    organization?: string;
    period?: string;
    year?: string;
    description?: string;
    type?: string;
  }>;
  leetcodeStats?: { total: number; easy: number; medium: number; hard: number };
}

export interface PortfolioBlogPost {
  title: string;
  slug: string;
  summary: string;
  content?: string | null;
  tags: string[];
  readTime: string | null;
  canonicalUrl: string | null;
  url: string;
  publishedAt: string | null;
}

export interface PortfolioProject {
  title: string;
  slug: string;
  shortDescription: string;
  technologies: string[];
  githubUrl: string | null;
  liveUrl: string | null;
  featured: boolean;
  metrics: string | null;
}

export interface PortfolioSkill {
  name: string;
  category: string;
}

export interface PortfolioEducation {
  institution: string;
  degree: string;
  field: string | null;
  startDate: string | null;
  endDate: string | null;
  score: string | null;
}

export interface PortfolioCertification {
  title: string;
  issuer: string;
  issueDate: string | null;
  expiryDate: string | null;
  credentialId: string | null;
  credentialUrl: string | null;
  imageUrl: string | null;
  description: string | null;
}

export interface PortfolioSocialLink {
  platform: string;
  url: string;
}

// ─────────────────────────────────────────────
// GITHUB DATA SHAPES (returned by tools)
// ─────────────────────────────────────────────

export interface GitHubPublicProfile {
  login: string;
  name: string | null;
  bio: string | null;
  publicRepos: number;
  followers: number;
  following: number;
  htmlUrl: string;
}

export interface GitHubRepository {
  name: string;
  description: string | null;
  language: string | null;
  topics: string[];
  stars: number;
  forks: number;
  updatedAt: string;
  htmlUrl: string;
  isPrivate: boolean;
}

// ─────────────────────────────────────────────
// SEARCH RESULT SHAPES
// ─────────────────────────────────────────────

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: "tavily" | "grounding";
}

// ─────────────────────────────────────────────
// CONCURRENCY
// ─────────────────────────────────────────────

export interface ConcurrencyStatus {
  activeCount: number;
  maxConcurrent: number;
  queueLength: number;
  hasSlot: boolean;
}

export interface VoiceQueueItem {
  id: string;
  queueId: string;
  ip: string;
  joinedAt: string;
  lastPolledAt: string;
  promoted: boolean;
  promotedAt: string | null;
  position: number;
  estimatedWaitSeconds: number;
}

export interface ActiveVoiceSessionItem {
  id: string;
  sessionId: string;
  ip: string; // raw IP address e.g. "192.168.0.1"
  startedAt: string; // ISO string
  durationSeconds: number;
  messageCount: number;
  isNew: boolean; // connected within last 60 seconds
}

export interface VoiceQueueData {
  queue: VoiceQueueItem[];
  waitingCount: number;
  promotedCount: number;
  activeVoiceCount: number;
  maxConcurrentVoice: number;
  activeSessions: ActiveVoiceSessionItem[];
}

// ─────────────────────────────────────────────
// FETCHED ARTIFACTS (for Voice Mode & Resources)
// ─────────────────────────────────────────────

export type ArtifactType =
  | "resume"
  | "project"
  | "blog"
  | "github"
  | "leetcode"
  | "linkedin"
  | "search"
  | "link";

export interface FetchedArtifact {
  id: string;
  type: ArtifactType;
  title: string;
  description?: string;
  url: string;
  meta?: string;
  badge?: string;
  secondaryUrl?: string;
  secondaryLabel?: string;
  timestamp: Date;
}

