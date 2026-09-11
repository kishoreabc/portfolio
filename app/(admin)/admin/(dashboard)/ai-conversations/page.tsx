import { Bot, MessageSquare, Mic, Clock, Hash, Radio } from "lucide-react";
import { getAiConversations } from "@/actions/ai-conversation";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RevokeSessionButton, RevokeAllActiveSessionsButton } from "@/components/admin/RevokeSessionButton";
import { DeleteAiConversationButton } from "@/components/admin/DeleteAiConversationButton";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    mode?: string;
    status?: string;
    from?: string;
    to?: string;
  }>;
}

export const metadata = {
  title: "AI Conversations | Admin",
  description: "View and manage all AI assistant conversation sessions.",
};

export default async function AiConversationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const modeParam = params.mode ?? "all";
  const statusParam = params.status ?? (modeParam === "active" ? "active" : "all");
  const mode = (modeParam === "active" ? "all" : modeParam) as "all" | "voice" | "chat";
  const status = (statusParam as "all" | "active" | "ended") ?? "all";
  const dateFrom = params.from;
  const dateTo = params.to;

  const { conversations, total, activeCount, totalPages } = await getAiConversations({
    page,
    mode,
    status,
    dateFrom,
    dateTo,
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">AI Conversations</h1>
              {activeCount > 0 && (
                <Badge
                  variant="outline"
                  className="border-emerald-500/40 text-emerald-500 bg-emerald-500/10 gap-1 text-[11px] font-medium"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {activeCount} active
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {total} total recorded session{total !== 1 ? "s" : ""} • Raw IP addresses logged
            </p>
          </div>
        </div>

        {/* Action / Filter controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <RevokeAllActiveSessionsButton activeCount={activeCount} />

          {/* Mode & Status Filters */}
          <div className="flex items-center gap-1 rounded-lg border border-border p-1 bg-card/60 overflow-x-auto max-w-full">
            <Link
              href="/admin/ai-conversations?page=1"
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors shrink-0 ${
                status === "all" && mode === "all"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Bot className="h-3 w-3" />
              All
            </Link>

            <Link
              href="/admin/ai-conversations?status=active&page=1"
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors shrink-0 ${
                status === "active"
                  ? "bg-emerald-500 text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Radio className="h-3 w-3 text-current" />
              Active ({activeCount})
            </Link>

            <Link
              href="/admin/ai-conversations?mode=voice&page=1"
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors shrink-0 ${
                mode === "voice" && status !== "active"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Mic className="h-3 w-3" />
              Voice
            </Link>

            <Link
              href="/admin/ai-conversations?mode=chat&page=1"
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors shrink-0 ${
                mode === "chat" && status !== "active"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageSquare className="h-3 w-3" />
              Chat
            </Link>
          </div>
        </div>
      </div>

      {/* Table */}
      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16">
          <Bot className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No conversations found.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-x-auto min-w-0 w-full bg-card/30">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs">Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs">Mode</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs">
                  <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />Messages</span>
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Duration / Status</span>
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs">
                  <span className="flex items-center gap-1"><Hash className="h-3 w-3" />IP Address</span>
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {conversations.map((conv) => {
                const isActive = conv.endedAt == null;

                return (
                  <tr
                    key={conv.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-foreground">
                      <span className="text-xs">
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
                            ? "border-violet-500/30 text-violet-500 bg-violet-500/10"
                            : "border-sky-500/30 text-sky-500 bg-sky-500/10"
                        }`}
                      >
                        {conv.mode === "voice" ? <Mic className="h-2.5 w-2.5" /> : <MessageSquare className="h-2.5 w-2.5" />}
                        {conv.mode}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {conv.messageCount}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active Now
                        </span>
                      ) : conv.durationSeconds != null ? (
                        formatDuration(conv.durationSeconds)
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-foreground/90 select-all">
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Button
              render={
                <Link
                  href={`/admin/ai-conversations?mode=${mode}&status=${status}&page=${page - 1}`}
                />
              }
              variant="outline"
              size="sm"
            >
              Previous
            </Button>
          )}
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Button
              render={
                <Link
                  href={`/admin/ai-conversations?mode=${mode}&status=${status}&page=${page + 1}`}
                />
              }
              variant="outline"
              size="sm"
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
