"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Code2, ExternalLink, Flame, Trophy, CheckCircle2 } from "lucide-react";
import { SiteConfig } from "@prisma/client";
import { GitHubHeatmapData, LeetCodeHeatmapData } from "@/types";

interface CodingSectionProps {
  config: SiteConfig | null;
  githubHeatmap: GitHubHeatmapData | null;
}

export function CodingSection({ config, githubHeatmap }: CodingSectionProps) {
  const [lcHeatmap, setLcHeatmap] = useState<LeetCodeHeatmapData | null>(null);
  const [lcLoading, setLcLoading] = useState(true);

  const totalLeetCode = config?.leetcodeTotal ?? 380;
  const leetcodeUrl = "https://leetcode.com/u/KISHORE-R/";

  useEffect(() => {
    async function fetchLeetCodeData() {
      try {
        const res = await fetch("/api/leetcode/heatmap");
        const json = await res.json();
        if (json.success && json.data) {
          setLcHeatmap(json.data);
        }
      } catch {
        // Fallback gracefully to manual stats
      } finally {
        setLcLoading(false);
      }
    }
    fetchLeetCodeData();
  }, []);

  return (
    <section id="coding" className="section-padding bg-card/20 relative border-t border-border/40">
      <div className="container-portfolio space-y-12">
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="outline" className="px-3 py-1 rounded-full text-xs font-mono">
            Problem Solving & Open Source
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            LeetCode & <span className="text-gradient">Activity Heatmaps</span>
          </h2>
          <p className="text-muted-foreground text-sm">
            Algorithmic problem solving and consistent open-source contribution activity.
          </p>
        </div>

        {/* LeetCode Main Metrics Card */}
        <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
          <Card className="border-border/70 bg-card/60 p-6 text-center space-y-2">
            <div className="mx-auto w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Trophy className="w-5 h-5" />
            </div>
            <p className="text-3xl font-extrabold text-gradient">{totalLeetCode}+</p>
            <p className="text-xs text-muted-foreground font-medium">LeetCode Problems Solved</p>
          </Card>

          <Card className="border-border/70 bg-card/60 p-6 text-center space-y-2">
            <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Code2 className="w-5 h-5" />
            </div>
            <p className="text-3xl font-extrabold text-foreground">
              {githubHeatmap?.totalContributions ?? "800+"}
            </p>
            <p className="text-xs text-muted-foreground font-medium">GitHub Contributions (Year)</p>
          </Card>

          <Card className="border-border/70 bg-card/60 p-6 text-center space-y-2">
            <div className="mx-auto w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Flame className="w-5 h-5" />
            </div>
            <p className="text-3xl font-extrabold text-emerald-500">DSA</p>
            <p className="text-xs text-muted-foreground font-medium">Core Focus Area</p>
          </Card>
        </div>

        {/* Heatmaps Container — Linear full-width order */}
        <div className="space-y-8 max-w-5xl mx-auto">
          {/* GitHub Heatmap Card */}
          <Card className="border-border/70 bg-card/60 backdrop-blur-sm p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 fill-current text-foreground" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <h3 className="font-bold text-sm">GitHub Contributions</h3>
              </div>
              <a
                href="https://github.com/Kishoreabc"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1 font-mono"
              >
                @Kishoreabc <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {githubHeatmap ? (
              <div className="space-y-3 pt-1">
                <div className="overflow-x-auto pb-2">
                  <div className="inline-block min-w-full">
                    {/* Month labels header */}
                    <div className="relative h-4 mb-1.5 text-[10px] text-muted-foreground font-mono select-none">
                      {(() => {
                        let lastMonth = "";
                        return githubHeatmap.weeks.map((week, idx) => {
                          const firstDay = week.contributionDays[0];
                          if (!firstDay) return null;
                          const m = new Date(firstDay.date).toLocaleString("en-US", {
                            month: "short",
                            timeZone: "UTC",
                          });
                          if (m !== lastMonth) {
                            lastMonth = m;
                            return (
                              <span
                                key={idx}
                                className="absolute"
                                style={{ left: `calc(1.75rem + ${idx * 14}px)` }}
                              >
                                {m}
                              </span>
                            );
                          }
                          return null;
                        });
                      })()}
                    </div>

                    {/* Heatmap grid: Left day labels + Weekly flex columns */}
                    <div className="flex items-start">
                      <div className="flex flex-col justify-between text-[9px] text-muted-foreground font-mono pr-2 py-0.5 select-none w-7 shrink-0 h-[95px]">
                        <span className="opacity-0">Sun</span>
                        <span>Mon</span>
                        <span className="opacity-0">Tue</span>
                        <span>Wed</span>
                        <span className="opacity-0">Thu</span>
                        <span>Fri</span>
                        <span className="opacity-0">Sat</span>
                      </div>

                      <div className="flex gap-[3px]">
                        {githubHeatmap.weeks.map((week, wIdx) => (
                          <div key={wIdx} className="flex flex-col gap-[3px] shrink-0">
                            {week.contributionDays.map((day, dIdx) => {
                              let level = 0;
                              if (day.contributionCount > 0) level = 1;
                              if (day.contributionCount > 3) level = 2;
                              if (day.contributionCount > 6) level = 3;
                              if (day.contributionCount > 10) level = 4;

                              return (
                                <div
                                  key={`${wIdx}-${dIdx}`}
                                  className={`w-[11px] h-[11px] rounded-[2px] heatmap-level-${level} transition-transform hover:scale-125`}
                                  title={`${day.date}: ${day.contributionCount} contributions`}
                                />
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Legend */}
                <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground font-mono pt-1">
                  <span>{githubHeatmap.totalContributions} contributions in the past year</span>
                  <div className="flex items-center gap-1">
                    <span>Less</span>
                    <span className="w-[10px] h-[10px] rounded-[2px] heatmap-level-0" />
                    <span className="w-[10px] h-[10px] rounded-[2px] heatmap-level-1" />
                    <span className="w-[10px] h-[10px] rounded-[2px] heatmap-level-2" />
                    <span className="w-[10px] h-[10px] rounded-[2px] heatmap-level-3" />
                    <span className="w-[10px] h-[10px] rounded-[2px] heatmap-level-4" />
                    <span>More</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-muted-foreground">
                GitHub activity synced live via GraphQL API.
              </div>
            )}
          </Card>

          {/* LeetCode Heatmap Card */}
          <Card className="border-border/70 bg-card/60 backdrop-blur-sm p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-sm">LeetCode Submissions</h3>
              </div>
              <a
                href={leetcodeUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1 font-mono"
              >
                @KISHORE-R <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {lcLoading ? (
              <div className="text-center py-8 text-xs text-muted-foreground animate-pulse">
                Loading LeetCode submission activity...
              </div>
            ) : lcHeatmap && lcHeatmap.days.length > 0 ? (
              <div className="space-y-3 pt-1">
                {/* Stats summary row */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-muted-foreground pb-1">
                  <span className="font-semibold text-foreground">
                    {lcHeatmap.totalSubmissions} submissions in the past one year
                  </span>
                  <div className="flex items-center gap-4">
                    <span>Total active days: <strong className="text-foreground">{lcHeatmap.activeDays}</strong></span>
                    {typeof lcHeatmap.streak === "number" && lcHeatmap.streak > 0 && (
                      <span>Max streak: <strong className="text-emerald-500">{lcHeatmap.streak}</strong></span>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto pb-2">
                  <div className="inline-block min-w-full">
                    {/* Month labels header */}
                    <div className="relative h-4 mb-1.5 text-[10px] text-muted-foreground font-mono select-none">
                      {(() => {
                        const lcWeeks: LeetCodeDay[][] = [];
                        for (let i = 0; i < lcHeatmap.days.length; i += 7) {
                          lcWeeks.push(lcHeatmap.days.slice(i, i + 7));
                        }
                        let lastMonth = "";
                        return lcWeeks.map((week, idx) => {
                          const firstDay = week[0];
                          if (!firstDay) return null;
                          const m = new Date(firstDay.date).toLocaleString("en-US", {
                            month: "short",
                            timeZone: "UTC",
                          });
                          if (m !== lastMonth) {
                            lastMonth = m;
                            return (
                              <span
                                key={idx}
                                className="absolute"
                                style={{ left: `calc(1.75rem + ${idx * 14}px)` }}
                              >
                                {m}
                              </span>
                            );
                          }
                          return null;
                        });
                      })()}
                    </div>

                    {/* Heatmap grid: Left day labels + Weekly flex columns */}
                    <div className="flex items-start">
                      <div className="flex flex-col justify-between text-[9px] text-muted-foreground font-mono pr-2 py-0.5 select-none w-7 shrink-0 h-[95px]">
                        <span className="opacity-0">Sun</span>
                        <span>Mon</span>
                        <span className="opacity-0">Tue</span>
                        <span>Wed</span>
                        <span className="opacity-0">Thu</span>
                        <span>Fri</span>
                        <span className="opacity-0">Sat</span>
                      </div>

                      <div className="flex gap-[3px]">
                        {(() => {
                          const lcWeeks: LeetCodeDay[][] = [];
                          for (let i = 0; i < lcHeatmap.days.length; i += 7) {
                            lcWeeks.push(lcHeatmap.days.slice(i, i + 7));
                          }
                          return lcWeeks.map((week, wIdx) => (
                            <div key={wIdx} className="flex flex-col gap-[3px] shrink-0">
                              {week.map((day, dIdx) => {
                                let level = 0;
                                if (day.count > 0) level = 1;
                                if (day.count > 2) level = 2;
                                if (day.count > 4) level = 3;
                                if (day.count > 7) level = 4;

                                return (
                                  <div
                                    key={`${wIdx}-${dIdx}`}
                                    className={`w-[11px] h-[11px] rounded-[2px] lc-heatmap-level-${level} transition-transform hover:scale-125`}
                                    title={`${day.date}: ${day.count} submissions`}
                                  />
                                );
                              })}
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Legend */}
                <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground font-mono pt-1">
                  <span>@{process.env.NEXT_PUBLIC_LEETCODE_USERNAME ?? "KISHORE-R"} on LeetCode</span>
                  <div className="flex items-center gap-1">
                    <span>Less</span>
                    <span className="w-[10px] h-[10px] rounded-[2px] lc-heatmap-level-0" />
                    <span className="w-[10px] h-[10px] rounded-[2px] lc-heatmap-level-1" />
                    <span className="w-[10px] h-[10px] rounded-[2px] lc-heatmap-level-2" />
                    <span className="w-[10px] h-[10px] rounded-[2px] lc-heatmap-level-3" />
                    <span className="w-[10px] h-[10px] rounded-[2px] lc-heatmap-level-4" />
                    <span>More</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 py-4 text-center">
                <p className="text-xs text-muted-foreground">
                  380+ problem solutions verified on LeetCode profile.
                </p>
                <Button size="sm" variant="outline" className="rounded-full text-xs" render={<a href={leetcodeUrl} target="_blank" rel="noreferrer" />}>
                  View LeetCode Profile
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}

