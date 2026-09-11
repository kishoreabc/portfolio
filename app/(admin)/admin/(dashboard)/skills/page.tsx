import { prisma } from "@/lib/db";
import { SkillDialog } from "@/components/admin/SkillDialog";
import { deleteSkill } from "@/actions/skill";
import { AdminRowDeleteButton } from "@/components/admin/AdminRowDeleteButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

export const metadata = {
  title: "Manage Skills | Admin",
};

export default async function AdminSkillsPage() {
  const skills = await prisma.skill.findMany({
    orderBy: [{ category: "asc" }, { displayOrder: "asc" }],
  });

  const categories = ["AI/ML", "Programming", "Databases", "Tools"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Skills & Tech Stack</h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            Manage technical skill badges displayed across the AI & Machine Learning portfolio.
          </p>
        </div>
        <SkillDialog />
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
        {categories.map((cat) => {
          const catSkills = skills.filter((s) => s.category === cat);
          return (
            <Card key={cat} className="border-border/70 bg-card/60">
              <CardHeader className="pb-3 flex flex-row items-center justify-between p-4 sm:p-6">
                <CardTitle className="text-base font-semibold">{cat}</CardTitle>
                <Badge variant="secondary" className="text-xs">{catSkills.length} badges</Badge>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">Skill Name</TableHead>
                      <TableHead className="min-w-[80px]">Status</TableHead>
                      <TableHead className="min-w-[80px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {catSkills.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4 text-xs text-muted-foreground">
                          No skills in this category.
                        </TableCell>
                      </TableRow>
                    ) : (
                      catSkills.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium text-sm">{s.name}</TableCell>
                          <TableCell>
                            <Badge variant={s.published ? "outline" : "destructive"} className="text-[10px]">
                              {s.published ? "Visible" : "Hidden"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <SkillDialog
                                skill={s}
                                trigger={
                                  <Button variant="ghost" size="icon" className="w-7 h-7">
                                    <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                                  </Button>
                                }
                              />
                              <AdminRowDeleteButton
                                itemTitle={s.name}
                                itemType="skill badge"
                                className="w-7 h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onDelete={deleteSkill.bind(null, s.id)}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
