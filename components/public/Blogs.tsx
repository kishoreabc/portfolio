"use client";

import { useState, useRef } from "react";
import { motion } from "motion/react";
import { BlogPost } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BlogModal } from "@/components/public/BlogModal";
import {
  BookOpen,
  Calendar,
  Clock,
  ExternalLink,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Eye,
} from "lucide-react";
import Link from "next/link";

interface BlogsProps {
  blogs: BlogPost[];
}

const fallbackBlogs: BlogPost[] = [
  {
    id: "fb-1",
    title: "Building Production-Grade RAG Systems: Vector Embeddings to Multi-Document Reasoning",
    slug: "building-production-grade-rag-systems",
    summary:
      "A deep dive into building resilient Retrieval-Augmented Generation architectures with FAISS, OCR document parsing, and hybrid chunking strategies for enterprise documents.",
    content: `## Architecture of High-Accuracy RAG Pipelines

Retrieval-Augmented Generation (RAG) is quickly shifting from simple toy prototypes to high-reliability production systems. In this article, we break down the critical lessons learned building production document analysis systems.

### 1. The Chunking Bottleneck
Naive fixed-character chunking frequently fractures critical context. Implementing semantic chunking based on document structure (headers, table boundaries, paragraphs) dramatically boosts retrieval precision.

### 2. Hybrid Retrieval with FAISS and BM25
While dense vector retrieval (Sentence Transformers) captures semantic intent, sparse lexical retrieval (BM25) guarantees exact keyword matching (part numbers, ticker symbols, financial metrics). Combining both yields state-of-the-art results.

### 3. Re-ranking
Employing a lightweight cross-encoder re-ranker before passing context to the LLM reduces hallucination rates by over 40% and keeps context windows lean.`,
    coverImage: null,
    tags: ["RAG", "FAISS", "Python", "Generative AI"],
    readTime: "6 min read",
    canonicalUrl: null,
    published: true,
    featured: true,
    displayOrder: 1,
    publishedAt: new Date("2026-03-01"),
    createdAt: new Date("2026-03-01"),
    updatedAt: new Date("2026-03-01"),
  },
  {
    id: "fb-2",
    title: "Multimodal Semantic Search: Combining MetaCLIP & BLIP with Vector Databases",
    slug: "multimodal-semantic-search-metaclip-blip",
    summary:
      "How to design an e-commerce catalog search indexing 20,000+ items that supports concurrent image-similarity queries, natural language prompts, and cosine ranking.",
    content: `## Bridging Text and Vision in Modern Search

Users do not think purely in text or purely in images. When looking for fashion items, they want to provide a reference image and say "find something like this in emerald green".

### Unified Latent Space with MetaCLIP
By projecting both image features and text descriptions into a shared embedding space, we can compute cosine distance between arbitrary modalities without intermediate translations.

### Automated Captioning via BLIP
For catalogs with sparse metadata, leveraging BLIP generates synthetic detailed descriptions that enrich both vector embeddings and keyword search indexes.

### Scalable Vector Search
Indexing vectors into ChromaDB allows sub-50ms retrieval latencies across tens of thousands of items with filtered metadata scopes.`,
    coverImage: null,
    tags: ["Multimodal AI", "CLIP", "ChromaDB", "Computer Vision"],
    readTime: "5 min read",
    canonicalUrl: null,
    published: true,
    featured: true,
    displayOrder: 2,
    publishedAt: new Date("2026-02-15"),
    createdAt: new Date("2026-02-15"),
    updatedAt: new Date("2026-02-15"),
  },
  {
    id: "fb-3",
    title: "Voice-First Assistive Agents: Real-Time Audio Memory Systems with FastAPI & TTS",
    slug: "voice-first-assistive-agents",
    summary:
      "Designing EchoRecall, a conversational assistive agent enabling visually impaired users to store and retrieve real-world object locations using natural spoken dialogues.",
    content: `## Designing for Voice-Only Interfaces

Voice-first applications require a completely different design paradigm than chat screens. Latency, clarity, and conversational state tracking are paramount.

### Low-Latency Speech Pipelines
Minimizing Time-to-First-Token (TTFT) requires streaming audio chunking, fast intent recognition via lightweight LLM models, and synthesized SSML speech markup for realistic prosody and pitch variations.

### Spatial Memory Indexing
Memories of object locations are parsed into spatial graphs stored in MySQL with timestamped validity states, allowing natural queries like "Where did I put my keys this morning?".`,
    coverImage: null,
    tags: ["Voice AI", "FastAPI", "Assistive Tech", "LLMs"],
    readTime: "4 min read",
    canonicalUrl: null,
    published: true,
    featured: false,
    displayOrder: 3,
    publishedAt: new Date("2026-01-20"),
    createdAt: new Date("2026-01-20"),
    updatedAt: new Date("2026-01-20"),
  },
];

