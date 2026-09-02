/**
 * GitHub API integration
 *
 * Fetches contribution calendar (heatmap) and repository data
 * using the official GitHub GraphQL API.
 *
 * All fetches are server-side only — GITHUB_TOKEN never reaches the browser.
 */

const GITHUB_GRAPHQL = "https://api.github.com/graphql";
const GITHUB_USERNAME = process.env.GITHUB_USERNAME ?? "Kishoreabc";

// ─── Types ────────────────────────────────────────────────────

export interface ContributionDay {
  contributionCount: number;
  date: string;
  color: string;
}

export interface ContributionWeek {
  contributionDays: ContributionDay[];
}

export interface ContributionCalendar {
  totalContributions: number;
  weeks: ContributionWeek[];
}

export interface GitHubRepo {
  name: string;
  description: string | null;
  stargazerCount: number;
  forkCount: number;
  primaryLanguage: { name: string } | null;
  repositoryTopics: { nodes: { topic: { name: string } }[] };
  updatedAt: string;
  url: string;
}

// ─── Contribution Heatmap ─────────────────────────────────────

const HEATMAP_QUERY = `
  query($userName: String!) {
    user(login: $userName) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
              color
            }
          }
        }
      }
    }
  }
`;

/**
 * Fetches the GitHub contribution calendar for the last 52 weeks.
 * Cached by Next.js fetch cache for 12 hours (revalidate: 43200).
 * Returns null on failure — caller must handle gracefully.
 */
export async function fetchGitHubHeatmap(): Promise<ContributionCalendar | null> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.warn("[GitHub] GITHUB_TOKEN not set — skipping heatmap fetch");
    return null;
  }

  try {
    const res = await fetch(GITHUB_GRAPHQL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: HEATMAP_QUERY,
        variables: { userName: GITHUB_USERNAME },
      }),
      next: { revalidate: 43200 }, // 12 hours
    });

    if (!res.ok) {
      console.error("[GitHub] Heatmap fetch failed:", res.status, res.statusText);
      return null;
    }

    const data = await res.json();

    if (data.errors) {
      console.error("[GitHub] GraphQL errors:", data.errors);
      return null;
    }

    return data.data?.user?.contributionsCollection?.contributionCalendar ?? null;
  } catch (error) {
    console.error("[GitHub] Heatmap fetch error:", error);
    return null;
  }
}

// ─── Repository Data ──────────────────────────────────────────

const REPO_QUERY = `
  query($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      name
      description
      stargazerCount
      forkCount
      primaryLanguage { name }
      repositoryTopics(first: 10) {
        nodes { topic { name } }
      }
      updatedAt
      url
    }
  }
`;

/**
 * Fetches basic repository data for a single repo.
 * Used by the admin GitHub sync button.
 */
export async function fetchGitHubRepo(
  repoUrl: string
): Promise<GitHubRepo | null> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.warn("[GitHub] GITHUB_TOKEN not set — skipping repo fetch");
    return null;
  }

  // Extract owner/name from GitHub URL
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return null;
  const [, owner, name] = match;

  try {
    const res = await fetch(GITHUB_GRAPHQL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: REPO_QUERY,
        variables: { owner, name },
      }),
      cache: "no-store", // always fresh for admin sync
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data.errors) return null;

    return data.data?.repository ?? null;
  } catch {
    return null;
  }
}
