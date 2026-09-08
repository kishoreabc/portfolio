import { prisma } from "@/lib/db";
import { BlogDialog } from "@/components/admin/BlogDialog";
import { BlogRowActions } from "@/components/admin/BlogRowActions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, Calendar, Clock, ExternalLink } from "lucide-react";

export const metadata = {
  title: "Manage Blogs | Admin",
};

export default async function AdminBlogsPage() {
  const blogs = await prisma.blogPost.findMany({
    orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog Articles</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Publish, edit, and organize technical articles, AI/ML case studies, and engineering blogs.
          </p>
        </div>
        <BlogDialog />
      </div>

      <Card className="border-border/70 bg-card/60">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[45px]">Order</TableHead>
                <TableHead className="w-[45%] min-w-[260px]">Article & Summary</TableHead>
                <TableHead className="w-[20%] min-w-[140px]">Tags</TableHead>
                <TableHead className="w-[12%] min-w-[100px]">Read Time</TableHead>
                <TableHead className="w-[10%]">Status</TableHead>
                <TableHead className="w-[13%] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground space-y-2">
                    <BookOpen className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="font-medium text-sm text-foreground">No blog posts found</p>
                    <p className="text-xs text-muted-foreground">
                      Click &quot;Add Blog Post&quot; above to create your first article or link to an external blog.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                blogs.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      #{b.displayOrder}
                    </TableCell>
                    <TableCell className="whitespace-normal max-w-sm">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-foreground">{b.title}</span>
                          {b.featured && (
                            <Badge variant="default" className="text-[10px] px-1.5 py-0">
                              Featured
                            </Badge>
                          )}
                          {b.canonicalUrl && (
                            <span className="text-[10px] text-muted-foreground inline-flex items-center gap-0.5">
                              <ExternalLink className="w-2.5 h-2.5" /> External
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 break-words leading-relaxed">
                          {b.summary}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {b.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                            {tag}
                          </Badge>
                        ))}
                        {b.tags.length > 3 && (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            +{b.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="space-y-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          {b.readTime || "5 min read"}
                        </span>
                        {b.publishedAt && (
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground/70">
                            <Calendar className="w-2.5 h-2.5" />
                            {new Date(b.publishedAt).toLocaleDateString("en-IN")}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={b.published ? "outline" : "destructive"} className="text-[10px]">
                        {b.published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <BlogRowActions blog={b} />
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
