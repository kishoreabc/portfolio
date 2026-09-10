import { SocialLink } from "@prisma/client";

interface FooterProps {
  socialLinks: SocialLink[];
}

export function Footer({ socialLinks }: FooterProps) {

  return (
    <footer className="border-t border-border/60 bg-card/40 py-12 text-xs text-muted-foreground">
      <div className="container-portfolio flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        {/* Brand */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            Aspiring AI/ML Engineer • Bannari Amman Institute of Technology
          </p>
        </div>

        {/* Social Links */}
        <div className="flex items-center gap-4">
          {socialLinks.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              {link.platform}
            </a>
          ))}
        </div>

        {/* Copyright */}
        <div className="space-y-1 text-right">
          <p className="text-[10px] text-muted-foreground">
            Built with Next.js 15, TypeScript, Tailwind CSS, & Prisma.
          </p>
        </div>
      </div>
    </footer>
  );
}
