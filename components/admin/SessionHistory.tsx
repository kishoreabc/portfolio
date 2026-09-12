import Link from "next/link";
import { Bot, MessageSquare, Mic, Clock, Hash, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RevokeSessionButton } from "@/components/admin/RevokeSessionButton";
import { DeleteAiConversationButton } from "@/components/admin/DeleteAiConversationButton";
import type { getAiConversations } from "@/actions/ai-conversation";

type ConversationItem = Awaited<ReturnType<typeof getAiConversations>>["conversations"][number];

interface SessionHistoryProps {
  conversations: ConversationItem[];
  total: number;
  activeCount: number;
  page: number;
  totalPages: number;
  mode: "all" | "voice" | "chat";
  status: "all" | "active" | "ended";
}

export function SessionHistory({
  conversations,
  activeCount,
  page,
  totalPages,
  mode,
  status,
}: SessionHistoryProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* ── Subheader & Filter Controls ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pt-1">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
            <span>Session History</span>
            <Badge variant="outline" className="text-xs font-normal border-border/70 text-muted-foreground">
              Page {page} of {Math.max(1, totalPages)}
            </Badge>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Recorded conversation sessions and message transcripts
          </p>
        </div>

        {/* Mode & Status Filter Pills */}
        <div className="flex items-center gap-1 rounded-lg border border-border p-1 bg-card/60 overflow-x-auto max-w-full shadow-2xs">
          <Link
            href="/admin/ai-conversations?tab=history&page=1"
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors shrink-0 ${
              status === "all" && mode === "all"
                ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <Bot className="h-3 w-3" />
            All
          </Link>

          <Link
            href="/admin/ai-conversations?tab=history&status=active&page=1"
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors shrink-0 ${
              status === "active"
                ? "bg-emerald-500 text-white shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <Radio className="h-3 w-3 text-current" />
            Active ({activeCount})
          </Link>

          <Link
            href="/admin/ai-conversations?tab=history&mode=voice&page=1"
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors shrink-0 ${
              mode === "voice" && status !== "active"
                ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <Mic className="h-3 w-3" />
            Voice
          </Link>

          <Link
            href="/admin/ai-conversations?tab=history&mode=chat&page=1"
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors shrink-0 ${
              mode === "chat" && status !== "active"
                ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <MessageSquare className="h-3 w-3" />
            Chat
          </Link>
        </div>
      </div>

      {/* ── Conversations Table ────────────────────────────────────────── */}
      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/80 bg-card/20 py-16 text-center">
          <div className="h-10 w-10 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground/60">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">No conversations found</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {status === "active"
                ? "There are no ongoing active sessions right now."
                : "No conversation logs matched your selected filter."}
            </p>
          </div>
          {(status !== "all" || mode !== "all") && (
            <Button
              render={<Link href="/admin/ai-conversations?tab=history&page=1" />}
              variant="outline"
              size="sm"
              className="mt-2 text-xs"
            >
              Reset Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-x-auto min-w-0 w-full bg-card/30 shadow-2xs">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground text-xs">
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Mode</th>
                <th className="px-4 py-3 text-left font-medium">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    Messages
                  </span>
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Duration / Status
                  </span>
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  <span className="flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    IP Address
                  </span>
                </th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {conversations.map((conv) => {
                const isActive = conv.endedAt == null;

                return (
                  <tr
                    key={conv.id}
                    className="border-b border-border/60 last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-foreground">
                      <span className="text-xs font-mono text-foreground/90">
                        {new Date(conv.startedAt).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`text-[10px] gap-1 ${
                          conv.mode === "voice"
                            ? "border-violet-500/30 text-violet-400 bg-violet-500/10"
                            : "border-sky-500/30 text-sky-400 bg-sky-500/10"
                        }`}
                      >
                        {conv.mode === "voice" ? (
                          <Mic className="h-2.5 w-2.5" />
                        ) : (
                          <MessageSquare className="h-2.5 w-2.5" />
                        )}
                        {conv.mode}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs font-medium">
                      {conv.messageCount}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                          Active Now
                        </span>
                      ) : conv.durationSeconds != null ? (
                        formatDuration(conv.durationSeconds)
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-foreground/80 select-all">
                        {conv.ipHash}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isActive && (
                          <RevokeSessionButton conversationId={conv.id} variant="table" />
                        )}
                        <Button
                          render={<Link href={`/admin/ai-conversations/${conv.id}`} />}
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                        >
                          View
                        </Button>
                        <DeleteAiConversationButton conversationId={conv.id} variant="table" />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination ─────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          {page > 1 && (
            <Button
              render={
                <Link
                  href={`/admin/ai-conversations?tab=history&mode=${mode}&status=${status}&page=${page - 1}`}
                />
              }
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Previous
            </Button>
          )}
          <span className="text-xs text-muted-foreground px-2">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Button
              render={
                <Link
                  href={`/admin/ai-conversations?tab=history&mode=${mode}&status=${status}&page=${page + 1}`}
                />
              }
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Next
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}
