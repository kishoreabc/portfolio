"use client";

import { useState } from "react";
import { BlogPost } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BlogModal } from "@/components/public/BlogModal";
import {
  Calendar,
  Clock,
  ExternalLink,
  Sparkles,
  Eye,
} from "lucide-react";

interface BlogsProps {
  blogs: BlogPost[];
}

export function LinkedInIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={`fill-current shrink-0 ${className}`} viewBox="0 0 24 24">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
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
    canonicalUrl: "https://www.linkedin.com/in/kishoreabc/recent-activity/all/",
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
    canonicalUrl: "https://www.linkedin.com/in/kishoreabc/recent-activity/all/",
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
    canonicalUrl: "https://www.linkedin.com/in/kishoreabc/recent-activity/all/",
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

  const displayBlogs = blogs && blogs.length > 0 ? blogs.filter((b) => b.published) : fallbackBlogs;

  const handleOpenModal = (blog: BlogPost) => {
    setSelectedBlog(blog);
    setModalOpen(true);
  };

  return (
    <section
      id="blogs"
      className="section-padding bg-background relative border-t border-border/40 overflow-hidden"
    >
      {/* Background glow effects */}
      <div className="absolute top-1/4 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container-portfolio space-y-10">
        {/* Header - Fully Centered */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 justify-center">
            <Badge
              variant="outline"
              className="px-3 py-1 rounded-full text-xs font-mono border-[#0A66C2]/40 bg-[#0A66C2]/10 text-[#0A66C2] dark:text-[#70B5F9]"
            >
              <LinkedInIcon className="w-3.5 h-3.5 mr-1.5" /> LinkedIn Articles
            </Badge>
            <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Engineering Insights
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Blogs & <span className="text-gradient">Articles</span>
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xl mx-auto">
            In-depth engineering deep-dives, architectural breakdowns, and AI case studies published on LinkedIn.
          </p>
        </div>

        {/* Centered Responsive Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {displayBlogs.map((blog) => {
            const linkedinUrl =
              blog.canonicalUrl || "https://www.linkedin.com/in/kishoreabc/recent-activity/all/";

            return (
              <Card
                key={blog.id}
                className="border-border/70 bg-card/60 backdrop-blur-sm h-full hover:border-[#0A66C2]/50 hover:shadow-xl transition-all duration-300 p-6 flex flex-col justify-between space-y-5 rounded-2xl group relative overflow-hidden"
              >
                <div className="space-y-4">
                  {/* Top Bar: Badges & Reading Info */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0A66C2] dark:text-[#70B5F9] bg-[#0A66C2]/10 px-2.5 py-0.5 rounded-full border border-[#0A66C2]/20 font-mono">
                        <LinkedInIcon className="w-3 h-3" /> Post
                      </span>
                      {blog.featured && (
                        <Badge variant="default" className="text-[10px] px-2 py-0.5 shadow-xs">
                          Featured
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                      {blog.readTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-primary/80" /> {blog.readTime}
                        </span>
                      )}
                      {blog.publishedAt && (
                        <span className="flex items-center gap-1 text-muted-foreground/80">
                          <Calendar className="w-3 h-3" />
                          {new Date(blog.publishedAt).toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <div className="space-y-2">
                    <a
                      href={linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-lg text-foreground group-hover:text-[#0A66C2] dark:group-hover:text-[#70B5F9] transition-colors leading-snug line-clamp-2 break-words block hover:underline"
                      title="Read article on LinkedIn"
                    >
                      {blog.title}
                    </a>

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
                        #{tag}
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
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 h-8 text-xs px-3.5 rounded-full bg-[#0A66C2] hover:bg-[#004182] text-white font-medium transition-all shadow-xs cursor-pointer"
                  >
                    <LinkedInIcon className="w-3.5 h-3.5" /> Read on LinkedIn{" "}
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenModal(blog)}
                    className="h-8 text-xs px-3 rounded-full border-border/70 hover:border-primary/50 text-muted-foreground hover:text-foreground gap-1.5 font-medium transition-all shadow-xs cursor-pointer"
                    title="Quick preview summary on page"
                  >
                    <Eye className="w-3.5 h-3.5" /> Quick Read
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Bottom Centered CTA */}
        <div className="text-center pt-2">
          <a
            href="https://www.linkedin.com/in/kishoreabc"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 h-9 px-5 rounded-full text-xs font-mono border border-border/70 bg-card/60 hover:bg-[#0A66C2]/10 hover:border-[#0A66C2]/40 hover:text-[#0A66C2] dark:hover:text-[#70B5F9] transition-all shadow-xs"
          >
            <LinkedInIcon className="w-3.5 h-3.5 text-[#0A66C2] dark:text-[#70B5F9]" />
            Follow on LinkedIn for Latest AI Write-ups
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </a>
        </div>
      </div>

      {/* Blog Reading Modal */}
      <BlogModal blog={selectedBlog} open={modalOpen} onOpenChange={setModalOpen} />
    </section>
  );
}
