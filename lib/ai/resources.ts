/**
 * lib/ai/resources.ts
 *
 * Fetches verified public portfolio resources (Resume, Socials, Projects, Blog Posts)
 * dynamically from the database to provide to the client session.
 * 100% dynamic: no hardcoded URLs or fallback arrays.
 */

import { prisma } from "@/lib/db";
import type { KnownPortfolioResources } from "@/types/ai";

export async function getKnownPortfolioResources(): Promise<KnownPortfolioResources> {
  try {
    const [config, projects, socials, blogPosts, certifications] = await Promise.all([
      prisma.siteConfig
        .findUnique({ where: { id: "singleton" }, select: { resumeUrl: true } })
        .catch(() => null),
      prisma.project
        .findMany({
          where: { published: true },
          orderBy: [{ featured: "desc" }, { displayOrder: "asc" }],
          select: {
            title: true,
            slug: true,
            shortDescription: true,
            technologies: true,
            githubUrl: true,
            liveUrl: true,
          },
        })
        .catch(() => []),
      prisma.socialLink
        .findMany({
          where: { enabled: true },
          orderBy: { displayOrder: "asc" },
          select: { platform: true, url: true },
        })
        .catch(() => []),
      prisma.blogPost
        .findMany({
          where: { published: true },
          orderBy: [{ featured: "desc" }, { displayOrder: "asc" }, { publishedAt: "desc" }],
          select: {
            title: true,
            slug: true,
            summary: true,
            tags: true,
            readTime: true,
            canonicalUrl: true,
            publishedAt: true,
          },
        })
        .catch(() => []),
      prisma.certification
        .findMany({
          orderBy: [{ issueDate: "desc" }, { displayOrder: "asc" }],
          select: { title: true, issuer: true, credentialUrl: true, imageUrl: true },
        })
        .catch(() => []),
    ]);

    const resumeUrl: string | undefined = config?.resumeUrl?.trim() || undefined;
    let githubUrl: string | undefined = undefined;
    let leetcodeUrl: string | undefined = undefined;
    let linkedinUrl: string | undefined = undefined;

    if (socials && socials.length > 0) {
      for (const s of socials) {
        const plat = s.platform.toLowerCase();
        if (plat.includes("git") && !githubUrl) githubUrl = s.url;
        else if (plat.includes("leet") && !leetcodeUrl) leetcodeUrl = s.url;
        else if (plat.includes("link") && !linkedinUrl) linkedinUrl = s.url;
      }
    }

    return {
      resumeUrl,
      githubUrl,
      leetcodeUrl,
      linkedinUrl,
      projects: projects.map((p) => ({
        title: p.title,
        slug: p.slug,
        shortDescription: p.shortDescription,
        technologies: p.technologies,
        githubUrl: p.githubUrl,
        liveUrl: p.liveUrl,
      })),
      blogPosts: blogPosts.map((b) => ({
        title: b.title,
        slug: b.slug,
        summary: b.summary,
        tags: b.tags,
        readTime: b.readTime || "5 min read",
        canonicalUrl: b.canonicalUrl,
        url: b.canonicalUrl || `/blog/${b.slug}`,
        publishedAt: b.publishedAt ? b.publishedAt.toISOString().slice(0, 10) : null,
      })),
      certifications: certifications
        .filter((c) => c.credentialUrl)
        .map((c) => ({
          title: c.title,
          issuer: c.issuer,
          credentialUrl: c.credentialUrl,
          imageUrl: c.imageUrl,
        })),
    };
  } catch (err) {
    console.error("[AI:Resources] Error getting portfolio resources:", err);
    return {
      projects: [],
      blogPosts: [],
      certifications: [],
    };
  }
}

