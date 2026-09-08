"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BlogPostSchema, BlogPostFormData } from "@/lib/validations";
import { createBlogPost, updateBlogPost } from "@/actions/blog";
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
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CloudinaryUpload } from "@/components/admin/CloudinaryUpload";

interface BlogDialogProps {
  blog?: BlogPost;
  trigger?: React.ReactNode;
}

export function BlogDialog({ blog, trigger }: BlogDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

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

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">LinkedIn Post / Article URL</label>
            <Input {...register("canonicalUrl")} placeholder="https://www.linkedin.com/pulse/... or https://www.linkedin.com/posts/..." />
            <p className="text-[10px] text-muted-foreground">
              Direct link to your published article or post on LinkedIn.
            </p>
          </div>

          <CloudinaryUpload
            label="Cover Image (Cloudinary Upload)"
            value={watch("coverImage") ?? ""}
            onChange={(url) => setValue("coverImage", url, { shouldValidate: true })}
            placeholder="Upload blog cover image or paste URL..."
            accept="image/*"
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Full Markdown Content</label>
            <Textarea
              {...register("content")}
              rows={8}
              placeholder="# Introduction&#10;&#10;Write full article content here with markdown support..."
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
