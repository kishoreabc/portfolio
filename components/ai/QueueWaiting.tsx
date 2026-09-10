/**
 * components/ai/QueueWaiting.tsx
 *
 * Shows a waiting screen when all voice slots are occupied.
 * Polls /api/ai/queue/:queueId every 3 seconds.
 * When ready, calls onReady with the session data.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Users, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { QueueStatusResponse, EphemeralTokenResponse } from "@/types/ai";

interface QueueWaitingProps {
  queueId: string;
  initialPosition: number;
  initialWaitSeconds: number;
  pollIntervalMs?: number;
  onReady: (sessionData: EphemeralTokenResponse) => void;
  onLeave: () => void;
}

export function QueueWaiting({
  queueId,
  initialPosition,
  initialWaitSeconds,
  pollIntervalMs = 3000,
  onReady,
  onLeave,
}: QueueWaitingProps) {
  const [position, setPosition] = useState(initialPosition);
  const [waitSeconds, setWaitSeconds] = useState(initialWaitSeconds);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmLeave, setShowConfirmLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMounted = useRef(true);
  const consecutive404Ref = useRef(0);

  useEffect(() => {
    isMounted.current = true;

    const poll = async () => {
      try {
        const res = await fetch(`/api/ai/queue/${queueId}`, {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (!res.ok) {
          if (res.status === 404) {
            consecutive404Ref.current += 1;
            // Allow up to 3 consecutive 404s before concluding expiration
            if (consecutive404Ref.current >= 3) {
              if (isMounted.current) {
                setError("Your queue spot has expired. Please try again.");
                if (pollRef.current) clearInterval(pollRef.current);
              }
            }
            return;
          }
          return; // Ignore other transient status codes, keep polling
        }

        consecutive404Ref.current = 0;
        const data = (await res.json()) as QueueStatusResponse;

        if (!isMounted.current) return;

        if (data.ready) {
          if (pollRef.current) clearInterval(pollRef.current);
          onReady(data as unknown as EphemeralTokenResponse);
        } else {
          setPosition(data.position);
          setWaitSeconds(data.estimatedWaitSeconds);
        }
      } catch {
        // Ignore network errors — keep polling
      }
    };

    pollRef.current = setInterval(poll, pollIntervalMs);

    return () => {
      isMounted.current = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [queueId, pollIntervalMs, onReady]);

  const handleConfirmLeave = async () => {
    setLeaving(true);
    if (pollRef.current) clearInterval(pollRef.current);
    try {
      await fetch(`/api/ai/queue/${queueId}`, {
        method: "DELETE",
        keepalive: true,
      });
    } catch {}
    onLeave();
  };

  const formatWait = (secs: number) => {
    if (secs < 60) return `~${secs}s`;
    return `~${Math.ceil(secs / 60)}m`;
  };

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-5 px-5 py-8 text-center overflow-hidden">
      {/* Leave confirmation overlay */}
      {showConfirmLeave && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-background/95 backdrop-blur-md p-6 text-center animate-in fade-in-0 duration-150">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 mb-0.5">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-semibold text-foreground">Leave voice queue?</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            You will be removed from the queue and you will lose your spot in line.
          </p>
          <div className="flex w-full gap-2.5 mt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => setShowConfirmLeave(false)}
              disabled={leaving}
            >
              Stay in Queue
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex-1 text-xs"
              onClick={handleConfirmLeave}
              disabled={leaving}
            >
              {leaving ? "Leaving..." : "Leave Queue"}
            </Button>
          </div>
        </div>
      )}

      {error ? (
        <>
          <span className="text-3xl">⏰</span>
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={handleConfirmLeave} disabled={leaving}>
            Try Again
          </Button>
        </>
      ) : (
        <>
          {/* Animated waiting indicator */}
          <div className="relative flex h-16 w-16 items-center justify-center">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
            <div className="absolute inset-2 animate-ping rounded-full bg-primary/10 animation-delay-150" />
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-base font-semibold text-foreground">
              {position === 1
                ? "You're next in line!"
                : `${position} ${position === 1 ? "person" : "people"} ahead of you`}
            </p>
            <p className="text-xs text-muted-foreground">
              All 2 voice slots are currently active.
              <br />
              Your spot is reserved — please don't close this.
            </p>
          </div>

          {/* Wait time estimate */}
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-2.5">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              Estimated wait:{" "}
              <span className="font-semibold text-foreground">{formatWait(waitSeconds)}</span>
            </span>
          </div>

          {/* Polling indicator */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Checking for an available slot...</span>
          </div>

          <Button
            id="ai-queue-leave"
            variant="ghost"
            size="sm"
            disabled={leaving}
            className="text-muted-foreground text-xs mt-2 hover:text-destructive"
            onClick={() => setShowConfirmLeave(true)}
          >
            Leave queue
          </Button>
        </>
      )}
    </div>
  );
}
