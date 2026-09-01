/**
 * GET /api/leetcode/heatmap
 * Public endpoint — returns LeetCode submission heatmap data.
 *
 * - Reads from DB cache (24h TTL)
 * - Fetches from LeetCode GraphQL server-side on cache miss
 * - Returns null data (not an error) if no data available
 *
 * This is a dedicated API route so Next.js can cache it separately
 * from the page render, and the client can show a skeleton.
 */
import { NextResponse } from "next/server";
import { getLeetCodeHeatmap } from "@/lib/leetcode";

export const dynamic = "force-dynamic"; // always check cache freshness

export async function GET() {
  try {
    const data = await getLeetCodeHeatmap();

    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          // Cache at CDN for 1 hour — stale-while-revalidate for 23 more
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=82800",
        },
      }
    );
  } catch (error) {
    console.error("[LeetCode Heatmap API] Error:", error);
    return NextResponse.json(
      { success: false, data: null, error: "Failed to fetch heatmap data" },
      { status: 500 }
    );
  }
}
