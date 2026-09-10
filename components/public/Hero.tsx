"use client";

import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, ArrowRight, FileText, Sparkles, Code2, Mail, ExternalLink } from "lucide-react";
import { SiteConfig, SocialLink } from "@prisma/client";

interface HeroProps {
  config: SiteConfig | null;
  socialLinks: SocialLink[];
}

export function Hero({ config, socialLinks }: HeroProps) {

  const heroSubtitle =
    config?.heroSubtitle ??
    "Aspiring AI/ML & Generative AI Engineer focused on building intelligent, multimodal and production-oriented AI systems.";
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

  const imageStyle = config?.heroImageStyle || "split";
  const avatarUrl = config?.avatarUrl || "";
  const hasAvatar = Boolean(avatarUrl);
  const name = config?.name || "Kishore R";


  const githubLink =
    socialLinks.find(
      (l) => l.platform.toLowerCase() === "github" || (l.iconSlug ?? "").toLowerCase() === "github"
    )?.url;

  const linkedinLink =
    socialLinks.find(
      (l) => l.platform.toLowerCase() === "linkedin" || (l.iconSlug ?? "").toLowerCase() === "linkedin"
    )?.url;

  const leetcodeLink =
    socialLinks.find(
      (l) =>
        l.platform.toLowerCase() === "leetcode" ||
        (l.iconSlug ?? "").toLowerCase() === "leetcode" ||
        (l.iconSlug ?? "").toLowerCase() === "code"
    )?.url;

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-28 pb-16 overflow-hidden bg-grid">
      {/* Background glowing gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* ─── SIDE-BY-SIDE (SPLIT) LAYOUT (DEFAULT WITH AVATAR) ─── */}
      {hasAvatar && imageStyle === "split" ? (
        <div className="container-portfolio relative z-10 max-w-6xl w-full">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Column: Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Availability Badge & Direct "View Projects" Prompt */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-wrap items-center justify-center lg:justify-start gap-3"
              >
                <Badge
                  variant="outline"
                  className="px-3.5 py-1.5 rounded-full border-primary/30 bg-primary/5 backdrop-blur-sm text-xs font-medium text-foreground gap-2 shadow-xs"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  {availability}
                </Badge>

                {/* Direct "View Projects" prompt beside opening message */}
                <a
                  href="#projects"
                  className="group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-primary/40 bg-primary/10 hover:bg-primary hover:text-primary-foreground backdrop-blur-sm text-xs font-semibold text-primary transition-all shadow-xs hover:shadow-md cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-primary group-hover:text-primary-foreground transition-colors" />
                  <span>View Projects</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </a>
              </motion.div>

              {/* Headline & Greeting */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="space-y-3"
              >
                <p className="text-sm sm:text-base font-semibold text-primary font-mono tracking-wide uppercase flex items-center justify-center lg:justify-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Hi, I&apos;m Kishore R</span>
                </p>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.12] text-foreground">
                  Building <span className="text-gradient">Intelligent Systems</span> That Solve Real Problems.
                </h1>
              </motion.div>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed"
              >
                {heroSubtitle}
              </motion.p>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-1"
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
                className="flex items-center justify-center lg:justify-start gap-3.5 pt-3"
              >
                {socialLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-9 h-9 rounded-full border border-border/60 bg-card/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 hover:scale-110 transition-all shadow-xs"
                    title={link.platform}
                  >
                    {renderSocialIcon(link)}
                  </a>
                ))}
              </motion.div>
            </div>

            {/* Right Column: Modern Tech Showcase with Floating Glass Badges */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-5 flex justify-center lg:justify-end"
            >
              <div className="relative w-full max-w-xs sm:max-w-sm flex items-center justify-center py-6">
                {/* Ambient Multidimensional Glow Aura */}
                <div className="absolute w-64 h-64 sm:w-72 sm:h-72 rounded-full bg-gradient-to-tr from-primary/35 via-blue-500/25 to-purple-600/30 blur-3xl opacity-80 pointer-events-none" />

                {/* Subtle Decorative Orbital Ring */}
                <div className="absolute w-[290px] h-[290px] sm:w-[330px] sm:h-[330px] rounded-full border border-primary/20 dark:border-white/10 pointer-events-none" />

                {/* Central Studio Portrait with Gradient Halo */}
                <div className="relative group cursor-pointer">
                  {/* Glowing Animated Ring */}
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-primary via-blue-500 to-purple-600 opacity-70 blur-sm group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Portrait Image Frame */}
                  <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full overflow-hidden border-2 border-background shadow-2xl bg-muted/30">
                    <img
                      src={avatarUrl}
                      alt={name}
                      className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                </div>

                {/* Floating Badge 1: GitHub (Top-Left) */}
                {githubLink && (
                  <motion.div
                    initial={{ opacity: 0, x: -15, y: -10 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.5 }}
                    className="absolute top-2 -left-2 sm:-left-6 z-20"
                  >
                    <a
                      href={githubLink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 rounded-full bg-background/90 dark:bg-card/90 backdrop-blur-md border border-border/80 shadow-lg flex items-center gap-2 text-xs font-semibold hover:border-primary/60 hover:scale-105 transition-all text-foreground group/pill"
                      title="GitHub Profile"
                    >
                      <svg className="w-4 h-4 fill-current group-hover/pill:text-primary transition-colors" viewBox="0 0 24 24">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                      <span>GitHub</span>
                    </a>
                  </motion.div>
                )}

                {/* Floating Badge 2: LinkedIn (Top-Right) */}
                {linkedinLink && (
                  <motion.div
                    initial={{ opacity: 0, x: 15, y: -10 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.5 }}
                    className="absolute top-2 -right-2 sm:-right-6 z-20"
                  >
                    <a
                      href={linkedinLink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 rounded-full bg-background/90 dark:bg-card/90 backdrop-blur-md border border-border/80 shadow-lg flex items-center gap-2 text-xs font-semibold hover:border-blue-500/60 hover:scale-105 transition-all text-foreground group/pill"
                      title="LinkedIn Profile"
                    >
                      <svg className="w-4 h-4 fill-current text-[#0A66C2]" viewBox="0 0 24 24">
                        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                      </svg>
                      <span>LinkedIn</span>
                    </a>
                  </motion.div>
                )}

                {/* Floating Badge 3: LeetCode (Bottom-Center) */}
                {leetcodeLink && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45, duration: 0.5 }}
                    className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20"
                  >
                    <a
                      href={leetcodeLink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 rounded-full bg-background/90 dark:bg-card/90 backdrop-blur-md border border-border/80 shadow-lg flex items-center gap-2 text-xs font-semibold hover:border-amber-500/60 hover:scale-105 transition-all text-foreground group/pill whitespace-nowrap"
                      title="LeetCode Profile"
                    >
                      <Code2 className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>LeetCode</span>

                    </a>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <div className="pt-12 flex justify-center">
            <a href="#about" aria-label="Scroll down">
              <ArrowDown className="w-5 h-5 text-muted-foreground animate-bounce" />
            </a>
          </div>
        </div>
      ) : (
        /* ─── CENTERED LAYOUT (OR WHEN IMAGE STYLE IS CENTERED / HIDDEN) ─── */
        <div className="container-portfolio relative z-10 text-center space-y-8 max-w-4xl">
          {/* Centered Avatar (when style is centered) */}
          {hasAvatar && imageStyle === "centered" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center"
            >
              <div className="relative group cursor-pointer">
                <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-primary via-blue-500 to-purple-600 opacity-60 blur-md group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
                <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden border-3 border-black dark:border-white shadow-2xl ring-2 ring-primary/40 bg-card">
                  <img
                    src={avatarUrl}
                    alt={name}
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <span
                  className="absolute bottom-1 right-2 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-background border border-emerald-400 shadow-sm"
                  title={availability}
                />
              </div>
            </motion.div>
          )}

          {/* Availability Badge & Direct "View Projects" Prompt */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-3"
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

            <a
              href="#projects"
              className="group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-primary/40 bg-primary/10 hover:bg-primary hover:text-primary-foreground backdrop-blur-sm text-xs font-semibold text-primary transition-all shadow-xs hover:shadow-md cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary group-hover:text-primary-foreground transition-colors" />
              <span>View Projects</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>

          {/* Main Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-3"
          >
            <p className="text-sm sm:text-base font-semibold text-primary tracking-wide uppercase font-mono">
              Hi, I&apos;m Kishore R
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.15] text-foreground">
              Building <span className="text-gradient">Intelligent Systems</span> That Solve Real Problems.
            </h1>
          </motion.div>

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
      )}
    </section>
  );
}
