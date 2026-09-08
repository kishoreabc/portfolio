import { prisma } from "@/lib/db";
import { fetchGitHubHeatmap } from "@/lib/github";
import { Navbar } from "@/components/public/Navbar";
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
import { JourneyEntry } from "@/types";
import { sortJourneyEntriesByTimelineDesc } from "@/lib/utils";

import type { SiteConfig, Skill, Project, Certification, BlogPost, Education, SocialLink } from "@prisma/client";
import type { ContributionCalendar } from "@/lib/github";

// Revalidate homepage every hour (ISR)
export const revalidate = 3600;

export default async function HomePage() {
  let config: SiteConfig | null = null;
  let skills: Skill[] = [];
  let projects: Project[] = [];
  let certifications: Certification[] = [];
  let blogs: BlogPost[] = [];
  let educationList: Education[] = [];
  let socialLinks: SocialLink[] = [];
  let githubHeatmap: ContributionCalendar | null = null;

  try {
    const results = await Promise.all([
      prisma.siteConfig.findUnique({ where: { id: "singleton" } }),
      prisma.skill.findMany({ orderBy: [{ category: "asc" }, { displayOrder: "asc" }] }),
      prisma.project.findMany({ orderBy: { displayOrder: "asc" } }),
      prisma.certification.findMany({ orderBy: [{ issueDate: "desc" }, { displayOrder: "asc" }] }),
      prisma.blogPost.findMany({ where: { published: true }, orderBy: [{ featured: "desc" }, { displayOrder: "asc" }, { publishedAt: "desc" }] }),
      prisma.education.findMany({ orderBy: { displayOrder: "asc" } }),
      prisma.socialLink.findMany({ where: { enabled: true }, orderBy: { displayOrder: "asc" } }),
      fetchGitHubHeatmap(),
    ]);
    config = results[0];
    skills = results[1];
    projects = results[2];
    certifications = results[3];
    blogs = results[4];
    educationList = results[5];
    socialLinks = results[6];
    githubHeatmap = results[7];
  } catch (error) {
    console.warn(
      "[HomePage] Database or external fetch error during render/build, using fallbacks:",
      error instanceof Error ? error.message : error
    );
  }

  const rawJourneyEntries = (config?.journeyEntries as unknown as JourneyEntry[]) || [
    {
      id: "btech",
      title: "B.Tech in AI & ML",
      organization: "Bannari Amman Institute of Technology",
      period: "2023 – Present",
      description: "Pursuing B.Tech in Artificial Intelligence & Machine Learning (CGPA: 8.33).",
      type: "education",
      icon: "graduation-cap",
    },
    {
      id: "genai",
      title: "Generative AI Development",
      organization: "Self-driven Projects",
      period: "2024 – Present",
      description: "Built RAG pipelines, multimodal search, and voice-first AI agents.",
      type: "project",
      icon: "cpu",
    },
    {
      id: "leetcode",
      title: "LeetCode / DSA Journey",
      organization: "LeetCode",
      period: "2023 – Present",
      description: "Solved 380+ problem algorithms across arrays, trees, and dynamic programming.",
      type: "achievement",
      icon: "code",
    },
    {
      id: "nptel",
      title: "NPTEL — Programming in Java",
      organization: "SWAYAM NPTEL",
      period: "2024",
      description: "Elite + Gold certification with 92% score.",
      type: "certification",
      icon: "award",
    },
    {
      id: "ncc",
      title: "NCC Involvement",
      organization: "National Cadet Corps",
      period: "2023 – Present",
      description: "Active NCC cadet developing leadership, discipline, and teamwork.",
      type: "activity",
      icon: "shield",
    },
  ];

  const journeyEntries = sortJourneyEntriesByTimelineDesc(rawJourneyEntries);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary selection:text-primary-foreground">
      <Navbar />

      <main className="flex-1">
        <Hero config={config} socialLinks={socialLinks} />
        <About config={config} educationList={educationList} />
        <Skills skills={skills} />
        <Projects projects={projects} />
        <Certifications certifications={certifications} />
        <Blogs blogs={blogs} />
        <CodingSection config={config} githubHeatmap={githubHeatmap} />
        <Journey journeyEntries={journeyEntries} />
        <Contact config={config} />
      </main>

      <Footer socialLinks={socialLinks} />
    </div>
  );
}
