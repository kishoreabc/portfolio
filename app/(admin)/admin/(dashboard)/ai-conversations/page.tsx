import { Suspense } from "react";
import { Bot, MessageSquare, Mic, Clock, Hash } from "lucide-react";
import { getAiConversations } from "@/actions/ai-conversation";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    mode?: string;
    from?: string;
    to?: string;
  }>;
}

export const metadata = {
  title: "AI Conversations | Admin",
  description: "View all AI assistant conversation sessions.",
};

export default async function AiConversationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const mode = (params.mode ?? "all") as "all" | "voice" | "chat";
  const dateFrom = params.from;
  const dateTo = params.to;

  const { conversations, total, totalPages } = await getAiConversations({
    page,
    mode,
    dateFrom,
    dateTo,
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">AI Conversations</h1>
            <p className="text-sm text-muted-foreground">
              {total} session{total !== 1 ? "s" : ""} total
            </p>
          </div>
        </div>

        {/* Mode filter */}
        <div className="flex items-center gap-1.5 rounded-lg border border-border p-1">
          {(["all", "voice", "chat"] as const).map((m) => (
            <Link
              key={m}
              href={`/admin/ai-conversations?mode=${m}&page=1`}
              className={`
                flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium capitalize
                transition-colors
                ${mode === m
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
                }
              `}
            >
              {m === "voice" && <Mic className="h-3 w-3" />}
              {m === "chat" && <MessageSquare className="h-3 w-3" />}
              {m === "all" && <Bot className="h-3 w-3" />}
              {m}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16">
          <Bot className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No conversations yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs">Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs">Mode</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs">
                  <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />Messages</span>
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Duration</span>
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs">
                  <span className="flex items-center gap-1"><Hash className="h-3 w-3" />IP</span>
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {conversations.map((conv) => (
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
                    {conv.durationSeconds != null
                      ? formatDuration(conv.durationSeconds)
                      : conv.endedAt == null
                      ? <span className="text-emerald-500 text-[10px]">Active</span>
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-[10px] text-muted-foreground/70">
                      {conv.ipHash}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button render={<Link href={`/admin/ai-conversations/${conv.id}`} />} variant="ghost" size="sm" className="h-7 text-xs">
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Button render={<Link href={`/admin/ai-conversations?mode=${mode}&page=${page - 1}`} />} variant="outline" size="sm">
              Previous
            </Button>
          )}
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Button render={<Link href={`/admin/ai-conversations?mode=${mode}&page=${page + 1}`} />} variant="outline" size="sm">
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
