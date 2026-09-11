"use client";

import { useState, useEffect, useCallback } from "react";
import type { VoiceQueueData, ActiveVoiceSessionItem } from "@/types/ai";
import {
  getVoiceQueueAction,
  promoteVoiceQueueEntryAction,
  removeFromVoiceQueueAction,
  clearVoiceQueueAction,
  revokeAiSession,
} from "@/actions/ai-conversation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Mic,
  RefreshCw,
  Trash2,
  Check,
  Copy,
  UserCheck,
  Radio,
  Activity,
  PhoneOff,
  ExternalLink,
  Users,
  Clock,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface VoiceQueueManagerProps {
  initialData: VoiceQueueData;
}

export function VoiceQueueManager({ initialData }: VoiceQueueManagerProps) {
  const [data, setData] = useState<VoiceQueueData>(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [revokeConfirmSession, setRevokeConfirmSession] = useState<ActiveVoiceSessionItem | null>(null);

  // Active view tab: "active" | "queue"
  const [activeTab, setActiveTab] = useState<"active" | "queue">(
    (initialData.activeSessions && initialData.activeSessions.length > 0) || initialData.waitingCount === 0
      ? "active"
      : "queue"
  );

  // ── Live ticking timer for elapsed duration (updates every 1s) ───────────────
  const [, setClock] = useState(0);
  useEffect(() => {
    if (!data.activeSessions || data.activeSessions.length === 0) return;
    const interval = setInterval(() => {
      setClock((c) => c + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [data.activeSessions]);

  // ── Fetch latest queue and active voice data ─────────────────────────────────
  const refreshQueue = useCallback(async (showToast = false) => {
    try {
      setIsRefreshing(true);
      const updated = await getVoiceQueueAction();
      setData(updated);
      if (showToast) {
        toast.success("Voice active status & queue updated");
      }
    } catch {
      if (showToast) {
        toast.error("Failed to refresh voice status");
      }
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // ── Auto-refresh active check (every 3.5s when active/waiting, 8s when idle) ───
  useEffect(() => {
    if (!autoRefresh) return;

    const hasActivity = (data.activeSessions?.length || 0) > 0 || data.waitingCount > 0;
    const pollIntervalMs = hasActivity ? 3500 : 8000;

    const interval = setInterval(() => {
      // Only refresh if document is in focus to save bandwidth
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        void refreshQueue(false);
      }
    }, pollIntervalMs);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshQueue, data.waitingCount, data.activeSessions?.length]);

  // ── Revoke active voice session immediately ──────────────────────────────────
  const handleRevokeSession = async (session: ActiveVoiceSessionItem) => {
    setActionLoadingId(session.id);
    setRevokeConfirmSession(null);

    // Optimistic UI removal
    setData((prev) => ({
      ...prev,
      activeSessions: (prev.activeSessions || []).filter((s) => s.id !== session.id),
      activeVoiceCount: Math.max(0, prev.activeVoiceCount - 1),
    }));

    try {
      await revokeAiSession(session.id);
      toast.success(`Voice session for IP ${session.ip} disconnected.`);
      void refreshQueue(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to disconnect voice session.");
      void refreshQueue(false);
    } finally {
      setActionLoadingId(null);
    }
  };

  // ── Promote visitor immediately (optimistic UI update) ───────────────────────
  const handlePromote = async (queueId: string) => {
    setActionLoadingId(queueId);
    setData((prev) => {
      const updatedQueue = prev.queue.map((item) =>
        item.queueId === queueId
          ? { ...item, promoted: true, promotedAt: new Date().toISOString() }
          : item
      );
      return {
        ...prev,
        queue: updatedQueue,
        waitingCount: Math.max(0, prev.waitingCount - 1),
        promotedCount: prev.promotedCount + 1,
      };
    });

    try {
      await promoteVoiceQueueEntryAction(queueId);
      toast.success("Visitor promoted! Slot will be claimed on their next poll.");
      void refreshQueue(false);
    } catch {
      toast.error("Failed to promote visitor.");
      void refreshQueue(false);
    } finally {
      setActionLoadingId(null);
    }
  };

  // ── Remove visitor from queue (optimistic UI update) ─────────────────────────
  const handleRemove = async (queueId: string) => {
    setActionLoadingId(queueId);
    const itemToRemove = data.queue.find((item) => item.queueId === queueId);
    setData((prev) => {
      const updatedQueue = prev.queue.filter((item) => item.queueId !== queueId);
      return {
        ...prev,
        queue: updatedQueue,
        waitingCount:
          itemToRemove && !itemToRemove.promoted
            ? Math.max(0, prev.waitingCount - 1)
            : prev.waitingCount,
        promotedCount:
          itemToRemove && itemToRemove.promoted
            ? Math.max(0, prev.promotedCount - 1)
            : prev.promotedCount,
      };
    });

    try {
      await removeFromVoiceQueueAction(queueId);
      toast.success("Visitor removed from queue.");
      void refreshQueue(false);
    } catch {
      toast.error("Failed to remove visitor.");
      void refreshQueue(false);
    } finally {
      setActionLoadingId(null);
    }
  };

  // ── Clear entire queue (optimistic UI update) ────────────────────────────────
  const handleClearAll = async () => {
    setClearLoading(true);
    setClearConfirmOpen(false);
    setData((prev) => ({
      ...prev,
      queue: [],
      waitingCount: 0,
      promotedCount: 0,
    }));

    try {
      await clearVoiceQueueAction();
      toast.success("Voice queue cleared.");
      void refreshQueue(false);
    } catch {
      toast.error("Failed to clear voice queue.");
      void refreshQueue(false);
    } finally {
      setClearLoading(false);
    }
  };

  // ── Copy IP Address to clipboard ──────────────────────────────────────────────
  const copyToClipboard = (ip: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(ip);
      setCopiedIp(ip);
      toast.success(`Copied IP: ${ip}`);
      setTimeout(() => setCopiedIp(null), 2000);
    }
  };

  // Helpers for formatting time
  const formatTimeAgo = (isoDate: string) => {
    const diffSeconds = Math.max(0, Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000));
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    const mins = Math.floor(diffSeconds / 60);
    const secs = diffSeconds % 60;
    return `${mins}m ${secs}s ago`;
  };

  const getElapsedSeconds = (startedAtIso: string) => {
    return Math.max(0, Math.floor((Date.now() - new Date(startedAtIso).getTime()) / 1000));
  };

  const formatLiveDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isAtCapacity = data.activeVoiceCount >= data.maxConcurrentVoice;
  const activeSessions = data.activeSessions || [];

  return (
    <Card className="border-border/80 bg-card/60 backdrop-blur-sm overflow-hidden shadow-sm">
      {/* ── Header & Controls ──────────────────────────────────────────────── */}
      <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-border/60">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20">
                <Mic className="h-4 w-4 text-violet-400" />
              </div>
              <CardTitle className="text-base sm:text-lg font-semibold tracking-tight text-foreground flex items-center gap-2 flex-wrap">
                <span>Voice Agent Live Monitor</span>
                {activeSessions.length > 0 ? (
                  <Badge
                    variant="outline"
                    className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 gap-1.5 text-xs font-semibold px-2 py-0.5 whitespace-nowrap shrink-0"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    {activeSessions.length} Active Voice Call{activeSessions.length !== 1 ? "s" : ""}
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-border text-muted-foreground bg-muted/40 text-xs font-normal px-2 py-0.5 whitespace-nowrap shrink-0"
                  >
                    No Active Calls
                  </Badge>
                )}
                {data.waitingCount > 0 && (
                  <Badge
                    variant="outline"
                    className="border-amber-500/40 text-amber-500 bg-amber-500/10 gap-1.5 text-xs font-semibold px-2 py-0.5 whitespace-nowrap shrink-0"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                    {data.waitingCount} in Queue
                  </Badge>
                )}
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Real-time active check &amp; concurrency monitor for Gemini Live Voice Agent. Detects newly arrived voice users and waiting queue live.
            </p>
          </div>

          {/* Quick Metrics & Controls */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Active Voice Concurrency Gauge */}
            <div className="h-8 inline-flex items-center gap-2 rounded-lg border border-border/80 bg-background/80 px-3 text-xs whitespace-nowrap shrink-0">
              <Activity className="h-3.5 w-3.5 text-violet-400 shrink-0" />
              <span className="text-muted-foreground">Concurrency:</span>
              <span
                className={`font-semibold font-mono whitespace-nowrap ${
                  isAtCapacity ? "text-amber-400 font-bold" : "text-emerald-400"
                }`}
              >
                {data.activeVoiceCount} / {data.maxConcurrentVoice}
              </span>
              {isAtCapacity && (
                <span className="text-[10px] text-amber-500 uppercase tracking-wider font-bold whitespace-nowrap">
                  (FULL)
                </span>
              )}
            </div>

            {/* Live Auto-Refresh Active Check Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh((prev) => !prev)}
              className={`h-8 text-xs gap-1.5 transition-all shrink-0 whitespace-nowrap ${
                autoRefresh
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
              title={autoRefresh ? "Active check running live" : "Active check paused"}
            >
              <span
                className={`h-2 w-2 rounded-full shrink-0 ${
                  autoRefresh ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
                }`}
              />
              <span>{autoRefresh ? "Active Check (3.5s)" : "Paused"}</span>
            </Button>

            {/* Manual Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshQueue(true)}
              disabled={isRefreshing}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground shrink-0"
              title="Check now"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
            </Button>

            {/* Clear All Queue (if queue entries exist) */}
            {data.queue.length > 0 && activeTab === "queue" && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setClearConfirmOpen(true)}
                className="h-8 text-xs gap-1 px-2.5 shrink-0 whitespace-nowrap"
                title="Clear all waiting visitors"
              >
                <Trash2 className="h-3.5 w-3.5 shrink-0" />
                <span>Clear Queue</span>
              </Button>
            )}
          </div>
        </div>

        {/* ── Sub-navigation Tabs: [Active Voice Users (N)] | [Waiting Queue (N)] ─ */}
        <div className="flex items-center gap-2 pt-3 mt-3 border-t border-border/40 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === "active"
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Radio className="h-3.5 w-3.5 shrink-0" />
            <span>Active Voice Users</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold shrink-0 ${
                activeTab === "active"
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : activeSessions.length > 0
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {activeSessions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("queue")}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === "queue"
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Users className="h-3.5 w-3.5 shrink-0" />
            <span>Waiting Queue</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold shrink-0 ${
                activeTab === "queue"
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : data.waitingCount > 0
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {data.waitingCount}
            </span>
          </button>
        </div>
      </CardHeader>

      {/* ── Tab Content: Active Voice Users ─────────────────────────────────── */}
      <CardContent className="p-0">
        {activeTab === "active" && (
          <>
            {activeSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2.5 py-10 px-4 text-center">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Radio className="h-5 w-5" />
                  <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <div className="space-y-1 max-w-md">
                  <p className="text-sm font-medium text-foreground">
                    No active voice agent users right now
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Active check is live. When a visitor taps the microphone or starts a Gemini Live Voice session on your portfolio, their live IP, elapsed duration, and session controls will pop up here instantly.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto min-w-0 w-full">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="border-b border-border/80 bg-muted/40 text-left">
                      <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap w-28">
                        Stream Status
                      </th>
                      <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">
                        Visitor IP Address
                      </th>
                      <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">
                        Live Duration
                      </th>
                      <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">
                        Started
                      </th>
                      <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">
                        Messages
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground whitespace-nowrap">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeSessions.map((session) => {
                      const isCopied = copiedIp === session.ip;
                      const elapsed = getElapsedSeconds(session.startedAt);
                      const isNewlyArrived = session.isNew || elapsed < 60;
                      const isTerminating = actionLoadingId === session.id;

                      return (
                        <tr
                          key={session.id}
                          className="border-b border-border/60 last:border-0 hover:bg-muted/20 transition-colors"
                        >
                          {/* Stream Status & Equalizer */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                {/* Equalizer sound bars */}
                                <span className="flex items-center gap-0.5 h-3">
                                  <span className="w-0.5 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                  <span className="w-0.5 h-3 bg-emerald-300 rounded-full animate-pulse [animation-delay:150ms]" />
                                  <span className="w-0.5 h-1.5 bg-emerald-400 rounded-full animate-pulse [animation-delay:300ms]" />
                                </span>
                                LIVE
                              </span>
                              {isNewlyArrived && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] px-1.5 py-0 bg-violet-500/15 text-violet-400 border border-violet-500/30 font-semibold gap-0.5"
                                >
                                  <Sparkles className="w-2.5 h-2.5" /> New
                                </Badge>
                              )}
                            </div>
                          </td>

                          {/* IP Address */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-semibold text-foreground tracking-wide bg-background/90 px-2 py-1 rounded border border-border/80 select-all">
                                {session.ip}
                              </span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(session.ip)}
                                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted cursor-pointer"
                                title="Copy IP address"
                              >
                                {isCopied ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Live Ticking Duration */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-primary" />
                              <span className="font-mono text-xs font-bold text-foreground">
                                {formatLiveDuration(elapsed)}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                / 05:00 max
                              </span>
                            </div>
                          </td>

                          {/* Started At */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-xs text-foreground font-medium">
                              {formatTimeAgo(session.startedAt)}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono">
                              {new Date(session.startedAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })}
                            </div>
                          </td>

                          {/* Message Count */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <MessageSquare className="w-3 h-3 text-muted-foreground" />
                              {session.messageCount} turns
                            </span>
                          </td>

                          {/* Action Controls */}
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1 px-2.5 text-muted-foreground hover:text-foreground"
                                render={
                                  <Link href={`/admin/ai-conversations/${session.id}`} target="_blank">
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    Transcript
                                  </Link>
                                }
                              />
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={isTerminating}
                                onClick={() => setRevokeConfirmSession(session)}
                                className="h-7 text-xs gap-1 px-2.5"
                                title="Disconnect active voice session"
                              >
                                <PhoneOff className="h-3 w-3" />
                                <span>End Call</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── Tab Content: Waiting Queue ─────────────────────────────────────── */}
        {activeTab === "queue" && (
          <>
            {data.queue.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2.5 py-10 px-4 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Radio className="h-5 w-5" />
                </div>
                <div className="space-y-1 max-w-md">
                  <p className="text-sm font-medium text-foreground">
                    No visitors currently waiting
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Incoming voice requests are allocated directly up to the maximum capacity (
                    <span className="font-semibold text-foreground">
                      {data.maxConcurrentVoice} concurrent sessions
                    </span>
                    ). If the limit is reached, excess visitors will appear here automatically with their IP address.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto min-w-0 w-full">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="border-b border-border/80 bg-muted/40 text-left">
                      <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap w-16">
                        Position
                      </th>
                      <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">
                        IP Address
                      </th>
                      <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">
                        Status
                      </th>
                      <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">
                        Joined
                      </th>
                      <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">
                        Last Polled
                      </th>
                      <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">
                        Est. Wait
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground whitespace-nowrap">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.queue.map((item) => {
                      const isLoading = actionLoadingId === item.queueId;
                      const isCopied = copiedIp === item.ip;

                      return (
                        <tr
                          key={item.id}
                          className="border-b border-border/60 last:border-0 hover:bg-muted/20 transition-colors"
                        >
                          {/* Queue Position */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            {item.promoted ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] font-bold border-emerald-500/40 text-emerald-400 bg-emerald-500/10 px-2 py-0.5"
                              >
                                Ready
                              </Badge>
                            ) : (
                              <div className="flex items-center gap-1">
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-xs">
                                  #{item.position}
                                </span>
                              </div>
                            )}
                          </td>

                          {/* IP Address */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2 group">
                              <span className="font-mono text-xs font-semibold text-foreground tracking-wide bg-background/90 px-2 py-1 rounded border border-border/80 select-all">
                                {item.ip}
                              </span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(item.ip)}
                                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted cursor-pointer"
                                title="Copy IP address"
                              >
                                {isCopied ? (
                                  <Check className="h-3 w-3 text-emerald-400" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            {item.promoted ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Promoted (Admitted)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                                Waiting in Queue
                              </span>
                            )}
                          </td>

                          {/* Joined At */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-xs text-foreground font-medium">
                              {formatTimeAgo(item.joinedAt)}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono">
                              {new Date(item.joinedAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })}
                            </div>
                          </td>

                          {/* Last Polled (Heartbeat) */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              <span>{formatTimeAgo(item.lastPolledAt)}</span>
                            </div>
                          </td>

                          {/* Estimated Wait */}
                          <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                            {item.promoted ? (
                              <span className="text-emerald-400 font-medium">Now</span>
                            ) : (
                              <span>~{item.estimatedWaitSeconds}s</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {!item.promoted && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isLoading}
                                  onClick={() => handlePromote(item.queueId)}
                                  className="h-7 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 gap-1 px-2.5"
                                  title="Admit visitor immediately"
                                >
                                  <UserCheck className="h-3 w-3" />
                                  <span>Promote</span>
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={isLoading}
                                onClick={() => handleRemove(item.queueId)}
                                className="h-7 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1 px-2"
                                title="Remove from queue"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* ── Revoke Session Confirmation Dialog ───────────────────────────────── */}
      <AlertDialog
        open={revokeConfirmSession !== null}
        onOpenChange={(isOpen) => !isOpen && setRevokeConfirmSession(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Active Voice Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately terminate the live Gemini Voice stream for visitor at IP{" "}
              <strong className="text-foreground font-mono">{revokeConfirmSession?.ip}</strong> and release
              their voice slot for waiting users.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => revokeConfirmSession && handleRevokeSession(revokeConfirmSession)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Disconnect Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Clear Queue Confirmation Dialog ─────────────────────────────────── */}
      <AlertDialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear entire voice waiting queue?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all {data.queue.length} waiting visitors from the queue.
              Their browser sessions will be notified to retry later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={clearLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              disabled={clearLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {clearLoading ? "Clearing..." : "Clear All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
