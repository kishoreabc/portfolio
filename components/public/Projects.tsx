"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Project } from "@prisma/client";
import { ProjectModal } from "@/components/public/ProjectModal";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, GitFork, ArrowUpRight } from "lucide-react";

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
    <section id="projects" className="section-padding bg-card/20 relative border-t border-border/40">
      <div className="container-portfolio space-y-12">
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="outline" className="px-3 py-1 rounded-full text-xs font-mono">
            Featured Work
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            AI/ML & <span className="text-gradient">GenAI Projects</span>
          </h2>
          <p className="text-muted-foreground text-sm">
            Production-oriented systems spanning RAG pipelines, multimodal semantic search, and voice-first assistive AI.
          </p>
        </div>

        {/* Projects Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {publishedProjects.map((project, idx) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="flex"
            >
              <Card className="border-border/70 bg-card/60 backdrop-blur-sm flex flex-col justify-between hover:border-primary/50 hover:shadow-lg transition-all group w-full">
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={project.featured ? "default" : "secondary"} className="text-[10px] px-2 py-0.5">
                      {project.featured ? "Featured" : "Project"}
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

                  <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">
                    {project.title}
                  </CardTitle>

                  <CardDescription className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {project.shortDescription}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  {/* Tech Badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {project.technologies.slice(0, 4).map((tech) => (
                      <Badge key={tech} variant="outline" className="text-[10px] px-2 py-0.5 border-border/80">
                        {tech}
                      </Badge>
                    ))}
                    {project.technologies.length > 4 && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 text-muted-foreground">
                        +{project.technologies.length - 4}
                      </Badge>
                    )}
                  </div>

                  {project.metrics && (
                    <div className="text-[11px] text-primary/90 font-medium bg-primary/5 p-2 rounded-lg border border-primary/10">
                      ⚡ {project.metrics}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-2 border-t border-border/50 flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs font-medium text-primary hover:text-primary hover:bg-primary/10 px-3"
                    onClick={() => handleOpenModal(project)}
                  >
                    View Details <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                  </Button>

                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors p-1"
                      title="View GitHub Repository"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                    </a>
                  )}
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
