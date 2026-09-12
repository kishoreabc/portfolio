"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Mic, MessageSquare, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

interface AiConversationsTabsProps {
  initialTab?: "monitor" | "history";
  activeVoiceCount: number;
  waitingQueueCount: number;
  totalSessions: number;
  monitorContent: React.ReactNode;
  historyContent: React.ReactNode;
}

export function AiConversationsTabs({
  initialTab = "monitor",
  activeVoiceCount,
  waitingQueueCount,
  totalSessions,
  monitorContent,
  historyContent,
}: AiConversationsTabsProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  // Determine active tab: prefer URL param if present, else initialTab
  const [activeTab, setActiveTab] = useState<"monitor" | "history">(() => {
    if (tabParam === "history" || tabParam === "monitor") return tabParam;
    return initialTab;
  });

  // Sync state if URL search param changes (e.g. from back/forward navigation or link click)
  useEffect(() => {
    if (tabParam === "history" || tabParam === "monitor") {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (newTab: "monitor" | "history") => {
    setActiveTab(newTab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", newTab);
      window.history.replaceState(null, "", url.toString());
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── Top Selection Bar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border/70 pb-4">
        <div className="inline-flex p-1 rounded-xl bg-card/80 border border-border/80 shadow-2xs backdrop-blur-md max-w-full overflow-x-auto gap-1">
          {/* Tab 1: Voice Agent Live Monitor */}
          <button
            type="button"
            onClick={() => handleTabChange("monitor")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer select-none",
              activeTab === "monitor"
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <div className="flex items-center gap-1.5">
              {activeVoiceCount > 0 ? (
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              ) : (
                <Mic className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>Voice Agent Live Monitor</span>
            </div>

            {/* Status indicator badge */}
            {activeVoiceCount > 0 ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold",
                  activeTab === "monitor"
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {activeVoiceCount} Live
              </span>
            ) : waitingQueueCount > 0 ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold",
                  activeTab === "monitor"
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                {waitingQueueCount} Queued
              </span>
            ) : (
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px] font-medium",
                  activeTab === "monitor"
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                Live
              </span>
            )}
          </button>

          {/* Tab 2: Session History */}
          <button
            type="button"
            onClick={() => handleTabChange("history")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer select-none",
              activeTab === "history"
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span>Session History</span>
            </div>

            <span
              className={cn(
                "px-1.5 py-0.5 rounded-full text-[10px] font-medium",
                activeTab === "history"
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {totalSessions}
            </span>
          </button>
        </div>

        {/* View mode indicator / active summary */}
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          <span>
            {activeTab === "monitor"
              ? "Live WebRTC / WebSocket Monitor active"
              : `Browsing ${totalSessions} recorded logs`}
          </span>
        </div>
      </div>

      {/* ── Tab View Content ─────────────────────────────────────────── */}
      <div className="w-full">
        {activeTab === "monitor" ? (
          <div className="animate-in fade-in-50 duration-200">{monitorContent}</div>
        ) : (
          <div className="animate-in fade-in-50 duration-200">{historyContent}</div>
        )}
      </div>
    </div>
  );
}
