"use client";

import { useState, useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Certification } from "@prisma/client";
import { Award, ExternalLink, Calendar, ShieldCheck, Eye, ArrowUpRight } from "lucide-react";
import { CertificateModal } from "@/components/public/CertificateModal";

interface CertificationsProps {
  certifications: Certification[];
}

export function Certifications({ certifications }: CertificationsProps) {
  const [selectedCert, setSelectedCert] = useState<Certification | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // As user scrolls past certifications, smooth swipe-right exit transition toward blogs
  const exitX = useTransform(scrollYProgress, [0.7, 1], [0, 60]);
  const exitOpacity = useTransform(scrollYProgress, [0.75, 1], [1, 0.7]);

  const publishedCerts = certifications.filter((c) => c.published);

  const handleOpenModal = (cert: Certification) => {
    setSelectedCert(cert);
    setModalOpen(true);
  };

  return (
    <section
      ref={sectionRef}
      id="certifications"
      className="section-padding bg-background relative border-t border-border/40 overflow-hidden"
    >
      <motion.div style={{ x: exitX, opacity: exitOpacity }} className="container-portfolio space-y-12">
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
              initial={{ opacity: 0, y: 30, x: idx % 2 === 0 ? -25 : 25 }}
              whileInView={{ opacity: 1, y: 0, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, delay: idx * 0.1, ease: [0.25, 1, 0.5, 1] }}
              className="flex"
            >
              <Card className="border-border/70 bg-card/60 backdrop-blur-sm h-full hover:border-primary/50 hover:shadow-lg transition-all p-6 flex flex-col justify-between space-y-4 w-full overflow-hidden min-w-0">
                <div className="space-y-4 min-w-0">
                  {/* Card Top: Award Icon + Actions */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                      <Award className="w-6 h-6" />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {(cert.imageUrl || cert.credentialUrl) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenModal(cert)}
                          className="h-7 text-xs px-2.5 rounded-full border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary hover:text-primary gap-1.5 font-medium transition-all shadow-xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Certificate
                        </Button>
                      )}

                      {cert.credentialUrl && (
                        <a
                          href={cert.credentialUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 font-medium px-1.5 py-0.5 hover:underline"
                          title="Verify credential online"
                        >
                          Verify <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Title & Issuer */}
                  <div className="space-y-1 min-w-0">
                    <h3 className="font-bold text-lg text-foreground break-words leading-snug">
                      {cert.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      <span className="font-medium text-foreground/80">{cert.issuer}</span>
                      {cert.issueDate && (
                        <span className="flex items-center gap-1 font-mono">
                          • <Calendar className="w-3 h-3" />
                          {new Date(cert.issueDate).getFullYear()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {cert.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed break-words line-clamp-4 hover:line-clamp-none transition-all">
                      {cert.description}
                    </p>
                  )}
                </div>

                {/* Footer / ID section */}
                <div className="pt-3 border-t border-border/50 flex items-center justify-between gap-2 text-[11px] font-mono text-muted-foreground mt-auto">
                  {cert.credentialId ? (
                    <div className="flex items-center gap-1.5 truncate">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">ID: {cert.credentialId}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-muted-foreground/70">
                      <Award className="w-3.5 h-3.5 text-amber-500/70 shrink-0" />
                      Verified Credential
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Certificate Modal */}
      <CertificateModal
        certification={selectedCert}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </section>
  );
}
