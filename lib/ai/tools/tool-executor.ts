/**
 * lib/ai/tools/tool-executor.ts
 *
 * Central tool dispatcher — the single point through which ALL tool calls flow.
 *
 * Security layers enforced here:
 *  4. Tool name allowlist — exact match against ALLOWED_TOOLS
 *  5. Tool input validation — typed argument parsing
 *  6. Per-session tool call limit check
 *  7. Per-session web search limit check
 *  8. Output sanitization before returning to caller
 *
 * Usage (from /api/ai/tool):
 *   const result = await executeTool({ sessionId, toolName, args, callId }, session);
 */

import { ALLOWED_TOOLS } from "@/types/ai";
import type { AllowedToolName, ToolResponse, AgentSession } from "@/types/ai";
import { hasExceededToolLimit, hasExceededSearchLimit, recordToolCall } from "../session-store";
import { incrementToolCallCount, incrementWebSearchCount } from "../usage-limit";
import { toSafeErrorMessage } from "../security";

// Portfolio tools
import {
  getMyProfile,
  getMyProjects,
  getMySkills,
  getMyEducation,
  getMyCertifications,
  getMySocialLinks,
  getMyResume,
  getMyBlogPosts,
} from "./portfolio";

// GitHub tools
import {
  getMyGitHub,
  getMyGitHubRepositories,
  getGitHubRepository,
  getGitHubRepositoryReadme,
  getGitHubActivity,
} from "./github";

// Search tools
import { searchMyPublicWebPresence } from "./search";

const SEARCH_TOOLS: AllowedToolName[] = ["search_my_public_web_presence"];

/**
 * Execute a tool call on behalf of a validated session.
 *
 * @param request - The tool call request (sessionId, toolName, args, callId)
 * @param session - The already-validated AgentSession
 * @returns ToolResponse (success or failure, never raw errors)
 */
export async function executeTool(
  request: {
    sessionId: string;
    toolName: string;
    args: Record<string, unknown>;
    callId: string;
  },
  session: AgentSession
): Promise<ToolResponse> {
  const { toolName, args, callId } = request;
  const startMs = Date.now();

  // ── Layer 4: Tool name allowlist ──────────────────────────────────────────
  if (!(ALLOWED_TOOLS as readonly string[]).includes(toolName)) {
    console.warn(`[AI:Tool] Blocked disallowed tool: "${toolName}" for session ${session.sessionId}`);
    return { callId, error: toSafeErrorMessage("TOOL_NOT_ALLOWED") };
  }

  const allowedTool = toolName as AllowedToolName;

  // ── Layer 6: Per-session tool call limit ──────────────────────────────────
  if (hasExceededToolLimit(session)) {
    return { callId, error: toSafeErrorMessage("TOOL_LIMIT_EXCEEDED") };
  }

  // ── Layer 7: Per-session web search limit ─────────────────────────────────
  const isSearchTool = SEARCH_TOOLS.includes(allowedTool);
  if (isSearchTool && hasExceededSearchLimit(session)) {
    return {
      callId,
      error: toSafeErrorMessage("SEARCH_QUOTA_EXHAUSTED"),
    };
  }

  // ── Execute ───────────────────────────────────────────────────────────────
  try {
    const result = await dispatch(allowedTool, args);

    const durationMs = Date.now() - startMs;

    // Record the call in the in-memory session (increments counters)
    recordToolCall(session.sessionId, isSearchTool);

    // Async — don't block the response on DB writes
    void incrementToolCallCount();
    if (isSearchTool) void incrementWebSearchCount();

    return {
      callId,
      result,
      toolsUsed: [allowedTool],
      source: getSource(allowedTool),
      durationMs,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const durationMs = Date.now() - startMs;

    if (message === "TOOL_TIMEOUT") {
      console.warn(`[AI:Tool] ${allowedTool} timed out after ${durationMs}ms`);
      return { callId, error: toSafeErrorMessage("TOOL_TIMEOUT") };
    }

    if (message.includes("GITHUB_UNAVAILABLE") || message.includes("GitHub")) {
      return { callId, error: toSafeErrorMessage("GITHUB_UNAVAILABLE") };
    }

    console.error(`[AI:Tool] ${allowedTool} error:`, message);
    return { callId, error: toSafeErrorMessage("INTERNAL_ERROR") };
  }
}

// ── Dispatch ──────────────────────────────────────────────────────────────────

async function dispatch(
  tool: AllowedToolName,
  args: Record<string, unknown>
): Promise<unknown> {
  switch (tool) {
    // Portfolio
    case "get_my_profile":
      return getMyProfile();
    case "get_my_projects":
      return getMyProjects(args.query ? String(args.query) : undefined);
    case "get_my_skills":
      return getMySkills();
    case "get_my_education":
      return getMyEducation();
    case "get_my_certifications":
      return getMyCertifications();
    case "get_my_social_links":
      return getMySocialLinks();
    case "get_my_resume":
      return getMyResume();
    case "get_my_blog_posts":
      return getMyBlogPosts(args.query ? String(args.query) : undefined);

    // GitHub
    case "get_my_github":
      return getMyGitHub();
    case "get_my_github_repositories":
      return getMyGitHubRepositories();
    case "get_github_repository": {
      const repo = args.repository ? String(args.repository) : "";
      if (!repo) throw new Error("Missing required argument: repository");
      return getGitHubRepository(repo);
    }
    case "get_github_repository_readme": {
      const repo = args.repository ? String(args.repository) : "";
      if (!repo) throw new Error("Missing required argument: repository");
      return getGitHubRepositoryReadme(repo);
    }
    case "get_github_activity":
      return getGitHubActivity();

    // Search
    case "search_my_public_web_presence": {
      const query = args.query ? String(args.query) : "";
      if (!query) throw new Error("Missing required argument: query");
      return searchMyPublicWebPresence(query);
    }

    default:
      // TypeScript exhaustiveness — should never reach here
      throw new Error(`TOOL_NOT_ALLOWED`);
  }
}

function getSource(tool: AllowedToolName): "portfolio" | "github" | "tavily" | "none" {
  if (tool.startsWith("get_my_github") || tool.startsWith("get_github")) return "github";
  if (tool === "search_my_public_web_presence") return "tavily";
  return "portfolio";
}
