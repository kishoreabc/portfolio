/**
 * lib/ai/usage-limit.ts
 *
 * Prisma-backed daily usage budget for the AI agent.
 *
 * Why Prisma (not in-memory)?
 *  On Vercel serverless, each instance has isolated memory.
 *  In-memory counters would reset on cold starts and wouldn't be shared
 *  across concurrent instances, allowing the budget to be exceeded.
 *  Prisma uses the existing Neon PostgreSQL DB — no additional paid service.
 *
 * The counter row has id="daily" and is keyed by `date` (YYYY-MM-DD).
 * When the date changes, the row is reset to 0s.
 */

import { prisma } from "@/lib/db";
import { AI_CONFIG } from "./config";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

/**
 * Fetch (or create) today's usage counter row.
 * If the stored date differs from today, reset all counts to 0.
 */
async function ensureTodayRow() {
  const today = todayStr();

  try {
    const existing = await prisma.aiUsageCounter.findUnique({
      where: { id: "daily" },
    });

    if (!existing || existing.date !== today) {
      // Upsert — reset all counters for the new day.
      return await prisma.aiUsageCounter.upsert({
        where: { id: "daily" },
        create: { id: "daily", date: today, sessions: 0, messages: 0, toolCalls: 0, webSearches: 0 },
        update: { date: today, sessions: 0, messages: 0, toolCalls: 0, webSearches: 0 },
      });
    }

    return existing;
  } catch (err) {
    console.error("[AI:UsageLimit] DB error reading counter:", err);
    // Fail open — if we can't read the counter, allow the request.
    // The daily budget is a soft safety net, not a hard security gate.
    return null;
  }
}

/**
 * Check if the global daily budget allows a new session.
 * Returns { allowed: true } or { allowed: false, reason }.
 */
export async function checkDailyBudget(): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const row = await ensureTodayRow();
  if (!row) return { allowed: true }; // fail open on DB error

  if (row.sessions >= AI_CONFIG.dailySessionLimit) {
    return { allowed: false, reason: "DAILY_BUDGET_EXHAUSTED" };
  }
  if (row.messages >= AI_CONFIG.dailyMessageLimit) {
    return { allowed: false, reason: "DAILY_BUDGET_EXHAUSTED" };
  }

  return { allowed: true };
}

/**
 * Check if the daily web search quota allows another search.
 */
export async function canSearch(): Promise<boolean> {
  const row = await ensureTodayRow();
  if (!row) return true; // fail open
  return row.webSearches < AI_CONFIG.dailySearchLimit;
}

/** Increment session count. Call after successfully creating a session. */
export async function incrementSessionCount(): Promise<void> {
  try {
    await ensureTodayRow();
    await prisma.aiUsageCounter.update({
      where: { id: "daily" },
      data: { sessions: { increment: 1 } },
    });
  } catch (err) {
    console.error("[AI:UsageLimit] Failed to increment session count:", err);
  }
}

/** Increment message count. Call after saving each transcript message. */
export async function incrementMessageCount(): Promise<void> {
  try {
    await prisma.aiUsageCounter.updateMany({
      where: { id: "daily" },
      data: { messages: { increment: 1 } },
    });
  } catch (err) {
    console.error("[AI:UsageLimit] Failed to increment message count:", err);
  }
}

/** Increment tool call count. */
export async function incrementToolCallCount(): Promise<void> {
  try {
    await prisma.aiUsageCounter.updateMany({
      where: { id: "daily" },
      data: { toolCalls: { increment: 1 } },
    });
  } catch (err) {
    console.error("[AI:UsageLimit] Failed to increment tool call count:", err);
  }
}

/** Increment web search count. */
export async function incrementWebSearchCount(): Promise<void> {
  try {
    await prisma.aiUsageCounter.updateMany({
      where: { id: "daily" },
      data: { webSearches: { increment: 1 } },
    });
  } catch (err) {
    console.error("[AI:UsageLimit] Failed to increment web search count:", err);
  }
}

/** Get current daily stats (for admin panel). */
export async function getDailyStats() {
  const row = await ensureTodayRow();
  if (!row) return null;
  return {
    date: row.date,
    sessions: row.sessions,
    messages: row.messages,
    toolCalls: row.toolCalls,
    webSearches: row.webSearches,
    limits: {
      sessions: AI_CONFIG.dailySessionLimit,
      messages: AI_CONFIG.dailyMessageLimit,
      searches: AI_CONFIG.dailySearchLimit,
    },
  };
}
