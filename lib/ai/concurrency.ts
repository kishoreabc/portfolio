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
import { terminateSessionsForIp } from "./session-store";

// ── Slot Acquisition ──────────────────────────────────────────────────────────

export type AcquireResult =
  | { acquired: true }
  | {
      acquired: false;
      queueId: string;
      position: number;
      estimatedWaitSeconds: number;
    };

export const WAITING_STALE_TIMEOUT_MS = 60 * 1000; // 60 seconds without heartbeat polling = abandoned waiting spot
export const PROMOTED_CLAIM_TIMEOUT_MS = 45 * 1000; // 45 seconds to claim a promoted slot before it rolls over

/**
 * Clean up stale queue entries:
 * - Unpromoted visitors who stopped polling > 60s ago
 * - Promoted visitors who did not claim their slot within 45s
 * - Zombie voice conversations that exceeded max duration limit
 */
export async function purgeStaleQueueEntries(): Promise<void> {
  try {
    const waitingThreshold = new Date(Date.now() - WAITING_STALE_TIMEOUT_MS);
    const promotedThreshold = new Date(Date.now() - PROMOTED_CLAIM_TIMEOUT_MS);

    await prisma.aiQueue.deleteMany({
      where: {
        OR: [
          { promoted: false, lastPolledAt: { lt: waitingThreshold } },
          { promoted: true, promotedAt: { lt: promotedThreshold } },
        ],
      },
    });

    // Proactively clean up any zombie DB voice sessions that exceeded hard limit
    const hardVoiceLimit = new Date(
      Date.now() - (AI_CONFIG.maxVoiceSessionSeconds * 1000 + 30_000)
    );
    await prisma.aiConversation
      .updateMany({
        where: {
          mode: "voice",
          endedAt: null,
          startedAt: { lt: hardVoiceLimit },
        },
        data: { endedAt: new Date() },
      })
      .catch(() => {});
  } catch (err) {
    console.error("[AI:Concurrency] Failed to purge stale queue entries:", err);
  }
}

/**
 * Terminate all existing voice sessions for a given IP in both memory and database.
 * Enforces the invariant: 1 IP address = maximum 1 active voice session.
 */
export async function terminateExistingVoiceSessionsForIp(ipHash: string): Promise<void> {
  try {
    terminateSessionsForIp(ipHash);

    await prisma.aiConversation.updateMany({
      where: {
        ipHash,
        mode: "voice",
        endedAt: null,
      },
      data: {
        endedAt: new Date(),
      },
    });
  } catch (err) {
    console.error("[AI:Concurrency] Failed to terminate existing voice sessions for IP:", err);
  }
}

/**
 * Count active voice sessions using the DB as the source of truth.
 * Bounded by maxVoiceSessionSeconds so dead sessions never permanently consume slots.
 */
export async function getActiveVoiceSessionCountFromDb(): Promise<number> {
  try {
    const hardVoiceLimit = new Date(
      Date.now() - (AI_CONFIG.maxVoiceSessionSeconds * 1000 + 30_000)
    );
    return await prisma.aiConversation.count({
      where: {
        mode: "voice",
        endedAt: null,
        startedAt: { gte: hardVoiceLimit },
      },
    });
  } catch (err) {
    console.error("[AI:Concurrency] Failed to count active voice sessions from DB:", err);
    return 0;
  }
}

/**
 * Automatically promote the oldest waiting visitors if slots are currently available.
 * Computes: occupiedSlots = activeDbSessions + pendingPromotedReservations.
 * Available slots = max(0, MAX_CONCURRENT_VOICE - occupiedSlots).
 *
 * Promotes up to availableSlots visitors in strict FIFO order (joinedAt ASC).
 */
export async function autoPromoteWaitingVisitors(): Promise<number> {
  try {
    await purgeStaleQueueEntries();

    const activeCount = await getActiveVoiceSessionCountFromDb();
    const claimThreshold = new Date(Date.now() - PROMOTED_CLAIM_TIMEOUT_MS);
    const pendingPromotedCount = await prisma.aiQueue.count({
      where: {
        promoted: true,
        promotedAt: { gte: claimThreshold },
      },
    });

    const occupiedSlots = activeCount + pendingPromotedCount;
    const availableSlots = Math.max(0, AI_CONFIG.maxConcurrentVoice - occupiedSlots);

    if (availableSlots <= 0) {
      return 0;
    }

    const waitingThreshold = new Date(Date.now() - WAITING_STALE_TIMEOUT_MS);
    const eligibleWaiting = await prisma.aiQueue.findMany({
      where: {
        promoted: false,
        lastPolledAt: { gte: waitingThreshold },
      },
      orderBy: { joinedAt: "asc" },
      take: availableSlots,
    });

    if (eligibleWaiting.length === 0) {
      return 0;
    }

    const ids = eligibleWaiting.map((e) => e.id);
    const now = new Date();

    await prisma.aiQueue.updateMany({
      where: { id: { in: ids } },
      data: {
        promoted: true,
        promotedAt: now,
      },
    });

    return ids.length;
  } catch (err) {
    console.error("[AI:Concurrency] Failed to auto-promote waiting visitors:", err);
    return 0;
  }
}

