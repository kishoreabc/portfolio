import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bot, Mic, MessageSquare, Clock, User, Hash } from "lucide-react";
import { getAiConversation } from "@/actions/ai-conversation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RevokeSessionButton } from "@/components/admin/RevokeSessionButton";
import { DeleteAiConversationButton } from "@/components/admin/DeleteAiConversationButton";
import { LocalTimestamp } from "@/components/ui/local-timestamp";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return {
    title: `Conversation ${id.slice(0, 8)}… | Admin`,
  };
}

export default async function AiConversationDetailPage({ params }: PageProps) {
  const { id } = await params;
  const conversation = await getAiConversation(id);

  if (!conversation) notFound();

  const isActive = conversation.endedAt == null;

  const SOURCE_ICONS: Record<string, string> = {
    get_my_profile: "📁",
    get_my_projects: "📁",
    get_my_skills: "📁",
    get_my_education: "📁",
    get_my_certifications: "📁",
    get_my_social_links: "📁",
    get_my_resume: "📁",
    get_my_github: "🐙",
    get_my_github_repositories: "🐙",
    get_github_repository: "🐙",
    get_github_repository_readme: "🐙",
    get_github_activity: "🐙",
    search_my_public_web_presence: "🔍",
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button
            render={<Link href="/admin/ai-conversations" aria-label="Back to conversations list" />}
            variant="ghost"
            size="icon"
            className="h-8 w-8 mt-0.5"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-semibold text-foreground">
                Conversation Transcript
              </h1>
              <Badge
                variant="outline"
                className={`text-[10px] gap-1 ${
                  conversation.mode === "voice"
                    ? "border-violet-500/30 text-violet-500 bg-violet-500/10"
                    : "border-sky-500/30 text-sky-500 bg-sky-500/10"
                }`}
              >
                {conversation.mode === "voice" ? (
                  <Mic className="h-2.5 w-2.5" />
                ) : (
                  <MessageSquare className="h-2.5 w-2.5" />
                )}
                {conversation.mode}
              </Badge>

              {isActive && (
                <Badge
                  variant="outline"
                  className="border-emerald-500/40 text-emerald-500 bg-emerald-500/10 gap-1 text-[10px]"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active Now
                </Badge>
              )}
            </div>

            <div className="mt-1.5 flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <LocalTimestamp date={conversation.startedAt} format="full" />
              </span>
              {conversation.durationSeconds != null && (
                <span>{formatDuration(conversation.durationSeconds)} session</span>
              )}
              <span>{conversation.messageCount} messages</span>
              <span className="font-mono flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded border border-border/60 text-foreground/90 select-all">
                <Hash className="h-3 w-3 text-muted-foreground" />
                {conversation.ipHash}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isActive && (
            <RevokeSessionButton conversationId={conversation.id} variant="detail" />
          )}
          <DeleteAiConversationButton
            conversationId={conversation.id}
            variant="detail"
            redirectOnDelete={true}
          />
        </div>
      </div>

      {/* Transcript */}
      {conversation.messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-12">
          <Bot className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No messages recorded in this session.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {conversation.messages.map((msg) => {
            const isUser = msg.role === "user";
            const tools = msg.toolsUsed ?? [];

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div
                  className={`
                    flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px]
                    ${isUser ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}
                  `}
                >
                  {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                </div>

                {/* Bubble */}
                <div className={`flex flex-col gap-1 max-w-[75%] ${isUser ? "items-end" : "items-start"}`}>
                  <div
                    className={`
                      rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed
                      ${isUser
                        ? "bg-primary/10 text-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                      }
                    `}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>

                  {/* Meta: timestamp + tools */}
                  <div className={`flex items-center gap-1.5 px-1 flex-wrap ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                    <span className="text-[10px] text-muted-foreground/50">
                      <LocalTimestamp date={msg.createdAt} format="time" />
                    </span>
                    {tools.map((tool) => (
                      <span
                        key={tool}
                        title={tool}
                        className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground border border-border"
                      >
                        {SOURCE_ICONS[tool] ?? "🔧"} {tool.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
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
