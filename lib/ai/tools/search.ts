/**
 * lib/ai/tools/search.ts
 *
 * Dual web search: Tavily (free tier) + Google Search Grounding (Gemini native).
 *
 * Strategy:
 *  1. Tavily search — scoped query, returns top results with snippets.
 *  2. Google Search Grounding — configured as a tool in the Live session config;
 *     Gemini uses it automatically when needed. No direct call needed here.
 *
 * All Tavily queries are automatically scoped to Kishore to prevent misuse.
 * Search is disabled when daily quota is exhausted (fail closed).
 *
 * Security:
 *  - TAVILY_API_KEY is server-side only.
 *  - Search results are sanitized before returning to model.
 *  - No arbitrary URLs are fetched.
 */

import { AI_CONFIG } from "../config";
import { sanitizeExternalContent } from "../security";
import type { SearchResult } from "@/types/ai";

const TAVILY_API_URL = "https://api.tavily.com/search";

// ── Tavily Search ─────────────────────────────────────────────────────────────

/**
 * Perform a Tavily search scoped to Kishore's public web presence.
 * Returns sanitized search results or null on failure.
 */
export async function searchMyPublicWebPresence(
  query: string
): Promise<SearchResult[] | null> {
  if (!AI_CONFIG.enableTavilySearch) {
    return null;
  }

  const apiKey = process.env.TAVILY_API_KEY?.trim();
  if (!apiKey) {
    console.warn("[AI:Search] TAVILY_API_KEY not configured — skipping Tavily search");
    return null;
  }

  // Scope the query to Kishore — prevents general-purpose web browsing
  const scopedQuery = `${query} Kishore R kishoreabc`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_CONFIG.searchToolTimeoutMs);

  try {
    const res = await fetch(TAVILY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: scopedQuery,
        search_depth: "basic",
        max_results: 5,
        include_answer: false,
        include_domains: [
          "github.com",
          "linkedin.com",
          "kishoreabc.dev",
          "medium.com",
          "dev.to",
        ],
        // Exclude irrelevant aggregator sites
        exclude_domains: ["reddit.com", "quora.com", "facebook.com"],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const body = await res.text();
      // Detect quota exhaustion — fail closed without retrying
      if (res.status === 429 || body.includes("quota") || body.includes("limit")) {
        console.warn("[AI:Search] Tavily quota exhausted — search disabled");
        return null;
      }
      console.error(`[AI:Search] Tavily error ${res.status}:`, body.slice(0, 200));
      return null;
    }

    const data = await res.json() as {
      results?: { title: string; url: string; content: string }[];
    };

    if (!data.results?.length) return null;

    return data.results
      .filter((r) => r.url && r.title)
      .map((r) => ({
        title: sanitizeExternalContent(r.title),
        url: r.url,
        snippet: sanitizeExternalContent(r.content?.slice(0, 500) ?? ""),
        source: "tavily" as const,
      }));
  } catch (err) {
    clearTimeout(timeout);
    if ((err as Error)?.name === "AbortError") {
      console.warn("[AI:Search] Tavily search timed out");
    } else {
      console.error("[AI:Search] Tavily search error:", err);
    }
    return null;
  }
}

// ── Google Search Grounding ───────────────────────────────────────────────────

/**
 * Returns the Google Search grounding tool declaration for the Gemini Live session.
 * This is injected into the session config — Gemini invokes it automatically.
 * No direct function call needed on our side.
 *
 * When AI_ENABLE_GOOGLE_GROUNDING is false or daily search quota is exhausted,
 * this returns null (tool is not offered to the model).
 */
export function getGoogleGroundingToolConfig(searchEnabled: boolean): object | null {
  if (!AI_CONFIG.enableGoogleGrounding || !searchEnabled) return null;

  return {
    googleSearch: {},
  };
}

// ── URL Safety ────────────────────────────────────────────────────────────────

const BLOCKED_PATTERNS = [
  /^https?:\/\/localhost/i,
  /^https?:\/\/127\./,
  /^https?:\/\/0\./,
  /^https?:\/\/10\./,
  /^https?:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^https?:\/\/192\.168\./,
  /^https?:\/\/169\.254\./,
  /^https?:\/\/\[?::1\]?/,
  /169\.254\.169\.254/, // AWS/GCP metadata endpoint
  /metadata\.google\.internal/,
];

/**
 * Validates that a URL is safe to include in responses.
 * Blocks private/internal network destinations.
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    return !BLOCKED_PATTERNS.some((pattern) => pattern.test(url));
  } catch {
    return false;
  }
}
