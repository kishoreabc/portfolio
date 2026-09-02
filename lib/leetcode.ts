/**
 * LeetCode data fetching (server-side proxy)
 *
 * LeetCode has no official API. This file proxies the well-known
 * public GraphQL endpoint server-side (no CORS issues).
 *
 * The response is cached in SiteConfig.leetcodeCache (24h TTL).
 * If the API is unavailable, we serve the last cached data.
 * If no cache exists, we return null and the UI shows manual stats.
 */
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import type { LeetCodeDay, LeetCodeHeatmapData } from "@/types";

const LEETCODE_GRAPHQL = "https://leetcode.com/graphql";

const USER_PROFILE_AND_STATS_QUERY = `
  query userProfileAndStats($username: String!) {
    matchedUser(username: $username) {
      userCalendar {
        activeYears
        streak
        totalActiveDays
        submissionCalendar
      }
      submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
          submissions
        }
      }
    }
  }
`;

interface LeetCodeCachePayload {
  submissionCalendar: Record<string, number>;
  streak: number;
  totalActiveDays: number;
  solvedTotal: number;
  solvedEasy: number;
  solvedMedium: number;
  solvedHard: number;
}

/**
 * Fetches LeetCode submission calendar and solved problem stats for past year.
 * Returns raw payload or null on failure.
 */
async function fetchLeetCodeData(
  username: string
): Promise<LeetCodeCachePayload | null> {
  try {
    const res = await fetch(LEETCODE_GRAPHQL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Referer": "https://leetcode.com",
        "User-Agent": "Mozilla/5.0 (compatible; portfolio-bot/1.0)",
      },
      body: JSON.stringify({
        query: USER_PROFILE_AND_STATS_QUERY,
        variables: { username },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000), // 8s timeout
    });

    if (!res.ok) return null;

    const data = await res.json();
    const user = data?.data?.matchedUser;
    const calendar = user?.userCalendar;
    if (!calendar?.submissionCalendar) return null;

    const parsedCalendar = JSON.parse(calendar.submissionCalendar) as Record<string, number>;

    const submitStats = user?.submitStatsGlobal?.acSubmissionNum || [];
    const getCount = (diff: string) =>
      submitStats.find((s: { difficulty: string; count: number }) => s.difficulty === diff)?.count ?? 0;

    return {
      submissionCalendar: parsedCalendar,
      streak: calendar.streak ?? 0,
      totalActiveDays: calendar.totalActiveDays ?? 0,
      solvedTotal: getCount("All"),
      solvedEasy: getCount("Easy"),
      solvedMedium: getCount("Medium"),
      solvedHard: getCount("Hard"),
    };
  } catch {
    return null;
  }
}

/**
 * Builds the full 52-week calendar array (including 0-count days)
 * aligned from 52 weeks ago up to today.
 */
function buildHeatmapData(
  payload: LeetCodeCachePayload
): LeetCodeHeatmapData {
  const raw = payload.submissionCalendar || {};

  // Build a date string (YYYY-MM-DD) -> count map
  const dateMap = new Map<string, number>();
  for (const [epoch, count] of Object.entries(raw)) {
    const d = new Date(parseInt(epoch, 10) * 1000);
    const key = d.toISOString().split("T")[0];
    dateMap.set(key, count);
  }

  // Generate 52 complete weeks ending on current date
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const endDayOfWeek = today.getUTCDay(); // 0 = Sun, 6 = Sat
  const totalDays = 52 * 7 + endDayOfWeek + 1;
  const startDate = new Date(today);
  startDate.setUTCDate(startDate.getUTCDate() - totalDays + 1);

  const days: LeetCodeDay[] = [];
  const cur = new Date(startDate);
  while (cur <= today) {
    const key = cur.toISOString().split("T")[0];
    days.push({
      date: key,
      count: dateMap.get(key) || 0,
    });
    cur.setUTCDate(cur.getUTCDate() + 1);
  }

  const totalSubmissions = Object.values(raw).reduce((sum, count) => sum + count, 0);
  const activeDays = payload.totalActiveDays || days.filter((d) => d.count > 0).length;

  return {
    days,
    totalSubmissions,
    activeDays,
    streak: payload.streak,
    solvedTotal: payload.solvedTotal,
    solvedEasy: payload.solvedEasy,
    solvedMedium: payload.solvedMedium,
    solvedHard: payload.solvedHard,
  };
}

