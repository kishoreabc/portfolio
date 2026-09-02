import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderGit2, Award, Wrench, MessageSquare, ExternalLink, ArrowRight, Milestone } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Admin Dashboard | Kishore R",
};

export default async function AdminDashboardPage() {
  const [
    projectsCount,
    certificationsCount,
    skillsCount,
    messagesCount,
    unreadMessagesCount,
    recentMessages,
    config,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.certification.count(),
    prisma.skill.count(),
    prisma.contactMessage.count({ where: { deletedAt: null } }),
    prisma.contactMessage.count({ where: { read: false, deletedAt: null } }),
    prisma.contactMessage.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.siteConfig.findUnique({ where: { id: "singleton" }, select: { journeyEntries: true } }),
  ]);

  const journeyCount = Array.isArray(config?.journeyEntries)
    ? (config.journeyEntries as unknown[]).length
    : 0;

  const stats = [
    { label: "Total Projects", value: projectsCount, href: "/admin/projects", icon: FolderGit2 },
    { label: "Certifications", value: certificationsCount, href: "/admin/certifications", icon: Award },
    { label: "Skills Badges", value: skillsCount, href: "/admin/skills", icon: Wrench },
    { label: "Journey Milestones", value: journeyCount, href: "/admin/journey", icon: Milestone },
    { label: "Unread Messages", value: unreadMessagesCount, total: messagesCount, href: "/admin/messages", icon: MessageSquare, highlight: unreadMessagesCount > 0 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-1">
          Manage and update portfolio metrics, projects, skills, and visitor messages.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="relative overflow-hidden border-border/70 bg-card/60">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon className={`w-4 h-4 ${stat.highlight ? "text-primary" : "text-muted-foreground"}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {stat.value}
                  {stat.total !== undefined && (
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      / {stat.total} total
                    </span>
                  )}
                </div>
                <Link
                  href={stat.href}
                  className="mt-3 inline-flex items-center text-xs text-primary font-medium hover:underline gap-1"
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
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Contact Form Submissions</CardTitle>
          </div>
          <Button variant="outline" size="sm" render={<Link href="/admin/messages">View Inbox</Link>} />
        </CardHeader>
        <CardContent>
          {recentMessages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No contact form submissions yet.
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {recentMessages.map((msg) => (
                <div key={msg.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground">{msg.name}</span>
                      <span className="text-xs text-muted-foreground">({msg.email})</span>
                      {!msg.read && (
                        <span className="w-2 h-2 rounded-full bg-primary inline-block" title="Unread" />
                      )}
                    </div>
                    <p className="text-xs font-semibold text-foreground/90">{msg.subject}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{msg.message}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
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
