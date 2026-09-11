"use client";

import { useState, useTransition } from "react";
import { Project } from "@prisma/client";
import {
  deleteProject,
  toggleProjectPublished,
  toggleProjectFeatured,
  syncProjectGithub,
} from "@/actions/project";
import { ProjectDialog } from "@/components/admin/ProjectDialog";
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
import { MoreHorizontal, Edit, Trash2, RefreshCw, Eye, EyeOff, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ProjectRowActions({ project }: { project: Project }) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [optimisticPublished, setOptimisticPublished] = useState(project.published);
  const [optimisticFeatured, setOptimisticFeatured] = useState(project.featured);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteProject(project.id);
      toast.success("Project deleted");
      setDeleteOpen(false);
    } catch {
      toast.error("Failed to delete project");
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    toast.promise(syncProjectGithub(project.id), {
      loading: "Fetching GitHub repo data...",
      success: "GitHub data synchronized!",
      error: (err) => (err instanceof Error ? err.message : "Sync failed"),
    });
  };

  const handleTogglePublished = () => {
    const nextVal = !optimisticPublished;
    setOptimisticPublished(nextVal);
    startTransition(async () => {
      try {
        await toggleProjectPublished(project.id, nextVal);
        toast.success(nextVal ? "Project published" : "Project hidden");
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
        await toggleProjectFeatured(project.id, nextVal);
        toast.success(nextVal ? "Set as featured" : "Removed from featured");
      } catch {
        setOptimisticFeatured(!nextVal); // revert
        toast.error("Failed to update featured status");
      }
    });
  };

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        <ProjectDialog
          project={project}
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

            {project.githubUrl && (
              <DropdownMenuItem onClick={handleSync}>
                <RefreshCw className="w-4 h-4 mr-2" /> Sync GitHub Data
              </DropdownMenuItem>
            )}

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
              This will permanently delete project &quot;{project.title}&quot;. This action cannot be undone.
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
              {loading ? "Deleting..." : "Delete Project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

