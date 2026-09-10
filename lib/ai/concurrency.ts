/**
 * lib/ai/concurrency.ts
 *
 * Voice session concurrency manager.
 *
 * Enforces a hard limit of MAX_CONCURRENT_VOICE simultaneous voice sessions.
 * Additional visitors are placed into a Prisma-backed queue so their position
 * survives across serverless instances.
 *
 * Flow:
 *  tryAcquireVoiceSlot(ip)
 *    → { acquired: true }                  — slot granted, create session
 *    → { acquired: false, queueId, position, estimatedWaitSeconds }
 *                                           — no slot, enqueued
 *
 *  releaseVoiceSlot(sessionId)
 *    → promotes the next queued visitor (marks AiQueue.promoted = true)
 *
 *  getQueueStatus(queueId)
 *    → { ready: false, position, estimatedWaitSeconds }
 *    → { ready: true }  (after releaseVoiceSlot promoted them)
 */

import { prisma } from "@/lib/db";
import { AI_CONFIG } from "./config";
import { hashIp } from "./security";
import { getActiveVoiceSessionCount, terminateSessionsForIp } from "./session-store";

// ── Slot Acquisition ──────────────────────────────────────────────────────────

export type AcquireResult =
  | { acquired: true }
  | {
      acquired: false;
      queueId: string;
      position: number;
      estimatedWaitSeconds: number;
    };

const STALE_QUEUE_TIMEOUT_MS = 180 * 1000; // 3 minutes

/**
 * Clean up stale queue entries (stopped polling > 3m ago, or promoted > 3m ago without claiming).
 */
async function purgeStaleQueueEntries(): Promise<void> {
  try {
    const staleThreshold = new Date(Date.now() - STALE_QUEUE_TIMEOUT_MS);
    await prisma.aiQueue.deleteMany({
      where: {
        OR: [
          { promoted: false, lastPolledAt: { lt: staleThreshold } },
          { promoted: true, promotedAt: { lt: staleThreshold } },
        ],
      },
    });
  } catch (err) {
    console.error("[AI:Concurrency] Failed to purge stale queue entries:", err);
  }
}

/**
 * Try to acquire a voice session slot for the given IP.
 * If no slot is available, creates or reuses a queue entry and returns position.
 */
export async function tryAcquireVoiceSlot(ip: string): Promise<AcquireResult> {
  await purgeStaleQueueEntries();

  const ipHash = hashIp(ip);

  // If this visitor already has an orphaned active session in memory (e.g. page reload),
  // clear it so they don't block themselves.
  terminateSessionsForIp(ipHash);

  const activeCount = getActiveVoiceSessionCount();

  if (activeCount < AI_CONFIG.maxConcurrentVoice) {
    // Slot available — caller will create the session.
    // Clean up any leftover queue entry for this IP.
    await prisma.aiQueue.deleteMany({ where: { ipHash } }).catch(() => {});
    return { acquired: true };
  }

  // Check if this visitor already has an active queue entry (prevents race-condition wipes)
  const staleThreshold = new Date(Date.now() - STALE_QUEUE_TIMEOUT_MS);
  const existing = await prisma.aiQueue.findFirst({
    where: {
      ipHash,
      lastPolledAt: { gte: staleThreshold },
    },
    orderBy: { joinedAt: "asc" },
  });

  if (existing) {
    if (existing.promoted) {
      await prisma.aiQueue.delete({ where: { id: existing.id } }).catch(() => {});
      return { acquired: true };
    }

    // Refresh heartbeat
    await prisma.aiQueue
      .update({
        where: { id: existing.id },
        data: { lastPolledAt: new Date() },
      })
      .catch(() => {});

    const aheadCount = await prisma.aiQueue.count({
      where: {
        promoted: false,
        joinedAt: { lt: existing.joinedAt },
        lastPolledAt: { gte: staleThreshold },
      },
    });

    const position = aheadCount + 1;
    const estimatedWaitSeconds = position * AI_CONFIG.estimatedSessionDurationSeconds;
    return { acquired: false, queueId: existing.queueId, position, estimatedWaitSeconds };
  }

  // No existing entry — add to queue
  const queueId = crypto.randomUUID();

  try {
    await prisma.aiQueue.create({
      data: {
        queueId,
        ipHash,
        promoted: false,
        lastPolledAt: new Date(),
      },
    });
  } catch (err) {
    console.error("[AI:Concurrency] Failed to create queue entry:", err);
  }

  const position = await getQueueLength();
  const estimatedWaitSeconds =
    position * AI_CONFIG.estimatedSessionDurationSeconds;

  return { acquired: false, queueId, position, estimatedWaitSeconds };
}

