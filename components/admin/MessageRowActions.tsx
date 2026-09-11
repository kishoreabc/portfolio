"use client";

import { useState, useTransition } from "react";
import { markMessageRead, markMessageReplied, softDeleteMessage, restoreMessage } from "@/actions/message";
import { Button } from "@/components/ui/button";
import { Mail, MailOpen, Trash2, RotateCcw, Reply, Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SuggestReplyDialog } from "@/components/admin/SuggestReplyDialog";

export function MessageRowActions({
  id,
  read,
  replied = false,
  deletedAt,
  email,
  subject,
  name = "Visitor",
  messageText = "",
  createdAt = new Date(),
}: {
  id: string;
  read: boolean;
  replied?: boolean;
  deletedAt: Date | null;
  email: string;
  subject: string;
  name?: string;
  messageText?: string;
  createdAt?: Date;
}) {
  const [optimisticRead, setOptimisticRead] = useState(read);
  const [optimisticReplied, setOptimisticReplied] = useState(replied);
  const [optimisticDeleted, setOptimisticDeleted] = useState(!!deletedAt);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleToggleRead = () => {
    const nextRead = !optimisticRead;
    setOptimisticRead(nextRead);
    setPendingAction("read");
    startTransition(async () => {
      try {
        await markMessageRead(id, nextRead);
        toast.success(nextRead ? "Marked as read" : "Marked as unread");
      } catch {
        setOptimisticRead(!nextRead);
        toast.error("Failed to update message status");
      } finally {
        setPendingAction(null);
      }
    });
  };

  const handleSoftDelete = () => {
    setOptimisticDeleted(true);
    setPendingAction("delete");
    startTransition(async () => {
      try {
        await softDeleteMessage(id);
        toast.success("Message moved to trash");
      } catch {
        setOptimisticDeleted(false);
        toast.error("Failed to move to trash");
      } finally {
        setPendingAction(null);
      }
    });
  };

  const handleRestore = () => {
    setOptimisticDeleted(false);
    setPendingAction("restore");
    startTransition(async () => {
      try {
        await restoreMessage(id);
        toast.success("Message restored");
      } catch {
        setOptimisticDeleted(true);
        toast.error("Failed to restore message");
      } finally {
        setPendingAction(null);
      }
    });
  };

  const handleToggleReplied = () => {
    const nextReplied = !optimisticReplied;
    setOptimisticReplied(nextReplied);
    setPendingAction("reply");
    startTransition(async () => {
      try {
        await markMessageReplied(id, nextReplied);
        toast.success(nextReplied ? "Marked as Replied & moved to Replied tab" : "Moved back to Inbox");
      } catch {
        setOptimisticReplied(!nextReplied);
        toast.error("Failed to update reply status");
      } finally {
        setPendingAction(null);
      }
    });
  };

  return (
    <div className="flex items-center justify-end gap-1">
      {/* Mark as Replied / Move to Inbox Toggle */}
      {!optimisticDeleted && (
        <Button
          variant="ghost"
          size="icon"
          disabled={pendingAction === "reply"}
          className={`w-8 h-8 cursor-pointer ${
            optimisticReplied
              ? "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
              : "text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10"
          }`}
          onClick={handleToggleReplied}
          title={optimisticReplied ? "Marked as Replied. Click to move back to Inbox." : "Mark as Replied (moves to Replied tab)"}
        >
          {pendingAction === "reply" ? (
            <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
          ) : (
            <CheckCircle2 className={`w-4 h-4 ${optimisticReplied ? "fill-emerald-500/20" : ""}`} />
          )}
        </Button>
      )}

      {/* AI Suggest Reply Dialog */}
      {!optimisticDeleted && (
        <SuggestReplyDialog
          message={{
            id,
            name,
            email,
            subject,
            message: messageText,
            createdAt,
            read: optimisticRead,
            replied: optimisticReplied,
          }}
          trigger={
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 cursor-pointer"
              title="✨ Suggest AI Reply"
            >
              <Sparkles className="w-4 h-4" />
            </Button>
          }
        />
      )}

      {/* Reply button opens mailto: */}
      <Button
        variant="ghost"
        size="icon"
        className="w-8 h-8"
        title="Reply via email"
        render={
          <a
            href={`mailto:${email}?subject=Re: ${encodeURIComponent(subject)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Reply className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </a>
        }
      />

      <Button
        variant="ghost"
        size="icon"
        className="w-8 h-8"
        disabled={pendingAction === "read"}
        onClick={handleToggleRead}
        title={optimisticRead ? "Mark as unread" : "Mark as read"}
      >
        {pendingAction === "read" ? (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        ) : optimisticRead ? (
          <Mail className="w-4 h-4 text-muted-foreground" />
        ) : (
          <MailOpen className="w-4 h-4 text-primary" />
        )}
      </Button>

      {optimisticDeleted ? (
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 text-primary"
          disabled={pendingAction === "restore"}
          onClick={handleRestore}
          title="Restore"
        >
          {pendingAction === "restore" ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          ) : (
            <RotateCcw className="w-4 h-4" />
          )}
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 text-destructive"
          disabled={pendingAction === "delete"}
          onClick={handleSoftDelete}
          title="Move to trash"
        >
          {pendingAction === "delete" ? (
            <Loader2 className="w-4 h-4 animate-spin text-destructive" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </Button>
      )}
    </div>
  );
}

