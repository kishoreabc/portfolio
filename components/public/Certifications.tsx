"use client";

import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Certification } from "@prisma/client";
import { Award, ExternalLink, Calendar, ShieldCheck } from "lucide-react";

interface CertificationsProps {
  certifications: Certification[];
}

export function Certifications({ certifications }: CertificationsProps) {
  const publishedCerts = certifications.filter((c) => c.published);

  return (
    <section id="certifications" className="section-padding bg-background relative border-t border-border/40">
      <div className="container-portfolio space-y-12">
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="outline" className="px-3 py-1 rounded-full text-xs font-mono">
            Credentials
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Achievements & <span className="text-gradient">Certifications</span>
          </h2>
          <p className="text-muted-foreground text-sm">
            Recognized technical certifications and verified academic excellence.
          </p>
        </div>

        {/* Certifications Grid */}
        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          {publishedCerts.map((cert, idx) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
            >
              <Card className="border-border/70 bg-card/60 backdrop-blur-sm h-full hover:border-primary/50 transition-all p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                    <Award className="w-6 h-6" />
                  </div>
                  {cert.credentialUrl && (
                    <a
                      href={cert.credentialUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                    >
                      Verify <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-foreground">{cert.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground/80">{cert.issuer}</span>
                    {cert.issueDate && (
                      <span className="flex items-center gap-1 font-mono">
                        • <Calendar className="w-3 h-3" />
                        {new Date(cert.issueDate).getFullYear()}
                      </span>
                    )}
                  </div>
                </div>

                {cert.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {cert.description}
                  </p>
                )}

                {cert.credentialId && (
                  <div className="pt-3 border-t border-border/50 text-[11px] font-mono text-muted-foreground flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ID: {cert.credentialId}
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
