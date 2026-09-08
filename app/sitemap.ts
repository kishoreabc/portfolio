import { prisma } from "@/lib/db";
import { getSiteUrl } from "@/lib/utils";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NODE_ENV === "production" ? "https://www.kishoreabc.dev" : getSiteUrl()).replace(/\/+$/, "");

  try {
    const [projects, blogs] = await Promise.all([
      prisma.project.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.blogPost.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    const projectUrls = projects.map((p) => ({
      url: `${baseUrl}/projects/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    const blogUrls = blogs.map((b) => ({
      url: `${baseUrl}/blogs/${b.slug}`,
      lastModified: b.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 1.0,
      },
      ...projectUrls,
      ...blogUrls,
    ];
  } catch (error) {
    console.warn(
      "[sitemap] Database unavailable during build/sitemap generation:",
      error instanceof Error ? error.message : error
    );
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 1.0,
      },
    ];
  }
}
