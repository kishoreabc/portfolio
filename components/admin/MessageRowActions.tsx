"use client";

import { markMessageRead, softDeleteMessage, restoreMessage } from "@/actions/message";
import { Button } from "@/components/ui/button";
import { Mail, MailOpen, Trash2, RotateCcw, Reply } from "lucide-react";
import { toast } from "sonner";

export function MessageRowActions({
  id,
  read,
  deletedAt,
  email,
  subject,
}: {
  id: string;
  read: boolean;
  deletedAt: Date | null;
  email: string;
  subject: string;
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

  return (
    <div className="flex items-center justify-end gap-1">
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
