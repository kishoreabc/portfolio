"use client";

import { useState } from "react";
import { Certification } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Award,
  ExternalLink,
  Calendar,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  Download,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface CertificateModalProps {
  certification: Certification | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CertificateModal({
  certification,
  open,
  onOpenChange,
}: CertificateModalProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  if (!certification) return null;

  const certUrl = certification.imageUrl || certification.credentialUrl || "";
  const isPdf = Boolean(
    certUrl &&
      (certUrl.toLowerCase().endsWith(".pdf") ||
        certUrl.includes(".pdf?") ||
        certUrl.includes("/pdf/"))
  );
  const isImage = Boolean(
    certUrl &&
      !isPdf &&
      (certUrl.match(/\.(jpeg|jpg|png|webp|gif|svg)($|\?)/i) ||
        certUrl.includes("res.cloudinary.com") ||
        certUrl.includes("image/upload"))
  );

  const formattedDate = certification.issueDate
    ? new Date(certification.issueDate).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setIsZoomed(false);
      setLoadError(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-3xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl max-h-[94vh] overflow-y-auto p-4 sm:p-7 bg-card/95 backdrop-blur-md border border-border/80 shadow-2xl rounded-2xl">
        <DialogHeader className="space-y-3 pb-2 border-b border-border/40">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="text-xs px-2.5 py-0.5 border-amber-500/30 text-amber-400 bg-amber-500/10 font-medium"
            >
              <Award className="w-3.5 h-3.5 mr-1 text-amber-500" />
              {certification.issuer}
            </Badge>

            {formattedDate && (
              <Badge
                variant="secondary"
                className="text-xs px-2.5 py-0.5 font-mono text-muted-foreground gap-1"
              >
                <Calendar className="w-3 h-3" />
                {formattedDate}
              </Badge>
            )}

            {certification.credentialId && (
              <Badge
                variant="outline"
                className="text-xs px-2.5 py-0.5 border-emerald-500/30 text-emerald-400 bg-emerald-500/10 font-mono gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                ID: {certification.credentialId}
              </Badge>
            )}
          </div>

          <div>
            <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {certification.title}
            </DialogTitle>
            {certification.description && (
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                {certification.description}
              </DialogDescription>
            )}
          </div>
        </DialogHeader>

        {/* Certificate Display Area */}
        <div className="py-4 space-y-3">
          {certUrl ? (
            <div className="relative rounded-xl border border-border/70 bg-black/40 overflow-hidden min-h-[320px] flex items-center justify-center">
              {/* Floating Toolbar for Image Zoom / Fullscreen */}
              {isImage && !loadError && (
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-background/80 backdrop-blur-md p-1 rounded-lg border border-border/60 shadow-md">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setIsZoomed(!isZoomed)}
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    title={isZoomed ? "Zoom Out" : "Zoom In"}
                  >
                    {isZoomed ? <ZoomOut className="w-3.5 h-3.5" /> : <ZoomIn className="w-3.5 h-3.5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    title="Open Full Image"
                    render={<a href={certUrl} target="_blank" rel="noreferrer" />}
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}

              {/* Image Display */}
              {isImage ? (
                <div
                  className={`w-full overflow-auto flex items-center justify-center p-2 sm:p-4 transition-all duration-300 ${
                    isZoomed ? "cursor-zoom-out max-h-[82vh]" : "cursor-zoom-in max-h-[72vh]"
                  }`}
                  onClick={() => setIsZoomed(!isZoomed)}
                >
                  {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-xs">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                  )}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={certUrl}
                    alt={`${certification.title} Certificate`}
                    onLoad={() => setLoading(false)}
                    onError={() => {
                      setLoading(false);
                      setLoadError(true);
                    }}
                    className={`rounded-lg object-contain transition-all duration-300 shadow-2xl ${
                      isZoomed
                        ? "w-full min-w-[120%] sm:min-w-[135%] max-w-none scale-100"
                        : "max-h-[68vh] sm:max-h-[72vh] w-auto max-w-full"
                    }`}
                  />
                </div>
              ) : isPdf ? (
                /* PDF Viewer */
                <div className="w-full h-[65vh] flex flex-col">
                  <iframe
                    src={`${certUrl}#toolbar=0`}
                    title={`${certification.title} PDF Certificate`}
                    className="w-full flex-1 rounded-lg border-0 bg-background"
                  />
                </div>
              ) : (
                /* External Web Certificate Viewer (e.g. NPTEL verification portal) */
                <div className="w-full h-[65vh] flex flex-col">
                  <iframe
                    src={certUrl}
                    title={`${certification.title} Certificate Portal`}
                    className="w-full flex-1 rounded-lg border-0 bg-background"
                    allowFullScreen
                  />
                  <div className="p-2 bg-muted/40 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between">
                    <span>Embedded credential preview from issuer portal</span>
                    <a
                      href={certUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 font-medium"
                    >
                      Open in New Tab <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}

              {/* Load error fallback */}
              {loadError && (
                <div className="p-8 text-center space-y-3">
                  <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
                  <p className="text-sm font-medium text-foreground">
                    Unable to preview certificate directly
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    The document can be viewed directly in a new tab via the original link below.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full gap-2 text-xs"
                    render={<a href={certUrl} target="_blank" rel="noreferrer" />}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Certificate
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center border border-dashed border-border rounded-xl space-y-2">
              <FileText className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">No certificate file or link attached</p>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="pt-3 border-t border-border/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {certification.credentialId && (
              <span className="font-mono text-[11px] bg-accent/50 px-2 py-1 rounded">
                Ref: {certification.credentialId}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {certUrl && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5 rounded-full border-border/80"
                render={<a href={certUrl} target="_blank" rel="noreferrer" />}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Full Screen
              </Button>
            )}

            {certification.credentialUrl && certification.credentialUrl !== certUrl && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5 rounded-full border-primary/30 text-primary hover:text-primary"
                render={<a href={certification.credentialUrl} target="_blank" rel="noreferrer" />}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Verify Online
              </Button>
            )}

            <Button
              variant="default"
              size="sm"
              onClick={() => handleOpenChange(false)}
              className="text-xs rounded-full px-4"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
