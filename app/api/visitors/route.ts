import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { extractIp } from "@/lib/ai/security";

// Bot / scraper detection pattern
const BOT_REGEX = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|preview|headless|lighthouse|pingdom|uptime/i;

/**
 * Per-IP deduplication window to prevent visitor counter inflation.
 * Only the first hit per IP within DEDUP_WINDOW_MS is counted.
 * In-memory only — resets on cold start, which is fine for a portfolio.
 */
const DEDUP_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const seenIps = new Map<string, number>(); // ip → expiresAt timestamp

// Periodically clean up expired entries to avoid memory growth
setInterval(() => {
  const now = Date.now();
  for (const [ip, expiresAt] of seenIps.entries()) {
    if (now > expiresAt) seenIps.delete(ip);
  }
}, 10 * 60 * 1000); // every 10 minutes

/**
 * GET /api/visitors
 * Returns the current total visit count without incrementing.
 */
export async function GET() {
  try {
    const counter = await prisma.siteVisitorCounter.findUnique({
      where: { id: "singleton" },
    });

    return NextResponse.json(
      { totalVisits: counter?.totalVisits ?? 0 },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("[Visitors API] Failed to fetch visitor count:", error);
    return NextResponse.json(
      { totalVisits: 0, error: "Failed to fetch visitor count" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/visitors
 * Atomically increments the total visit counter in the database.
 * Filters automated crawlers and bots.
 * Deduplicates within a 5-minute window per IP to prevent inflation.
 */
export async function POST(req: NextRequest) {
  try {
    const userAgent = req.headers.get("user-agent") || "";

    // Ignore bots and crawlers to avoid inflating the count
    if (BOT_REGEX.test(userAgent)) {
      const counter = await prisma.siteVisitorCounter.findUnique({
        where: { id: "singleton" },
      });
      return NextResponse.json(
        { totalVisits: counter?.totalVisits ?? 0, ignored: true },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        }
      );
    }

    // Deduplicate: only count once per IP within DEDUP_WINDOW_MS
    const ip = extractIp(req);
    const now = Date.now();
    const seenUntil = seenIps.get(ip);
    if (seenUntil && now < seenUntil) {
      // Already counted recently — return current count without incrementing
      const counter = await prisma.siteVisitorCounter.findUnique({
        where: { id: "singleton" },
      });
      return NextResponse.json(
        { totalVisits: counter?.totalVisits ?? 0 },
        {
          headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
        }
      );
    }
    seenIps.set(ip, now + DEDUP_WINDOW_MS);

    // Atomic increment via upsert - persistent across redeploys
    const counter = await prisma.siteVisitorCounter.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        totalVisits: 1,
        lastVisitedAt: new Date(),
      },
      update: {
        totalVisits: { increment: 1 },
        lastVisitedAt: new Date(),
      },
    });

    return NextResponse.json(
      { totalVisits: counter.totalVisits },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("[Visitors API] Failed to increment visitor count:", error);
    return NextResponse.json(
      { totalVisits: 0, error: "Failed to record visitor" },
      { status: 500 }
    );
  }
}
