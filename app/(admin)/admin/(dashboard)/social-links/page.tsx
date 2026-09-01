import { prisma } from "@/lib/db";
import { SocialLinkDialog } from "@/components/admin/SocialLinkDialog";
import { deleteSocialLink, toggleSocialLinkEnabled } from "@/actions/social-link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, ExternalLink } from "lucide-react";

export const metadata = {
  title: "Manage Social Links | Admin",
};

export default async function AdminSocialLinksPage() {
  const links = await prisma.socialLink.findMany({
    orderBy: { displayOrder: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Social & Profile Links</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage links to GitHub, LinkedIn, LeetCode, and contact email.
          </p>
        </div>
        <SocialLinkDialog />
      </div>

      <Card className="border-border/70 bg-card/60">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Platform</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {links.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No social links found.
                  </TableCell>
                </TableRow>
              ) : (
                links.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-semibold text-sm">{l.platform}</TableCell>
                    <TableCell>
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        {l.url} <ExternalLink className="w-3 h-3" />
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge variant={l.enabled ? "outline" : "destructive"} className="text-[10px]">
                        {l.enabled ? "Active" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <SocialLinkDialog
                          socialLink={l}
                          trigger={
                            <Button variant="ghost" size="icon" className="w-8 h-8">
                              <Edit className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          }
                        />

                        <form
                          action={async () => {
                            "use server";
                            await deleteSocialLink(l.id);
                          }}
                        >
                          <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </form>
                      </div>
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
