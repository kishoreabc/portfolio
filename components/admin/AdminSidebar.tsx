"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderGit2,
  Award,
  Wrench,
  GraduationCap,
  Share2,
  MessageSquare,
  User,
  Settings,
  LogOut,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

  const links = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/projects", label: "Projects", icon: FolderGit2 },
    { href: "/admin/certifications", label: "Certifications", icon: Award },
    { href: "/admin/skills", label: "Skills", icon: Wrench },
    { href: "/admin/education", label: "Education", icon: GraduationCap },
    { href: "/admin/social-links", label: "Social Links", icon: Share2 },
    {
      href: "/admin/messages",
      label: "Messages",
      icon: MessageSquare,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
    },
    { href: "/admin/profile", label: "Profile & Site Config", icon: User },
  ];

  return (
    <aside className="w-64 border-r border-border/80 bg-card/40 flex flex-col justify-between h-screen sticky top-0">
      <div>
        {/* Brand header */}
        <div className="p-6 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
              K
            </div>
            <div>
              <h2 className="font-semibold text-sm leading-none">CMS Portal</h2>
              <span className="text-xs text-muted-foreground">Kishore R</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" render={<Link href="/" target="_blank" />} title="View Public Portfolio">
            <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </Button>
        </div>

        {/* Navigation links */}
        <nav className="p-4 space-y-1">
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
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
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
      </div>

      {/* Footer / Auth Info */}
      <div className="p-4 border-t border-border/60 space-y-3">
        {userEmail && (
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs font-semibold text-foreground">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div className="truncate text-xs">
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
    </aside>
  );
}
