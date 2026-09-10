"use client";

import { useState } from "react";
import { revokeAiSession, revokeAllActiveAiSessions } from "@/actions/ai-conversation";
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
import { Ban, Loader2, PowerOff, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

interface RevokeSessionButtonProps {
  conversationId: string;
  variant?: "table" | "detail";
  className?: string;
  onRevoked?: () => void;
}

export function RevokeSessionButton({
  conversationId,
  variant = "table",
  className = "",
  onRevoked,
}: RevokeSessionButtonProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRevoke = async () => {
    setLoading(true);
    try {
      await revokeAiSession(conversationId);
      toast.success("Active session has been stopped and revoked.");
      onRevoked?.();
    } catch {
      toast.error("Failed to revoke active session.");
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  return (
    <>
      {variant === "table" ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirmOpen(true)}
          disabled={loading}
          className={`h-7 px-2 text-xs border-amber-500/30 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400 gap-1 ${className}`}
          title="Revoke & terminate active session"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Ban className="h-3 w-3" />
          )}
          <span>Revoke</span>
        </Button>
      ) : (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setConfirmOpen(true)}
          disabled={loading}
          className={`gap-1.5 h-8 text-xs font-medium ${className}`}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <PowerOff className="h-3.5 w-3.5" />
          )}
          <span>Revoke Active Session</span>
        </Button>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              Revoke Active AI Session?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately terminate the visitor&apos;s active session, release
              any voice concurrency slots, and mark the conversation as ended.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleRevoke();
              }}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Revoking..." : "Yes, Revoke Session"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface RevokeAllActiveSessionsButtonProps {
  activeCount: number;
}

export function RevokeAllActiveSessionsButton({
  activeCount,
}: RevokeAllActiveSessionsButtonProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  if (activeCount === 0) return null;

  const handleRevokeAll = async () => {
    setLoading(true);
    try {
      const res = await revokeAllActiveAiSessions();
      toast.success(`Revoked all ${res.count} active session(s).`);
    } catch {
      toast.error("Failed to revoke active sessions.");
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setConfirmOpen(true)}
        disabled={loading}
        className="h-8 text-xs border-destructive/40 text-destructive hover:bg-destructive/10 gap-1.5"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <PowerOff className="h-3.5 w-3.5" />
        )}
        <span>Revoke All Active ({activeCount})</span>
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              Revoke All {activeCount} Active Sessions?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to stop and end all currently active AI sessions?
              All connected visitors will be disconnected immediately and all voice
              concurrency slots will be cleared.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleRevokeAll();
              }}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Revoking All..." : `Revoke All (${activeCount})`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
