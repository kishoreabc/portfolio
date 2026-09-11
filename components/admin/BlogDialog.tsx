"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BlogPostSchema, BlogPostFormData } from "@/lib/validations";
import { createBlogPost, updateBlogPost, generateBlogQuickRead } from "@/actions/blog";
import { BlogPost } from "@prisma/client";
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
import { Plus, Loader2, Sparkles, Key, Cpu, Eye, PenLine } from "lucide-react";
import { toast } from "sonner";
import { CloudinaryUpload } from "@/components/admin/CloudinaryUpload";
import { MarkdownView } from "@/components/ui/markdown-view";

interface BlogDialogProps {
  blog?: BlogPost;
  trigger?: React.ReactNode;
}

export function BlogDialog({ blog, trigger }: BlogDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger render={trigger as React.ReactElement} />
      ) : (
        <DialogTrigger render={<Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Blog Post</Button>} />
      )}
      {open && <BlogDialogContent blog={blog} onClose={() => setOpen(false)} />}
    </Dialog>
  );
}

function BlogDialogContent({
  blog,
  onClose,
}: {
  blog?: BlogPost;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gemini-3.5-flash-lite");
  const [customModel, setCustomModel] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [previewMarkdown, setPreviewMarkdown] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedKey = localStorage.getItem("portfolio_gemini_api_key") || "";
      setApiKey(storedKey);
      const storedModel = localStorage.getItem("portfolio_gemini_model") || "gemini-3.5-flash-lite";
      if (["gemini-3.5-flash-lite", "gemini-2.5-flash", "gemini-3.7-flash", "gemini-2.5-pro"].includes(storedModel)) {
        setModel(storedModel);
      } else if (storedModel) {
        setModel("custom");
        setCustomModel(storedModel);
      }
    }
  }, []);

  const defaultValues: Partial<BlogPostFormData> = {
    title: blog?.title ?? "",
    slug: blog?.slug ?? "",
    summary: blog?.summary ?? "",
    content: blog?.content ?? "",
    coverImage: blog?.coverImage ?? "",
    tags: blog?.tags ?? ["AI/ML"],
    readTime: blog?.readTime ?? "5 min read",
    canonicalUrl: blog?.canonicalUrl ?? "",
    published: blog?.published ?? true,
    featured: blog?.featured ?? false,
    displayOrder: blog?.displayOrder ?? 0,
    publishedAt: blog?.publishedAt
      ? new Date(blog.publishedAt).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
  };

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<BlogPostFormData>({
    resolver: zodResolver(BlogPostSchema),
    defaultValues,
  });

  const tagsInput = useWatch({ control, name: "tags" });
  const canonicalUrlValue = useWatch({ control, name: "canonicalUrl" });
  const coverImageValue = useWatch({ control, name: "coverImage" });
  const contentValue = useWatch({ control, name: "content" });
  const featuredValue = useWatch({ control, name: "featured" });
  const publishedValue = useWatch({ control, name: "published" });

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

  const handleAutoGenerate = async () => {
    if (!canonicalUrlValue || !canonicalUrlValue.trim().startsWith("http")) {
      toast.error("Please enter a valid blog or LinkedIn URL first (starting with http:// or https://).");
      return;
    }

    const effectiveModel = model === "custom" ? (customModel.trim() || "gemini-3.5-flash-lite") : model;

    setGenerating(true);
    try {
      const res = await generateBlogQuickRead({
        url: canonicalUrlValue.trim(),
        apiKey: apiKey.trim() || undefined,
        model: effectiveModel,
      });

      if (!res.success) {
        if (res.needsApiKey) {
          setShowSettings(true);
          toast.warning("Gemini API key is required. Please enter it in the AI Settings.");
        } else {
          toast.error(res.error || "Failed to generate blog content with Gemini.");
        }
        return;
      }

      if (res.data) {
        // Auto-populate ALL details unconditionally from Gemini
        if (res.data.title) {
          setValue("title", res.data.title, { shouldValidate: true });
        }
        if (res.data.slug) {
          setValue("slug", res.data.slug, { shouldValidate: true });
        }
        if (res.data.summary) {
          setValue("summary", res.data.summary, { shouldValidate: true });
        }
        if (res.data.tags && res.data.tags.length > 0) {
          setValue("tags", res.data.tags, { shouldValidate: true });
        }
        if (res.data.readTime) {
          setValue("readTime", res.data.readTime, { shouldValidate: true });
        }
        if (res.data.publishedAt) {
          setValue("publishedAt", res.data.publishedAt, { shouldValidate: true });
        }
        if (res.data.coverImage) {
          setValue("coverImage", res.data.coverImage, { shouldValidate: true });
        }
        if (res.data.content) {
          setValue("content", res.data.content, { shouldValidate: true });
        }

        // Switch to preview mode so user immediately sees the rich formatted output
        setPreviewMarkdown(true);

        toast.success(`✨ All details & Quick Read generated using ${effectiveModel}!`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate content");
    } finally {
      setGenerating(false);
    }
  };

  const onSubmit = async (data: BlogPostFormData) => {
    setLoading(true);
    try {
      if (blog) {
        await updateBlogPost(blog.id, data);
        toast.success("Blog post updated successfully");
      } else {
        await createBlogPost(data);
        toast.success("Blog post published successfully");
      }
      onClose();
      reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save blog post");
    } finally {
      setLoading(false);
    }
  };

  const displayModelName = model === "custom" && customModel ? customModel : model;

  return (
    <DialogContent className="sm:max-w-4xl lg:max-w-5xl w-[95vw] max-h-[92vh] overflow-y-auto overflow-x-hidden p-6 sm:p-8">
        <DialogHeader>
          <DialogTitle>{blog ? "Edit Blog Post" : "Create New Blog Post"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4 w-full min-w-0 max-w-full overflow-hidden">
          {/* AI Auto-Generator Box */}
          <div className="space-y-3 p-4 rounded-xl border border-primary/25 bg-primary/5 dark:bg-primary/10 min-w-0 max-w-full">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="text-xs font-bold flex items-center gap-1.5 text-primary">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> LinkedIn / Article URL & AI Quick Read
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
                      value={["gemini-3.5-flash-lite", "gemini-2.5-flash", "gemini-3.7-flash", "gemini-2.5-pro"].includes(model) ? model : "custom"}
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
                {...register("canonicalUrl")}
                placeholder="https://www.linkedin.com/posts/... or any article URL"
                className="bg-background text-xs min-w-0 flex-1"
              />
              <Button
                type="button"
                disabled={generating || !canonicalUrlValue}
                onClick={handleAutoGenerate}
                className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 text-xs font-semibold h-9 px-4 cursor-pointer shadow-sm"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    Auto-Generate Quick Read
                  </>
                )}
              </Button>
            </div>

            <p className="text-[11px] text-muted-foreground leading-normal">
              Paste your article or LinkedIn post link and click <strong>Auto-Generate Quick Read</strong>. Gemini AI ({displayModelName}) will analyze the link and automatically generate the Quick Read markdown breakdown, summary, tags, and read time.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
            <div className="space-y-1.5 min-w-0">
              <label className="text-xs font-semibold">Title *</label>
              <Input
                {...register("title")}
                placeholder="Building Production-Grade RAG Systems"
                className="w-full min-w-0 text-xs"
                onChange={(e) => {
                  register("title").onChange(e);
                  if (!blog) {
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

            <div className="space-y-1.5 min-w-0">
              <label className="text-xs font-semibold">Slug *</label>
              <Input {...register("slug")} placeholder="building-production-rag-systems" className="w-full min-w-0 text-xs" />
              {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5 min-w-0">
            <label className="text-xs font-semibold">Summary / Excerpt *</label>
            <Textarea
              {...register("summary")}
              rows={3}
              placeholder="A concise summary displayed on the blog card..."
              className="w-full min-w-0 text-xs leading-relaxed resize-y"
            />
            {errors.summary && <p className="text-xs text-destructive">{errors.summary.message}</p>}
          </div>

          <div className="space-y-1.5 min-w-0">
            <label className="text-xs font-semibold">Tags (Comma separated) *</label>
            <Input
              value={Array.isArray(tagsInput) ? tagsInput.join(", ") : ""}
              onChange={(e) => {
                const list = e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean);
                setValue("tags", list);
              }}
              placeholder="Generative AI, RAG, Vector Search, LLMs"
              className="w-full min-w-0 text-xs"
            />
            {errors.tags && <p className="text-xs text-destructive">{errors.tags.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 min-w-0">
            <div className="space-y-1.5 min-w-0">
              <label className="text-xs font-semibold">Read Time</label>
              <Input {...register("readTime")} placeholder="5 min read" className="w-full min-w-0 text-xs" />
            </div>

            <div className="space-y-1.5 min-w-0">
              <label className="text-xs font-semibold">Published Date</label>
              <Input type="date" {...register("publishedAt")} className="w-full min-w-0 text-xs" />
            </div>

            <div className="space-y-1.5 min-w-0">
              <label className="text-xs font-semibold">Display Order</label>
              <Input
                type="number"
                {...register("displayOrder", { valueAsNumber: true })}
                placeholder="1"
                className="w-full min-w-0 text-xs"
              />
            </div>
          </div>

          <CloudinaryUpload
            label="Cover Image (Cloudinary Upload)"
            value={coverImageValue ?? ""}
            onChange={(url) => setValue("coverImage", url, { shouldValidate: true, shouldDirty: true, shouldTouch: true })}
            placeholder="Upload blog cover image or paste URL..."
            accept="image/*"
            helpText="Upload blog cover image (PNG, JPG, WebP) or paste an image URL directly."
          />

          <div className="space-y-2 min-w-0 max-w-full">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="text-xs font-semibold">Full Markdown Content (Quick Read)</label>

              {/* Toggle Write / Preview */}
              <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/80">
                <button
                  type="button"
                  onClick={() => setPreviewMarkdown(false)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                    !previewMarkdown
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Edit raw markdown"
                >
                  <PenLine className="w-3.5 h-3.5" />
                  Write
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMarkdown(true)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                    previewMarkdown
                      ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Preview formatted markdown output"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </button>
              </div>
            </div>

            {!previewMarkdown ? (
              <Textarea
                {...register("content")}
                rows={14}
                placeholder="## Overview&#10;&#10;Write or auto-generate quick read content here with markdown support..."
                className="font-mono text-xs leading-relaxed min-h-[280px] resize-y w-full min-w-0"
              />
            ) : (
              <div className="min-h-[280px] w-full p-5 sm:p-7 rounded-xl border border-input bg-card/60 text-xs shadow-xs min-w-0 max-w-full break-words [overflow-wrap:anywhere] overflow-x-hidden">
                {contentValue ? (
                  <MarkdownView content={contentValue || ""} />
                ) : (
                  <div className="text-center py-14 text-muted-foreground text-xs italic">
                    No content to preview yet. Switch to &quot;Write&quot; or click &quot;Auto-Generate Quick Read&quot; above.
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>
                {previewMarkdown
                  ? "Showing live rendered preview. Extends downward naturally without cramping or inner scrollbars."
                  : "Supports Markdown & Code blocks (## headings, - lists, `inline code`, ``` blocks)."}
              </span>
              <button
                type="button"
                onClick={() => setPreviewMarkdown(!previewMarkdown)}
                className="text-primary hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                {previewMarkdown ? "Switch to Write (Edit Mode)" : "Switch to Live Preview"}
              </button>
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
            </div>

            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {blog ? "Save Changes" : "Publish Blog Post"}
            </Button>
          </div>
        </form>
      </DialogContent>
  );
}
