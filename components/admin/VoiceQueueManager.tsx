"use client";

import { useState, useEffect, useCallback } from "react";
import type { VoiceQueueData } from "@/types/ai";
import {
  getVoiceQueueAction,
  promoteVoiceQueueEntryAction,
  removeFromVoiceQueueAction,
  clearVoiceQueueAction,
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
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

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

  // ── Fetch latest queue data ──────────────────────────────────────────────────
  const refreshQueue = useCallback(async (showToast = false) => {
    try {
      setIsRefreshing(true);
      const updated = await getVoiceQueueAction();
      setData(updated);
      if (showToast) {
        toast.success("Voice queue updated");
      }
    } catch {
      if (showToast) {
        toast.error("Failed to refresh voice queue");
      }
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // ── Auto-refresh effect (every 4 seconds when active) ───────────────────────
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Only refresh if document is in focus to save bandwidth
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        void refreshQueue(false);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshQueue]);

  // ── Promote visitor immediately ─────────────────────────────────────────────
  const handlePromote = async (queueId: string) => {
    setActionLoadingId(queueId);
    try {
      await promoteVoiceQueueEntryAction(queueId);
      toast.success("Visitor promoted! Slot will be claimed on their next poll.");
      await refreshQueue(false);
    } catch {
      toast.error("Failed to promote visitor.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // ── Remove visitor from queue ───────────────────────────────────────────────
  const handleRemove = async (queueId: string) => {
    setActionLoadingId(queueId);
    try {
      await removeFromVoiceQueueAction(queueId);
      toast.success("Visitor removed from queue.");
      await refreshQueue(false);
    } catch {
      toast.error("Failed to remove visitor.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // ── Clear entire queue ──────────────────────────────────────────────────────
  const handleClearAll = async () => {
    setClearLoading(true);
    try {
      await clearVoiceQueueAction();
      toast.success("Voice queue cleared.");
      await refreshQueue(false);
    } catch {
      toast.error("Failed to clear voice queue.");
    } finally {
      setClearLoading(false);
      setClearConfirmOpen(false);
    }
  };

  // ── Copy IP Address to clipboard ────────────────────────────────────────────
  const copyToClipboard = (ip: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(ip);
      setCopiedIp(ip);
      toast.success(`Copied IP: ${ip}`);
      setTimeout(() => setCopiedIp(null), 2000);
    }
  };

  // Helper for format relative time
  const formatTimeAgo = (isoDate: string) => {
    const diffSeconds = Math.max(0, Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000));
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    const mins = Math.floor(diffSeconds / 60);
    const secs = diffSeconds % 60;
    return `${mins}m ${secs}s ago`;
  };

  const isAtCapacity = data.activeVoiceCount >= data.maxConcurrentVoice;

  return (
    <Card className="border-border/80 bg-card/60 backdrop-blur-sm overflow-hidden shadow-sm">
      {/* Header & Controls */}
      <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-border/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20">
                <Mic className="h-4 w-4 text-violet-400" />
              </div>
              <CardTitle className="text-base sm:text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
                Voice Model Waiting Queue
                {data.waitingCount > 0 ? (
                  <Badge
                    variant="outline"
                    className="border-amber-500/40 text-amber-500 bg-amber-500/10 gap-1.5 text-xs font-semibold px-2 py-0.5"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                    {data.waitingCount} in line
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-emerald-500/30 text-emerald-500 bg-emerald-500/10 text-xs font-medium px-2 py-0.5"
                  >
                    Queue Clear
                  </Badge>
                )}
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">
              Real-time concurrency queue for Gemini Live Voice Agent. Displays visitors waiting when concurrency reaches limit.
            </p>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
            {/* Active Voice Concurrency Gauge */}
            <div className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/80 px-3 py-1.5 text-xs">
              <Activity className="h-3.5 w-3.5 text-violet-400" />
              <span className="text-muted-foreground">Active Voice:</span>
              <span
                className={`font-semibold ${
                  isAtCapacity ? "text-amber-400 font-bold" : "text-emerald-400"
                }`}
              >
                {data.activeVoiceCount} / {data.maxConcurrentVoice}
              </span>
              {isAtCapacity && (
                <span className="text-[10px] text-amber-500 uppercase tracking-wider font-semibold ml-0.5">
                  (Full)
                </span>
              )}
            </div>

            {/* Live Auto-Refresh Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh((prev) => !prev)}
              className={`h-8 text-xs gap-1.5 transition-all ${
                autoRefresh
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
              title={autoRefresh ? "Live polling active (every 4s)" : "Live polling paused"}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  autoRefresh ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
                }`}
              />
              <span>{autoRefresh ? "Live (4s)" : "Paused"}</span>
            </Button>

            {/* Manual Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshQueue(true)}
              disabled={isRefreshing}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              title="Refresh queue now"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
            </Button>

            {/* Clear All Queue (if entries exist) */}
            {data.queue.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setClearConfirmOpen(true)}
                className="h-8 text-xs gap-1 px-2.5"
                title="Clear all waiting visitors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Clear All</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Content: Queue Table or Empty State */}
      <CardContent className="p-0">
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
                  <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground w-16">
                    Position
                  </th>
                  <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">
                    IP Address
                  </th>
                  <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">
                    Joined
                  </th>
                  <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">
                    Last Polled
                  </th>
                  <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">
                    Est. Wait
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
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
                      <td className="px-4 py-3">
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
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 group">
                          <span className="font-mono text-xs font-semibold text-foreground tracking-wide bg-background/90 px-2 py-1 rounded border border-border/80 select-all">
                            {item.ip}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(item.ip)}
                            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted"
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
                      <td className="px-4 py-3">
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
                      <td className="px-4 py-3">
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
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span>{formatTimeAgo(item.lastPolledAt)}</span>
                        </div>
                      </td>

                      {/* Estimated Wait */}
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {item.promoted ? (
                          <span className="text-emerald-400 font-medium">Now</span>
                        ) : (
                          <span>~{item.estimatedWaitSeconds}s</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
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
                            <span>Remove</span>
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
      </CardContent>

      {/* Confirmation Dialog for Clearing Queue */}
      <AlertDialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Clear Voice Model Waiting Queue?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all {data.queue.length} waiting visitors from the queue. Their browsers will be notified to retry or return to the idle state.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={clearLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleClearAll();
              }}
              disabled={clearLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {clearLoading ? "Clearing..." : "Yes, Clear Queue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
