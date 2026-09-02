/**
 * Shared TypeScript types for the portfolio.
 * These extend or alias Prisma-generated types where needed.
 */

// ─── Journey Entry (stored as JSON in SiteConfig) ─────────────

export interface JourneyEntry {
  id: string;
  title: string;
  organization: string;
  period: string;
  description: string;
  type: "education" | "project" | "achievement" | "certification" | "activity";
  icon: string;
}

// ─── Achievement (stored as JSON in SiteConfig) ───────────────

export interface Achievement {
  id: string;
  title: string;
  description: string;
  metric: string;
  url: string;
  icon: string;
}

// ─── LeetCode Heatmap ─────────────────────────────────────────

export interface LeetCodeDay {
  date: string;       // YYYY-MM-DD
  count: number;      // submission count
}

export interface LeetCodeHeatmapData {
  days: LeetCodeDay[];
  totalSubmissions: number;
  activeDays: number;
  streak?: number;
  solvedTotal?: number;
  solvedEasy?: number;
  solvedMedium?: number;
  solvedHard?: number;
}


// ─── GitHub Heatmap ───────────────────────────────────────────

export interface GitHubHeatmapData {
  totalContributions: number;
  weeks: {
    contributionDays: {
      contributionCount: number;
      date: string;
      color: string;
    }[];
  }[];
}

// ─── Contact form state ───────────────────────────────────────

export interface FormState {
  status: "idle" | "loading" | "success" | "error";
  message?: string;
}

// ─── Admin table action result ────────────────────────────────

export interface ActionResult {
  success: boolean;
  error?: string;
}