export function Blogs({ blogs }: BlogsProps) {
  const [selectedBlog, setSelectedBlog] = useState<BlogPost | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTag, setActiveTag] = useState<string>("All");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const displayBlogs = blogs && blogs.length > 0 ? blogs.filter((b) => b.published) : fallbackBlogs;

  // Extract all unique tags
  const allTags = ["All", ...Array.from(new Set(displayBlogs.flatMap((b) => b.tags)))];

  const filteredBlogs =
    activeTag === "All"
      ? displayBlogs
      : displayBlogs.filter((b) => b.tags.includes(activeTag));

  const handleOpenModal = (blog: BlogPost) => {
    setSelectedBlog(blog);
    setModalOpen(true);
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -360, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 360, behavior: "smooth" });
    }
  };

  return (
    <section
      id="blogs"
      className="section-padding bg-background relative border-t border-border/40 overflow-hidden"
    >
      {/* Background glow effects */}
      <div className="absolute top-1/4 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main sliding animation container: slides horizontally into view as user scrolls */}
      <motion.div
        initial={{ opacity: 0, x: -60 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="container-portfolio space-y-10"
      >
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2">
              <Badge variant="outline" className="px-3 py-1 rounded-full text-xs font-mono">
                <BookOpen className="w-3 h-3 mr-1 text-primary" /> Technical Writing
              </Badge>
              <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" /> Engineering Insights
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Featured <span className="text-gradient">Blogs & Articles</span>
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              In-depth engineering deep-dives, architectural breakdowns, and research case studies in
              Generative AI, RAG pipelines, and Multimodal intelligence.
            </p>
          </div>

          {/* Carousel Slide Controls */}
          <div className="flex items-center gap-2 self-start md:self-end">
            <Button
              variant="outline"
              size="icon"
              onClick={scrollLeft}
              className="h-9 w-9 rounded-full border-border/70 hover:border-primary/60 hover:text-primary transition-all"
              aria-label="Slide blogs left"
              title="Slide blogs left"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={scrollRight}
              className="h-9 w-9 rounded-full border-border/70 hover:border-primary/60 hover:text-primary transition-all"
              aria-label="Slide blogs right"
              title="Slide blogs right"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tag Filters */}
        {allTags.length > 2 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {allTags.map((tag) => (
              <Button
                key={tag}
                variant={activeTag === tag ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTag(tag)}
                className={`text-xs rounded-full px-3 h-7 transition-all shrink-0 ${
                  activeTag === tag
                    ? "shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground border-border/60"
                }`}
              >
                {tag}
              </Button>
            ))}
          </div>
        )}

        {/* Horizontal Sliding Track for Blogs */}
        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto pb-6 pt-2 scroll-smooth snap-x snap-mandatory scrollbar-none"
        >
          {filteredBlogs.map((blog, idx) => (
            <motion.div
              key={blog.id}
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="w-[320px] sm:w-[380px] md:w-[420px] shrink-0 snap-start flex flex-col"
            >
              <Card className="border-border/70 bg-card/60 backdrop-blur-sm h-full hover:border-primary/50 hover:shadow-xl transition-all duration-300 p-6 flex flex-col justify-between space-y-5 rounded-2xl group relative overflow-hidden">
                <div className="space-y-4">
                  {/* Top Bar: Badges & Reading Info */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      {blog.featured && (
                        <Badge variant="default" className="text-[10px] px-2 py-0.5 shadow-xs">
                          Featured
                        </Badge>
                      )}
                      {blog.readTime && (
                        <span className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
                          <Clock className="w-3 h-3 text-primary/80" /> {blog.readTime}
                        </span>
                      )}
                    </div>

                    {blog.publishedAt && (
                      <span className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground/80">
                        <Calendar className="w-3 h-3" />
                        {new Date(blog.publishedAt).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <div className="space-y-2">
                    <h3
                      onClick={() => handleOpenModal(blog)}
                      className="font-bold text-lg sm:text-xl text-foreground group-hover:text-primary transition-colors cursor-pointer leading-snug line-clamp-2 break-words"
                    >
                      {blog.title}
                    </h3>

                    {/* Summary */}
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 break-words">
                      {blog.summary}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {blog.tags.slice(0, 3).map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-[10px] px-2 py-0.5 bg-muted/60 hover:bg-muted font-mono"
                      >
                        {tag}
                      </Badge>
                    ))}
                    {blog.tags.length > 3 && (
                      <span className="text-[10px] text-muted-foreground font-mono self-center">
                        +{blog.tags.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Footer: Action buttons */}
                <div className="pt-4 border-t border-border/50 flex items-center justify-between gap-2 mt-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenModal(blog)}
                    className="h-8 text-xs px-3 rounded-full border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary gap-1.5 font-medium transition-all shadow-xs cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Quick Read
                  </Button>

                  <div className="flex items-center gap-2">
                    {blog.canonicalUrl ? (
                      <a
                        href={blog.canonicalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 hover:underline px-1 py-1"
                        title="Read on external publication"
                      >
                        External <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <Link
                        href={`/blogs/${blog.slug}`}
                        className="text-xs font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                      >
                        Article <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Blog Reading Modal */}
      <BlogModal blog={selectedBlog} open={modalOpen} onOpenChange={setModalOpen} />
    </section>
  );
}
