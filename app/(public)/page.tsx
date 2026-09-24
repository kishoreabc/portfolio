import { prisma } from "@/lib/db";
import { fetchGitHubHeatmap } from "@/lib/github";
import { getLeetCodeHeatmap } from "@/lib/leetcode";
import { Hero } from "@/components/public/Hero";
import { About } from "@/components/public/About";
import { Skills } from "@/components/public/Skills";
import { Projects } from "@/components/public/Projects";
import { Certifications } from "@/components/public/Certifications";
import { Blogs } from "@/components/public/Blogs";
import { CodingSection } from "@/components/public/CodingSection";
import { Journey } from "@/components/public/Journey";
import { Contact } from "@/components/public/Contact";
import { Footer } from "@/components/public/Footer";
import { ScrollRevealObserver } from "@/components/public/ScrollRevealObserver";
import { JourneyEntry, LeetCodeHeatmapData } from "@/types";

import type { Metadata } from "next";
import type { SiteConfig, Skill, Project, Certification, BlogPost, Education, SocialLink } from "@prisma/client";
import type { ContributionCalendar } from "@/lib/github";

// Revalidate homepage every hour (ISR)
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  let config: {
    seoTitle: string | null;
    seoDescription: string | null;
    seoKeywords: string | null;
    ogImageUrl: string | null;
    avatarUrl: string | null;
  } | null = null;

  try {
    config = await prisma.siteConfig.findUnique({
      where: { id: "singleton" },
      select: {
        seoTitle: true,
        seoDescription: true,
        seoKeywords: true,
        ogImageUrl: true,
        avatarUrl: true,
      },
    });
  } catch (error) {
    console.warn(
      "[generateMetadata] Failed to fetch siteConfig:",
      error instanceof Error ? error.message : error
    );
  }

  const title = config?.seoTitle?.trim() || "Kishore R";
  const description =
    config?.seoDescription?.trim() ||
    "Official portfolio and personal website of Kishore R (Kishore), Aspiring AI/ML and Generative AI Engineer specializing in RAG pipelines, LLMs, and intelligent systems. Based in Salem, Tamil Nadu, India. Explore Kishore's projects, articles, code, and experience.";

  const rawKeywords = config?.seoKeywords?.trim();
  const keywords = rawKeywords
    ? rawKeywords.split(",").map((k) => k.trim()).filter(Boolean)
    : undefined;

  const socialImage = config?.ogImageUrl?.trim() || config?.avatarUrl?.trim();
  const images = socialImage ? [{ url: socialImage, alt: "Kishore R Profile Photo" }] : [];

  return {
    title: {
      absolute: title,
    },
    description,
    keywords,
    openGraph: {
      title,
      description,
      ...(images.length > 0 ? { images } : {}),
    },
    twitter: {
      title,
      description,
      ...(images.length > 0 ? { images } : {}),
    },
  };
}

export default async function HomePage() {
  let config: SiteConfig | null = null;
  let skills: Skill[] = [];
  let projects: Project[] = [];
  let certifications: Certification[] = [];
  let blogs: BlogPost[] = [];
  let educationList: Education[] = [];
  let socialLinks: SocialLink[] = [];
  let githubHeatmap: ContributionCalendar | null = null;
  let leetcodeHeatmap: LeetCodeHeatmapData | null = null;

  try {
    const [dbData, ghData, lcData] = await Promise.all([
      prisma.$transaction([
        prisma.siteConfig.findUnique({ where: { id: "singleton" } }),
        prisma.skill.findMany({ orderBy: [{ category: "asc" }, { displayOrder: "asc" }] }),
        prisma.project.findMany({ orderBy: { displayOrder: "asc" } }),
        prisma.certification.findMany({ orderBy: [{ issueDate: "desc" }, { displayOrder: "asc" }] }),
        prisma.blogPost.findMany({ where: { published: true }, orderBy: [{ featured: "desc" }, { displayOrder: "asc" }, { publishedAt: "desc" }] }),
        prisma.education.findMany({ orderBy: { displayOrder: "asc" } }),
        prisma.socialLink.findMany({ where: { enabled: true }, orderBy: { displayOrder: "asc" } }),
      ]),
      fetchGitHubHeatmap(),
      getLeetCodeHeatmap(),
    ]);
    config = dbData[0];
    skills = dbData[1];
    projects = dbData[2];
    certifications = dbData[3];
    blogs = dbData[4];
    educationList = dbData[5];
    socialLinks = dbData[6];
    githubHeatmap = ghData;
    leetcodeHeatmap = lcData;
  } catch (error) {
    console.warn(
      "[HomePage] Database or external fetch error during render/build:",
      error instanceof Error ? error.message : error
    );
  }

  const journeyEntries = (Array.isArray(config?.journeyEntries)
    ? config.journeyEntries
    : []) as unknown as JourneyEntry[];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary selection:text-primary-foreground overflow-x-clip w-full max-w-full">
      <ScrollRevealObserver />

      <main className="flex-1 w-full max-w-full min-w-0">
        <Hero config={config} socialLinks={socialLinks} />
        <About
          config={config}
          educationList={educationList}
          initialSolvedCount={leetcodeHeatmap?.solvedTotal ?? config?.leetcodeTotal ?? 0}
        />
        <Skills skills={skills} />
        <Projects projects={projects} />
        <Certifications certifications={certifications} />
        <Blogs blogs={blogs} socialLinks={socialLinks} />
        <CodingSection
          config={config}
          githubHeatmap={githubHeatmap}
          socialLinks={socialLinks}
          initialLeetCodeHeatmap={leetcodeHeatmap}
        />
        <Journey journeyEntries={journeyEntries} />
        <Contact config={config} />
      </main>

      <Footer socialLinks={socialLinks} />
    </div>
  );
}
