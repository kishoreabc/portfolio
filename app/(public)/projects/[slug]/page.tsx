import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Footer } from "@/components/public/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ExternalLink, Star, GitFork, Cpu, AlertCircle, CheckCircle2, Layers } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 86400; // 24h ISR

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await prisma.project.findUnique({ where: { slug } });
  if (!project) return { title: "Project Not Found" };

  return {
    title: `${project.title} | Kishore R Project`,
    description: project.shortDescription,
    openGraph: {
      title: project.title,
      description: project.shortDescription,
      images: project.imageUrl ? [{ url: project.imageUrl }] : [],
    },
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [project, socialLinks] = await Promise.all([
    prisma.project.findUnique({ where: { slug } }),
    prisma.socialLink.findMany({ where: { enabled: true }, orderBy: { displayOrder: "asc" } }),
  ]);

  if (!project || !project.published) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <main className="flex-1 container-portfolio pt-32 pb-20 space-y-8 max-w-4xl">
        <Button variant="ghost" size="sm" render={<Link href="/#projects" />} className="gap-2 text-xs">
          <ArrowLeft className="w-4 h-4" /> Back to All Projects
        </Button>

        {/* Title & Metadata Header */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {project.featured && (
              <Badge variant="default" className="text-xs px-2.5 py-0.5">
                Featured Project
              </Badge>
            )}
            {project.githubStars !== null && (
              <span className="flex items-center gap-1 text-xs text-amber-500 font-medium bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                <Star className="w-3.5 h-3.5 fill-amber-500" /> {project.githubStars} stars
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">{project.title}</h1>
          <p className="text-base text-muted-foreground leading-relaxed">{project.shortDescription}</p>

          <div className="flex flex-wrap gap-2 pt-2">
            {project.technologies.map((t) => (
              <Badge key={t} variant="secondary" className="text-xs px-3 py-1">
                {t}
              </Badge>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-4">
            {project.githubUrl && (
              <Button size="default" className="rounded-full gap-2 text-xs" render={<a href={project.githubUrl} target="_blank" rel="noreferrer" />}>
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                View on GitHub
              </Button>
            )}

            {project.liveUrl && (
              <Button size="default" variant="outline" className="rounded-full gap-2 text-xs" render={<a href={project.liveUrl} target="_blank" rel="noreferrer" />}>
                <ExternalLink className="w-4 h-4" /> Live Demo
              </Button>
            )}
          </div>
        </div>

        {/* Content sections */}
        <div className="space-y-8 pt-6">
          {project.fullDescription && (
            <Card className="border-border/70 bg-card/60 p-6 space-y-3">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Cpu className="w-5 h-5 text-primary" /> Detailed Overview
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {project.fullDescription}
              </p>
            </Card>
          )}

          {(project.problem || project.solution) && (
            <div className="grid gap-6 sm:grid-cols-2">
              {project.problem && (
                <Card className="border-border/70 bg-card/60 p-6 space-y-2">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" /> Problem Statement
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{project.problem}</p>
                </Card>
              )}

              {project.solution && (
                <Card className="border-border/70 bg-card/60 p-6 space-y-2">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Technical Solution
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{project.solution}</p>
                </Card>
              )}
            </div>
          )}

          {project.architecture && (
            <Card className="border-border/70 bg-card/60 p-6 space-y-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" /> Architecture & Data Flow
              </h3>
              <div className="p-4 rounded-xl bg-accent/50 font-mono text-xs text-muted-foreground leading-relaxed">
                {project.architecture}
              </div>
            </Card>
          )}
        </div>
      </main>

      <Footer socialLinks={socialLinks} />
    </div>
  );
}
