"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Project } from "@prisma/client";
import { ProjectModal } from "@/components/public/ProjectModal";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, GitFork, ArrowUpRight, Cpu, AlertCircle, CheckCircle2, Play, ExternalLink } from "lucide-react";

interface ProjectsProps {
  projects: Project[];
}

export function Projects({ projects }: ProjectsProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const publishedProjects = projects.filter((p) => p.published);

  const handleOpenModal = (project: Project) => {
    setSelectedProject(project);
    setModalOpen(true);
  };

  return (
    <section id="projects" className="section-padding bg-card/20 relative border-t border-border/40 scroll-mt-20">
      <div className="container-portfolio space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="outline" className="px-3.5 py-1 rounded-full text-xs font-mono border-primary/30 text-primary">
            Executive Project Briefs
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Production AI & <span className="text-gradient">GenAI Systems</span>
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Every project below follows a clear visual path: the real-world problem, the engineered system architecture, and verified proof of impact.
          </p>
        </div>

        {/* Projects Grid with Problem -> System -> Proof Visual Flow */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {publishedProjects.map((project, idx) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="flex"
            >
              <Card className="border-border/70 bg-card/60 backdrop-blur-sm flex flex-col justify-between hover:border-primary/50 hover:shadow-xl transition-all duration-300 group w-full overflow-hidden">
                <CardHeader className="space-y-3 pb-3">
                  {/* Top Meta Bar */}
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant={project.featured ? "default" : "secondary"}
                      className="text-[10px] px-2 py-0.5 uppercase tracking-wider font-mono font-medium"
                    >
                      {project.featured ? "Production System" : "Project"}
                    </Badge>

                    {project.githubStars !== null && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                        <span className="flex items-center gap-1 text-amber-500 font-medium">
                          <Star className="w-3.5 h-3.5 fill-amber-500" /> {project.githubStars}
                        </span>
                        {project.githubForks !== null && (
                          <span className="flex items-center gap-1">
                            <GitFork className="w-3 h-3" /> {project.githubForks}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Project Title */}
                  <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors leading-snug">
                    {project.title}
                  </CardTitle>
                </CardHeader>

                {/* Visual Path: Problem ➔ System ➔ Proof */}
                <CardContent className="space-y-3 pt-0 flex-1 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    {/* Step 1: The Problem */}
                    <div className="p-3 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400 font-mono tracking-wider uppercase">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>The Problem</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {project.problem || project.shortDescription}
                      </p>
                    </div>

                    {/* Step 2: The System & Approach */}
                    <div className="p-3 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20 space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary font-mono tracking-wider uppercase">
                        <Cpu className="w-3.5 h-3.5 shrink-0" />
                        <span>System & Approach</span>
                      </div>
                      <p className="text-xs text-foreground/90 font-medium line-clamp-2 leading-relaxed">
                        {project.solution || project.architecture || project.shortDescription}
                      </p>
                      {/* Tech badges */}
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {project.technologies.slice(0, 4).map((tech) => (
                          <Badge
                            key={tech}
                            variant="outline"
                            className="text-[10px] px-2 py-0.5 border-border/80 bg-background/60 font-mono"
                          >
                            {tech}
                          </Badge>
                        ))}
                        {project.technologies.length > 4 && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0.5 text-muted-foreground bg-background/40 font-mono"
                          >
                            +{project.technologies.length - 4}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Step 3: Verified Proof & Impact */}
                    <div className="p-3 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 font-mono tracking-wider uppercase">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Proof & Impact</span>
                      </div>
                      <p className="text-xs font-mono font-medium text-emerald-700 dark:text-emerald-300 line-clamp-2 leading-relaxed">
                        {project.metrics || "Production-tested • Verifiable architecture • Grounded outputs"}
                      </p>
                    </div>
                  </div>
                </CardContent>

                {/* Footer Actions */}
                <CardFooter className="pt-3 pb-4 border-t border-border/50 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="text-xs font-semibold rounded-full px-3.5 gap-1 shadow-xs hover:shadow-sm"
                      onClick={() => handleOpenModal(project)}
                    >
                      Deep Dive <ArrowUpRight className="w-3.5 h-3.5" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs font-medium rounded-full px-3 gap-1.5 border-border/70 hover:border-primary/40 hover:bg-primary/5"
                      onClick={() => handleOpenModal(project)}
                    >
                      <Play className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span className="hidden sm:inline">1-Min</span> Demo
                    </Button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-full hover:bg-accent"
                        title="Live Demo"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-full hover:bg-accent"
                        title="View GitHub Repository"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                        </svg>
                      </a>
                    )}
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <ProjectModal
        project={selectedProject}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </section>
  );
}
