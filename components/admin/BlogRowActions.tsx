"use client";

import { useState } from "react";
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
import { MoreHorizontal, Edit, Trash2, Eye, EyeOff, Star, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export function BlogRowActions({ blog }: { blog: BlogPost }) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteBlogPost(blog.id);
      toast.success("Blog post deleted");
    } catch {
      toast.error("Failed to delete blog post");
    } finally {
      setLoading(false);
      setDeleteOpen(false);
    }
  };

  const handleTogglePublished = async () => {
    try {
      await toggleBlogPublished(blog.id, !blog.published);
      toast.success(blog.published ? "Blog un-published" : "Blog published");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleToggleFeatured = async () => {
    try {
      await toggleBlogFeatured(blog.id, !blog.featured);
      toast.success(blog.featured ? "Removed from featured" : "Marked as featured");
    } catch {
      toast.error("Failed to update featured status");
    }
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
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleTogglePublished}>
              {blog.published ? (
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
              <Star className="w-4 h-4 mr-2" />
              {blog.featured ? "Unfeature" : "Make Featured"}
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Post
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
