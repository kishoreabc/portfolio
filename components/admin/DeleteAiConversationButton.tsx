"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteAiConversation } from "@/actions/ai-conversation";
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
import { Loader2, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface DeleteAiConversationButtonProps {
  conversationId: string;
  variant?: "table" | "detail";
  className?: string;
  redirectOnDelete?: boolean;
  onDeleted?: () => void;
}

export function DeleteAiConversationButton({
  conversationId,
  variant = "table",
  className = "",
  redirectOnDelete = false,
  onDeleted,
}: DeleteAiConversationButtonProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteAiConversation(conversationId);
      toast.success("Conversation record deleted from database.");
      setConfirmOpen(false);
      onDeleted?.();
      if (redirectOnDelete) {
        router.push("/admin/ai-conversations");
      }
    } catch (err) {
      console.error("[DeleteAiConversationButton] Error:", err);
      toast.error("Failed to delete conversation record.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {variant === "table" ? (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setConfirmOpen(true)}
          disabled={loading}
          className={`size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 ${className}`}
          title="Delete conversation record from database"
          aria-label="Delete conversation record"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirmOpen(true)}
          disabled={loading}
          className={`gap-1.5 h-8 text-xs font-medium border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive ${className}`}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
          <span>Delete Record</span>
        </Button>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Conversation Record?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this AI conversation record and all its
              stored messages from the database. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
