"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, MapPin, Mail, Award, BookOpen } from "lucide-react";
import { SiteConfig, Education } from "@prisma/client";

interface AboutProps {
  config: SiteConfig | null;
  educationList: Education[];
}

export function About({ config, educationList }: AboutProps) {
  const [solvedCount, setSolvedCount] = useState<number>(config?.leetcodeTotal ?? 393);

  useEffect(() => {
    async function fetchLatestStats() {
      try {
        const res = await fetch("/api/leetcode/heatmap");
        const json = await res.json();
        if (json.success && json.data?.solvedTotal) {
          setSolvedCount(json.data.solvedTotal);
        }
      } catch {
        // Fallback to initial config value
      }
    }
    fetchLatestStats();
  }, []);

  const aboutText =
    config?.aboutText ||
    "I am Kishore R, an Artificial Intelligence & Machine Learning engineer and final-year B.Tech student at Bannari Amman Institute of Technology. Focused on building production-ready AI systems across Machine Learning, Retrieval-Augmented Generation (RAG), Multimodal AI, and LLM orchestration. I combine strong DSA fundamentals with modern AI engineering practices to create systems that deliver real-world impact.";

  return (
    <section id="about" className="section-padding bg-card/20 relative border-t border-border/40">
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
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-6 space-y-6"
          >
            <Card className="border-border/70 bg-card/60 backdrop-blur-sm p-6 sm:p-8 space-y-6">
              {config?.avatarUrl && (
                <div className="flex items-center gap-4 pb-4 border-b border-border/60">
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-primary/40 shadow-md shrink-0 bg-muted">
                    <img
                      src={config.avatarUrl}
                      alt={config.name || "Kishore R"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-foreground truncate">
                      {config.name || "Kishore R"}
                    </h3>
                    <p className="text-xs text-primary font-medium truncate">
                      {config.headline || "AI/ML & Generative AI Engineer"}
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
              <Card className="border-border/70 bg-card/60 p-4 text-center">
                <p className="text-2xl font-bold text-gradient">8.33</p>
                <p className="text-xs text-muted-foreground mt-0.5">B.Tech CGPA</p>
              </Card>
              <Card className="border-border/70 bg-card/60 p-4 text-center">
                <p className="text-2xl font-bold text-gradient">{solvedCount}+</p>
                <p className="text-xs text-muted-foreground mt-0.5">LeetCode Solved</p>
              </Card>
            </div>
          </motion.div>


          {/* Education Timeline */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-6 space-y-4"
          >
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
              <GraduationCap className="w-5 h-5 text-primary" />
              Education Timeline
            </h3>

            <div className="space-y-4 relative before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-border/80">
              {educationList.map((edu, idx) => (
                <div key={edu.id} className="relative pl-8 space-y-1 group">
                  <span className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-primary ring-4 ring-background group-hover:scale-125 transition-transform" />
                  <Card className="border-border/70 bg-card/60 p-4 transition-all hover:border-primary/40">
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
          </motion.div>
        </div>
      </div>
    </section>
  );
}
