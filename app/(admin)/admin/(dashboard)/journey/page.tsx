import { prisma } from "@/lib/db";
import { JourneyDialog } from "@/components/admin/JourneyDialog";
import {
  deleteJourneyEntry,
  moveJourneyEntry,
  sortAllJourneyEntriesByTimelineDesc,
} from "@/actions/journey";
import { JourneyEntry } from "@/types";
import { sortJourneyEntriesByTimelineDesc } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  ArrowDownNarrowWide,
  GraduationCap,
  Cpu,
  Code2,
  Award,
  Shield,
  Briefcase,
  Rocket,
  Sparkles,
  BookOpen,
  Milestone,
} from "lucide-react";

export const metadata = {
  title: "Manage Journey Milestones | Admin",
};

function getMilestoneIcon(iconName: string) {
  switch (iconName) {
    case "graduation-cap":
      return GraduationCap;
    case "cpu":
      return Cpu;
    case "code":
      return Code2;
    case "award":
      return Award;
    case "shield":
      return Shield;
    case "briefcase":
      return Briefcase;
    case "rocket":
      return Rocket;
    case "sparkles":
      return Sparkles;
    case "book-open":
      return BookOpen;
    case "milestone":
      return Milestone;
    default:
      return Cpu;
  }
}

function getTypeBadgeVariant(type: JourneyEntry["type"]) {
  switch (type) {
    case "education":
      return "border-blue-500/30 text-blue-400 bg-blue-500/10";
    case "project":
      return "border-emerald-500/30 text-emerald-400 bg-emerald-500/10";
    case "achievement":
      return "border-amber-500/30 text-amber-400 bg-amber-500/10";
    case "certification":
      return "border-purple-500/30 text-purple-400 bg-purple-500/10";
    case "activity":
      return "border-rose-500/30 text-rose-400 bg-rose-500/10";
    default:
      return "";
  }
}

export default async function AdminJourneyPage() {
  const config = await prisma.siteConfig.findUnique({
    where: { id: "singleton" },
    select: { journeyEntries: true },
  });

  const rawEntries = Array.isArray(config?.journeyEntries)
    ? (config.journeyEntries as unknown as JourneyEntry[])
    : [];

  const entries = sortJourneyEntriesByTimelineDesc(rawEntries);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Journey & Milestones</h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            Manage your timeline milestones, education journey, key achievements, and co-curriculars.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <form
            action={async () => {
              "use server";
              await sortAllJourneyEntriesByTimelineDesc();
            }}
          >
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="text-xs gap-1.5"
              title="Permanently sort stored entries by timeline descending"
            >
              <ArrowDownNarrowWide className="w-3.5 h-3.5" /> Sort Timeline Desc
            </Button>
          </form>
          <JourneyDialog />
        </div>
      </div>

      <Card className="border-border/70 bg-card/60">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 min-w-[48px] text-center">Order</TableHead>
                <TableHead className="min-w-[200px]">Milestone</TableHead>
                <TableHead className="min-w-[130px]">Organization</TableHead>
                <TableHead className="min-w-[100px]">Timeline</TableHead>
                <TableHead className="min-w-[90px]">Category</TableHead>
                <TableHead className="min-w-[80px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No journey milestones found. Click &quot;Add Milestone&quot; to create your first entry.
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry, idx) => {
                  const Icon = getMilestoneIcon(entry.icon);
                  const typeClass = getTypeBadgeVariant(entry.type);

                  return (
                    <TableRow key={entry.id || idx}>
                      {/* Reorder Buttons */}
                      <TableCell className="text-center p-2">
                        <div className="flex flex-col items-center justify-center">
                          <form
                            action={async () => {
                              "use server";
                              await moveJourneyEntry(entry.id, "up");
                            }}
                          >
                            <Button
                              type="submit"
                              variant="ghost"
                              size="icon-xs"
                              disabled={idx === 0}
                              className="h-5 w-5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                              title="Move Up"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </Button>
                          </form>
                          <span className="text-[11px] font-mono text-muted-foreground font-semibold">
                            {idx + 1}
                          </span>
                          <form
                            action={async () => {
                              "use server";
                              await moveJourneyEntry(entry.id, "down");
                            }}
                          >
                            <Button
                              type="submit"
                              variant="ghost"
                              size="icon-xs"
                              disabled={idx === entries.length - 1}
                              className="h-5 w-5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                              title="Move Down"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </Button>
                          </form>
                        </div>
                      </TableCell>

                      {/* Milestone Title + Icon */}
                      <TableCell>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="space-y-0.5 max-w-sm">
                            <p className="font-semibold text-sm text-foreground">{entry.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {entry.description}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Organization */}
                      <TableCell className="text-sm font-medium">
                        {entry.organization}
                      </TableCell>

                      {/* Timeline */}
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {entry.period}
                      </TableCell>

                      {/* Category Type */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] capitalize px-2 py-0.5 ${typeClass}`}
                        >
                          {entry.type}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <JourneyDialog
                            entry={entry}
                            trigger={
                              <Button variant="ghost" size="icon" className="w-8 h-8">
                                <Edit className="w-4 h-4 text-muted-foreground" />
                              </Button>
                            }
                          />

                          <form
                            action={async () => {
                              "use server";
                              await deleteJourneyEntry(entry.id);
                            }}
                          >
                            <Button
                              type="submit"
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 text-destructive"
                              title="Delete Milestone"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </form>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
