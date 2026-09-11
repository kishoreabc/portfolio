"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderGit2,
  BookOpen,
  Award,
  Wrench,
  GraduationCap,
  Share2,
  MessageSquare,
  User,
  LogOut,
  ExternalLink,
  Milestone,
  Bot,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface SidebarProps {
  unreadMessagesCount: number;
  userEmail?: string;
  signOutAction: () => Promise<void>;
}

export function AdminSidebar({
  unreadMessagesCount,
  userEmail,
  signOutAction,
}: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/projects", label: "Projects", icon: FolderGit2 },
    { href: "/admin/certifications", label: "Certifications", icon: Award },
    { href: "/admin/blogs", label: "Blogs", icon: BookOpen },
    { href: "/admin/skills", label: "Skills", icon: Wrench },
    { href: "/admin/education", label: "Education", icon: GraduationCap },
    { href: "/admin/journey", label: "Journey", icon: Milestone },
    { href: "/admin/social-links", label: "Social Links", icon: Share2 },
    {
      href: "/admin/messages",
      label: "Messages",
      icon: MessageSquare,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
    },
    { href: "/admin/ai-conversations", label: "AI Conversations", icon: Bot },
    { href: "/admin/profile", label: "Profile & Site Config", icon: User },
  ];

  const renderNavLinks = (onItemClick?: () => void) => (
    <nav className="p-4 space-y-1 overflow-y-auto">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive =
          link.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onItemClick}
            className={cn(
              "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <Icon className="w-4 h-4 shrink-0" />
              <span>{link.label}</span>
            </div>
            {link.badge !== undefined && (
              <Badge
                variant={isActive ? "secondary" : "default"}
                className="ml-auto text-xs px-2 py-0.5"
              >
                {link.badge}
              </Badge>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const renderFooter = () => (
    <div className="p-4 border-t border-border/60 space-y-3 bg-card/20">
      {userEmail && (
        <div className="flex items-center gap-2.5 px-2">
          <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs font-semibold text-foreground shrink-0">
            {userEmail.charAt(0).toUpperCase()}
          </div>
          <div className="truncate text-xs min-w-0">
            <p className="font-medium text-foreground truncate">{userEmail}</p>
            <p className="text-muted-foreground text-[10px]">Admin Session</p>
          </div>
        </div>
      )}

      <form action={signOutAction}>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="w-full text-xs text-muted-foreground hover:text-destructive hover:border-destructive/40"
        >
          <LogOut className="w-3.5 h-3.5 mr-2" />
          Sign Out
        </Button>
      </form>
    </div>
  );

  return (
    <>
      {/* ── DESKTOP SIDEBAR (Visible on lg and larger viewports) ── */}
      <aside className="hidden lg:flex w-64 border-r border-border/80 bg-card/40 flex-col justify-between h-screen sticky top-0 shrink-0">
        <div className="overflow-y-auto">
          {/* Brand header */}
          <div className="p-6 border-b border-border/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-xs">
                K
              </div>
              <div>
                <h2 className="font-semibold text-sm leading-none">CMS Portal</h2>
                <span className="text-xs text-muted-foreground">Kishore R</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              render={<Link href="/" target="_blank" />}
              title="View Public Portfolio"
            >
              <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </Button>
          </div>

          {/* Desktop Navigation Links */}
          {renderNavLinks()}
        </div>

        {/* Desktop Footer / Auth Info */}
        {renderFooter()}
      </aside>

      {/* ── MOBILE / TABLET TOP BAR (Visible on < lg viewports) ── */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between border-b border-border/80 bg-background/95 backdrop-blur-md px-4 py-3 shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-xs">
            K
          </div>
          <div>
            <h2 className="font-semibold text-sm leading-none">CMS Portal</h2>
            <span className="text-[11px] text-muted-foreground">Admin Dashboard</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-muted-foreground"
            render={<Link href="/" target="_blank" />}
            title="View Public Portfolio"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>

          {/* Mobile Admin Navigation Drawer */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  className="w-8 h-8 rounded-lg relative"
                  aria-label="Open Admin Menu"
                >
                  <Menu className="w-4 h-4" />
                  {unreadMessagesCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                  )}
                </Button>
              }
            />
            <SheetContent
              side="left"
              className="w-[84vw] max-w-xs p-0 flex flex-col justify-between h-full bg-card/95 backdrop-blur-2xl border-r border-border/80 shadow-2xl"
            >
              <SheetTitle className="sr-only">Admin Navigation Menu</SheetTitle>
              <SheetDescription className="sr-only">
                Navigate CMS Portal management sections and perform administrative actions.
              </SheetDescription>

              <div className="overflow-y-auto">
                {/* Brand header */}
                <div className="p-5 border-b border-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-xs">
                      K
                    </div>
                    <div>
                      <h2 className="font-semibold text-sm leading-none">CMS Portal</h2>
                      <span className="text-xs text-muted-foreground font-mono">Kishore R Admin</span>
                    </div>
                  </div>
                </div>

                {/* Mobile Navigation Links */}
                {renderNavLinks(() => setMobileOpen(false))}
              </div>

              {/* Mobile Footer */}
              {renderFooter()}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
}
