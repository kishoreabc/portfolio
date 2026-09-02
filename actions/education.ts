"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { EducationSchema, EducationFormData } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export async function createEducation(data: EducationFormData) {
  await requireAdmin();

  const validated = EducationSchema.parse(data);

  const edu = await prisma.education.create({
    data: {
      ...validated,
      startDate: validated.startDate ? new Date(validated.startDate) : null,
      endDate: validated.endDate ? new Date(validated.endDate) : null,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/education");
  return { success: true, education: edu };
}

export async function updateEducation(id: string, data: EducationFormData) {
  await requireAdmin();

  const validated = EducationSchema.parse(data);

  const edu = await prisma.education.update({
    where: { id },
    data: {
      ...validated,
      startDate: validated.startDate ? new Date(validated.startDate) : null,
      endDate: validated.endDate ? new Date(validated.endDate) : null,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/education");
  return { success: true, education: edu };
}

export async function deleteEducation(id: string) {
  await requireAdmin();

  await prisma.education.delete({
    where: { id },
  });

  revalidatePath("/");
  revalidatePath("/admin/education");
  return { success: true };
}
