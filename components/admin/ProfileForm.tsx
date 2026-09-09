"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SiteConfigSchema, SiteConfigFormData } from "@/lib/validations";
import { updateSiteConfig } from "@/actions/profile";
import { SiteConfig } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CloudinaryUpload } from "@/components/admin/CloudinaryUpload";

const DEFAULT_SEO_KEYWORDS =
  "Kishore, Kishore R, kishore, kishore r, kishoreabc, kishorehp134, Kishore Salem, Kishore Tamil Nadu, Kishore India, Kishore Bannari Amman, Kishore BIT, Kishore Portfolio, Kishore R Portfolio, Kishore Website, Kishore R Website, Kishore Official Website, Kishore Developer, Kishore Software Engineer, Kishore AI Developer, Kishore GitHub, Kishore LinkedIn, Kishore LeetCode, Kishore AI, Kishore R AI, Kishore AI Engineer, Kishore ML Engineer, AI/ML Engineer, Generative AI Engineer, RAG Engineer, LLM Specialist, Multimodal AI, Deep Learning Engineer, Machine Learning Engineer India, Full Stack AI Developer, Python AI Developer, LangChain, LangGraph, FastAPI, Next.js, Data Structures and Algorithms";

export function ProfileForm({ config }: { config: SiteConfig | null }) {
  const [loading, setLoading] = useState(false);

  const defaultValues: SiteConfigFormData = {
    heroTitle: config?.heroTitle ?? "Building Intelligent Systems That Solve Real Problems.",
    heroSubtitle: config?.heroSubtitle ?? "Aspiring AI/ML & Generative AI Engineer focused on building intelligent, multimodal and production-oriented AI systems.",
    availabilityStatus: config?.availabilityStatus ?? "Open to opportunities",
    name: config?.name ?? "Kishore R",
    headline: config?.headline ?? "Aspiring AI/ML & Generative AI Engineer",
    bio: config?.bio ?? "",
    location: config?.location ?? "Salem, Tamil Nadu, India",
    contactEmail: config?.contactEmail ?? "Kishorehp134@gmail.com",
    phone: config?.phone ?? "",
    avatarUrl: config?.avatarUrl ?? "",
    resumeUrl: config?.resumeUrl ?? "",
    aboutText: config?.aboutText ?? "",
    seoTitle: config?.seoTitle ?? "Kishore R ",
    seoDescription: config?.seoDescription ?? "Official portfolio and personal website of Kishore R, an aspiring AI/ML and Generative AI Engineer specializing in RAG pipelines, LLMs, and intelligent systems.",
    seoKeywords: config?.seoKeywords ?? DEFAULT_SEO_KEYWORDS,
    ogImageUrl: config?.ogImageUrl ?? "",
    leetcodeTotal: config?.leetcodeTotal ?? 380,
    leetcodeEasy: config?.leetcodeEasy ?? 0,
    leetcodeMedium: config?.leetcodeMedium ?? 0,
    leetcodeHard: config?.leetcodeHard ?? 0,
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SiteConfigFormData>({

    resolver: zodResolver(SiteConfigSchema),
    defaultValues,
  });

  const onSubmit = async (data: SiteConfigFormData) => {
    setLoading(true);
    try {
      await updateSiteConfig(data);
      toast.success("Profile and site configuration saved!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save configuration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Hero Section Config */}
      <Card className="border-border/70 bg-card/60">
        <CardHeader>
          <CardTitle>Hero Section Settings</CardTitle>
          <CardDescription>Main headline, availability status, and tagline on homepage hero.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Hero Headline *</label>
            <Input {...register("heroTitle")} placeholder="Building Intelligent Systems That Solve Real Problems." />
            {errors.heroTitle && <p className="text-xs text-destructive">{errors.heroTitle.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Hero Subtitle / Supporting Text *</label>
            <Textarea {...register("heroSubtitle")} rows={2} />
            {errors.heroSubtitle && <p className="text-xs text-destructive">{errors.heroSubtitle.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Availability Status Badge</label>
              <Input {...register("availabilityStatus")} placeholder="Open to opportunities" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Location</label>
              <Input {...register("location")} placeholder="Salem, Tamil Nadu, India" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Bio & Information */}
      <Card className="border-border/70 bg-card/60">
        <CardHeader>
          <CardTitle>Personal Info & Resume</CardTitle>
          <CardDescription>Bio, contact email, avatar image, and downloadable resume link.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Full Name *</label>
              <Input {...register("name")} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Professional Headline *</label>
              <Input {...register("headline")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Contact Email *</label>
              <Input {...register("contactEmail")} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Phone Number</label>
              <Input {...register("phone")} placeholder="+91 9876543210" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CloudinaryUpload
              label="Professional Profile Image (Avatar)"
              value={watch("avatarUrl") ?? ""}
              onChange={(url) => setValue("avatarUrl", url, { shouldValidate: true, shouldDirty: true, shouldTouch: true })}
              placeholder="Upload portrait photo or paste image URL..."
              accept="image/*"
              helpText="Professional photo displayed in the Hero and About sections."
            />

            <CloudinaryUpload
              label="Resume PDF File"
              value={watch("resumeUrl") ?? ""}
              onChange={(url) => setValue("resumeUrl", url, { shouldValidate: true, shouldDirty: true, shouldTouch: true })}
              placeholder="Upload PDF resume or paste Cloudinary URL..."
              accept=".pdf,application/pdf"
              helpText="Downloadable resume file linked across your portfolio."
            />
          </div>



          <div className="space-y-1.5">
            <label className="text-xs font-semibold">About Section Text</label>
            <Textarea {...register("aboutText")} rows={4} placeholder="Full personal description for About section..." />
          </div>
        </CardContent>
      </Card>

      {/* LeetCode Manual Statistics */}
      <Card className="border-border/70 bg-card/60">
        <CardHeader>
          <CardTitle>LeetCode & Coding Statistics</CardTitle>
          <CardDescription>Manually editable problem count shown in Coding section.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Total Solved *</label>
              <Input type="number" {...register("leetcodeTotal", { valueAsNumber: true })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Easy Solved</label>
              <Input type="number" {...register("leetcodeEasy", { valueAsNumber: true })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Medium Solved</label>
              <Input type="number" {...register("leetcodeMedium", { valueAsNumber: true })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Hard Solved</label>
              <Input type="number" {...register("leetcodeHard", { valueAsNumber: true })} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEO Metadata */}
      <Card className="border-border/70 bg-card/60">
        <CardHeader>
          <CardTitle>SEO & Open Graph Meta</CardTitle>
          <CardDescription>Search engine title and description for Google indexing.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">SEO Title</label>
            <Input {...register("seoTitle")} placeholder="Kishore R — Aspiring AI/ML & Generative AI Engineer" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">SEO Meta Description</label>
            <Textarea {...register("seoDescription")} rows={2} placeholder="Portfolio of Kishore R..." />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold">Exact-Match Keyword Matrix</label>
              <button
                type="button"
                onClick={() => setValue("seoKeywords", DEFAULT_SEO_KEYWORDS, { shouldValidate: true })}
                className="text-[11px] text-primary hover:underline cursor-pointer font-medium"
              >
                Reset to Recommended Keywords
              </button>
            </div>
            <Textarea
              {...register("seoKeywords")}
              rows={4}
              placeholder="Comma-separated keywords (e.g. Kishore, Kishore R, Kishore AI Engineer...)"
              className="font-mono text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              Comma-separated terms indexed by Google and search engines for exact-match ranking.
            </p>
          </div>

          <CloudinaryUpload
            label="Open Graph / Social Share Card Image (og:image)"
            value={watch("ogImageUrl") ?? ""}
            onChange={(url) => setValue("ogImageUrl", url, { shouldValidate: true })}
            placeholder="Upload social banner or leave empty to use avatar..."
            accept="image/*"
            helpText="1200x630px preview card displayed when your website link is shared on LinkedIn or Twitter."
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save All Site Settings
        </Button>
      </div>
    </form>
  );
}
