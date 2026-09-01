"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { SiteConfigSchema, SiteConfigFormData } from "@/lib/validations";
import { JourneyEntry, Achievement } from "@/types";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

export async function updateSiteConfig(data: SiteConfigFormData) {
  await requireAdmin();

  const validated = SiteConfigSchema.parse(data);

  const config = await prisma.siteConfig.upsert({
    where: { id: "singleton" },
    update: validated,
    create: {
      id: "singleton",
      ...validated,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/profile");
  revalidatePath("/admin/settings");
  return { success: true, config };
}

export async function updateJourneyEntries(entries: JourneyEntry[]) {
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
  revalidatePath("/admin/profile");
  return { success: true, config };
}

export async function updateAchievements(achievements: Achievement[]) {
  await requireAdmin();

  const config = await prisma.siteConfig.upsert({
    where: { id: "singleton" },
    update: {
      achievements: achievements as unknown as Prisma.InputJsonValue,
    },
    create: {
      id: "singleton",
      achievements: achievements as unknown as Prisma.InputJsonValue,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/profile");
  return { success: true, config };
}
