import { prisma } from "@/lib/db";
import Link from "next/link";
import { MessageRowActions } from "@/components/admin/MessageRowActions";
import { SuggestReplyDialog } from "@/components/admin/SuggestReplyDialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sparkles } from "lucide-react";

export const metadata = {
  title: "Contact Messages | Admin",
};

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const params = await searchParams;
  const currentView =
    params.view === "trash" ? "trash" : params.view === "replied" ? "replied" : "inbox";

  const [inboxCount, repliedCount, trashCount] = await Promise.all([
    prisma.contactMessage.count({ where: { deletedAt: null, replied: false } }),
    prisma.contactMessage.count({ where: { deletedAt: null, replied: true } }),
    prisma.contactMessage.count({ where: { deletedAt: { not: null } } }),
  ]);

  const whereClause =
    currentView === "trash"
      ? { deletedAt: { not: null } }
      : currentView === "replied"
      ? { deletedAt: null, replied: true }
      : { deletedAt: null, replied: false };

  const messages = await prisma.contactMessage.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {currentView === "trash"
              ? "Trash — Contact Messages"
              : currentView === "replied"
              ? "Replied — Contact Messages"
              : "Inbox — Contact Messages"}
          </h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            {currentView === "trash"
              ? "Soft-deleted inquiries. Can be restored back to inbox at any time."
              : currentView === "replied"
              ? "Inquiries that have already received an email reply."
              : "Pending incoming inquiries from your portfolio contact form."}
          </p>
        </div>

        {/* View Filter Tabs: Inbox | Replied | Trash */}
        <div className="flex items-center gap-1.5 text-xs bg-muted/50 p-1 rounded-lg border border-border/80 overflow-x-auto max-w-full">
          <Link
            href="/admin/messages"
            prefetch={true}
            className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 shrink-0 ${
              currentView === "inbox"
                ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Inbox</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                currentView === "inbox"
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {inboxCount}
            </span>
          </Link>

          <Link
            href="/admin/messages?view=replied"
            prefetch={true}
            className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 shrink-0 ${
              currentView === "replied"
                ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Replied</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                currentView === "replied"
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {repliedCount}
            </span>
          </Link>

          <Link
            href="/admin/messages?view=trash"
            prefetch={true}
            className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 shrink-0 ${
              currentView === "trash"
                ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Trash</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                currentView === "trash"
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {trashCount}
            </span>
          </Link>
        </div>
      </div>

      <Card className="border-border/70 bg-card/60">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[150px]">Sender</TableHead>
                <TableHead className="min-w-[280px]">Subject & Message</TableHead>
                <TableHead className="min-w-[120px]">Received</TableHead>
                <TableHead className="min-w-[90px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                    {currentView === "trash"
                      ? "Trash is empty."
                      : currentView === "replied"
                      ? "No replied messages yet. Sent replies will automatically appear here."
                      : "No pending messages in your inbox."}
                  </TableCell>
                </TableRow>
              ) : (
                messages.map((m) => (
                  <TableRow
                    key={m.id}
                    className={!m.read && currentView === "inbox" ? "bg-primary/5 font-medium" : ""}
                  >
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-sm">{m.name}</span>
                          {!m.read && currentView === "inbox" && (
                            <Badge variant="default" className="text-[9px] px-1 py-0">
                              NEW
                            </Badge>
                          )}
                          {m.replied && (
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1.5 py-0 border-emerald-500/40 text-emerald-500 bg-emerald-500/10 font-semibold"
                            >
                              REPLIED
                            </Badge>
                          )}
                        </div>
                        <a
                          href={`mailto:${m.email}`}
                          className="text-xs text-muted-foreground hover:underline font-mono"
                        >
                          {m.email}
                        </a>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="font-semibold text-xs text-foreground">{m.subject}</p>
                          {currentView !== "trash" && (
                            <SuggestReplyDialog
                              message={{
                                id: m.id,
                                name: m.name,
                                email: m.email,
                                subject: m.subject,
                                message: m.message,
                                createdAt: m.createdAt,
                                read: m.read,
                                replied: m.replied,
                                repliedAt: m.repliedAt,
                              }}
                              trigger={
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                                  title="Draft AI suggested reply"
                                >
                                  <Sparkles className="w-3 h-3" />
                                  {m.replied ? "Reply Again" : "Suggest Reply"}
                                </button>
                              }
                            />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3">
                          {m.message}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      <div>
                        {new Date(m.createdAt).toLocaleString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      {m.repliedAt && (
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                          Replied:{" "}
                          {new Date(m.repliedAt).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <MessageRowActions
                        id={m.id}
                        read={m.read}
                        replied={m.replied}
                        deletedAt={m.deletedAt}
                        email={m.email}
                        subject={m.subject}
                        name={m.name}
                        messageText={m.message}
                        createdAt={m.createdAt}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
