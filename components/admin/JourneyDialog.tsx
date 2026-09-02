"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { JourneyEntrySchema, JourneyEntryFormData } from "@/lib/validations";
import { createJourneyEntry, updateJourneyEntry } from "@/actions/journey";
import { JourneyEntry } from "@/types";
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
import {
  Plus,
  Loader2,
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
import { toast } from "sonner";

interface JourneyDialogProps {
  entry?: JourneyEntry;
  trigger?: React.ReactNode;
}

const ICON_OPTIONS = [
  { value: "graduation-cap", label: "Graduation (Education)", icon: GraduationCap },
  { value: "cpu", label: "CPU / Tech (AI/ML & Projects)", icon: Cpu },
  { value: "code", label: "Code (LeetCode / Coding)", icon: Code2 },
  { value: "award", label: "Award (Certifications)", icon: Award },
  { value: "shield", label: "Shield (NCC / Security)", icon: Shield },
  { value: "briefcase", label: "Briefcase (Work / Experience)", icon: Briefcase },
  { value: "rocket", label: "Rocket (Launch / Startup)", icon: Rocket },
  { value: "sparkles", label: "Sparkles (Achievement)", icon: Sparkles },
  { value: "book-open", label: "Book (Research / Learning)", icon: BookOpen },
  { value: "milestone", label: "Milestone (Key Milestone)", icon: Milestone },
];

const TYPE_OPTIONS = [
  { value: "education", label: "Education" },
  { value: "project", label: "Project" },
  { value: "achievement", label: "Achievement" },
  { value: "certification", label: "Certification" },
  { value: "activity", label: "Activity / Co-curricular" },
] as const;

export function JourneyDialog({ entry, trigger }: JourneyDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const defaultValues: Partial<JourneyEntryFormData> = {
    title: entry?.title ?? "",
    organization: entry?.organization ?? "",
    period: entry?.period ?? "",
    description: entry?.description ?? "",
    type: entry?.type ?? "education",
    icon: entry?.icon ?? "graduation-cap",
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<JourneyEntryFormData>({
    resolver: zodResolver(JourneyEntrySchema),
    defaultValues,
  });

  const selectedIcon = watch("icon");

  const onSubmit = async (data: JourneyEntryFormData) => {
    setLoading(true);
    try {
      if (entry) {
        await updateJourneyEntry(entry.id, data);
        toast.success("Journey milestone updated");
      } else {
        await createJourneyEntry(data);
        toast.success("Journey milestone added");
      }
      setOpen(false);
      reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save journey milestone");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger render={trigger as React.ReactElement} />
      ) : (
        <DialogTrigger
          render={
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" /> Add Milestone
            </Button>
          }
        />
      )}
      <DialogContent className="w-[95vw] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{entry ? "Edit Journey Milestone" : "Add Journey Milestone"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Title *</label>
            <Input {...register("title")} placeholder="e.g. B.Tech in AI & ML" />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Organization / Platform *</label>
              <Input {...register("organization")} placeholder="e.g. Bannari Amman Institute" />
              {errors.organization && (
                <p className="text-xs text-destructive">{errors.organization.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Timeline / Period *</label>
              <Input {...register("period")} placeholder="e.g. 2023 – Present" />
              {errors.period && <p className="text-xs text-destructive">{errors.period.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Type *</label>
              <select
                {...register("type")}
                className="w-full h-8 px-2.5 rounded-lg border border-input bg-background text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Timeline Icon *</label>
              <select
                value={selectedIcon}
                onChange={(e) => setValue("icon", e.target.value)}
                className="w-full h-8 px-2.5 rounded-lg border border-input bg-background text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {ICON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Description *</label>
            <Textarea
              {...register("description")}
              rows={3}
              placeholder="Describe key responsibilities, achievements, or learnings during this milestone..."
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="flex justify-end pt-2 border-t border-border/60">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {entry ? "Save Changes" : "Add Milestone"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
