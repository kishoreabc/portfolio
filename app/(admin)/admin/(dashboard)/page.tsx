import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FolderGit2,
  BookOpen,
  Award,
  Wrench,
  MessageSquare,
  ArrowRight,
  Milestone,
  Eye,
  Bot,
  Mic,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Admin Dashboard | Kishore R",
};

export default async function AdminDashboardPage() {
  const [
    projectsCount,
    certificationsCount,
    blogsCount,
    skillsCount,
    messagesCount,
    unreadMessagesCount,
    recentMessages,
    config,
    visitorCounter,
    waitingVoiceQueueCount,
    activeAiSessionsCount,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.certification.count(),
    prisma.blogPost.count(),
    prisma.skill.count(),
    prisma.contactMessage.count({ where: { deletedAt: null } }),
    prisma.contactMessage.count({ where: { read: false, deletedAt: null, replied: false } }),
    prisma.contactMessage.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.siteConfig.findUnique({ where: { id: "singleton" }, select: { journeyEntries: true } }),
    prisma.siteVisitorCounter.findUnique({ where: { id: "singleton" } }),
    prisma.aiQueue.count({
      where: {
        promoted: false,
        lastPolledAt: { gte: new Date(Date.now() - 60 * 1000) },
      },
    }),
    prisma.aiConversation.count({
      where: { endedAt: null },
    }),
  ]);

  const journeyCount = Array.isArray(config?.journeyEntries)
    ? (config.journeyEntries as unknown[]).length
    : 0;

  const stats = [
    { label: "Total Visits", value: visitorCounter?.totalVisits ?? 0, href: "/", icon: Eye },
    { label: "Active AI Sessions", value: activeAiSessionsCount, href: "/admin/ai-conversations", icon: Bot, highlight: activeAiSessionsCount > 0 || waitingVoiceQueueCount > 0 },
    { label: "Total Projects", value: projectsCount, href: "/admin/projects", icon: FolderGit2 },
    { label: "Certifications", value: certificationsCount, href: "/admin/certifications", icon: Award },
    { label: "Blog Articles", value: blogsCount, href: "/admin/blogs", icon: BookOpen },
    { label: "Skills Badges", value: skillsCount, href: "/admin/skills", icon: Wrench },
    { label: "Journey Milestones", value: journeyCount, href: "/admin/journey", icon: Milestone },
    { label: "Unread Messages", value: unreadMessagesCount, total: messagesCount, href: "/admin/messages", icon: MessageSquare, highlight: unreadMessagesCount > 0 },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
          Manage and update portfolio metrics, projects, skills, blogs, and visitor messages.
        </p>
      </div>

      {/* Voice Model Waiting Queue Alert Banner (if visitors waiting) */}
      {waitingVoiceQueueCount > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-400">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 border border-amber-500/30">
              <Mic className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-300">
                {waitingVoiceQueueCount} visitor{waitingVoiceQueueCount !== 1 ? "s" : ""} waiting in Voice Model Queue
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Voice concurrency capacity reached. View real-time waiting list, IP addresses, and promote visitors.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-amber-500/40 text-amber-400 hover:bg-amber-500/20 text-xs shrink-0 w-full sm:w-auto"
            render={<Link href="/admin/ai-conversations">Manage Voice Queue →</Link>}
          />
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="relative overflow-hidden border-border/70 bg-card/60">
              <CardHeader className="flex flex-row items-center justify-between pb-2 p-3.5 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground line-clamp-1">
                  {stat.label}
                </CardTitle>
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${stat.highlight ? "text-primary" : "text-muted-foreground"}`} />
              </CardHeader>
              <CardContent className="p-3.5 sm:p-6 pt-0">
                <div className="text-2xl sm:text-3xl font-bold">
                  {stat.value}
                  {stat.total !== undefined && (
                    <span className="text-xs sm:text-sm font-normal text-muted-foreground ml-1">
                      /{stat.total}
                    </span>
                  )}
                </div>
                <Link
                  href={stat.href}
                  className="mt-2 sm:mt-3 inline-flex items-center text-[11px] sm:text-xs text-primary font-medium hover:underline gap-1"
                >
                  Manage <ArrowRight className="w-3 h-3" />
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Contact Messages */}
      <Card className="border-border/70 bg-card/60">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-6">
          <div>
            <CardTitle className="text-base sm:text-lg">Recent Contact Form Submissions</CardTitle>
          </div>
          <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs" render={<Link href="/admin/messages">View Inbox</Link>} />
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {recentMessages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No contact form submissions yet.
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {recentMessages.map((msg) => (
                <div key={msg.id} className="py-3 flex flex-col sm:flex-row sm:items-start justify-between gap-1.5 sm:gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <span className="font-medium text-sm text-foreground">{msg.name}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">({msg.email})</span>
                      {!msg.read && (
                        <span className="w-2 h-2 rounded-full bg-primary inline-block shrink-0" title="Unread" />
                      )}
                      {msg.replied && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                          Replied
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-foreground/90">{msg.subject}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1 break-words">{msg.message}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 self-start sm:self-auto">
                    {new Date(msg.createdAt).toLocaleDateString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
