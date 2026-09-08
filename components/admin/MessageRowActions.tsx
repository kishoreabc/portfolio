"use client";

import { markMessageRead, markMessageReplied, softDeleteMessage, restoreMessage } from "@/actions/message";
import { Button } from "@/components/ui/button";
import { Mail, MailOpen, Trash2, RotateCcw, Reply, Sparkles, CheckCircle2 } from "lucide-react";
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
  const handleToggleRead = async () => {
    try {
      await markMessageRead(id, !read);
      toast.success(read ? "Marked as unread" : "Marked as read");
    } catch {
      toast.error("Failed to update message status");
    }
  };

  const handleSoftDelete = async () => {
    try {
      await softDeleteMessage(id);
      toast.success("Message moved to trash");
    } catch {
      toast.error("Failed to move to trash");
    }
  };

  const handleRestore = async () => {
    try {
      await restoreMessage(id);
      toast.success("Message restored");
    } catch {
      toast.error("Failed to restore message");
    }
  };

  const handleToggleReplied = async () => {
    try {
      await markMessageReplied(id, !replied);
      toast.success(replied ? "Moved back to Inbox" : "Marked as Replied & moved to Replied tab");
    } catch {
      toast.error("Failed to update reply status");
    }
  };

  return (
    <div className="flex items-center justify-end gap-1">
      {/* Mark as Replied / Move to Inbox Toggle */}
      {!deletedAt && (
        <Button
          variant="ghost"
          size="icon"
          className={`w-8 h-8 cursor-pointer ${
            replied ? "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10" : "text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10"
          }`}
          onClick={handleToggleReplied}
          title={replied ? "Marked as Replied. Click to move back to Inbox." : "Mark as Replied (moves to Replied tab)"}
        >
          <CheckCircle2 className={`w-4 h-4 ${replied ? "fill-emerald-500/20" : ""}`} />
        </Button>
      )}

      {/* AI Suggest Reply Dialog */}
      {!deletedAt && (
        <SuggestReplyDialog
          message={{
            id,
            name,
            email,
            subject,
            message: messageText,
            createdAt,
            read,
            replied,
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
        onClick={handleToggleRead}
        title={read ? "Mark as unread" : "Mark as read"}
      >
        {read ? (
          <Mail className="w-4 h-4 text-muted-foreground" />
        ) : (
          <MailOpen className="w-4 h-4 text-primary" />
        )}
      </Button>

      {deletedAt ? (
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 text-primary"
          onClick={handleRestore}
          title="Restore"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 text-destructive"
          onClick={handleSoftDelete}
          title="Move to trash"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
