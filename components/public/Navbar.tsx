"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sun, Moon, Menu, Sparkles, MessageSquare } from "lucide-react";

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
        <div className="flex items-center gap-3">
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
            <Sheet>
              <SheetTrigger
                render={
                  <Button variant="outline" size="icon" className="w-9 h-9 rounded-lg" aria-label="Open menu">
                    <Menu className="w-5 h-5" />
                  </Button>
                }
              />
              <SheetContent side="right" className="w-72 pt-12">
                <div className="flex flex-col space-y-4">
                  <div className="pb-4 border-b border-border">
                    <p className="font-bold text-base">Kishore R</p>
                    <p className="text-xs text-muted-foreground">Aspiring AI/ML & Generative AI Engineer</p>
                  </div>
                  {navItems.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      className="text-sm font-medium text-muted-foreground hover:text-foreground py-2 transition-colors"
                    >
                      {item.label}
                    </a>
                  ))}
                  <div className="pt-4 border-t border-border">
                    <Button size="sm" className="w-full rounded-full" render={<a href="#contact" />}>
                      <MessageSquare className="w-4 h-4 mr-2" /> Let&apos;s Talk
                    </Button>
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
