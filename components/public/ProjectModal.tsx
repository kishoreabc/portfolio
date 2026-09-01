"use client";

import { useState } from "react";
import { Project } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Star, GitFork, Cpu, CheckCircle2, AlertCircle, Layers } from "lucide-react";

interface ProjectModalProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectModal({ project, open, onOpenChange }: ProjectModalProps) {
  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto p-6 sm:p-8">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="default" className="text-xs px-2 py-0.5">
              {project.featured ? "Featured Project" : "Project Details"}
            </Badge>
            {project.githubStars !== null && (
              <span className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                <Star className="w-3.5 h-3.5 fill-amber-500" /> {project.githubStars} stars
              </span>
            )}
          </div>
          <DialogTitle className="text-2xl font-bold">{project.title}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {project.shortDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Tech Badges */}
          <div className="flex flex-wrap gap-1.5">
            {project.technologies.map((tech) => (
              <Badge key={tech} variant="secondary" className="text-xs">
                {tech}
              </Badge>
            ))}
          </div>

          {/* Links */}
          <div className="flex items-center gap-3">
            {project.githubUrl && (
              <Button size="sm" variant="outline" className="rounded-full gap-2 text-xs" render={<a href={project.githubUrl} target="_blank" rel="noreferrer" />}>
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                View Repository
              </Button>
            )}

            {project.liveUrl && (
              <Button size="sm" className="rounded-full gap-2 text-xs" render={<a href={project.liveUrl} target="_blank" rel="noreferrer" />}>
                <ExternalLink className="w-3.5 h-3.5" /> Live Demo
              </Button>
            )}
          </div>

          {/* Full Description */}
          {project.fullDescription && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Cpu className="w-4 h-4 text-primary" /> Overview
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {project.fullDescription}
              </p>
            </div>
          )}

          {/* Problem & Solution Grid */}
          {(project.problem || project.solution) && (
            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              {project.problem && (
                <div className="p-4 rounded-xl bg-accent/40 border border-border/60 space-y-1.5">
                  <h4 className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" /> Problem
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{project.problem}</p>
                </div>
              )}

              {project.solution && (
                <div className="p-4 rounded-xl bg-accent/40 border border-border/60 space-y-1.5">
                  <h4 className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Solution
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{project.solution}</p>
                </div>
              )}
            </div>
          )}

          {/* System Architecture */}
          {project.architecture && (
            <div className="p-4 rounded-xl bg-card border border-border/70 space-y-2">
              <h4 className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                <Layers className="w-4 h-4 text-primary shrink-0" /> System Architecture Pipeline
              </h4>
              <p className="text-xs font-mono text-muted-foreground bg-accent/50 p-3 rounded-lg leading-relaxed">
                {project.architecture}
              </p>
            </div>
          )}

          {/* Highlights / Metrics */}
          {project.metrics && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs font-medium text-primary">
              ⚡ Key Highlight: {project.metrics}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
