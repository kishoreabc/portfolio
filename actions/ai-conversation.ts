"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { terminateSession } from "@/lib/ai/session-store";
import { releaseVoiceSlot } from "@/lib/ai/concurrency";
import { revalidatePath } from "next/cache";
import type { AgentMode } from "@/types/ai";

const PAGE_SIZE = 20;

// ── Conversation List ────────────────────────────────────────────────────────

export async function getAiConversations({
  page = 1,
  mode,
  status,
  dateFrom,
  dateTo,
}: {
  page?: number;
  mode?: AgentMode | "all";
  status?: "all" | "active" | "ended";
  dateFrom?: string;
  dateTo?: string;
} = {}) {
  await requireAdmin();

  const where: Record<string, unknown> = {};

  if (mode && mode !== "all") {
    where.mode = mode;
  }

  if (status === "active") {
    where.endedAt = null;
  } else if (status === "ended") {
    where.endedAt = { not: null };
  }

  if (dateFrom || dateTo) {
    where.startedAt = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo + "T23:59:59.999Z") } : {}),
    };
  }

  const [conversations, total, activeCount] = await Promise.all([
    prisma.aiConversation.findMany({
      where,
      orderBy: { startedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        sessionId: true,
        mode: true,
        ipHash: true,
        startedAt: true,
        endedAt: true,
        messageCount: true,
      },
    }),
    prisma.aiConversation.count({ where }),
    prisma.aiConversation.count({ where: { endedAt: null } }),
  ]);

  return {
    conversations: conversations.map((c) => ({
      ...c,
      // Raw IP address displayed directly (e.g. 192.168.0.1)
      ipHash: c.ipHash,
      durationSeconds:
        c.endedAt && c.startedAt
          ? Math.round((c.endedAt.getTime() - c.startedAt.getTime()) / 1000)
          : null,
    })),
    total,
    activeCount,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
  };
}

// ── Single Conversation (full transcript) ────────────────────────────────────

export async function getAiConversation(id: string) {
  await requireAdmin();

  const conversation = await prisma.aiConversation.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          role: true,
          content: true,
          toolsUsed: true,
          createdAt: true,
        },
      },
    },
  });

  if (!conversation) return null;

  return {
    ...conversation,
    // Raw IP address displayed directly (e.g. 192.168.0.1)
    ipHash: conversation.ipHash,
    durationSeconds:
      conversation.endedAt && conversation.startedAt
        ? Math.round(
            (conversation.endedAt.getTime() - conversation.startedAt.getTime()) / 1000
          )
        : null,
  };
}

// ── Revoke / Terminate Active Session ────────────────────────────────────────

export async function revokeAiSession(id: string) {
  await requireAdmin();

  const conversation = await prisma.aiConversation.findUnique({
    where: { id },
  });

  if (!conversation) {
    throw new Error("Conversation session not found");
  }

  if (conversation.endedAt) {
    return { success: true, message: "Session is already ended" };
  }

  const now = new Date();

  // 1. Mark session as ended in database
  await prisma.aiConversation.update({
    where: { id },
    data: { endedAt: now },
  });

  // 2. Terminate in-memory session entry
  terminateSession(conversation.sessionId);

  // 3. If voice session, release concurrency slot so waiting users can connect
  if (conversation.mode === "voice") {
    await releaseVoiceSlot();
  }

  revalidatePath("/admin/ai-conversations");
  revalidatePath(`/admin/ai-conversations/${id}`);

  return { success: true };
}

// ── Revoke All Active Sessions ───────────────────────────────────────────────

export async function revokeAllActiveAiSessions() {
  await requireAdmin();

  const activeConversations = await prisma.aiConversation.findMany({
    where: { endedAt: null },
  });

  if (activeConversations.length === 0) {
    return { success: true, count: 0 };
  }

  const now = new Date();

  // 1. Mark all active sessions as ended
  await prisma.aiConversation.updateMany({
    where: { endedAt: null },
    data: { endedAt: now },
  });

  // 2. Terminate each in memory
  for (const conv of activeConversations) {
    terminateSession(conv.sessionId);
  }

  // 3. Release voice slots
  await releaseVoiceSlot();

  revalidatePath("/admin/ai-conversations");

  return { success: true, count: activeConversations.length };
}

// ── Delete Conversation ──────────────────────────────────────────────────────

export async function deleteAiConversation(id: string) {
  await requireAdmin();

  // onDelete: Cascade in schema handles AiMessage deletion
  await prisma.aiConversation.delete({ where: { id } });

  revalidatePath("/admin/ai-conversations");

  return { success: true };
}
