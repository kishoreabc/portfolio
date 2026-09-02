"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { SocialLinkSchema, SocialLinkFormData } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export async function createSocialLink(data: SocialLinkFormData) {
  await requireAdmin();

  const validated = SocialLinkSchema.parse(data);

  const link = await prisma.socialLink.create({
    data: validated,
  });

  revalidatePath("/");
  revalidatePath("/admin/social-links");
  return { success: true, socialLink: link };
}

export async function updateSocialLink(id: string, data: SocialLinkFormData) {
  await requireAdmin();

  const validated = SocialLinkSchema.parse(data);

  const link = await prisma.socialLink.update({
    where: { id },
    data: validated,
  });

  revalidatePath("/");
  revalidatePath("/admin/social-links");
  return { success: true, socialLink: link };
}

export async function deleteSocialLink(id: string) {
  await requireAdmin();

  await prisma.socialLink.delete({
    where: { id },
  });

  revalidatePath("/");
  revalidatePath("/admin/social-links");
  return { success: true };
}

export async function toggleSocialLinkEnabled(id: string, enabled: boolean) {
  await requireAdmin();

  await prisma.socialLink.update({
    where: { id },
    data: { enabled },
  });

  revalidatePath("/");
  revalidatePath("/admin/social-links");
  return { success: true };
}
