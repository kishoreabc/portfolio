import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Bot / scraper detection pattern
const BOT_REGEX = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|preview|headless|lighthouse|pingdom|uptime/i;

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
