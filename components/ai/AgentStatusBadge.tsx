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

export function AgentStatusBadge({ state, compact = false }: AgentStatusBadgeProps) {
  const config = STATE_CONFIG[state];

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
