"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { revalidatePath } from "next/cache";

export async function markMessageRead(id: string, read: boolean = true) {
  await requireAdmin();

  await prisma.contactMessage.update({
    where: { id },
    data: { read },
  });

  revalidatePath("/admin/messages");
  revalidatePath("/admin");
  return { success: true };
}

export async function softDeleteMessage(id: string) {
  await requireAdmin();

  await prisma.contactMessage.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/admin/messages");
  revalidatePath("/admin");
  return { success: true };
}

export async function restoreMessage(id: string) {
  await requireAdmin();

  await prisma.contactMessage.update({
    where: { id },
    data: { deletedAt: null },
  });

  revalidatePath("/admin/messages");
  revalidatePath("/admin");
  return { success: true };
}
