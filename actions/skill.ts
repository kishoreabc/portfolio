"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { SkillSchema, SkillFormData } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export async function createSkill(data: SkillFormData) {
  await requireAdmin();

  const validated = SkillSchema.parse(data);

  const skill = await prisma.skill.create({
    data: validated,
  });

  revalidatePath("/");
  revalidatePath("/admin/skills");
  return { success: true, skill };
}

export async function updateSkill(id: string, data: SkillFormData) {
  await requireAdmin();

  const validated = SkillSchema.parse(data);

  const skill = await prisma.skill.update({
    where: { id },
    data: validated,
  });

  revalidatePath("/");
  revalidatePath("/admin/skills");
  return { success: true, skill };
}

export async function deleteSkill(id: string) {
  await requireAdmin();

  await prisma.skill.delete({
    where: { id },
  });

  revalidatePath("/");
  revalidatePath("/admin/skills");
  return { success: true };
}

export async function toggleSkillPublished(id: string, published: boolean) {
  await requireAdmin();

  await prisma.skill.update({
    where: { id },
    data: { published },
  });

  revalidatePath("/");
  revalidatePath("/admin/skills");
  return { success: true };
}
