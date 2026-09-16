"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  Sun,
  Moon,
  Menu,
  Sparkles,
  MessageSquare,
  ChevronRight,
  Mail,
  MapPin,
} from "lucide-react";
import { VisitorCounter } from "@/components/public/VisitorCounter";

const navItems = [
  { label: "About", href: "/#about", id: "about" },
  { label: "Skills", href: "/#skills", id: "skills" },
  { label: "Projects", href: "/#projects", id: "projects" },
  { label: "Certifications", href: "/#certifications", id: "certifications" },
  { label: "Blogs", href: "/#blogs", id: "blogs" },
  { label: "Coding", href: "/#coding", id: "coding" },
  { label: "Journey", href: "/#journey", id: "journey" },
];

const emptySubscribe = () => () => {};

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);

  const pathname = usePathname();
  const router = useRouter();

  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const { theme, setTheme } = useTheme();

  // Scroll progress and background blur effect
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
          const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
          setScrollProgress(Math.min(100, Math.max(0, progress)));
          setScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Active section spy using IntersectionObserver
  useEffect(() => {
    if (pathname !== "/") {
      setActiveSection("");
      return;
    }

    const sectionIds = ["about", "skills", "projects", "certifications", "blogs", "coding", "journey", "contact"];
    const sectionElements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (sectionElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
            break;
          }
        }
      },
      {
        rootMargin: "-25% 0px -55% 0px",
        threshold: 0,
      }
    );

    sectionElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);

  // Smooth scroll handler with precision offset and destination pulse
  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (!el) return;

    setActiveSection(sectionId);
    const navOffset = 84;
    const targetY = el.getBoundingClientRect().top + window.scrollY - navOffset;

    window.scrollTo({
      top: Math.max(0, targetY),
      behavior: "smooth",
    });

    // Add glowing focal pulse to destination section
    el.classList.add("section-highlight-pulse");
    setTimeout(() => el.classList.remove("section-highlight-pulse"), 1600);
  };

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    id?: string
  ) => {
    if (pathname === "/" && id) {
      e.preventDefault();
      scrollToSection(id);
      window.history.pushState(null, "", `#${id}`);
    } else if (pathname !== "/" && href.startsWith("/#")) {
      // Allow standard navigation to home hash
      router.push(href);
    }
  };

  // Smooth circular theme spread animation using the modern View Transitions API
  const handleToggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    const nextTheme = theme === "dark" ? "light" : "dark";

    // Fallback if View Transitions API is not supported or user prefers reduced motion
    if (
      typeof document === "undefined" ||
      !("startViewTransition" in document) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setTheme(nextTheme);
      return;
    }

    // Always anchor the animation origin to the exact center of the button
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(rect.left + rect.width / 2);
    const y = Math.round(rect.top + rect.height / 2);

    const endRadius =
      Math.ceil(
        Math.hypot(
          Math.max(x, window.innerWidth - x),
          Math.max(y, window.innerHeight - y)
        )
      ) + 40;

    const doc = document as Document & {
      startViewTransition: (updateCallback: () => void | Promise<void>) => {
        ready: Promise<void>;
        finished: Promise<void>;
      };
    };

    const transition = doc.startViewTransition(() => {
      // flushSync forces React to synchronously apply the DOM change (<html class="...">)
      // before startViewTransition captures the new view state snapshot
      flushSync(() => {
        setTheme(nextTheme);
      });
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 800,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          pseudoElement: "::view-transition-new(root)",
          fill: "forwards",
        }
      );
    });
  };

  return (
    <>
      {/* Dynamic Reading / Scroll Progress Bar */}
      <div
        className="fixed top-0 left-0 h-[2.5px] bg-gradient-to-r from-primary via-indigo-500 to-cyan-400 z-[110] transition-all duration-75 ease-out pointer-events-none"
        style={{ width: `${scrollProgress}%` }}
        role="progressbar"
        aria-valuenow={Math.round(scrollProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
      />

      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-[100] transition-all duration-500 pointer-events-none",
          scrolled
            ? "bg-background/70 backdrop-blur-md shadow-sm py-2.5 sm:py-3"
            : "bg-transparent py-4 sm:py-5"
        )}
      >
        <div className="container-portfolio flex items-center justify-between gap-2 pointer-events-auto">
          {/* Brand / Logo with matching slightly transparent glass pill */}
          <Link
            href="/"
            onClick={(e) => {
              if (pathname === "/") {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
                setActiveSection("");
                window.history.pushState(null, "", "/");
              }
            }}
            className="flex items-center gap-2.5 group shrink-0 bg-card/60 dark:bg-card/30 backdrop-blur-md px-2.5 sm:px-3 py-1.5 rounded-full border border-border/60 shadow-2xs hover:border-primary/50 transition-all cursor-pointer"
          >
            <motion.div
              whileHover={{ scale: 1.08, rotate: 3 }}
              whileTap={{ scale: 0.94 }}
              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-sm group-hover:shadow-primary/30 group-hover:shadow-md transition-shadow shrink-0"
            >
              K
            </motion.div>
            <div className="flex flex-col shrink-0 pr-1">
              <span className="font-bold text-xs sm:text-sm tracking-tight leading-none group-hover:text-primary transition-colors whitespace-nowrap">
                Kishore R
              </span>
              <span className="text-[9px] sm:text-[10px] text-muted-foreground font-mono mt-0.5 whitespace-nowrap">
                AI / ML Engineer
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links with animated floating pill */}
          <nav
            onMouseLeave={() => setHoveredNav(null)}
            className="hidden lg:flex items-center gap-0.5 xl:gap-1 bg-card/60 dark:bg-card/30 backdrop-blur-md px-3 xl:px-4 py-1.5 rounded-full border border-border/60 shrink-0 shadow-2xs relative"
          >
            {navItems.map((item) => {
              const isActive = pathname === "/" && activeSection === item.id;
              const isHovered = hoveredNav === item.id;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href, item.id)}
                  onMouseEnter={() => setHoveredNav(item.id)}
                  className={cn(
                    "relative px-2.5 xl:px-3.5 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap select-none cursor-pointer",
                    isActive ? "text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {/* Floating active pill with physics-based spring animation */}
                  {isActive && (
                    <motion.span
                      layoutId="navbar-active-pill"
                      className="absolute inset-0 rounded-full bg-primary shadow-xs z-0"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    />
                  )}

                  {/* Floating hover pill for unselected items */}
                  {isHovered && !isActive && (
                    <motion.span
                      layoutId="navbar-hover-pill"
                      className="absolute inset-0 rounded-full bg-accent/70 dark:bg-muted/60 z-0"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    />
                  )}

                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Site Visitor Counter — hidden on very small screens to avoid overflow */}
            <div className="hidden sm:block"><VisitorCounter /></div>

            {/* Theme Toggle with Circular View Transition Spread */}
            {mounted && (
              <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-9 h-9 rounded-full border-border/60 shrink-0 hover:border-primary/50 transition-colors cursor-pointer relative overflow-hidden shadow-2xs"
                  onClick={handleToggleTheme}
                  aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={theme}
                      initial={{ rotate: -120, scale: 0.5, opacity: 0 }}
                      animate={{ rotate: 0, scale: 1, opacity: 1 }}
                      exit={{ rotate: 120, scale: 0.5, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="flex items-center justify-center"
                    >
                      {theme === "dark" ? (
                        <Sun className="w-4 h-4 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                      ) : (
                        <Moon className="w-4 h-4 text-indigo-500 drop-shadow-[0_0_8px_rgba(99,102,241,0.4)]" />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </Button>
              </motion.div>
            )}

            {/* "Let's Talk" CTA with Shimmer and tap animation */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.94 }}>
              <Button
                size="sm"
                className="hidden sm:inline-flex rounded-full text-xs font-medium px-3.5 sm:px-4 shadow-sm shrink-0 btn-shimmer transition-all cursor-pointer"
                render={
                  <a
                    href="/#contact"
                    onClick={(e) => handleNavClick(e, "/#contact", "contact")}
                  />
                }
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary-foreground/90 animate-pulse" />
                Let&apos;s Talk
              </Button>
            </motion.div>

            {/* Mobile & Tablet Navigation Sheet */}
            <div className="lg:hidden shrink-0">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger
                  render={
                    <Button variant="outline" size="icon" className="w-9 h-9 rounded-lg" aria-label="Open menu">
                      <Menu className="w-5 h-5" />
                    </Button>
                  }
                />
                <SheetContent
                  side="right"
                  className="w-[84vw] max-w-sm sm:max-w-md p-6 pt-10 flex flex-col justify-between h-full bg-card/95 backdrop-blur-2xl border-l border-border/80 shadow-2xl"
                >
                  <SheetTitle className="sr-only">Mobile Navigation Menu</SheetTitle>
                  <SheetDescription className="sr-only">
                    Navigate through Kishore&apos;s portfolio sections and contact information.
                  </SheetDescription>

                  {/* Top Section: Brand Info & Status */}
                  <div>
                    <div className="flex items-center gap-3 pb-4 border-b border-border/70">
                      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-sm">
                        K
                      </div>
                      <div>
                        <p className="font-bold text-base leading-tight">Kishore R</p>
                        <p className="text-xs text-muted-foreground font-mono">AI / ML & GenAI Engineer</p>
                      </div>
                    </div>

                    {/* Availability Badge */}
                    <div className="mt-3.5 flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium w-fit">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Open to opportunities
                    </div>

                    {/* Navigation Links with staggered animation */}
                    <nav className="mt-5 flex flex-col space-y-1">
                      {navItems.map((item, idx) => {
                        const isActive = pathname === "/" && activeSection === item.id;
                        return (
                          <motion.a
                            key={item.href}
                            href={item.href}
                            initial={{ opacity: 0, x: -14 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.04 * idx, duration: 0.2 }}
                            onClick={(e) => {
                              setMobileOpen(false);
                              handleNavClick(e, item.href, item.id);
                            }}
                            className={cn(
                              "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group",
                              isActive
                                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                                : "text-foreground/80 hover:text-foreground hover:bg-accent/70 active:bg-accent"
                            )}
                          >
                            <span>{item.label}</span>
                            <ChevronRight
                              className={cn(
                                "w-4 h-4 transition-all",
                                isActive
                                  ? "text-primary-foreground translate-x-0.5"
                                  : "text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5"
                              )}
                            />
                          </motion.a>
                        );
                      })}
                    </nav>
                  </div>

                  {/* Bottom Section: CTA & Quick Contact */}
                  <div className="pt-4 border-t border-border/70 space-y-3 mt-auto">
                    <Button
                      size="default"
                      className="w-full rounded-xl font-medium shadow-sm text-sm"
                      render={
                        <a
                          href="/#contact"
                          onClick={(e) => {
                            setMobileOpen(false);
                            handleNavClick(e, "/#contact", "contact");
                          }}
                        />
                      }
                    >
                      <MessageSquare className="w-4 h-4 mr-2" /> Let&apos;s Talk
                    </Button>

                    <div className="flex items-center justify-center gap-4 pt-1">
                      <a
                        href="https://github.com/kishoreabc"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-full bg-muted/60 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="GitHub Profile"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                        </svg>
                      </a>
                      <a
                        href="https://linkedin.com/in/kishore-r"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-full bg-muted/60 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="LinkedIn Profile"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                        </svg>
                      </a>
                      <a
                        href="mailto:Kishorehp134@gmail.com"
                        className="w-9 h-9 rounded-full bg-muted/60 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Send Email"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    </div>

                    <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground font-mono">
                      <MapPin className="w-3 h-3 text-primary/70" />
                      Salem, Tamil Nadu, India
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
