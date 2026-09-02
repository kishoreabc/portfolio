"use client";

import { useState } from "react";
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
import { MoreHorizontal, Edit, Trash2, RefreshCw, Eye, EyeOff, Star } from "lucide-react";
import { toast } from "sonner";

export function ProjectRowActions({ project }: { project: Project }) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteProject(project.id);
      toast.success("Project deleted");
    } catch {
      toast.error("Failed to delete project");
    } finally {
      setLoading(false);
      setDeleteOpen(false);
    }
  };

  const handleSync = async () => {
    toast.promise(syncProjectGithub(project.id), {
      loading: "Fetching GitHub repo data...",
      success: "GitHub data synchronized!",
      error: (err) => (err instanceof Error ? err.message : "Sync failed"),
    });
  };

  const handleTogglePublished = async () => {
    try {
      await toggleProjectPublished(project.id, !project.published);
      toast.success(project.published ? "Project hidden" : "Project published");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleToggleFeatured = async () => {
    try {
      await toggleProjectFeatured(project.id, !project.featured);
      toast.success(project.featured ? "Removed from featured" : "Set as featured");
    } catch {
      toast.error("Failed to update featured status");
    }
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
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleTogglePublished}>
              {project.published ? (
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
              {project.featured ? "Unfeature" : "Make Featured"}
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
