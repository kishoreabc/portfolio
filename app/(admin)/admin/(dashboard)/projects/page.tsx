import { prisma } from "@/lib/db";
import { ProjectDialog } from "@/components/admin/ProjectDialog";
import { ProjectRowActions } from "@/components/admin/ProjectRowActions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Star, GitFork, ExternalLink } from "lucide-react";

export const metadata = {
  title: "Manage Projects | Admin",
};

export default async function AdminProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: { displayOrder: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            Create, edit, feature, and synchronize GitHub metadata for portfolio projects.
          </p>
        </div>
        <ProjectDialog />
      </div>

      <Card className="border-border/70 bg-card/60">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px] min-w-[50px]">Order</TableHead>
                <TableHead className="min-w-[180px]">Project</TableHead>
                <TableHead className="min-w-[140px]">Technologies</TableHead>
                <TableHead className="min-w-[90px]">Status</TableHead>
                <TableHead className="min-w-[110px]">GitHub Sync</TableHead>
                <TableHead className="min-w-[80px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No projects found. Click &quot;Add Project&quot; to create your first record.
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      #{p.displayOrder}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{p.title}</span>
                          {p.featured && (
                            <Badge variant="default" className="text-[10px] px-1.5 py-0">
                              Featured
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 max-w-xs">
                          {p.shortDescription}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {p.technologies.slice(0, 3).map((tech) => (
                          <Badge key={tech} variant="secondary" className="text-[10px] px-1.5 py-0">
                            {tech}
                          </Badge>
                        ))}
                        {p.technologies.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{p.technologies.length - 3}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.published ? "outline" : "destructive"} className="text-[10px]">
                        {p.published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        {p.githubStars !== null && (
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-amber-500">
                              <Star className="w-3 h-3 fill-amber-500" /> {p.githubStars}
                            </span>
                            <span className="flex items-center gap-1">
                              <GitFork className="w-3 h-3" /> {p.githubForks ?? 0}
                            </span>
                          </div>
                        )}
                        <span className="text-[10px]">
                          {p.githubSyncEnabled ? "Sync ON" : "Sync OFF"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <ProjectRowActions project={p} />
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