/**
 * Called when a voice session ends or a promoted user leaves.
 * Marks the oldest actively-waiting visitor as promoted = true.
 * The browser polling /api/ai/queue/:queueId will see ready: true.
 */
export async function releaseVoiceSlot(): Promise<void> {
  try {
    await purgeStaleQueueEntries();

    const staleThreshold = new Date(Date.now() - STALE_QUEUE_TIMEOUT_MS);

    // Promote the oldest actively polling waiting visitor
    const next = await prisma.aiQueue.findFirst({
      where: {
        promoted: false,
        lastPolledAt: { gte: staleThreshold },
      },
      orderBy: { joinedAt: "asc" },
    });

    if (next) {
      await prisma.aiQueue.update({
        where: { id: next.id },
        data: {
          promoted: true,
          promotedAt: new Date(),
        },
      });
    }
  } catch (err) {
    console.error("[AI:Concurrency] Failed to release slot:", err);
  }
}

/**
 * Leave the queue explicitly.
 * Deletes the visitor's queue entry and passes the slot if already promoted.
 */
export async function leaveQueue(queueId: string, ip: string): Promise<boolean> {
  try {
    const entry = await prisma.aiQueue.findUnique({ where: { queueId } });
    if (!entry) return true;

    // Security check: only the IP that created the queue entry can remove it
    if (entry.ipHash !== hashIp(ip)) {
      return false;
    }

    await prisma.aiQueue.delete({ where: { queueId } });

    // If this visitor was already promoted, promote the next waiting visitor
    if (entry.promoted) {
      void releaseVoiceSlot();
    }

    return true;
  } catch (err) {
    console.error("[AI:Concurrency] Failed to leave queue:", err);
    return false;
  }
}

// ── Queue Status ──────────────────────────────────────────────────────────────

export type QueuePollResult =
  | { ready: false; position: number; estimatedWaitSeconds: number }
  | { ready: true };

/**
 * Check the current status of a queued visitor.
 * Called by GET /api/ai/queue/:queueId.
 */
export async function getQueueStatus(queueId: string, ip: string): Promise<QueuePollResult | null> {
  try {
    await purgeStaleQueueEntries();

    const entry = await prisma.aiQueue.findUnique({ where: { queueId } });
    if (!entry) return null;

    // Security: validate IP ownership of the queue slot
    if (entry.ipHash !== hashIp(ip)) return null;

    if (entry.promoted) {
      // Cleanup — remove from queue once admitted
      await prisma.aiQueue.delete({ where: { queueId } }).catch(() => {});
      return { ready: true };
    }

    // Refresh heartbeat
    await prisma.aiQueue
      .update({
        where: { id: entry.id },
        data: { lastPolledAt: new Date() },
      })
      .catch(() => {});

    const staleThreshold = new Date(Date.now() - STALE_QUEUE_TIMEOUT_MS);

    // Count how many non-promoted entries ahead of this one are actively waiting
    const aheadCount = await prisma.aiQueue.count({
      where: {
        promoted: false,
        joinedAt: { lt: entry.joinedAt },
        lastPolledAt: { gte: staleThreshold },
      },
    });

    const position = aheadCount + 1; // 1-indexed
    const estimatedWaitSeconds = position * AI_CONFIG.estimatedSessionDurationSeconds;

    return { ready: false, position, estimatedWaitSeconds };
  } catch (err) {
    console.error("[AI:Concurrency] Failed to get queue status:", err);
    return null;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getQueueLength(): Promise<number> {
  try {
    const staleThreshold = new Date(Date.now() - STALE_QUEUE_TIMEOUT_MS);
    return await prisma.aiQueue.count({
      where: {
        promoted: false,
        lastPolledAt: { gte: staleThreshold },
      },
    });
  } catch {
    return 1;
  }
}

