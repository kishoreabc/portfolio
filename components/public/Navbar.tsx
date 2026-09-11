"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
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
  { label: "About", href: "#about" },
  { label: "Skills", href: "#skills" },
  { label: "Projects", href: "#projects" },
  { label: "Certifications", href: "#certifications" },
  { label: "Blogs", href: "#blogs" },
  { label: "Coding", href: "#coding" },
  { label: "Journey", href: "#journey" },
];

const emptySubscribe = () => () => {};

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/80 backdrop-blur-md border-b border-border/60 py-3.5 shadow-sm"
          : "bg-transparent py-5"
      )}
    >
      <div className="container-portfolio flex items-center justify-between">
        {/* Brand / Logo */}
        <Link href="#" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-base shadow-sm group-hover:scale-105 transition-transform">
            K
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight leading-none group-hover:text-primary transition-colors">
              Kishore R
            </span>
            <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
              AI / ML Engineer
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-card/40 backdrop-blur-sm px-4 py-1.5 rounded-full border border-border/50">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-full transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Site Visitor Counter */}
          <VisitorCounter />

          {/* Theme Toggle */}
          {mounted && (
            <Button
              variant="outline"
              size="icon"
              className="w-9 h-9 rounded-full border-border/60"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </Button>
          )}

          {/* "Let's Talk" CTA */}
          <Button
            size="sm"
            className="hidden sm:inline-flex rounded-full text-xs font-medium px-4 shadow-sm"
            render={<a href="#contact" />}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary-foreground/90 animate-pulse" />
            Let&apos;s Talk
          </Button>

          {/* Mobile Navigation Sheet */}
          <div className="md:hidden">
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

                  {/* Navigation Links */}
                  <nav className="mt-5 flex flex-col space-y-1">
                    {navItems.map((item) => (
                      <a
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent/70 active:bg-accent transition-all group"
                      >
                        <span>{item.label}</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </a>
                    ))}
                  </nav>
                </div>

                {/* Bottom Section: CTA & Quick Contact */}
                <div className="pt-4 border-t border-border/70 space-y-3 mt-auto">
                  <Button
                    size="default"
                    className="w-full rounded-xl font-medium shadow-sm text-sm"
                    render={<a href="#contact" onClick={() => setMobileOpen(false)} />}
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
  );
}
