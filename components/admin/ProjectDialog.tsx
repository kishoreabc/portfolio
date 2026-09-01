"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProjectSchema, ProjectFormData } from "@/lib/validations";
import { createProject, updateProject } from "@/actions/project";
import { Project } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ProjectDialogProps {
  project?: Project;
  trigger?: React.ReactNode;
}

export function ProjectDialog({ project, trigger }: ProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const defaultValues: Partial<ProjectFormData> = {
    title: project?.title ?? "",
    slug: project?.slug ?? "",
    shortDescription: project?.shortDescription ?? "",
    fullDescription: project?.fullDescription ?? "",
    problem: project?.problem ?? "",
    solution: project?.solution ?? "",
    architecture: project?.architecture ?? "",
    technologies: project?.technologies ?? [],
    githubUrl: project?.githubUrl ?? "",
    liveUrl: project?.liveUrl ?? "",
    imageUrl: project?.imageUrl ?? "",
    metrics: project?.metrics ?? "",
    featured: project?.featured ?? false,
    published: project?.published ?? true,
    displayOrder: project?.displayOrder ?? 0,
    githubSyncEnabled: project?.githubSyncEnabled ?? false,
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(ProjectSchema),
    defaultValues,
  });

  const techInput = watch("technologies");

  const onSubmit = async (data: ProjectFormData) => {
    setLoading(true);
    try {
      if (project) {
        await updateProject(project.id, data);
        toast.success("Project updated successfully");
      } else {
        await createProject(data);
        toast.success("Project created successfully");
      }
      setOpen(false);
      reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger render={trigger as React.ReactElement} />
      ) : (
        <DialogTrigger render={<Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Project</Button>} />
      )}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project ? "Edit Project" : "Create New Project"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Title *</label>
              <Input
                {...register("title")}
                placeholder="RAG Financial Chatbot"
                onChange={(e) => {
                  register("title").onChange(e);
                  if (!project) {
                    const slugified = e.target.value
                      .toLowerCase()
                      .replace(/[^\w\s-]/g, "")
                      .replace(/[\s_]+/g, "-");
                    setValue("slug", slugified);
                  }
                }}
              />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Slug *</label>
              <Input {...register("slug")} placeholder="rag-financial-chatbot" />
              {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Short Description *</label>
            <Textarea
              {...register("shortDescription")}
              rows={2}
              placeholder="Brief overview displayed on card"
            />
            {errors.shortDescription && (
              <p className="text-xs text-destructive">{errors.shortDescription.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Full Description</label>
            <Textarea {...register("fullDescription")} rows={3} placeholder="Detailed project overview..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Problem Statement</label>
              <Textarea {...register("problem")} rows={2} placeholder="What problem did this solve?" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Solution</label>
              <Textarea {...register("solution")} rows={2} placeholder="How was it solved?" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Architecture</label>
            <Textarea {...register("architecture")} rows={2} placeholder="Data pipeline / system architecture" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Technologies (Comma separated) *</label>
            <Input
              value={Array.isArray(techInput) ? techInput.join(", ") : ""}
              onChange={(e) => {
                const list = e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean);
                setValue("technologies", list);
              }}
              placeholder="OpenAI, FAISS, Python, FastAPI"
            />
            {errors.technologies && (
              <p className="text-xs text-destructive">{errors.technologies.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">GitHub URL</label>
              <Input {...register("githubUrl")} placeholder="https://github.com/..." />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Live Demo URL</label>
              <Input {...register("liveUrl")} placeholder="https://..." />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Metrics / Highlight</label>
              <Input {...register("metrics")} placeholder="20K+ items indexed, 98% accuracy" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Display Order</label>
              <Input
                type="number"
                {...register("displayOrder", { valueAsNumber: true })}
                placeholder="1"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/60">
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <Switch
                  checked={watch("featured")}
                  onCheckedChange={(val) => setValue("featured", val)}
                />
                Featured
              </label>

              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <Switch
                  checked={watch("published")}
                  onCheckedChange={(val) => setValue("published", val)}
                />
                Published
              </label>

              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <Switch
                  checked={watch("githubSyncEnabled")}
                  onCheckedChange={(val) => setValue("githubSyncEnabled", val)}
                />
                Sync GitHub Stars
              </label>
            </div>

            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {project ? "Save Changes" : "Create Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
