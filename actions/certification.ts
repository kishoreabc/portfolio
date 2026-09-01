"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { CertificationSchema, CertificationFormData } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export async function createCertification(data: CertificationFormData) {
  await requireAdmin();

  const validated = CertificationSchema.parse(data);

  const cert = await prisma.certification.create({
    data: {
      ...validated,
      issueDate: validated.issueDate ? new Date(validated.issueDate) : null,
      expiryDate: validated.expiryDate ? new Date(validated.expiryDate) : null,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/certifications");
  return { success: true, certification: cert };
}

export async function updateCertification(id: string, data: CertificationFormData) {
  await requireAdmin();

  const validated = CertificationSchema.parse(data);

  const cert = await prisma.certification.update({
    where: { id },
    data: {
      ...validated,
      issueDate: validated.issueDate ? new Date(validated.issueDate) : null,
      expiryDate: validated.expiryDate ? new Date(validated.expiryDate) : null,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/certifications");
  return { success: true, certification: cert };
}

export async function deleteCertification(id: string) {
  await requireAdmin();

  await prisma.certification.delete({
    where: { id },
  });

  revalidatePath("/");
  revalidatePath("/admin/certifications");
  return { success: true };
}

export async function toggleCertificationPublished(id: string, published: boolean) {
  await requireAdmin();

  await prisma.certification.update({
    where: { id },
    data: { published },
  });

  revalidatePath("/");
  revalidatePath("/admin/certifications");
  return { success: true };
}
