"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, MapPin, Mail } from "lucide-react";
import { SiteConfig, Education } from "@prisma/client";

interface AboutProps {
  config: SiteConfig | null;
  educationList: Education[];
  initialSolvedCount?: number;
}

export function About({ config, educationList, initialSolvedCount }: AboutProps) {
  const [solvedCount, setSolvedCount] = useState<number>(
    initialSolvedCount ?? config?.leetcodeTotal ?? 0
  );

  useEffect(() => {
    if (initialSolvedCount !== undefined) return;
    async function fetchLatestStats() {
      try {
        const res = await fetch("/api/leetcode/heatmap");
        const json = await res.json();
        if (json.success && json.data?.solvedTotal) {
          setSolvedCount(json.data.solvedTotal);
        }
      } catch {
        // Keep initial config value
      }
    }
    fetchLatestStats();
  }, [initialSolvedCount]);

  const aboutText = config?.aboutText || "";

  return (
    <section id="about" className="section-padding bg-card/20 relative border-t border-border/40 overflow-hidden">
      <div className="container-portfolio space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="outline" className="px-3.5 py-1 rounded-full text-xs font-mono border-primary/30 text-primary">
            About Kishore R
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Engineering <span className="text-gradient">AI with Purpose</span>
          </h2>
          <p className="text-muted-foreground text-sm">
            Bridging fundamental Data Structures & Algorithms with modern Generative AI engineering.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-12 items-start">
          {/* Personal Bio Card */}
          <div className="lg:col-span-6 space-y-6 scroll-reveal" data-delay="1">
            <Card className="card-glow-border border-border/70 bg-card/90 p-6 sm:p-8 space-y-6 hover:border-primary/40 hover:shadow-xl transition-all duration-300">
              {config?.avatarUrl && (
                <div className="flex items-center gap-4 pb-4 border-b border-border/60">
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-primary/40 shadow-md shrink-0 bg-muted group">
                    <img
                      src={config.avatarUrl}
                      alt={config.name || "Kishore R"}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-foreground truncate">
                      {config.name || "Kishore R"}
                    </h3>
                    <p className="text-xs text-primary font-medium truncate">
                      {config.headline || "Aspiring AI/ML & Generative AI Engineer"}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {config.location || "Salem, Tamil Nadu, India"}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-4 text-foreground/90 text-sm leading-relaxed whitespace-pre-line">
                {aboutText}
              </div>

              <div className="pt-4 border-t border-border/60 grid grid-cols-2 gap-4 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <span>{config?.location ?? "Salem, Tamil Nadu, India"}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <a href={`mailto:${config?.contactEmail}`} className="hover:text-foreground truncate">
                    {config?.contactEmail ?? "Kishorehp134@gmail.com"}
                  </a>
                </div>
              </div>
            </Card>

            {/* Core Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="card-glow-border border-border/70 bg-card/90 p-4 text-center hover:-translate-y-1.5 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 group">
                <p className="text-2xl font-bold text-gradient group-hover:scale-105 transition-transform">8.33</p>
                <p className="text-xs text-muted-foreground mt-0.5">B.Tech CGPA</p>
              </Card>
              <Card className="card-glow-border border-border/70 bg-card/90 p-4 text-center hover:-translate-y-1.5 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 group">
                <p className="text-2xl font-bold text-gradient group-hover:scale-105 transition-transform">{solvedCount}+</p>
                <p className="text-xs text-muted-foreground mt-0.5">LeetCode Solved</p>
              </Card>
            </div>
          </div>

          {/* Education Timeline */}
          <div className="lg:col-span-6 space-y-4 scroll-reveal" data-delay="2">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
              <GraduationCap className="w-5 h-5 text-primary" />
              Education Timeline
            </h3>

            <div className="space-y-4 relative before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-border/80">
              {educationList.map((edu) => (
                <div key={edu.id} className="relative pl-8 space-y-1 group">
                  <span className="absolute left-1.5 top-2 flex h-3 w-3 items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary ring-2 ring-background group-hover:scale-125 transition-transform duration-300" />
                  </span>
                  <Card className="card-glow-border border-border/70 bg-card/90 p-4 transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:-translate-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-sm text-foreground">{edu.institution}</h4>
                        <p className="text-xs text-primary font-medium">{edu.degree} {edu.field ? `— ${edu.field}` : ""}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] shrink-0 font-mono">
                        {edu.score}
                      </Badge>
                    </div>

                    <p className="text-[11px] text-muted-foreground mt-2 font-mono">
                      {edu.startDate ? new Date(edu.startDate).getFullYear() : ""} –{" "}
                      {edu.endDate ? new Date(edu.endDate).getFullYear() : "Present"}
                    </p>

                    {edu.description && (
                      <p className="text-xs text-muted-foreground mt-1.5">{edu.description}</p>
                    )}
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
