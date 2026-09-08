import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines clsx and tailwind-merge for conflict-free Tailwind class merging.
 * Used throughout the component library.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date for display.
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "Present";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", { year: "numeric", month: "long" });
}

/**
 * Truncates text to a max length, adding "..." if truncated.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}

/**
 * Generates a URL-safe slug from a string.
 */
export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Returns the base URL for the site.
 * Uses NEXT_PUBLIC_SITE_URL, strips trailing slashes to avoid '//' paths,
 * and defaults to 'https://www.kishoreabc.dev'.
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (!raw || raw.includes("vercel.app") || (raw.includes("localhost") && process.env.NODE_ENV === "production")) {
    return "https://www.kishoreabc.dev";
  }
  return raw.replace(/\/+$/, "");
}

/**
 * Parses timeline period strings (e.g. "2024 – Present", "2023 – 2024", "2024")
 * into numeric values for reliable chronological sorting.
 */
export function parseTimelinePeriod(period: string): { endVal: number; startVal: number } {
  if (!period) return { endVal: 0, startVal: 0 };

  const normalized = period.replace(/[–—]/g, "-").trim();
  const parts = normalized.split("-").map((p) => p.trim());

  const parseYear = (str: string): number => {
    if (!str) return 0;
    const lower = str.toLowerCase();
    if (lower.includes("present") || lower.includes("current") || lower.includes("now")) {
      return 9999;
    }
    const match = str.match(/\b(19\d\d|20\d\d)\b/);
    return match ? parseInt(match[1], 10) : 0;
  };

  const startVal = parseYear(parts[0]);
  const endVal = parts.length > 1 ? parseYear(parts[1]) : startVal;

  return { endVal, startVal };
}

/**
 * Sorts journey entries in descending chronological order (most recent / ongoing first).
 */
export function sortJourneyEntriesByTimelineDesc<T extends { period: string }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => {
    const timeA = parseTimelinePeriod(a.period);
    const timeB = parseTimelinePeriod(b.period);

    // 1. Compare end date/year (e.g. Present = 9999 > 2025 > 2024)
    if (timeB.endVal !== timeA.endVal) {
      return timeB.endVal - timeA.endVal;
    }

    // 2. If end date/year is the same (e.g. both are Present), compare start date/year
    if (timeB.startVal !== timeA.startVal) {
      return timeB.startVal - timeA.startVal;
    }

    return 0;
  });
}

