"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CertificationSchema, CertificationFormData } from "@/lib/validations";
import { createCertification, updateCertification } from "@/actions/certification";
import { Certification } from "@prisma/client";
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
import { Switch } from "@/components/ui/switch";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { CloudinaryUpload } from "@/components/admin/CloudinaryUpload";

interface CertificationDialogProps {
  certification?: Certification;
  trigger?: React.ReactNode;
}

export function CertificationDialog({ certification, trigger }: CertificationDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const defaultValues: Partial<CertificationFormData> = {
    title: certification?.title ?? "",
    issuer: certification?.issuer ?? "",
    issueDate: certification?.issueDate ? new Date(certification.issueDate).toISOString().split("T")[0] : "",
    credentialId: certification?.credentialId ?? "",
    credentialUrl: certification?.credentialUrl ?? "",
    imageUrl: certification?.imageUrl ?? "",
    description: certification?.description ?? "",
    published: certification?.published ?? true,
    displayOrder: certification?.displayOrder ?? 0,
  };

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<CertificationFormData>({
    resolver: zodResolver(CertificationSchema),
    defaultValues,
  });

  const imageUrlValue = useWatch({ control, name: "imageUrl" });
  const publishedValue = useWatch({ control, name: "published" });

  const onSubmit = async (data: CertificationFormData) => {
    setLoading(true);
    try {
      if (certification) {
        await updateCertification(certification.id, data);
        toast.success("Certification updated");
      } else {
        await createCertification(data);
        toast.success("Certification added");
      }
      setOpen(false);
      reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save certification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger render={trigger as React.ReactElement} />
      ) : (
        <DialogTrigger render={<Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Certification</Button>} />
      )}
      <DialogContent className="sm:max-w-4xl lg:max-w-5xl w-[95vw] max-h-[92vh] overflow-y-auto overflow-x-hidden p-6 sm:p-8">
        <DialogHeader>
          <DialogTitle>{certification ? "Edit Certification" : "Add Certification"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4 w-full min-w-0 max-w-full overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Title *</label>
              <Input {...register("title")} placeholder="Programming in Java" />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Issuer *</label>
              <Input {...register("issuer")} placeholder="SWAYAM NPTEL" />
              {errors.issuer && <p className="text-xs text-destructive">{errors.issuer.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Issue Date</label>
              <Input type="date" {...register("issueDate")} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Credential ID</label>
              <Input {...register("credentialId")} placeholder="NPTEL24CS..." />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Credential URL</label>
              <Input {...register("credentialUrl")} placeholder="https://nptel.ac.in/..." />
            </div>
          </div>

          <CloudinaryUpload
            label="Certificate Image / PDF (Cloudinary)"
            value={imageUrlValue ?? ""}
            onChange={(url) => setValue("imageUrl", url, { shouldValidate: true, shouldDirty: true, shouldTouch: true })}
            placeholder="Upload file or paste Cloudinary URL..."
          />


          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Description / Score</label>
            <Textarea {...register("description")} rows={2} placeholder="Elite + Gold certification with 92% score." />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/60">
            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <Switch
                  checked={publishedValue}
                onCheckedChange={(val) => setValue("published", val)}
              />
              Published
            </label>

            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {certification ? "Save Changes" : "Add Certification"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
