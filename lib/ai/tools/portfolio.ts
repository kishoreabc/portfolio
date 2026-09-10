/**
 * lib/ai/tools/portfolio.ts
 *
 * Portfolio knowledge tools — 100% dynamic, live data from the Prisma DB.
 * Pure dynamic retrieval: no hardcoded mock profiles, fallback projects, or static links.
 *
 * Security:
 *  - Server-side only — never imported by client components.
 *  - All queries use `published: true` / `enabled: true` filters.
 *  - No raw DB IDs, internal secrets, or admin credentials exposed.
 *  - Configurable query timeout.
 */

import { prisma } from "@/lib/db";
import { AI_CONFIG } from "../config";
import type {
  PortfolioProfile,
  PortfolioProject,
  PortfolioEducation,
  PortfolioCertification,
  PortfolioSocialLink,
  PortfolioBlogPost,
} from "@/types/ai";

/** Wrap a promise with a configurable timeout. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("TOOL_TIMEOUT")), ms)
    ),
  ]);
}

// ─────────────────────────────────────────────────────────────────────────────
// get_my_profile
// ─────────────────────────────────────────────────────────────────────────────

export async function getMyProfile(): Promise<PortfolioProfile> {
  try {
    const [config, linkedinSocial] = await Promise.all([
      withTimeout(
        prisma.siteConfig.findUnique({ where: { id: "singleton" } }),
        AI_CONFIG.portfolioToolTimeoutMs
      ),
      withTimeout(
        prisma.socialLink.findFirst({
          where: {
            enabled: true,
            platform: { contains: "linkedin", mode: "insensitive" },
          },
          select: { url: true },
        }),
        AI_CONFIG.portfolioToolTimeoutMs
      ).catch(() => null),
    ]);

    const achievements = Array.isArray(config?.achievements)
      ? (config.achievements as unknown as PortfolioProfile["achievements"])
      : [];

    const journey = Array.isArray(config?.journeyEntries)
      ? (config.journeyEntries as unknown as PortfolioProfile["journey"])
      : [];

    const leetcodeStats = {
      total: config?.leetcodeTotal ?? 0,
      easy: config?.leetcodeEasy ?? 0,
      medium: config?.leetcodeMedium ?? 0,
      hard: config?.leetcodeHard ?? 0,
    };

    return {
      name: config?.name || "",
      headline: config?.headline || "",
      bio: config?.bio || config?.aboutText || "",
      location: config?.location || "",
      contactEmail: config?.contactEmail || "",
      portfolioUrl: AI_CONFIG.portfolioUrl,
      linkedinUrl: linkedinSocial?.url || AI_CONFIG.linkedinUrl || "",
      resumeUrl: config?.resumeUrl?.trim() || AI_CONFIG.resumeUrl || "",
      availabilityStatus: config?.availabilityStatus || "",
      achievements: achievements && achievements.length > 0 ? achievements : undefined,
      journey: journey && journey.length > 0 ? journey : undefined,
      leetcodeStats,
    };
  } catch (err) {
    console.error("[AI:Tool] getMyProfile error:", err);
    return {
      name: "",
      headline: "",
      bio: "",
      location: "",
      contactEmail: "",
      portfolioUrl: AI_CONFIG.portfolioUrl,
      linkedinUrl: AI_CONFIG.linkedinUrl || "",
      resumeUrl: AI_CONFIG.resumeUrl || "",
      availabilityStatus: "",
      leetcodeStats: { total: 0, easy: 0, medium: 0, hard: 0 },
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// get_my_projects
// ─────────────────────────────────────────────────────────────────────────────

export async function getMyProjects(query?: string): Promise<PortfolioProject[]> {
  try {
    const projects = await withTimeout(
      prisma.project.findMany({
        where: { published: true },
        orderBy: [{ featured: "desc" }, { displayOrder: "asc" }],
        select: {
          title: true,
          slug: true,
          shortDescription: true,
          technologies: true,
          githubUrl: true,
          liveUrl: true,
          featured: true,
          metrics: true,
        },
      }),
      AI_CONFIG.portfolioToolTimeoutMs
    );

    const mapped = projects.map(toPortfolioProject);

    if (query?.trim()) {
      const q = query.trim().toLowerCase();
      const filtered = mapped.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q) ||
          p.technologies.some((t) => t.toLowerCase().includes(q))
      );
      return filtered.length > 0 ? filtered : mapped;
    }

    return mapped;
  } catch (err) {
    console.error("[AI:Tool] getMyProjects error:", err);
    return [];
  }
}

function toPortfolioProject(p: {
  title: string;
  slug: string;
  shortDescription: string;
  technologies: string[];
  githubUrl: string | null;
  liveUrl: string | null;
  featured: boolean;
  metrics: string | null;
}): PortfolioProject {
  return {
    title: p.title,
    slug: p.slug,
    shortDescription: p.shortDescription,
    technologies: p.technologies,
    githubUrl: p.githubUrl,
    liveUrl: p.liveUrl,
    featured: p.featured,
    metrics: p.metrics,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// get_my_skills
// ─────────────────────────────────────────────────────────────────────────────

export async function getMySkills(): Promise<Record<string, string[]>> {
  try {
    const skills = await withTimeout(
      prisma.skill.findMany({
        where: { published: true },
        orderBy: [{ category: "asc" }, { displayOrder: "asc" }],
        select: { name: true, category: true },
      }),
      AI_CONFIG.portfolioToolTimeoutMs
    );

    const grouped: Record<string, string[]> = {};
    for (const skill of skills) {
      if (!grouped[skill.category]) grouped[skill.category] = [];
      grouped[skill.category].push(skill.name);
    }
    return grouped;
  } catch (err) {
    console.error("[AI:Tool] getMySkills error:", err);
    return {};
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// get_my_education
// ─────────────────────────────────────────────────────────────────────────────

export async function getMyEducation(): Promise<PortfolioEducation[]> {
  try {
    const list = await withTimeout(
      prisma.education.findMany({
        orderBy: { displayOrder: "asc" },
        select: {
          institution: true,
          degree: true,
          field: true,
          startDate: true,
          endDate: true,
          score: true,
        },
      }),
      AI_CONFIG.portfolioToolTimeoutMs
    );

    return list.map((e) => ({
      institution: e.institution,
      degree: e.degree,
      field: e.field,
      startDate: e.startDate?.toISOString().slice(0, 10) ?? null,
      endDate: e.endDate?.toISOString().slice(0, 10) ?? null,
      score: e.score,
    }));
  } catch (err) {
    console.error("[AI:Tool] getMyEducation error:", err);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// get_my_certifications
// ─────────────────────────────────────────────────────────────────────────────

export async function getMyCertifications(): Promise<PortfolioCertification[]> {
  try {
    const list = await withTimeout(
      prisma.certification.findMany({
        where: { published: true },
        orderBy: [{ issueDate: "desc" }, { displayOrder: "asc" }],
        select: {
          title: true,
          issuer: true,
          issueDate: true,
          credentialUrl: true,
          description: true,
        },
      }),
      AI_CONFIG.portfolioToolTimeoutMs
    );

    return list.map((c) => ({
      title: c.title,
      issuer: c.issuer,
      issueDate: c.issueDate?.toISOString().slice(0, 10) ?? null,
      credentialUrl: c.credentialUrl,
      description: c.description,
    }));
  } catch (err) {
    console.error("[AI:Tool] getMyCertifications error:", err);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// get_my_social_links
// ─────────────────────────────────────────────────────────────────────────────

export async function getMySocialLinks(): Promise<PortfolioSocialLink[]> {
  try {
    const links = await withTimeout(
      prisma.socialLink.findMany({
        where: { enabled: true },
        orderBy: { displayOrder: "asc" },
        select: { platform: true, url: true },
      }),
      AI_CONFIG.portfolioToolTimeoutMs
    );

    return links.map((l) => ({ platform: l.platform, url: l.url }));
  } catch (err) {
    console.error("[AI:Tool] getMySocialLinks error:", err);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// get_my_resume
// ─────────────────────────────────────────────────────────────────────────────

export async function getMyResume(): Promise<{ resumeUrl: string | null }> {
  try {
    const config = await withTimeout(
      prisma.siteConfig.findUnique({
        where: { id: "singleton" },
        select: { resumeUrl: true },
      }),
      AI_CONFIG.portfolioToolTimeoutMs
    );

    const url = config?.resumeUrl?.trim() || AI_CONFIG.resumeUrl || null;
    return { resumeUrl: url };
  } catch (err) {
    console.error("[AI:Tool] getMyResume error:", err);
    return {
      resumeUrl: AI_CONFIG.resumeUrl || null,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// get_my_blog_posts
// ─────────────────────────────────────────────────────────────────────────────

export async function getMyBlogPosts(query?: string): Promise<PortfolioBlogPost[]> {
  try {
    const posts = await withTimeout(
      prisma.blogPost.findMany({
        where: { published: true },
        orderBy: [{ featured: "desc" }, { displayOrder: "asc" }, { publishedAt: "desc" }],
        select: {
          title: true,
          slug: true,
          summary: true,
          content: true,
          tags: true,
          readTime: true,
          canonicalUrl: true,
          publishedAt: true,
        },
      }),
      AI_CONFIG.portfolioToolTimeoutMs
    );

    const mapped = posts.map((p) => {
      const canonical = p.canonicalUrl?.trim() || null;
      return {
        title: p.title,
        slug: p.slug,
        summary: p.summary,
        content: p.content,
        tags: p.tags,
        readTime: p.readTime || "5 min read",
        canonicalUrl: canonical,
        url: canonical || `${AI_CONFIG.portfolioUrl}/blog/${p.slug}`,
        publishedAt: p.publishedAt ? p.publishedAt.toISOString().slice(0, 10) : null,
      };
    });

    if (query?.trim()) {
      const q = query.trim().toLowerCase();
      const filtered = mapped.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.summary.toLowerCase().includes(q) ||
          b.tags.some((t) => t.toLowerCase().includes(q))
      );
      return filtered.length > 0 ? filtered : mapped;
    }

    return mapped;
  } catch (err) {
    console.error("[AI:Tool] getMyBlogPosts error:", err);
    return [];
  }
}
