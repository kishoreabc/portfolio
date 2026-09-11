"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
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
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AdminRowDeleteButtonProps {
  itemTitle?: string;
  itemType?: string;
  size?: "default" | "sm" | "icon";
  className?: string;
  onDelete: () => Promise<unknown>;
}

export function AdminRowDeleteButton({
  itemTitle,
  itemType = "record",
  className = "w-8 h-8 text-destructive hover:text-destructive hover:bg-destructive/10",
  onDelete,
}: AdminRowDeleteButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await onDelete();
        toast.success(`${itemTitle ? `"${itemTitle}"` : `The ${itemType}`} deleted successfully`);
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : `Failed to delete ${itemType}`);
      }
    });
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className={className}
        onClick={() => setOpen(true)}
        disabled={isPending}
        title={`Delete ${itemType}`}
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin text-destructive" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {itemTitle
                ? `This will permanently delete "${itemTitle}". This action cannot be undone.`
                : `This will permanently delete this ${itemType}. This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isPending ? "Deleting..." : `Delete ${itemType}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
