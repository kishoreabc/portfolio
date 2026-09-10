"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProjectSchema, ProjectFormData } from "@/lib/validations";
import { createProject, updateProject, generateProjectDetails } from "@/actions/project";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CloudinaryUpload } from "@/components/admin/CloudinaryUpload";
import { Plus, Loader2, Sparkles, Cpu, Key } from "lucide-react";
import { toast } from "sonner";
import { Project } from "@prisma/client";

interface ProjectDialogProps {
  project?: Project | null;
  trigger?: React.ReactNode;
}

export function ProjectDialog({ project, trigger }: ProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Gemini AI state
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gemini-3.5-flash-lite");
  const [customModel, setCustomModel] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiUrl, setAiUrl] = useState(project?.githubUrl || project?.liveUrl || "");

  // Load saved API key & model from localStorage on mount (shared with blog AI)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem("portfolio_gemini_api_key");
      if (savedKey) setApiKey(savedKey);
      const savedModel = localStorage.getItem("portfolio_gemini_model");
      if (savedModel) {
        if (
          ["gemini-3.5-flash-lite", "gemini-2.5-flash", "gemini-3.7-flash", "gemini-2.5-pro"].includes(
            savedModel
          )
        ) {
          setModel(savedModel);
        } else {
          setModel("custom");
          setCustomModel(savedModel);
        }
      }
    }
  }, []);

  const handleSaveApiKey = (val: string) => {
    setApiKey(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("portfolio_gemini_api_key", val.trim());
    }
  };

  const handleSaveModel = (val: string) => {
    setModel(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("portfolio_gemini_model", val.trim());
    }
  };

  const displayModelName = model === "custom" && customModel ? customModel : model;

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
    control,
    reset,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(ProjectSchema),
    defaultValues,
  });

  const techInput = useWatch({ control, name: "technologies" });
  const githubUrlValue = useWatch({ control, name: "githubUrl" });
  const liveUrlValue = useWatch({ control, name: "liveUrl" });
  const imageUrlValue = useWatch({ control, name: "imageUrl" });
  const featuredValue = useWatch({ control, name: "featured" });
  const publishedValue = useWatch({ control, name: "published" });
  const githubSyncEnabledValue = useWatch({ control, name: "githubSyncEnabled" });

  const handleAutoGenerate = async () => {
    const targetUrl = aiUrl.trim() || githubUrlValue?.trim() || liveUrlValue?.trim();
    if (!targetUrl || !targetUrl.startsWith("http")) {
      toast.error(
        "Please enter a valid GitHub repository or project link first (starting with http:// or https://)."
      );
      return;
    }

    const effectiveModel =
      model === "custom" ? customModel.trim() || "gemini-3.5-flash-lite" : model;

    setGenerating(true);
    try {
      const res = await generateProjectDetails({
        url: targetUrl,
        apiKey: apiKey.trim() || undefined,
        model: effectiveModel,
      });

      if (!res.success) {
        if (res.needsApiKey) {
          setShowSettings(true);
          toast.warning("Gemini API key is required. Please enter it in the AI Settings.");
        } else {
          toast.error(res.error || "Failed to generate project details with Gemini.");
        }
        return;
      }

      if (res.data) {
        // Auto-populate ALL details unconditionally from Gemini
        if (res.data.title) {
          setValue("title", res.data.title, { shouldValidate: true, shouldDirty: true });
        }
        if (res.data.slug) {
          setValue("slug", res.data.slug, { shouldValidate: true, shouldDirty: true });
        }
        if (res.data.shortDescription) {
          setValue("shortDescription", res.data.shortDescription, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
        if (res.data.fullDescription) {
          setValue("fullDescription", res.data.fullDescription, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
        if (res.data.problem) {
          setValue("problem", res.data.problem, { shouldValidate: true, shouldDirty: true });
        }
        if (res.data.solution) {
          setValue("solution", res.data.solution, { shouldValidate: true, shouldDirty: true });
        }
        if (res.data.architecture) {
          setValue("architecture", res.data.architecture, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
        if (res.data.technologies && res.data.technologies.length > 0) {
          setValue("technologies", res.data.technologies, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
        if (res.data.githubUrl) {
          setValue("githubUrl", res.data.githubUrl, { shouldValidate: true, shouldDirty: true });
        }
        if (res.data.liveUrl) {
          setValue("liveUrl", res.data.liveUrl, { shouldValidate: true, shouldDirty: true });
        }
        if (res.data.imageUrl) {
          setValue("imageUrl", res.data.imageUrl, { shouldValidate: true, shouldDirty: true });
        }
        if (res.data.metrics) {
          setValue("metrics", res.data.metrics, { shouldValidate: true, shouldDirty: true });
        }
        if (typeof res.data.featured === "boolean") {
          setValue("featured", res.data.featured, { shouldValidate: true, shouldDirty: true });
        }
        if (typeof res.data.githubSyncEnabled === "boolean") {
          setValue("githubSyncEnabled", res.data.githubSyncEnabled, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }

        toast.success(`✨ All project details auto-filled using ${effectiveModel}!`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate project content");
    } finally {
      setGenerating(false);
    }
  };

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
      <DialogContent className="sm:max-w-4xl lg:max-w-5xl w-[95vw] max-h-[92vh] overflow-y-auto overflow-x-hidden p-6 sm:p-8">
        <DialogHeader>
          <DialogTitle>{project ? "Edit Project" : "Create New Project"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4 w-full min-w-0 max-w-full overflow-hidden">
          {/* AI Auto-Generator Box */}
          <div className="space-y-3 p-4 rounded-xl border border-primary/25 bg-primary/5 dark:bg-primary/10 min-w-0 max-w-full">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="text-xs font-bold flex items-center gap-1.5 text-primary">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> GitHub / Project URL & AI Auto-Fill
              </label>

              {/* Model & API Key Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-[11px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 px-2 py-0.5 rounded-md border border-border bg-background hover:bg-muted cursor-pointer font-mono"
                  title="Click to change Gemini model"
                >
                  <Cpu className="w-3 h-3 text-primary" />
                  <span className="truncate max-w-[120px]">{displayModelName}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-[11px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 px-2 py-0.5 rounded-md border border-border bg-background hover:bg-muted cursor-pointer font-mono"
                  title="Click to configure Gemini API key"
                >
                  <Key className="w-3 h-3 text-amber-500" />
                  <span>{apiKey ? "Key Set" : "Add Key"}</span>
                </button>
              </div>
            </div>

            {/* AI Settings Drawer (Model & API Key) */}
            {showSettings && (
              <div className="p-3.5 rounded-lg bg-background border border-border space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" /> Gemini AI Settings
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">Persisted in browser</span>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  {/* Model Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-foreground flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-primary" /> Select Model
                    </label>
                    <select
                      value={
                        ["gemini-3.5-flash-lite", "gemini-2.5-flash", "gemini-3.7-flash", "gemini-2.5-pro"].includes(
                          model
                        )
                          ? model
                          : "custom"
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val !== "custom") {
                          handleSaveModel(val);
                        } else {
                          setModel("custom");
                        }
                      }}
                      className="w-full h-8 px-2 text-xs rounded-md border border-input bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite (Ultra-fast)</option>
                      <option value="gemini-2.5-flash">gemini-2.5-flash (Balanced)</option>
                      <option value="gemini-3.7-flash">gemini-3.7-flash (Next-Gen Reasoning)</option>
                      <option value="gemini-2.5-pro">gemini-2.5-pro (Deep Reasoning)</option>
                      <option value="custom">Custom Model ID...</option>
                    </select>

                    {model === "custom" && (
                      <Input
                        type="text"
                        value={customModel}
                        onChange={(e) => {
                          setCustomModel(e.target.value);
                          if (typeof window !== "undefined") {
                            localStorage.setItem("portfolio_gemini_model", e.target.value.trim());
                          }
                        }}
                        placeholder="e.g. gemini-3.8-flash"
                        className="text-xs h-7 font-mono mt-1"
                      />
                    )}
                  </div>

                  {/* API Key */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-foreground flex items-center gap-1">
                      <Key className="w-3 h-3 text-amber-500" /> API Key
                    </label>
                    <div className="flex gap-1.5">
                      <Input
                        type="password"
                        value={apiKey}
                        onChange={(e) => handleSaveApiKey(e.target.value)}
                        placeholder="AIzaSy..."
                        className="text-xs h-8 font-mono"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs h-8 px-2.5 shrink-0 cursor-pointer"
                        onClick={() => {
                          setShowSettings(false);
                          toast.success("AI settings updated.");
                        }}
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Active model: <strong className="font-mono text-primary">{displayModelName}</strong>. You can also configure default values via <code className="font-mono text-primary">GEMINI_MODEL</code> and <code className="font-mono text-primary">GEMINI_API_KEY</code> in <code className="font-mono text-primary">.env.local</code>.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 min-w-0 max-w-full">
              <Input
                value={aiUrl}
                onChange={(e) => {
                  setAiUrl(e.target.value);
                  if (e.target.value.includes("github.com") && !githubUrlValue) {
                    setValue("githubUrl", e.target.value);
                  }
                }}
                placeholder="https://github.com/username/project or live project URL..."
                className="bg-background text-xs min-w-0 flex-1"
              />
              <Button
                type="button"
                disabled={generating || (!aiUrl.trim() && !githubUrlValue && !liveUrlValue)}
                onClick={handleAutoGenerate}
                className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 text-xs font-semibold h-9 px-4 cursor-pointer shadow-sm"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Auto-Filling Details...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    Auto-Fill Project Details
                  </>
                )}
              </Button>
            </div>

            <p className="text-[11px] text-muted-foreground leading-normal">
              Paste a GitHub repository link or live demo URL and click <strong>Auto-Fill Project Details</strong>. Gemini AI ({displayModelName}) will analyze the code/README and automatically populate the title, slug, descriptions, problem, solution, architecture, technologies, and highlights.
            </p>
          </div>

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

          <CloudinaryUpload
            label="Project Cover Image (Cloudinary)"
            value={imageUrlValue ?? ""}
            onChange={(url) => setValue("imageUrl", url, { shouldValidate: true, shouldDirty: true, shouldTouch: true })}
            placeholder="Upload project screenshot or paste Cloudinary URL..."
          />


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
                  checked={featuredValue}
                  onCheckedChange={(val) => setValue("featured", val)}
                />
                Featured
              </label>

              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <Switch
                  checked={publishedValue}
                  onCheckedChange={(val) => setValue("published", val)}
                />
                Published
              </label>

              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <Switch
                  checked={githubSyncEnabledValue}
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
