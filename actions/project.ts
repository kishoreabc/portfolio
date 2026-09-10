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

import { GoogleGenAI } from "@google/genai";
import { toSlug } from "@/lib/utils";

async function fetchProjectUrlMetadata(url: string) {
  let title = "";
  let description = "";
  let coverImage = "";
  let readmeSnippet = "";
  let githubInfo: any = null;

  // 1. If it's a GitHub URL, try fetching repo metadata and README
  const githubMatch = url.match(/github\.com\/([^/]+)\/([^/]+)/i);
  if (githubMatch) {
    const [, owner, rawRepo] = githubMatch;
    const repoName = rawRepo.replace(/\.git$/i, "");

    // Fetch repository data using existing GitHub helper
    try {
      githubInfo = await fetchGitHubRepo(`https://github.com/${owner}/${repoName}`);
    } catch {}

    // Try fetching README from raw.githubusercontent.com
    for (const branch of ["main", "master", "HEAD"]) {
      try {
        const readmeRes = await fetch(
          `https://raw.githubusercontent.com/${owner}/${repoName}/${branch}/README.md`,
          { signal: AbortSignal.timeout(6000) }
        );
        if (readmeRes.ok) {
          const readmeText = await readmeRes.text();
          if (readmeText && readmeText.trim().length > 30) {
            readmeSnippet = readmeText.slice(0, 8000);
            break;
          }
        }
      } catch {}
    }
  }

  // 2. Fetch web HTML metadata (OpenGraph tags, body text)
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(6000),
      redirect: "follow",
    });

    if (res.ok) {
      const html = await res.text();
      const ogTitleMatch =
        html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i) ||
        html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:title["']/i);
      const ogDescMatch =
        html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i) ||
        html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:description["']/i);
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      const metaDescMatch =
        html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
        html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
      const ogImageMatch =
        html.match(/<meta[^>]*property=["']og:image(?::secure_url)?["'][^>]*content=["']([^"']*)["']/i) ||
        html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:image(?::secure_url)?["']/i) ||
        html.match(/<meta[^>]*name=["']twitter:image(?::src)?["'][^>]*content=["']([^"']*)["']/i);

      if (!title) title = ogTitleMatch?.[1] || titleMatch?.[1]?.trim() || "";
      if (!description) description = ogDescMatch?.[1] || metaDescMatch?.[1]?.trim() || "";
      const rawImage = (ogImageMatch?.[1] || "").replace(/&amp;/g, "&").trim();
      if (rawImage && !rawImage.includes("github.com/identicons/")) {
        coverImage = rawImage;
      }
    }
  } catch (err) {
    console.warn("fetchProjectUrlMetadata HTML fetch failed:", err);
  }

  return {
    title: githubInfo?.name || title,
    description: githubInfo?.description || description,
    coverImage,
    readmeSnippet,
    githubInfo,
  };
}

export async function generateProjectDetails({
  url,
  apiKey,
  model,
}: {
  url: string;
  apiKey?: string;
  model?: string;
}) {
  await requireAdmin();

  if (!url || !url.trim().startsWith("http")) {
    return {
      success: false,
      error: "Please enter a valid URL starting with http:// or https://",
    };
  }

  const config = await prisma.siteConfig.findUnique({
    where: { id: "singleton" },
    select: { geminiApiKey: true, geminiModel: true },
  });

  const effectiveKey =
    apiKey?.trim() || config?.geminiApiKey?.trim() || process.env.GEMINI_API_KEY?.trim();
  if (!effectiveKey) {
    return {
      success: false,
      needsApiKey: true,
      error:
        "Gemini API key is required. Please set it in Admin Settings (Profile & Config) or .env.local.",
    };
  }

  const effectiveModel = (
    model?.trim() ||
    config?.geminiModel?.trim() ||
    process.env.GEMINI_MODEL?.trim() ||
    "gemini-2.5-flash"
  ).toLowerCase();

  try {
    const metadata = await fetchProjectUrlMetadata(url.trim());
    const ai = new GoogleGenAI({ apiKey: effectiveKey });

    const prompt = `You are an expert AI/ML software engineer and technical reviewer for Kishore R (Aspiring AI/ML & Generative AI Engineer).
A project link has been provided to automatically generate full, production-ready portfolio project details.
Target URL: ${url}
Detected Title / Name: ${metadata.title || "Not detected"}
Detected Description: ${metadata.description || "Not detected"}
GitHub Repository Info: ${metadata.githubInfo ? JSON.stringify(metadata.githubInfo) : "None"}
Extracted README / Content Snippet:
${metadata.readmeSnippet || metadata.description || "Not available"}

Your objective is to analyze the project, repository, architecture, and code context, and return a comprehensive, professional project profile suitable for Kishore's high-end portfolio.

Requirements:
- title: Crisp, compelling project title (e.g. "RAG-Based Financial Chatbot" or "Multimodal Semantic Search Engine").
- slug: URL-friendly kebab-case slug (e.g. "rag-financial-chatbot").
- shortDescription: Punchy, high-impact 1-2 sentence overview for project cards (max 180 chars).
- fullDescription: In-depth markdown description detailing what the project does, core capabilities, real-world utility, and developer workflow.
- problem: The exact engineering, data, or user problem this project solves (e.g., latency bottlenecks, manual document parsing, hallucination in LLMs).
- solution: How the project solves the problem using specific methodologies, algorithms, models, and design patterns.
- architecture: Technical pipeline / architecture breakdown (e.g. "User Query -> Hybrid BM25 & Dense Embedding Search (FAISS) -> Cross-Encoder Reranking -> Streaming Gemini Generation").
- technologies: Array of exact technologies, libraries, and frameworks used (e.g. ["Python", "FastAPI", "OpenAI", "FAISS", "LangChain", "Docker", "Next.js"]).
- githubUrl: The GitHub repository URL (use the target URL if it is GitHub, or any repository URL found in the text).
- liveUrl: Live demo / deployed web application URL if found in the README or text, else empty string.
- metrics: Key metric or impressive highlight (e.g. "98% retrieval precision, <180ms response time", "10K+ records indexed", or stars/forks count).
- featured: boolean (true if high-complexity AI/ML or flagship project, false otherwise).

Return ONLY a valid JSON object matching these exact keys:
{
  "title": string,
  "slug": string,
  "shortDescription": string,
  "fullDescription": string,
  "problem": string,
  "solution": string,
  "architecture": string,
  "technologies": string[],
  "githubUrl": string,
  "liveUrl": string,
  "metrics": string,
  "featured": boolean
}`;

    const response = await ai.models.generateContent({
      model: effectiveModel,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "{}";
    const parsed = JSON.parse(responseText);

    const title = parsed.title || metadata.title || "AI Engineering Project";
    const slug = parsed.slug || toSlug(title);

    let imageUrl = (metadata.coverImage || "").replace(/&amp;/g, "&").trim();

    // Auto-upload extracted cover image to Cloudinary so it is permanent and avoids hotlink issues
    if (imageUrl && imageUrl.startsWith("http") && !imageUrl.includes("res.cloudinary.com")) {
      try {
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "wasbvar9";
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default";

        const formData = new FormData();
        formData.append("file", imageUrl);
        formData.append("upload_preset", uploadPreset);

        const cloudRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
          {
            method: "POST",
            body: formData,
            signal: AbortSignal.timeout(8000),
          }
        );

        if (cloudRes.ok) {
          const cloudData = await cloudRes.json();
          if (cloudData.secure_url) {
            imageUrl = cloudData.secure_url;
          }
        }
      } catch (uploadErr) {
        console.warn("Cloudinary auto-upload failed, keeping direct clean image URL:", uploadErr);
      }
    }

    const githubUrl =
      url.includes("github.com") ? url.trim() : (parsed.githubUrl || "").trim();

    return {
      success: true,
      data: {
        title,
        slug,
        shortDescription: parsed.shortDescription || metadata.description || "",
        fullDescription: parsed.fullDescription || "",
        problem: parsed.problem || "",
        solution: parsed.solution || "",
        architecture: parsed.architecture || "",
        technologies: Array.isArray(parsed.technologies) ? parsed.technologies : ["Python", "AI/ML"],
        githubUrl,
        liveUrl: (parsed.liveUrl || (!url.includes("github.com") ? url : "")).trim(),
        imageUrl,
        metrics: parsed.metrics || "",
        featured: Boolean(parsed.featured),
        githubSyncEnabled: Boolean(githubUrl),
      },
    };
  } catch (err: any) {
    console.error("Gemini project generation error:", err);
    return {
      success: false,
      error: err?.message || "Failed to analyze project with Gemini.",
    };
  }
}
