/**
 * components/ai/AgentTranscript.tsx
 *
 * Scrollable conversation transcript display.
 * Shows alternating user (right) and assistant (left) message bubbles.
 * Supports rich Markdown rendering with interactive redirectable links,
 * and quick-action redirect chips for key resources (Resume, GitHub, LeetCode, etc.).
 * Source attribution tags: 📁 Portfolio / 🐙 GitHub / 🔍 Web / 🌐 Grounding
 */

"use client";

import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import {
  ExternalLink,
  FileText,
  Code,
  Globe,
  Mail,
  BookOpen,
} from "lucide-react";
import type { TranscriptEntry, KnownPortfolioResources } from "@/types/ai";

interface AgentTranscriptProps {
  entries: TranscriptEntry[];
  resources?: KnownPortfolioResources;
}

const SOURCE_BADGE: Record<string, { icon: string; label: string; color: string }> = {
  portfolio: { icon: "📁", label: "Portfolio", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  github: { icon: "🐙", label: "GitHub", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  tavily: { icon: "🔍", label: "Web Search", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  grounding: { icon: "🌐", label: "Google", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
};

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

interface ResourceLink {
  label: string;
  url: string;
  type: "resume" | "github" | "leetcode" | "linkedin" | "email" | "url" | "blog";
}

function linkifyText(text: string): string {
  // Convert bare URLs into markdown links while preserving already-formatted markdown links
  return text.replace(
    /(\[.*?\]\(https?:\/\/[^\s)]+\))|(https?:\/\/[^\s<>)"]+)/g,
    (match, mdLink, bareUrl) => {
      if (mdLink) return mdLink;
      return `[${bareUrl}](${bareUrl})`;
    }
  );
}

function getDetectedResources(content: string, resources?: KnownPortfolioResources): ResourceLink[] {
  const links: ResourceLink[] = [];
  const lower = content.toLowerCase();

  // Resume check
  if (
    (lower.includes("resume") ||
      lower.includes(" cv") ||
      lower.includes("/resume.pdf") ||
      lower.includes("resume link")) &&
    resources?.resumeUrl
  ) {
    links.push({
      label: "View Resume (PDF)",
      url: resources.resumeUrl,
      type: "resume",
    });
  }

  // GitHub check
  if (lower.includes("github")) {
    const repoMatch = content.match(
      /https?:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+/
    );
    const targetUrl = repoMatch ? repoMatch[0].replace(/[).]+$/, "") : resources?.githubUrl;
    if (targetUrl) {
      links.push({
        label: repoMatch ? "Open GitHub Repo" : "GitHub Profile",
        url: targetUrl,
        type: "github",
      });
    }
  }

  // LeetCode check
  if (lower.includes("leetcode") && resources?.leetcodeUrl) {
    links.push({
      label: "LeetCode Profile",
      url: resources.leetcodeUrl,
      type: "leetcode",
    });
  }

  // LinkedIn check (excluding pulse articles which get their own blog cards)
  if (
    (lower.includes("linkedin.com/in/") || (lower.includes("linkedin") && !lower.includes("pulse"))) &&
    resources?.linkedinUrl
  ) {
    links.push({
      label: "LinkedIn Profile",
      url: resources.linkedinUrl,
      type: "linkedin",
    });
  }

  // Markdown links check for articles [Title](url)
  const mdBlogRegex = /\[(.*?)\]\((https?:\/\/[^\s)]*(?:pulse|\/blog\/)[^\s)]*)\)/gi;
  let blogMatch: RegExpExecArray | null;
  while ((blogMatch = mdBlogRegex.exec(content)) !== null) {
    const label = blogMatch[1] || "LinkedIn Article";
    const url = blogMatch[2];
    if (!links.some((l) => l.url === url)) {
      links.push({
        label: label.length > 40 ? `${label.slice(0, 37)}...` : label,
        url,
        type: "blog",
      });
    }
  }

  // Any other URL in content that wasn't covered above
  const allUrls = content.match(/https?:\/\/[^\s<>)"]+/g) || [];
  for (const rawUrl of allUrls) {
    const cleanUrl = rawUrl.replace(/[).,]+$/, "");
    const alreadyPresent = links.some(
      (l) => l.url.toLowerCase() === cleanUrl.toLowerCase()
    );
    if (!alreadyPresent) {
      try {
        const parsed = new URL(cleanUrl);
        // Exclude internal API routes
        if (!parsed.pathname.startsWith("/api/")) {
          const isPulse = cleanUrl.includes("pulse") || cleanUrl.includes("/blog/");
          links.push({
            label: isPulse ? "Read Article" : parsed.hostname.replace(/^www\./, ""),
            url: cleanUrl,
            type: isPulse ? "blog" : "url",
          });
        }
      } catch {}
    }
  }

  return links;
}

function renderResourceIcon(type: ResourceLink["type"]) {
  switch (type) {
    case "resume":
      return <FileText className="h-3.5 w-3.5 text-primary shrink-0" />;
    case "github":
      return <GithubIcon className="h-3.5 w-3.5 text-primary shrink-0" />;
    case "leetcode":
      return <Code className="h-3.5 w-3.5 text-amber-500 shrink-0" />;
    case "linkedin":
      return <LinkedinIcon className="h-3.5 w-3.5 text-blue-500 shrink-0" />;
    case "blog":
      return <BookOpen className="h-3.5 w-3.5 text-indigo-400 shrink-0" />;
    case "email":
      return <Mail className="h-3.5 w-3.5 text-emerald-500 shrink-0" />;
    default:
      return <Globe className="h-3.5 w-3.5 text-primary shrink-0" />;
  }
}

export function AgentTranscript({ entries, resources }: AgentTranscriptProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center gap-3 text-center px-4 py-8"
        aria-label="Conversation transcript"
      >
        <span className="text-3xl">👋</span>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-[200px]">
          Ask me anything about Kishore — his projects, skills, experience, or GitHub.
        </p>
      </div>
    );
  }

  return (
    <div
      role="log"
      aria-label="Conversation transcript"
      aria-live="polite"
      className="flex flex-1 flex-col gap-3 overflow-y-auto px-3 py-3 scroll-smooth"
    >
      {entries.map((entry) => {
        const isUser = entry.role === "user";
        const sourceInfo =
          entry.source && entry.source !== "none"
            ? SOURCE_BADGE[entry.source]
            : null;
        const detectedResources = !isUser ? getDetectedResources(entry.content, resources) : [];

        return (
          <div
            key={entry.id}
            className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}
          >
            {/* Message bubble */}
            <div
              className={`
                relative max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed
                ${
                  isUser
                    ? "bg-primary text-primary-foreground rounded-br-sm shadow-xs"
                    : "bg-muted/90 border border-border/50 text-foreground rounded-bl-sm shadow-xs"
                }
              `}
            >
              {isUser ? (
                <p className="whitespace-pre-wrap break-words">{entry.content}</p>
              ) : (
                <div className="text-foreground leading-relaxed break-words [overflow-wrap:anywhere] min-w-0">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => (
                        <p className="mb-2 last:mb-0 leading-relaxed break-words text-sm">
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc list-inside space-y-1 my-2 text-sm pl-1">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-inside space-y-1 my-2 text-sm pl-1">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="leading-relaxed break-words">{children}</li>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-foreground">
                          {children}
                        </strong>
                      ),
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-primary underline underline-offset-4 decoration-primary/60 hover:decoration-primary transition-all bg-primary/10 hover:bg-primary/20 px-1.5 py-0.5 rounded text-xs break-all cursor-pointer mx-0.5"
                        >
                          <span>{children}</span>
                          <ExternalLink className="h-3 w-3 shrink-0 inline opacity-80" />
                        </a>
                      ),
                      code: ({ children }) => (
                        <code className="rounded bg-muted-foreground/15 px-1 py-0.5 font-mono text-xs text-primary font-medium">
                          {children}
                        </code>
                      ),
                    }}
                  >
                    {linkifyText(entry.content)}
                  </ReactMarkdown>

                  {/* Quick Action Redirect Chips */}
                  {detectedResources.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-border/60">
                      {detectedResources.map((res) => (
                        <a
                          key={`${res.type}-${res.url}`}
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-background border border-border hover:border-primary/60 hover:bg-primary/5 hover:text-primary transition-all text-foreground shadow-2xs group cursor-pointer"
                        >
                          {renderResourceIcon(res.type)}
                          <span className="font-semibold">{res.label}</span>
                          <ExternalLink className="h-3 w-3 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-transform shrink-0" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Source attribution + timestamp */}
            <div
              className={`flex items-center gap-1.5 px-1 ${
                isUser ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <span className="text-[10px] text-muted-foreground/60">
                {formatTime(entry.timestamp)}
              </span>
              {sourceInfo && (
                <span
                  className={`
                    inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5
                    text-[10px] font-medium ${sourceInfo.color}
                  `}
                >
                  <span>{sourceInfo.icon}</span>
                  <span>{sourceInfo.label}</span>
                </span>
              )}
              {entry.toolsUsed && entry.toolsUsed.length > 0 && !sourceInfo && (
                <span className="text-[10px] text-muted-foreground/40">
                  {entry.toolsUsed.length} tool
                  {entry.toolsUsed.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} aria-hidden />
    </div>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
