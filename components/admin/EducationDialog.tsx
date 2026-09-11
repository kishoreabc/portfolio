"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EducationSchema, EducationFormData } from "@/lib/validations";
import { createEducation, updateEducation } from "@/actions/education";
import { Education } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EducationDialogProps {
  education?: Education;
  trigger?: React.ReactNode;
}

export function EducationDialog({ education, trigger }: EducationDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger render={trigger as React.ReactElement} />
      ) : (
        <DialogTrigger render={<Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Education</Button>} />
      )}
      {open && <EducationDialogContent education={education} onClose={() => setOpen(false)} />}
    </Dialog>
  );
}

function EducationDialogContent({
  education,
  onClose,
}: {
  education?: Education;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const defaultValues: Partial<EducationFormData> = {
    institution: education?.institution ?? "",
    degree: education?.degree ?? "",
    field: education?.field ?? "",
    startDate: education?.startDate ? new Date(education.startDate).toISOString().split("T")[0] : "",
    endDate: education?.endDate ? new Date(education.endDate).toISOString().split("T")[0] : "",
    score: education?.score ?? "",
    description: education?.description ?? "",
    displayOrder: education?.displayOrder ?? 0,
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EducationFormData>({
    resolver: zodResolver(EducationSchema),
    defaultValues,
  });

  const onSubmit = async (data: EducationFormData) => {
    setLoading(true);
    try {
      if (education) {
        await updateEducation(education.id, data);
        toast.success("Education record updated");
      } else {
        await createEducation(data);
        toast.success("Education record added");
      }
      onClose();
      reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save education record");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-4xl lg:max-w-5xl w-[95vw] max-h-[92vh] overflow-y-auto overflow-x-hidden p-6 sm:p-8">
        <DialogHeader>
          <DialogTitle>{education ? "Edit Education Record" : "Add Education Record"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4 w-full min-w-0 max-w-full overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Institution *</label>
              <Input {...register("institution")} placeholder="Bannari Amman Institute of Technology" />
              {errors.institution && <p className="text-xs text-destructive">{errors.institution.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Degree *</label>
              <Input {...register("degree")} placeholder="B.Tech" />
              {errors.degree && <p className="text-xs text-destructive">{errors.degree.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Field of Study</label>
              <Input {...register("field")} placeholder="AI & ML" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">CGPA / Score</label>
              <Input {...register("score")} placeholder="8.33 CGPA or 84.8%" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Start Date</label>
              <Input type="date" {...register("startDate")} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">End Date (Leave blank if Present)</label>
              <Input type="date" {...register("endDate")} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Display Order</label>
              <Input type="number" {...register("displayOrder", { valueAsNumber: true })} placeholder="1" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Description</label>
            <Textarea {...register("description")} rows={2} placeholder="Relevant coursework, focus areas..." />
          </div>

          <div className="flex justify-end pt-2 border-t border-border/60">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {education ? "Save Changes" : "Add Record"}
            </Button>
          </div>
        </form>
      </DialogContent>
  );
}
