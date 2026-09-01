import { prisma } from "@/lib/db";
import { EducationDialog } from "@/components/admin/EducationDialog";
import { deleteEducation } from "@/actions/education";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";

export const metadata = {
  title: "Manage Education | Admin",
};

export default async function AdminEducationPage() {
  const educationList = await prisma.education.findMany({
    orderBy: { displayOrder: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Education</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage academic degrees, school qualifications, CGPA metrics, and timelines.
          </p>
        </div>
        <EducationDialog />
      </div>

      <Card className="border-border/70 bg-card/60">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Institution</TableHead>
                <TableHead>Degree / Field</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Timeline</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {educationList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No education records found.
                  </TableCell>
                </TableRow>
              ) : (
                educationList.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-semibold text-sm">{e.institution}</TableCell>
                    <TableCell>
                      <div className="space-y-0.5 text-xs">
                        <p className="font-medium text-foreground">{e.degree}</p>
                        {e.field && <p className="text-muted-foreground">{e.field}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-primary">
                      {e.score ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {e.startDate ? new Date(e.startDate).getFullYear() : "—"} –{" "}
                      {e.endDate ? new Date(e.endDate).getFullYear() : "Present"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <EducationDialog
                          education={e}
                          trigger={
                            <Button variant="ghost" size="icon" className="w-8 h-8">
                              <Edit className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          }
                        />

                        <form
                          action={async () => {
                            "use server";
                            await deleteEducation(e.id);
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
