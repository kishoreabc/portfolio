import { Bot } from "lucide-react";
import { getAiConversations, getVoiceQueueAction } from "@/actions/ai-conversation";
import { Badge } from "@/components/ui/badge";
import { RevokeAllActiveSessionsButton } from "@/components/admin/RevokeSessionButton";
import { VoiceQueueManager } from "@/components/admin/VoiceQueueManager";
import { SessionHistory } from "@/components/admin/SessionHistory";
import { AiConversationsTabs } from "@/components/admin/AiConversationsTabs";

interface PageProps {
  searchParams: Promise<{
    tab?: string;
    page?: string;
    mode?: string;
    status?: string;
    from?: string;
    to?: string;
  }>;
}

export const metadata = {
  title: "AI Conversations | Admin",
  description: "View and manage all AI assistant conversation sessions and Gemini Live voice agent.",
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

  // If user explicitly provided tab or if viewing specific session filters/pagination, prioritize that tab
  const initialTab: "monitor" | "history" =
    params.tab === "history" || params.tab === "monitor"
      ? params.tab
      : params.status || params.mode || params.page
        ? "history"
        : "monitor";

  const [{ conversations, total, activeCount, totalPages }, queueData] = await Promise.all([
    getAiConversations({
      page,
      mode,
      status,
      dateFrom,
      dateTo,
    }),
    getVoiceQueueAction(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
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
              {queueData.waitingCount > 0 && (
                <Badge
                  variant="outline"
                  className="border-amber-500/40 text-amber-500 bg-amber-500/10 gap-1 text-[11px] font-medium"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  {queueData.waitingCount} in voice queue
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {total} total recorded session{total !== 1 ? "s" : ""} • Raw IP addresses logged
            </p>
          </div>
        </div>

        {/* Global Action controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <RevokeAllActiveSessionsButton activeCount={activeCount} />
        </div>
      </div>

      {/* ── Tabs: Voice Agent Live Monitor & Session History ─────────── */}
      <AiConversationsTabs
        initialTab={initialTab}
        activeVoiceCount={queueData.activeVoiceCount}
        waitingQueueCount={queueData.waitingCount}
        totalSessions={total}
        monitorContent={<VoiceQueueManager initialData={queueData} />}
        historyContent={
          <SessionHistory
            conversations={conversations}
            total={total}
            activeCount={activeCount}
            page={page}
            totalPages={totalPages}
            mode={mode}
            status={status}
          />
        }
      />
    </div>
  );
}
