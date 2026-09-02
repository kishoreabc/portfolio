"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { ProjectSchema, ProjectFormData } from "@/lib/validations";
import { fetchGitHubRepo } from "@/lib/github";
import { revalidatePath } from "next/cache";

export async function createProject(data: ProjectFormData) {
  await requireAdmin();

  const validated = ProjectSchema.parse(data);

  let githubData = {};
  if (validated.githubSyncEnabled && validated.githubUrl) {
    const repo = await fetchGitHubRepo(validated.githubUrl);
    if (repo) {
      githubData = {
        githubStars: repo.stargazerCount,
        githubForks: repo.forkCount,
        githubLanguage: repo.primaryLanguage?.name ?? null,
        githubTopics: repo.repositoryTopics.nodes.map((n) => n.topic.name),
        githubUpdatedAt: new Date(repo.updatedAt),
        githubCachedAt: new Date(),
      };
    }
  }

  const project = await prisma.project.create({
    data: {
      ...validated,
      ...githubData,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/projects");
  return { success: true, project };
}

export async function updateProject(id: string, data: ProjectFormData) {
  await requireAdmin();

  const validated = ProjectSchema.parse(data);

  let githubData = {};
  if (validated.githubSyncEnabled && validated.githubUrl) {
    const repo = await fetchGitHubRepo(validated.githubUrl);
    if (repo) {
      githubData = {
        githubStars: repo.stargazerCount,
        githubForks: repo.forkCount,
        githubLanguage: repo.primaryLanguage?.name ?? null,
        githubTopics: repo.repositoryTopics.nodes.map((n) => n.topic.name),
        githubUpdatedAt: new Date(repo.updatedAt),
        githubCachedAt: new Date(),
      };
    }
  }

  const project = await prisma.project.update({
    where: { id },
    data: {
      ...validated,
      ...githubData,
    },
  });

  revalidatePath("/");
  revalidatePath(`/projects/${project.slug}`);
  revalidatePath("/admin/projects");
  return { success: true, project };
}

export async function deleteProject(id: string) {
  await requireAdmin();

  await prisma.project.delete({
    where: { id },
  });

  revalidatePath("/");
  revalidatePath("/admin/projects");
  return { success: true };
}

export async function toggleProjectPublished(id: string, published: boolean) {
  await requireAdmin();

  await prisma.project.update({
    where: { id },
    data: { published },
  });

  revalidatePath("/");
  revalidatePath("/admin/projects");
  return { success: true };
}

export async function toggleProjectFeatured(id: string, featured: boolean) {
  await requireAdmin();

  await prisma.project.update({
    where: { id },
    data: { featured },
  });

  revalidatePath("/");
  revalidatePath("/admin/projects");
  return { success: true };
}

export async function syncProjectGithub(id: string) {
  await requireAdmin();

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || !project.githubUrl) {
    throw new Error("Project or GitHub URL not found");
  }

  const repo = await fetchGitHubRepo(project.githubUrl);
  if (!repo) {
    throw new Error("Failed to fetch repository from GitHub");
  }

  await prisma.project.update({
    where: { id },
    data: {
      githubStars: repo.stargazerCount,
      githubForks: repo.forkCount,
      githubLanguage: repo.primaryLanguage?.name ?? null,
      githubTopics: repo.repositoryTopics.nodes.map((n) => n.topic.name),
      githubUpdatedAt: new Date(repo.updatedAt),
      githubCachedAt: new Date(),
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/projects");
  return { success: true };
}
