import { prisma } from "@/lib/db";
import { CertificationDialog } from "@/components/admin/CertificationDialog";
import { deleteCertification, toggleCertificationPublished } from "@/actions/certification";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, ExternalLink, Eye } from "lucide-react";

export const metadata = {
  title: "Manage Certifications | Admin",
};

export default async function AdminCertificationsPage() {
  const certs = await prisma.certification.findMany({
    orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Certifications</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage course certifications, NPTEL awards, and credential verification links.
          </p>
        </div>
        <CertificationDialog />
      </div>

      <Card className="border-border/70 bg-card/60">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[45%] min-w-[240px]">Title & Description</TableHead>
                <TableHead className="w-[20%] min-w-[140px]">Issuer</TableHead>
                <TableHead className="w-[13%] min-w-[100px]">Issue Date</TableHead>
                <TableHead className="w-[10%]">Status</TableHead>
                <TableHead className="w-[12%] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {certs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No certifications found.
                  </TableCell>
                </TableRow>
              ) : (
                certs.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="whitespace-normal max-w-sm">
                      <div className="space-y-1">
                        <span className="font-semibold text-sm block leading-tight text-foreground">{c.title}</span>
                        {c.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 break-words leading-relaxed">
                            {c.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{c.issuer}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {c.issueDate ? new Date(c.issueDate).toLocaleDateString("en-IN") : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.published ? "outline" : "destructive"} className="text-[10px]">
                        {c.published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(c.imageUrl || c.credentialUrl) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 text-muted-foreground hover:text-primary"
                            title="View Certificate"
                            render={<a href={c.imageUrl || c.credentialUrl!} target="_blank" rel="noreferrer" />}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}

                        <CertificationDialog
                          certification={c}
                          trigger={
                            <Button variant="ghost" size="icon" className="w-8 h-8">
                              <Edit className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          }
                        />

                        <form
                          action={async () => {
                            "use server";
                            await deleteCertification(c.id);
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
