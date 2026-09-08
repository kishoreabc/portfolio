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
                {tag}
              </Badge>
            ))}
          </div>

          {blog.canonicalUrl && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full gap-2 text-xs"
                render={<a href={blog.canonicalUrl} target="_blank" rel="noreferrer" />}
              >
                Read on Original Platform <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
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
            <article className="prose prose-neutral dark:prose-invert max-w-none text-foreground/90 leading-relaxed whitespace-pre-line text-sm sm:text-base font-sans">
              {blog.content}
            </article>
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