/**
 * Try to acquire a voice session slot for the given IP.
 * - Terminates any previous un-ended voice session for this IP (no multi-slot leaks).
 * - Enforces strict FIFO: new visitors cannot jump ahead if visitors are waiting.
 * - Auto-promotes queued visitors if slots are free.
 */
export async function tryAcquireVoiceSlot(ip: string): Promise<AcquireResult> {
  const ipHash = hashIp(ip);

  // 1. Terminate any previous voice session for this IP in both memory & DB
  await terminateExistingVoiceSessionsForIp(ipHash);

  // 2. Reconcile and auto-promote any waiting visitors if slots are free
  await autoPromoteWaitingVisitors();

  const waitingThreshold = new Date(Date.now() - WAITING_STALE_TIMEOUT_MS);
  const claimThreshold = new Date(Date.now() - PROMOTED_CLAIM_TIMEOUT_MS);

  // 3. Check if THIS visitor already has a queue entry
  const existing = await prisma.aiQueue.findFirst({
    where: {
      ipHash,
      OR: [
        { promoted: false, lastPolledAt: { gte: waitingThreshold } },
        { promoted: true, promotedAt: { gte: claimThreshold } },
      ],
    },
    orderBy: { joinedAt: "asc" },
  });

  if (existing) {
    if (existing.promoted) {
      // Slot ready and granted to this queued visitor!
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
        lastPolledAt: { gte: waitingThreshold },
      },
    });

    const position = aheadCount + 1;
    const estimatedWaitSeconds = position * AI_CONFIG.estimatedSessionDurationSeconds;
    return { acquired: false, queueId: existing.queueId, position, estimatedWaitSeconds };
  }

  // 4. Visitor is NOT in the queue yet.
  // Count active sessions and pending promoted reservations
  const activeCount = await getActiveVoiceSessionCountFromDb();
  const pendingPromotedCount = await prisma.aiQueue.count({
    where: {
      promoted: true,
      promotedAt: { gte: claimThreshold },
    },
  });
  const occupiedSlots = activeCount + pendingPromotedCount;

  // Check if anyone else is already waiting in line
  const waitingAheadCount = await prisma.aiQueue.count({
    where: {
      promoted: false,
      lastPolledAt: { gte: waitingThreshold },
    },
  });

  // Strict Concurrency & FIFO:
  // Only grant instant slot if free slots exist AND no one is waiting ahead
  if (occupiedSlots < AI_CONFIG.maxConcurrentVoice && waitingAheadCount === 0) {
    await prisma.aiQueue.deleteMany({ where: { ipHash } }).catch(() => {});
    return { acquired: true };
  }

  // Otherwise, all slots are occupied OR visitors are waiting ahead: Enqueue at back of line
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

  // Re-check auto-promotion in case a slot became available during enqueuing
  await autoPromoteWaitingVisitors();

  const newlyCreated = await prisma.aiQueue.findUnique({
    where: { queueId },
  });

  if (newlyCreated?.promoted) {
    await prisma.aiQueue.delete({ where: { queueId } }).catch(() => {});
    return { acquired: true };
  }

  const aheadCount = await prisma.aiQueue.count({
    where: {
      promoted: false,
      joinedAt: { lt: newlyCreated?.joinedAt ?? new Date() },
      lastPolledAt: { gte: waitingThreshold },
    },
  });

  const position = aheadCount + 1;
  const estimatedWaitSeconds = position * AI_CONFIG.estimatedSessionDurationSeconds;

  return { acquired: false, queueId, position, estimatedWaitSeconds };
}

/**
 * Called when a voice session ends or a user leaves.
 * Reconciles the queue and promotes next waiting visitors.
 */
export async function releaseVoiceSlot(): Promise<void> {
  await autoPromoteWaitingVisitors();
}

/**
 * Leave the queue explicitly.
 * Deletes the visitor's queue entry and passes the slot to the next waiting visitor.
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

    // Promote the next waiting visitor
    await autoPromoteWaitingVisitors();

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
 * Auto-promotes waiting visitors so that as soon as a slot is free,
 * the polling client gets ready: true without getting stuck.
 */
export async function getQueueStatus(queueId: string, ip: string): Promise<QueuePollResult | null> {
  try {
    // 1. Auto-promote eligible visitors
    await autoPromoteWaitingVisitors();

    const entry = await prisma.aiQueue.findUnique({ where: { queueId } });
    if (!entry) return null;

    // Security: validate IP ownership of the queue slot
    if (entry.ipHash !== hashIp(ip)) return null;

    if (entry.promoted) {
      // Slot ready! Remove from queue once admitted
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

    const waitingThreshold = new Date(Date.now() - WAITING_STALE_TIMEOUT_MS);

    // Count non-promoted entries ahead of this one that are actively waiting
    const aheadCount = await prisma.aiQueue.count({
      where: {
        promoted: false,
        joinedAt: { lt: entry.joinedAt },
        lastPolledAt: { gte: waitingThreshold },
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
    const waitingThreshold = new Date(Date.now() - WAITING_STALE_TIMEOUT_MS);
    return await prisma.aiQueue.count({
      where: {
        promoted: false,
        lastPolledAt: { gte: waitingThreshold },
      },
    });
  } catch {
    return 1;
  }
}

