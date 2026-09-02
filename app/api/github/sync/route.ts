/**
 * POST /api/github/sync
 * Admin-only endpoint — syncs GitHub data for a project.
 *
 * Protected by middleware.ts (session required).
 * Also calls requireAdmin() as a defense-in-depth check.
 *
 * Body: { projectId: string }
 * Fetches GitHub repo data and updates the project record.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { fetchGitHubRepo } from "@/lib/github";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  // Defense-in-depth: check admin session even though middleware protects this route
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { projectId } = await req.json();

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    // Fetch the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!project.githubUrl) {
      return NextResponse.json({ error: "Project has no GitHub URL" }, { status: 400 });
    }

    // Fetch GitHub data
    const repoData = await fetchGitHubRepo(project.githubUrl);

    if (!repoData) {
      return NextResponse.json(
        { error: "Failed to fetch GitHub data. Check GITHUB_TOKEN and repo URL." },
        { status: 502 }
      );
    }

    // Update project with GitHub data
    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        githubStars: repoData.stargazerCount,
        githubForks: repoData.forkCount,
        githubLanguage: repoData.primaryLanguage?.name ?? null,
        githubTopics: repoData.repositoryTopics.nodes.map((n) => n.topic.name),
        githubUpdatedAt: new Date(repoData.updatedAt),
        githubCachedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        stars: updated.githubStars,
        forks: updated.githubForks,
        language: updated.githubLanguage,
        topics: updated.githubTopics,
        updatedAt: updated.githubUpdatedAt,
        cachedAt: updated.githubCachedAt,
      },
    });
  } catch (error) {
    console.error("[GitHub Sync] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
