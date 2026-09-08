"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { BlogPostSchema, BlogPostFormData } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export async function createBlogPost(data: BlogPostFormData) {
  await requireAdmin();

  const validated = BlogPostSchema.parse(data);

  const blog = await prisma.blogPost.create({
    data: {
      ...validated,
      publishedAt: validated.publishedAt ? new Date(validated.publishedAt) : new Date(),
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/blogs");
  return { success: true, blog };
}

export async function updateBlogPost(id: string, data: BlogPostFormData) {
  await requireAdmin();

  const validated = BlogPostSchema.parse(data);

  const blog = await prisma.blogPost.update({
    where: { id },
    data: {
      ...validated,
      publishedAt: validated.publishedAt ? new Date(validated.publishedAt) : new Date(),
    },
  });

  revalidatePath("/");
  revalidatePath(`/blogs/${blog.slug}`);
  revalidatePath("/admin/blogs");
  return { success: true, blog };
}

export async function deleteBlogPost(id: string) {
  await requireAdmin();

  await prisma.blogPost.delete({
    where: { id },
  });

  revalidatePath("/");
  revalidatePath("/admin/blogs");
  return { success: true };
}

export async function toggleBlogPublished(id: string, published: boolean) {
  await requireAdmin();

  const blog = await prisma.blogPost.update({
    where: { id },
    data: { published },
  });

  revalidatePath("/");
  revalidatePath(`/blogs/${blog.slug}`);
  revalidatePath("/admin/blogs");
  return { success: true };
}

export async function toggleBlogFeatured(id: string, featured: boolean) {
  await requireAdmin();

  const blog = await prisma.blogPost.update({
    where: { id },
    data: { featured },
  });

  revalidatePath("/");
  revalidatePath(`/blogs/${blog.slug}`);
  revalidatePath("/admin/blogs");
  return { success: true };
}
