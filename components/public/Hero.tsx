"use client";

import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, FileText, Sparkles, Code2, Mail, ExternalLink } from "lucide-react";
import { SiteConfig, SocialLink } from "@prisma/client";

interface HeroProps {
  config: SiteConfig | null;
  socialLinks: SocialLink[];
}

export function Hero({ config, socialLinks }: HeroProps) {
  const heroTitle = config?.heroTitle ?? "Building Intelligent Systems That Solve Real Problems.";
  const heroSubtitle =
    config?.heroSubtitle ??
    "AI/ML & Generative AI Engineer focused on building intelligent, multimodal and production-oriented AI systems.";
  const availability = config?.availabilityStatus ?? "Open to opportunities";
  const resumeUrl = config?.resumeUrl;
  const renderSocialIcon = (link: SocialLink) => {
    const platform = link.platform.toLowerCase();
    const slug = (link.iconSlug ?? "").toLowerCase();

    if (platform === "github" || slug === "github") {
      return (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
      );
    }

    if (platform === "linkedin" || slug === "linkedin") {
      return (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
        </svg>
      );
    }

    if (platform === "leetcode" || slug === "code" || slug === "leetcode") {
      return <Code2 className="w-4 h-4" />;
    }

    if (
      platform === "email" ||
      platform === "mail" ||
      slug === "mail" ||
      slug === "email" ||
      link.url.startsWith("mailto:")
    ) {
      return <Mail className="w-4 h-4" />;
    }

    if (platform === "twitter" || platform === "x" || slug === "twitter" || slug === "x") {
      return (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    }

    return <ExternalLink className="w-4 h-4" />;
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-28 pb-16 overflow-hidden bg-grid">
      {/* Background glowing gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="container-portfolio relative z-10 text-center space-y-8 max-w-4xl">
        {/* Availability Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center"
        >
          <Badge
            variant="outline"
            className="px-3.5 py-1.5 rounded-full border-primary/30 bg-primary/5 backdrop-blur-sm text-xs font-medium text-foreground gap-2 shadow-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            {availability}
          </Badge>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.15] text-foreground"
        >
          Building <span className="text-gradient">Intelligent Systems</span> That Solve Real Problems.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
        >
          {heroSubtitle}
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4 pt-2"
        >
          <Button size="lg" className="rounded-full px-7 shadow-md gap-2" render={<a href="#projects" />}>
            <Sparkles className="w-4 h-4" />
            View Projects
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="rounded-full px-7 border-border/80 gap-2"
            render={<a href="#contact" />}
          >
            Contact Me
          </Button>

          {resumeUrl && (
            <Button
              size="lg"
              variant="secondary"
              className="rounded-full px-6 gap-2"
              render={<a href={resumeUrl} target="_blank" rel="noreferrer" />}
            >
              <FileText className="w-4 h-4" />
              Resume
            </Button>
          )}
        </motion.div>

        {/* Social Icons Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex items-center justify-center gap-4 pt-6"
        >
          {socialLinks.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="w-10 h-10 rounded-full border border-border/60 bg-card/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 hover:scale-110 transition-all shadow-xs"
              title={link.platform}
            >
              {renderSocialIcon(link)}
            </a>
          ))}
        </motion.div>

        {/* Scroll indicator */}
        <div className="pt-10 flex justify-center">
          <a href="#about" aria-label="Scroll down">
            <ArrowDown className="w-5 h-5 text-muted-foreground animate-bounce" />
          </a>
        </div>
      </div>
    </section>
  );
}