/**
 * Gets LeetCode heatmap & solved problem data.
 * Reads from DB cache if fresh (< 24h), otherwise fetches from LeetCode.
 * Falls back to stale cache on failure, returns null if no cache.
 */
export async function getLeetCodeHeatmap(): Promise<LeetCodeHeatmapData | null> {
  const username = process.env.NEXT_PUBLIC_LEETCODE_USERNAME ?? "KISHORE-R";
  const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  // Check cache freshness
  const config = await prisma.siteConfig.findUnique({
    where: { id: "singleton" },
    select: {
      leetcodeCache: true,
      leetcodeCachedAt: true,
      leetcodeTotal: true,
      leetcodeEasy: true,
      leetcodeMedium: true,
      leetcodeHard: true,
    },
  });

  const cacheAge = config?.leetcodeCachedAt
    ? Date.now() - config.leetcodeCachedAt.getTime()
    : Infinity;

  // Format cache if existing
  const cachedPayload = config?.leetcodeCache as unknown as LeetCodeCachePayload | null;

  // Serve fresh cache (normalize if old structure)
  if (cachedPayload && cacheAge < CACHE_TTL_MS) {
    const normalized: LeetCodeCachePayload = {
      submissionCalendar:
        "submissionCalendar" in cachedPayload
          ? cachedPayload.submissionCalendar
          : (cachedPayload as unknown as Record<string, number>),
      streak: cachedPayload.streak ?? 0,
      totalActiveDays: cachedPayload.totalActiveDays ?? 0,
      solvedTotal: cachedPayload.solvedTotal ?? config?.leetcodeTotal ?? 393,
      solvedEasy: cachedPayload.solvedEasy ?? config?.leetcodeEasy ?? 225,
      solvedMedium: cachedPayload.solvedMedium ?? config?.leetcodeMedium ?? 157,
      solvedHard: cachedPayload.solvedHard ?? config?.leetcodeHard ?? 11,
    };
    return buildHeatmapData(normalized);
  }

  // Fetch fresh data
  const fresh = await fetchLeetCodeData(username);

  if (fresh) {
    // Update cache and solved stats in DB
    await prisma.siteConfig.update({
      where: { id: "singleton" },
      data: {
        leetcodeCache: fresh as unknown as Prisma.InputJsonValue,
        leetcodeCachedAt: new Date(),
        leetcodeTotal: fresh.solvedTotal,
        leetcodeEasy: fresh.solvedEasy,
        leetcodeMedium: fresh.solvedMedium,
        leetcodeHard: fresh.solvedHard,
      },
    });
    return buildHeatmapData(fresh);
  }

  // Fetch failed — serve stale cache if available
  if (cachedPayload) {
    console.warn("[LeetCode] Fetch failed, serving stale cache");
    const normalized: LeetCodeCachePayload = {
      submissionCalendar:
        "submissionCalendar" in cachedPayload
          ? cachedPayload.submissionCalendar
          : (cachedPayload as unknown as Record<string, number>),
      streak: cachedPayload.streak ?? 0,
      totalActiveDays: cachedPayload.totalActiveDays ?? 0,
      solvedTotal: cachedPayload.solvedTotal ?? config?.leetcodeTotal ?? 393,
      solvedEasy: cachedPayload.solvedEasy ?? config?.leetcodeEasy ?? 225,
      solvedMedium: cachedPayload.solvedMedium ?? config?.leetcodeMedium ?? 157,
      solvedHard: cachedPayload.solvedHard ?? config?.leetcodeHard ?? 11,
    };
    return buildHeatmapData(normalized);
  }

  // No cache at all
  return null;
}


