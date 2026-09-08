"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { Plus, Loader2, Sparkles, Key } from "lucide-react";
import { toast } from "sonner";
import { CloudinaryUpload } from "@/components/admin/CloudinaryUpload";

interface BlogDialogProps {
  blog?: BlogPost;
  trigger?: React.ReactNode;
}

export function BlogDialog({ blog, trigger }: BlogDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedKey = localStorage.getItem("portfolio_gemini_api_key") || "";
      setApiKey(storedKey);
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
    watch,
    reset,
    formState: { errors },
  } = useForm<BlogPostFormData>({
    resolver: zodResolver(BlogPostSchema),
    defaultValues,
  });

  const tagsInput = watch("tags");
  const canonicalUrlValue = watch("canonicalUrl");

  const handleSaveApiKey = (val: string) => {
    setApiKey(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("portfolio_gemini_api_key", val.trim());
    }
  };

  const handleAutoGenerate = async () => {
    if (!canonicalUrlValue || !canonicalUrlValue.trim().startsWith("http")) {
      toast.error("Please enter a valid blog or LinkedIn URL first (starting with http:// or https://).");
      return;
    }

    setGenerating(true);
    try {
      const res = await generateBlogQuickRead({
        url: canonicalUrlValue.trim(),
        apiKey: apiKey.trim() || undefined,
      });

      if (!res.success) {
        if (res.needsApiKey) {
          setShowApiKeyInput(true);
          toast.warning("Gemini API key is required. Please enter it below or set GEMINI_API_KEY in .env.local.");
        } else {
          toast.error(res.error || "Failed to generate blog content with Gemini.");
        }
        return;
      }

      if (res.data) {
        // Auto-populate Title if empty or suggested
        if (!watch("title") || watch("title").trim() === "") {
          setValue("title", res.data.title, { shouldValidate: true });
        }
        if (!watch("slug") || watch("slug").trim() === "") {
          setValue("slug", res.data.slug, { shouldValidate: true });
        }
        // Populate full markdown quick-read content
        setValue("content", res.data.content, { shouldValidate: true });
        // Populate summary
        if (!watch("summary") || watch("summary").trim() === "") {
          setValue("summary", res.data.summary, { shouldValidate: true });
        }
        // Populate tags
        if (res.data.tags && res.data.tags.length > 0) {
          setValue("tags", res.data.tags, { shouldValidate: true });
        }
        // Populate read time
        if (res.data.readTime) {
          setValue("readTime", res.data.readTime, { shouldValidate: true });
        }

        toast.success("✨ Quick Read content generated successfully using Gemini AI!");
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
      setOpen(false);
      reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save blog post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger render={trigger as React.ReactElement} />
      ) : (
        <DialogTrigger render={<Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Blog Post</Button>} />
      )}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{blog ? "Edit Blog Post" : "Create New Blog Post"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          {/* AI Auto-Generator Box */}
          <div className="space-y-3 p-4 rounded-xl border border-primary/25 bg-primary/5 dark:bg-primary/10">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-bold flex items-center gap-1.5 text-primary">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> LinkedIn / Article URL & AI Quick Read Generator
              </label>
              <button
                type="button"
                onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                className="text-[11px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 underline underline-offset-2 cursor-pointer"
              >
                <Key className="w-3 h-3" /> {apiKey ? "API Key Configured" : "Gemini API Key"}
              </button>
            </div>

            {/* Optional Gemini API Key Drawer */}
            {showApiKeyInput && (
              <div className="p-3 rounded-lg bg-background border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-foreground flex items-center gap-1">
                    <Key className="w-3 h-3 text-amber-500" /> Gemini API Key
                  </label>
                  <span className="text-[10px] text-muted-foreground">Stored locally in your browser</span>
                </div>
                <div className="flex gap-2">
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
                    className="text-xs h-8 shrink-0 cursor-pointer"
                    onClick={() => {
                      setShowApiKeyInput(false);
                      toast.success("Gemini API key saved.");
                    }}
                  >
                    Save
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  You can also permanently configure <code className="font-mono text-primary font-semibold">GEMINI_API_KEY</code> in <code className="font-mono text-primary font-semibold">.env.local</code>.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                {...register("canonicalUrl")}
                placeholder="https://www.linkedin.com/posts/... or any article URL"
                className="bg-background text-xs"
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
              Paste your LinkedIn article or post link and click <strong>Auto-Generate Quick Read</strong> to automatically compose the structured Markdown breakdown, title, executive summary, technical tags, and read time using Gemini AI.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Title *</label>
              <Input
                {...register("title")}
                placeholder="Building Production-Grade RAG Systems"
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

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Slug *</label>
              <Input {...register("slug")} placeholder="building-production-rag-systems" />
              {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Summary / Excerpt *</label>
            <Textarea
              {...register("summary")}
              rows={2}
              placeholder="A concise summary displayed on the blog card..."
            />
            {errors.summary && <p className="text-xs text-destructive">{errors.summary.message}</p>}
          </div>

          <div className="space-y-1.5">
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
            />
            {errors.tags && <p className="text-xs text-destructive">{errors.tags.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Read Time</label>
              <Input {...register("readTime")} placeholder="5 min read" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Published Date</label>
              <Input type="date" {...register("publishedAt")} />
            </div>
          </div>

          <CloudinaryUpload
            label="Cover Image (Cloudinary Upload)"
            value={watch("coverImage") ?? ""}
            onChange={(url) => setValue("coverImage", url, { shouldValidate: true })}
            placeholder="Upload blog cover image or paste URL..."
            accept="image/*"
          />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold">Full Markdown Content (Quick Read)</label>
              <span className="text-[10px] text-muted-foreground font-mono">Supports Markdown & Code Blocks</span>
            </div>
            <Textarea
              {...register("content")}
              rows={8}
              placeholder="# Overview&#10;&#10;Write or auto-generate quick read content here with markdown support..."
              className="font-mono text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            </div>

            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {blog ? "Save Changes" : "Publish Blog Post"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
