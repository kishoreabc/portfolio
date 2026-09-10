"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SocialLinkSchema, SocialLinkFormData } from "@/lib/validations";
import { createSocialLink, updateSocialLink } from "@/actions/social-link";
import { SocialLink } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SocialLinkDialogProps {
  socialLink?: SocialLink;
  trigger?: React.ReactNode;
}

export function SocialLinkDialog({ socialLink, trigger }: SocialLinkDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const defaultValues: Partial<SocialLinkFormData> = {
    platform: socialLink?.platform ?? "",
    url: socialLink?.url ?? "",
    iconSlug: socialLink?.iconSlug ?? "",
    enabled: socialLink?.enabled ?? true,
    displayOrder: socialLink?.displayOrder ?? 0,
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<SocialLinkFormData>({
    resolver: zodResolver(SocialLinkSchema),
    defaultValues,
  });

  const onSubmit = async (data: SocialLinkFormData) => {
    setLoading(true);
    try {
      if (socialLink) {
        await updateSocialLink(socialLink.id, data);
        toast.success("Social link updated");
      } else {
        await createSocialLink(data);
        toast.success("Social link added");
      }
      setOpen(false);
      reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save social link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger render={trigger as React.ReactElement} />
      ) : (
        <DialogTrigger render={<Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Social Profile</Button>} />
      )}
      <DialogContent className="sm:max-w-4xl lg:max-w-5xl w-[95vw] max-h-[92vh] overflow-y-auto overflow-x-hidden p-6 sm:p-8">
        <DialogHeader>
          <DialogTitle>{socialLink ? "Edit Social Profile" : "Add Social Profile"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4 w-full min-w-0 max-w-full overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5 md:col-span-1">
              <label className="text-xs font-semibold">Platform *</label>
              <Input {...register("platform")} placeholder="GitHub / LinkedIn / LeetCode" />
              {errors.platform && <p className="text-xs text-destructive">{errors.platform.message}</p>}
            </div>

            <div className="space-y-1.5 md:col-span-1">
              <label className="text-xs font-semibold">Profile URL *</label>
              <Input {...register("url")} placeholder="https://github.com/..." />
              {errors.url && <p className="text-xs text-destructive">{errors.url.message}</p>}
            </div>

            <div className="space-y-1.5 md:col-span-1">
              <label className="text-xs font-semibold">Display Order</label>
              <Input type="number" {...register("displayOrder", { valueAsNumber: true })} placeholder="1" />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/60">
            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <Switch
                checked={watch("enabled")}
                onCheckedChange={(val) => setValue("enabled", val)}
              />
              Enabled
            </label>

            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {socialLink ? "Save Changes" : "Add Profile"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
