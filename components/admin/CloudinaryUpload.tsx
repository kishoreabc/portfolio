"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, Loader2, FileText, Image as ImageIcon, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface CloudinaryUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
  accept?: string;
  helpText?: string;
}

export function CloudinaryUpload({
  value,
  onChange,
  label = "Certificate Image / PDF",
  placeholder = "https://res.cloudinary.com/...",
  accept = "image/*,.pdf",
  helpText,
}: CloudinaryUploadProps) {
  const [uploading, setUploading] = useState(false);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "wasbvar9";
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to upload to Cloudinary");
      }

      const uploadedUrl = data.secure_url || data.url;
      onChange(uploadedUrl);
      toast.success("Uploaded to Cloudinary!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cloudinary upload failed");
    } finally {
      setUploading(false);
      e.target.value = ""; // Reset input
    }
  };

  const isPdf = value?.toLowerCase().endsWith(".pdf");
  const isImage = value && !isPdf && (value.startsWith("http") || value.startsWith("/"));

  return (
    <div className="space-y-2">
      {label && <label className="text-xs font-semibold block">{label}</label>}

      {/* Preview Card */}
      {value ? (
        <div className="relative group border border-border/80 rounded-lg p-3 bg-muted/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            {isImage ? (
              <div className="w-12 h-12 rounded border border-border overflow-hidden shrink-0 bg-background flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={value} alt="Preview" className="w-full h-full object-cover" />
              </div>
            ) : isPdf ? (
              <div className="w-12 h-12 rounded border border-red-500/30 bg-red-500/10 flex items-center justify-center shrink-0 text-red-500">
                <FileText className="w-6 h-6" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded border border-border bg-background flex items-center justify-center shrink-0 text-muted-foreground">
                <ImageIcon className="w-6 h-6" />
              </div>
            )}

            <div className="min-w-0 space-y-0.5">
              <p className="text-xs font-mono truncate text-foreground/90">{value}</p>
              <a
                href={value}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-primary hover:underline inline-flex items-center gap-1 font-medium"
              >
                View file <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
            onClick={() => onChange("")}
            title="Remove image"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : null}

      {/* Upload Controls */}
      <div className="flex items-center gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="text-xs font-mono"
        />

        <label className="shrink-0 cursor-pointer">
          <input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={uploading}
            className="pointer-events-none text-xs gap-1.5 shrink-0"
          >
            {uploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                Upload File
              </>
            )}
          </Button>
        </label>
      </div>
      <p className="text-[10px] text-muted-foreground">
        {helpText || "Upload certificate images (PNG, JPG, WebP) or PDF documents directly to Cloudinary."}
      </p>
    </div>
  );
}
