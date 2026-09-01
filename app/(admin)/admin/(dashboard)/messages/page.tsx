import { prisma } from "@/lib/db";
import { MessageRowActions } from "@/components/admin/MessageRowActions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata = {
  title: "Contact Messages | Admin",
};

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const params = await searchParams;
  const showTrash = params.view === "trash";

  const messages = await prisma.contactMessage.findMany({
    where: showTrash ? { deletedAt: { not: null } } : { deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {showTrash ? "Trash — Contact Messages" : "Inbox — Contact Messages"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            View, read, reply to, and organize portfolio contact form inquiries.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <a
            href="/admin/messages"
            className={`px-3 py-1.5 rounded-md font-medium border ${
              !showTrash ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"
            }`}
          >
            Inbox
          </a>
          <a
            href="/admin/messages?view=trash"
            className={`px-3 py-1.5 rounded-md font-medium border ${
              showTrash ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"
            }`}
          >
            Trash
          </a>
        </div>
      </div>

      <Card className="border-border/70 bg-card/60">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sender</TableHead>
                <TableHead>Subject & Message</TableHead>
                <TableHead>Received</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    {showTrash ? "Trash is empty." : "No messages in inbox."}
                  </TableCell>
                </TableRow>
              ) : (
                messages.map((m) => (
                  <TableRow key={m.id} className={!m.read && !showTrash ? "bg-primary/5 font-medium" : ""}>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm">{m.name}</span>
                          {!m.read && !showTrash && (
                            <Badge variant="default" className="text-[9px] px-1 py-0">NEW</Badge>
                          )}
                        </div>
                        <a href={`mailto:${m.email}`} className="text-xs text-muted-foreground hover:underline">
                          {m.email}
                        </a>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <div className="space-y-1">
                        <p className="font-medium text-xs text-foreground">{m.subject}</p>
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3">
                          {m.message}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <MessageRowActions
                        id={m.id}
                        read={m.read}
                        deletedAt={m.deletedAt}
                        email={m.email}
                        subject={m.subject}
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
