"use client";

import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { JourneyEntry } from "@/types";
import { GraduationCap, Cpu, Code2, Award, Shield } from "lucide-react";

interface JourneyProps {
  journeyEntries: JourneyEntry[];
}

export function Journey({ journeyEntries }: JourneyProps) {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "graduation-cap":
        return GraduationCap;
      case "cpu":
        return Cpu;
      case "code":
        return Code2;
      case "award":
        return Award;
      case "shield":
        return Shield;
      default:
        return Cpu;
    }
  };

  return (
    <section id="journey" className="section-padding bg-background relative border-t border-border/40">
      <div className="container-portfolio space-y-12">
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="outline" className="px-3 py-1 rounded-full text-xs font-mono">
            Milestones
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Learning & <span className="text-gradient">Building Journey</span>
          </h2>
          <p className="text-muted-foreground text-sm">
            Key milestones across B.Tech AI & ML education, Generative AI projects, DSA problem solving, and NCC.
          </p>
        </div>

        {/* Timeline Container */}
        <div className="max-w-3xl mx-auto relative before:absolute before:left-4 sm:before:left-1/2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/80">
          {journeyEntries.map((entry, idx) => {
            const Icon = getIcon(entry.icon);
            const isEven = idx % 2 === 0;

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className={`relative flex items-center mb-8 ${
                  isEven ? "sm:flex-row-reverse" : ""
                }`}
              >
                {/* Timeline node icon */}
                <div className="absolute left-4 sm:left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md z-10">
                  <Icon className="w-4 h-4" />
                </div>

                {/* Content Card */}
                <div className={`w-full pl-12 sm:pl-0 sm:w-1/2 ${isEven ? "sm:pr-10 sm:text-right" : "sm:pl-10"}`}>
                  <Card className="border-border/70 bg-card/60 backdrop-blur-sm p-5 space-y-2 hover:border-primary/40 transition-all">
                    <div className={`flex flex-col gap-1 ${isEven ? "sm:items-end" : ""}`}>
                      <Badge variant="secondary" className="w-fit text-[10px] font-mono px-2 py-0.5">
                        {entry.period}
                      </Badge>
                      <h3 className="font-bold text-base text-foreground mt-1">{entry.title}</h3>
                      <p className="text-xs font-semibold text-primary">{entry.organization}</p>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                      {entry.description}
                    </p>
                  </Card>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
