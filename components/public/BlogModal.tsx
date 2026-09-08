"use client";

import { BlogPost } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, ExternalLink, BookOpen, ArrowRight, Share2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface BlogModalProps {
  blog: BlogPost | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BlogModal({ blog, open, onOpenChange }: BlogModalProps) {
  if (!blog) return null;

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/blogs/${blog.slug}`;
      navigator.clipboard.writeText(url);
      toast.success("Article link copied to clipboard!");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-3xl md:max-w-4xl max-h-[88vh] overflow-y-auto p-6 sm:p-8">
        <DialogHeader className="space-y-3 pb-4 border-b border-border/60">
          <div className="flex flex-wrap items-center gap-2">
            {blog.featured && (
              <Badge variant="default" className="text-xs px-2.5 py-0.5">
                Featured Article
              </Badge>
            )}
            {blog.readTime && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono bg-accent/60 px-2.5 py-0.5 rounded-full">
                <Clock className="w-3 h-3 text-primary" /> {blog.readTime}
              </span>
            )}
            {blog.publishedAt && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                <Calendar className="w-3 h-3" />
                {new Date(blog.publishedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
          </div>

          <DialogTitle className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-snug">
            {blog.title}
          </DialogTitle>

          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            {blog.summary}
          </DialogDescription>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {blog.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs px-2.5 py-0.5">
                {tag}
              </Badge>
            ))}
          </div>
        </DialogHeader>

        {/* Article Body */}
        <div className="py-6 space-y-6">
          {blog.coverImage && (
            <div className="w-full max-h-[380px] rounded-xl overflow-hidden border border-border/60 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={blog.coverImage}
                alt={blog.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {blog.content ? (
            <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 leading-relaxed whitespace-pre-line font-sans text-sm sm:text-base">
              {blog.content}
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-card/60 border border-border/70 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-primary/70 mx-auto" />
              <p className="text-sm font-medium text-foreground">
                This article was originally published on an external platform.
              </p>
              {blog.canonicalUrl && (
                <Button
                  render={<a href={blog.canonicalUrl} target="_blank" rel="noreferrer" />}
                  className="rounded-full gap-2 text-xs"
                >
                  Read on External Publication <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-border/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="text-xs gap-1.5 rounded-full"
            >
              <Share2 className="w-3.5 h-3.5" /> Share
            </Button>

            {blog.canonicalUrl && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5 rounded-full"
                render={<a href={blog.canonicalUrl} target="_blank" rel="noreferrer" />}
              >
                External Link <ExternalLink className="w-3 h-3" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              className="text-xs rounded-full gap-1.5"
              render={<Link href={`/blogs/${blog.slug}`} />}
            >
              Open Dedicated Page <ArrowRight className="w-3.5 h-3.5" />
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs rounded-full"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
