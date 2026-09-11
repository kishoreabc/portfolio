"use client";

import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skill } from "@prisma/client";
import { Cpu, Code, Database, Wrench } from "lucide-react";

interface SkillsProps {
  skills: Skill[];
}

export function Skills({ skills }: SkillsProps) {
  const categories = [
    { title: "AI / ML & Generative AI", icon: Cpu, categoryKey: "AI/ML" },
    { title: "Programming Languages", icon: Code, categoryKey: "Programming" },
    { title: "Databases & Vector Stores", icon: Database, categoryKey: "Databases" },
    { title: "AI Tools & Frameworks", icon: Wrench, categoryKey: "Tools" },
  ];

  return (
    <section id="skills" className="section-padding bg-background relative overflow-hidden">
      <div className="container-portfolio space-y-12">
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="outline" className="px-3 py-1 rounded-full text-xs font-mono">
            Technical Stack
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Skills & <span className="text-gradient">Technologies</span>
          </h2>
          <p className="text-muted-foreground text-sm">
            Core stack powering my intelligent systems, machine learning models, and RAG pipelines.
          </p>
        </div>

        {/* Category Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            const catSkills = skills.filter((s) => s.category === cat.categoryKey && s.published);

            return (
              <motion.div
                key={cat.categoryKey}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
              >
                <Card className="border-border/70 bg-card/60 backdrop-blur-sm h-full hover:border-primary/40 transition-all shadow-xs">
                  <CardHeader className="flex flex-row items-center gap-3 pb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">{cat.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {catSkills.map((skill) => (
                        <Badge
                          key={skill.id}
                          variant="secondary"
                          className="px-3 py-1.5 text-xs font-medium bg-accent/60 hover:bg-primary hover:text-primary-foreground transition-all cursor-default shadow-xs"
                        >
                          {skill.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
