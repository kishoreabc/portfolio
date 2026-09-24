/**
 * components/ai/AgentStatusBadge.tsx
 *
 * Animated status badge showing the current AI agent state.
 * Used in both the floating trigger button and the panel controls bar.
 */

"use client";

import type { SessionState } from "@/types/ai";

interface AgentStatusBadgeProps {
  state: SessionState;
  disconnectReason?: "IDLE_TIMEOUT" | "REVOKED" | "TIME_LIMIT" | "DISCONNECTED" | string | null;
  compact?: boolean; // If true, show dot + text. If false, show full badge.
}

const STATE_CONFIG: Record<
  SessionState,
  { label: string; color: string; dotColor: string; animate: boolean }
> = {
  IDLE: {
    label: "Ready",
    color: "text-muted-foreground",
    dotColor: "bg-muted-foreground",
    animate: false,
  },
  CONNECTING: {
    label: "Connecting...",
    color: "text-blue-400",
    dotColor: "bg-blue-400",
    animate: true,
  },
  LISTENING: {
    label: "Listening",
    color: "text-emerald-500",
    dotColor: "bg-emerald-500",
    animate: true,
  },
  THINKING: {
    label: "Thinking...",
    color: "text-blue-500",
    dotColor: "bg-blue-500",
    animate: true,
  },
  SPEAKING: {
    label: "Speaking",
    color: "text-primary",
    dotColor: "bg-primary",
    animate: true,
  },
  INTERRUPTED: {
    label: "Interrupted",
    color: "text-orange-500",
    dotColor: "bg-orange-500",
    animate: false,
  },
  ERROR: {
    label: "Error",
    color: "text-destructive",
    dotColor: "bg-destructive",
    animate: false,
  },
  DISCONNECTED: {
    label: "Disconnected",
    color: "text-muted-foreground",
    dotColor: "bg-muted-foreground",
    animate: false,
  },
};

export function AgentStatusBadge({ state, disconnectReason, compact = false }: AgentStatusBadgeProps) {
  let config = STATE_CONFIG[state];

  if (state === "DISCONNECTED") {
    if (disconnectReason === "IDLE_TIMEOUT") {
      config = {
        label: "Closed (Inactive)",
        color: "text-amber-400",
        dotColor: "bg-amber-400",
        animate: false,
      };
    } else if (disconnectReason === "REVOKED") {
      config = {
        label: "Closed (Admin)",
        color: "text-destructive",
        dotColor: "bg-destructive",
        animate: false,
      };
    } else if (disconnectReason === "TIME_LIMIT") {
      config = {
        label: "Limit Reached",
        color: "text-amber-400",
        dotColor: "bg-amber-400",
        animate: false,
      };
    }
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${config.color}`}
      aria-label={`Agent state: ${config.label}`}
      role="status"
    >
      <span className="relative flex h-2 w-2">
        {config.animate ? (
          <>
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.dotColor} opacity-75`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${config.dotColor}`}
            />
          </>
        ) : (
          <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dotColor}`} />
        )}
      </span>
      {!compact && <span>{config.label}</span>}
    </span>
  );
}
