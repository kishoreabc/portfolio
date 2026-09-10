/**
 * lib/ai/tools/github.ts
 *
 * GitHub REST API tools for the portfolio AI agent.
 *
 * Security:
 *  - All requests locked to GITHUB_USERNAME — no arbitrary user lookups.
 *  - GITHUB_TOKEN never reaches the browser or the model.
 *  - README content is sanitized for prompt injection before returning to Gemini.
 *  - Private repos, private emails, tokens, and secrets are never returned.
 *
 * Performance:
 *  - In-memory cache with configurable TTL per resource type.
 *  - ETag / conditional requests reduce GitHub API quota usage.
 *
 * Rate limits:
 *  - Unauthenticated: 60 req/hour. Authenticated: 5000 req/hour.
 *  - With aggressive caching, authenticated token is rarely needed.
 */

import { AI_CONFIG } from "../config";
import { sanitizeExternalContent } from "../security";
import type { GitHubPublicProfile, GitHubRepository } from "@/types/ai";

const BASE_URL = "https://api.github.com";
const { githubUsername } = AI_CONFIG;

// ── Cache ─────────────────────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  etag?: string;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string, ttlMs: number): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > ttlMs) return null;
  return entry.data;
}

function setCached<T>(key: string, data: T, etag?: string): void {
  cache.set(key, { data, cachedAt: Date.now(), etag });
}

function getEtag(key: string): string | undefined {
  return (cache.get(key) as CacheEntry<unknown> | undefined)?.etag;
}

// ── HTTP Helper ───────────────────────────────────────────────────────────────

