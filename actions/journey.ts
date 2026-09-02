"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { JourneyEntrySchema, JourneyEntryFormData } from "@/lib/validations";
import { JourneyEntry } from "@/types";
import { sortJourneyEntriesByTimelineDesc } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

async function getRawJourneyEntries(): Promise<JourneyEntry[]> {
  const config = await prisma.siteConfig.findUnique({
    where: { id: "singleton" },
    select: { journeyEntries: true },
  });

  if (!config?.journeyEntries || !Array.isArray(config.journeyEntries)) {
    return [];
  }

  return config.journeyEntries as unknown as JourneyEntry[];
}

async function saveJourneyEntries(entries: JourneyEntry[]) {
  await requireAdmin();

  const config = await prisma.siteConfig.upsert({
    where: { id: "singleton" },
    update: {
      journeyEntries: entries as unknown as Prisma.InputJsonValue,
    },
    create: {
      id: "singleton",
      journeyEntries: entries as unknown as Prisma.InputJsonValue,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/journey");
  revalidatePath("/admin/profile");
  return config;
}

export async function createJourneyEntry(data: JourneyEntryFormData) {
  await requireAdmin();
  const validated = JourneyEntrySchema.parse(data);

  const current = await getRawJourneyEntries();
  const newId =
    validated.id?.trim() ||
    `journey-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const newEntry: JourneyEntry = {
    id: newId,
    title: validated.title,
    organization: validated.organization,
    period: validated.period,
    description: validated.description,
    type: validated.type,
    icon: validated.icon || "cpu",
  };

  const updated = [...current, newEntry];
  await saveJourneyEntries(updated);

  return { success: true, entry: newEntry };
}

export async function updateJourneyEntry(id: string, data: JourneyEntryFormData) {
  await requireAdmin();
  const validated = JourneyEntrySchema.parse(data);

  const current = await getRawJourneyEntries();
  const index = current.findIndex((item) => item.id === id);

  if (index === -1) {
    throw new Error(`Journey entry with ID "${id}" not found.`);
  }

  const updatedEntry: JourneyEntry = {
    ...current[index],
    title: validated.title,
    organization: validated.organization,
    period: validated.period,
    description: validated.description,
    type: validated.type,
    icon: validated.icon || current[index].icon || "cpu",
  };

  current[index] = updatedEntry;
  await saveJourneyEntries(current);

  return { success: true, entry: updatedEntry };
}

export async function deleteJourneyEntry(id: string) {
  await requireAdmin();

  const current = await getRawJourneyEntries();
  const filtered = current.filter((item) => item.id !== id);

  await saveJourneyEntries(filtered);
  return { success: true };
}

export async function moveJourneyEntry(id: string, direction: "up" | "down") {
  await requireAdmin();

  const current = await getRawJourneyEntries();
  const index = current.findIndex((item) => item.id === id);

  if (index === -1) return { success: false };

  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= current.length) {
    return { success: false };
  }

  const temp = current[index];
  current[index] = current[targetIndex];
  current[targetIndex] = temp;

  await saveJourneyEntries(current);
  return { success: true };
}

export async function sortAllJourneyEntriesByTimelineDesc() {
  await requireAdmin();

  const current = await getRawJourneyEntries();
  const sorted = sortJourneyEntriesByTimelineDesc(current);

  await saveJourneyEntries(sorted);
  return { success: true, entries: sorted };
}

