import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Clock, Calendar, ExternalLink, BookOpen, Share2 } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { MarkdownView } from "@/components/ui/markdown-view";

export const revalidate = 86400; // 24h ISR

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const blog = await prisma.blogPost.findUnique({ where: { slug } });
  if (!blog) return { title: "Blog Post Not Found" };

  return {
    title: `${blog.title} | Kishore R Blog`,
    description: blog.summary,
    openGraph: {
      title: blog.title,
      description: blog.summary,
      images: blog.coverImage ? [{ url: blog.coverImage }] : [],
    },
  };
}

function LinkedInIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={`fill-current shrink-0 ${className}`} viewBox="0 0 24 24">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [blog, socialLinks] = await Promise.all([
    prisma.blogPost.findUnique({ where: { slug } }),
    prisma.socialLink.findMany({ where: { enabled: true }, orderBy: { displayOrder: "asc" } }),
  ]);

  if (!blog || !blog.published) {
    notFound();
  }

  const linkedinUrl = blog.canonicalUrl || "https://www.linkedin.com/in/kishoreabc/recent-activity/all/";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 container-portfolio pt-32 pb-20 space-y-8 max-w-4xl">
        <Button variant="ghost" size="sm" render={<Link href="/#blogs" />} className="gap-2 text-xs">
          <ArrowLeft className="w-4 h-4" /> Back to All Blogs
        </Button>

        {/* Header */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#0A66C2] dark:text-[#70B5F9] bg-[#0A66C2]/10 px-3 py-1 rounded-full border border-[#0A66C2]/20 font-mono">
              <LinkedInIcon className="w-3.5 h-3.5" /> LinkedIn Article
            </span>
            {blog.featured && (
              <Badge variant="default" className="text-xs px-2.5 py-0.5">
                Featured Article
              </Badge>
            )}
            {blog.readTime && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono bg-accent/60 px-2.5 py-1 rounded-full border border-border/50">
                <Clock className="w-3 h-3 text-primary" /> {blog.readTime}
              </span>
            )}
            {blog.publishedAt && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(blog.publishedAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
            {blog.title}
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            {blog.summary}
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            {blog.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs px-3 py-1 font-mono">
                #{tag}
              </Badge>
            ))}
          </div>

          <div className="pt-2">
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-xs font-medium text-white bg-[#0A66C2] hover:bg-[#004182] px-4 py-2 rounded-full transition-all shadow-xs"
            >
              <LinkedInIcon className="w-3.5 h-3.5" /> Read on LinkedIn <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Cover Image */}
        {blog.coverImage && (
          <div className="w-full max-h-[440px] rounded-2xl overflow-hidden border border-border/70 shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={blog.coverImage}
              alt={blog.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content Body */}
        <Card className="border-border/70 bg-card/60 p-6 sm:p-10 space-y-6">
          {blog.content ? (
            <MarkdownView content={blog.content} />
          ) : (
            <div className="text-center py-12 space-y-3">
              <BookOpen className="w-12 h-12 text-primary/70 mx-auto" />
              <p className="text-base font-medium">Article Preview</p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                The full publication of this article is hosted externally. Click below to continue reading.
              </p>
              {blog.canonicalUrl && (
                <Button
                  render={<a href={blog.canonicalUrl} target="_blank" rel="noreferrer" />}
                  className="rounded-full gap-2 text-xs"
                >
                  Open External Article <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          )}
        </Card>
      </main>

      <Footer socialLinks={socialLinks} />
    </div>
  );
}
