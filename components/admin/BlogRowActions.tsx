"use client";

import { useState, useTransition } from "react";
import { BlogPost } from "@prisma/client";
import {
  deleteBlogPost,
  toggleBlogPublished,
  toggleBlogFeatured,
} from "@/actions/blog";
import { BlogDialog } from "@/components/admin/BlogDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, Edit, Trash2, Eye, EyeOff, Star, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export function BlogRowActions({ blog }: { blog: BlogPost }) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [optimisticPublished, setOptimisticPublished] = useState(blog.published);
  const [optimisticFeatured, setOptimisticFeatured] = useState(blog.featured);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteBlogPost(blog.id);
      toast.success("Blog post deleted");
      setDeleteOpen(false);
    } catch {
      toast.error("Failed to delete blog post");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublished = () => {
    const nextVal = !optimisticPublished;
    setOptimisticPublished(nextVal);
    startTransition(async () => {
      try {
        await toggleBlogPublished(blog.id, nextVal);
        toast.success(nextVal ? "Blog published" : "Blog un-published");
      } catch {
        setOptimisticPublished(!nextVal); // revert
        toast.error("Failed to update status");
      }
    });
  };

  const handleToggleFeatured = () => {
    const nextVal = !optimisticFeatured;
    setOptimisticFeatured(nextVal);
    startTransition(async () => {
      try {
        await toggleBlogFeatured(blog.id, nextVal);
        toast.success(nextVal ? "Marked as featured" : "Removed from featured");
      } catch {
        setOptimisticFeatured(!nextVal); // revert
        toast.error("Failed to update featured status");
      }
    });
  };

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 text-muted-foreground hover:text-primary"
          title="View Blog"
          render={
            <Link
              href={blog.canonicalUrl || `/blogs/${blog.slug}`}
              target="_blank"
              rel="noreferrer"
            />
          }
        >
          <ExternalLink className="w-4 h-4" />
        </Button>

        <BlogDialog
          blog={blog}
          trigger={
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <Edit className="w-4 h-4 text-muted-foreground" />
            </Button>
          }
        />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" className="w-8 h-8" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                ) : (
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleTogglePublished}>
              {optimisticPublished ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" /> Unpublish
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" /> Publish
                </>
              )}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleToggleFeatured}>
              <Star className={`w-4 h-4 mr-2 ${optimisticFeatured ? "fill-amber-500 text-amber-500" : ""}`} />
              {optimisticFeatured ? "Unfeature" : "Make Featured"}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => setDeleteOpen(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete blog post &quot;{blog.title}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? "Deleting..." : "Delete Post"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