async function ghFetch(
  path: string,
  etag?: string,
  timeoutMs: number = AI_CONFIG.githubToolTimeoutMs
): Promise<{ data: unknown; etag?: string; notModified: boolean } | null> {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": `${githubUsername}-portfolio-ai`,
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (etag) headers["If-None-Match"] = etag;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(`${BASE_URL}${path}`, {
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (res.status === 304) return { data: null, notModified: true };
    if (!res.ok) {
      console.error(`[AI:GitHub] ${path} → ${res.status} ${res.statusText}`);
      return null;
    }

    const data = await res.json();
    const newEtag = res.headers.get("etag") ?? undefined;
    return { data, etag: newEtag, notModified: false };
  } catch (err) {
    console.error(`[AI:GitHub] Fetch error for ${path}:`, err);
    return null;
  }
}

// ── Tools ─────────────────────────────────────────────────────────────────────

/**
 * get_my_github — public GitHub profile.
 */
export async function getMyGitHub(): Promise<GitHubPublicProfile | null> {
  const cacheKey = `gh:profile:${githubUsername}`;
  const cached = getCached<GitHubPublicProfile>(cacheKey, AI_CONFIG.githubProfileCacheTtlMs);
  if (cached) return cached;

  const result = await ghFetch(`/users/${githubUsername}`, getEtag(cacheKey));
  if (!result) return null;
  if (result.notModified) return getCached<GitHubPublicProfile>(cacheKey, Infinity);

  const d = result.data as Record<string, unknown>;

  // Only return safe, public fields
  const profile: GitHubPublicProfile = {
    login: String(d.login ?? githubUsername),
    name: d.name ? String(d.name) : null,
    bio: d.bio ? sanitizeExternalContent(String(d.bio)) : null,
    publicRepos: Number(d.public_repos ?? 0),
    followers: Number(d.followers ?? 0),
    following: Number(d.following ?? 0),
    htmlUrl: String(d.html_url ?? `https://github.com/${githubUsername}`),
  };

  setCached(cacheKey, profile, result.etag);
  return profile;
}

/**
 * get_my_github_repositories — list of public repos sorted by most recently updated.
 */
export async function getMyGitHubRepositories(): Promise<GitHubRepository[]> {
  const cacheKey = `gh:repos:${githubUsername}`;
  const cached = getCached<GitHubRepository[]>(cacheKey, AI_CONFIG.githubRepoListCacheTtlMs);
  if (cached) return cached;

  const result = await ghFetch(
    `/users/${githubUsername}/repos?type=public&sort=updated&per_page=30`,
    getEtag(cacheKey)
  );
  if (!result) return [];
  if (result.notModified) return getCached<GitHubRepository[]>(cacheKey, Infinity) ?? [];

  const repos = (result.data as Record<string, unknown>[]).map(toGitHubRepository);
  setCached(cacheKey, repos, result.etag);
  return repos;
}

/**
 * get_github_repository — single repository details.
 * Only allows repos owned by GITHUB_USERNAME.
 */
export async function getGitHubRepository(repoName: string): Promise<GitHubRepository | null> {
  // Security: strip any path traversal or user prefix
  const safeName = repoName.replace(/^.*\//, "").replace(/[^a-zA-Z0-9._-]/g, "");
  if (!safeName) return null;

  const cacheKey = `gh:repo:${githubUsername}/${safeName}`;
  const cached = getCached<GitHubRepository>(cacheKey, AI_CONFIG.githubRepoCacheTtlMs);
  if (cached) return cached;

  const result = await ghFetch(`/repos/${githubUsername}/${safeName}`, getEtag(cacheKey));
  if (!result) return null;
  if (result.notModified) return getCached<GitHubRepository>(cacheKey, Infinity);

  const repo = toGitHubRepository(result.data as Record<string, unknown>);

  // Security: verify the repo actually belongs to GITHUB_USERNAME
  const rawData = result.data as Record<string, unknown> | null | undefined;
  const ownerObj = rawData?.owner as Record<string, unknown> | null | undefined;
  const ownerLogin = String(ownerObj?.login ?? "");
  if (ownerLogin.toLowerCase() !== githubUsername.toLowerCase()) {
    console.warn(`[AI:GitHub] Ownership mismatch for ${safeName} — owner: ${ownerLogin}`);
    return null;
  }

  // Never return private repos
  if (repo.isPrivate) return null;

  setCached(cacheKey, repo, result.etag);
  return repo;
}

/**
 * get_github_repository_readme — README content (sanitized, truncated).
 */
export async function getGitHubRepositoryReadme(repoName: string): Promise<string | null> {
  const safeName = repoName.replace(/^.*\//, "").replace(/[^a-zA-Z0-9._-]/g, "");
  if (!safeName) return null;

  const cacheKey = `gh:readme:${githubUsername}/${safeName}`;
  const cached = getCached<string>(cacheKey, AI_CONFIG.githubReadmeCacheTtlMs);
  if (cached) return cached;

  const result = await ghFetch(
    `/repos/${githubUsername}/${safeName}/readme`,
    getEtag(cacheKey)
  );
  if (!result) return null;
  if (result.notModified) return getCached<string>(cacheKey, Infinity);

  const d = result.data as Record<string, unknown>;
  const encoded = d.content as string | undefined;
  if (!encoded) return null;

  // Decode base64 content
  const rawContent = Buffer.from(encoded.replace(/\n/g, ""), "base64").toString("utf-8");

  // CRITICAL: sanitize before sending to model (prompt injection defence)
  const sanitized = sanitizeExternalContent(rawContent);

  setCached(cacheKey, sanitized, result.etag);
  return sanitized;
}

/**
 * get_github_activity — recent public push events.
 */
export async function getGitHubActivity(): Promise<
  { repoName: string; pushedAt: string; message?: string }[]
> {
  const cacheKey = `gh:activity:${githubUsername}`;
  const cached = getCached<{ repoName: string; pushedAt: string }[]>(
    cacheKey,
    AI_CONFIG.githubActivityCacheTtlMs
  );
  if (cached) return cached;

  const result = await ghFetch(
    `/users/${githubUsername}/events/public?per_page=20`,
    getEtag(cacheKey)
  );
  if (!result) return [];
  if (result.notModified) return getCached<{ repoName: string; pushedAt: string }[]>(cacheKey, Infinity) ?? [];

  const events = result.data as Record<string, unknown>[];
  const pushEvents = events
    .filter((e) => e.type === "PushEvent")
    .slice(0, 5)
    .map((e) => ({
      repoName: String((e.repo as Record<string, unknown>)?.name ?? "").replace(`${githubUsername}/`, ""),
      pushedAt: String(e.created_at ?? ""),
    }));

  setCached(cacheKey, pushEvents, result.etag);
  return pushEvents;
}

// ── Private Helpers ───────────────────────────────────────────────────────────

function toGitHubRepository(d: Record<string, unknown>): GitHubRepository {
  const topics = ((d.topics as string[] | undefined) ?? []).map(String);

  return {
    name: String(d.name ?? ""),
    description: d.description ? sanitizeExternalContent(String(d.description)) : null,
    language: d.language ? String(d.language) : null,
    topics,
    stars: Number(d.stargazers_count ?? 0),
    forks: Number(d.forks_count ?? 0),
    updatedAt: String(d.updated_at ?? ""),
    htmlUrl: String(d.html_url ?? ""),
    isPrivate: Boolean(d.private),
  };
}
