"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import type { AgentMode } from "@/types/ai";

const PAGE_SIZE = 20;

// ── Conversation List ────────────────────────────────────────────────────────

export async function getAiConversations({
  page = 1,
  mode,
  dateFrom,
  dateTo,
}: {
  page?: number;
  mode?: AgentMode | "all";
  dateFrom?: string;
  dateTo?: string;
} = {}) {
  await requireAdmin();

  const where: Record<string, unknown> = {};

  if (mode && mode !== "all") {
    where.mode = mode;
  }

  if (dateFrom || dateTo) {
    where.startedAt = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo + "T23:59:59.999Z") } : {}),
    };
  }

  const [conversations, total] = await Promise.all([
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
  ]);

  return {
    conversations: conversations.map((c) => ({
      ...c,
      // Only show first 8 chars of hashed IP for display
      ipHash: c.ipHash.slice(0, 8) + "…",
      durationSeconds:
        c.endedAt && c.startedAt
          ? Math.round((c.endedAt.getTime() - c.startedAt.getTime()) / 1000)
          : null,
    })),
    total,
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
    ipHash: conversation.ipHash.slice(0, 8) + "…",
    durationSeconds:
      conversation.endedAt && conversation.startedAt
        ? Math.round(
            (conversation.endedAt.getTime() - conversation.startedAt.getTime()) / 1000
          )
        : null,
  };
}

// ── Delete Conversation ──────────────────────────────────────────────────────

export async function deleteAiConversation(id: string) {
  await requireAdmin();

  // onDelete: Cascade in schema handles AiMessage deletion
  await prisma.aiConversation.delete({ where: { id } });

  return { success: true };
}
