"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SkillSchema, SkillFormData } from "@/lib/validations";
import { createSkill, updateSkill } from "@/actions/skill";
import { Skill } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SkillDialogProps {
  skill?: Skill;
  trigger?: React.ReactNode;
}

export function SkillDialog({ skill, trigger }: SkillDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const defaultValues: Partial<SkillFormData> = {
    name: skill?.name ?? "",
    category: (skill?.category as SkillFormData["category"]) ?? "AI/ML",
    iconSlug: skill?.iconSlug ?? "",
    displayOrder: skill?.displayOrder ?? 0,
    published: skill?.published ?? true,
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<SkillFormData>({
    resolver: zodResolver(SkillSchema),
    defaultValues,
  });

  const onSubmit = async (data: SkillFormData) => {
    setLoading(true);
    try {
      if (skill) {
        await updateSkill(skill.id, data);
        toast.success("Skill updated");
      } else {
        await createSkill(data);
        toast.success("Skill added");
      }
      setOpen(false);
      reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save skill");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger render={trigger as React.ReactElement} />
      ) : (
        <DialogTrigger render={<Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Skill Badge</Button>} />
      )}
      <DialogContent className="sm:max-w-4xl lg:max-w-5xl w-[95vw] max-h-[92vh] overflow-y-auto overflow-x-hidden p-6 sm:p-8">
        <DialogHeader>
          <DialogTitle>{skill ? "Edit Skill" : "Add Skill Badge"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4 w-full min-w-0 max-w-full overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Skill Name *</label>
              <Input {...register("name")} placeholder="RAG or LangChain" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Category *</label>
              <Select
                defaultValue={watch("category")}
                onValueChange={(val) => setValue("category", val as SkillFormData["category"])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AI/ML">AI / ML / GenAI</SelectItem>
                  <SelectItem value="Programming">Programming</SelectItem>
                  <SelectItem value="Databases">Databases</SelectItem>
                  <SelectItem value="Tools">Developer Tools</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Display Order</label>
              <Input type="number" {...register("displayOrder", { valueAsNumber: true })} placeholder="1" />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/60">
            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <Switch
                checked={watch("published")}
                onCheckedChange={(val) => setValue("published", val)}
              />
              Published
            </label>

            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {skill ? "Save Changes" : "Add Skill"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
