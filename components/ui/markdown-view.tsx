"use client";

import ReactMarkdown from "react-markdown";

interface MarkdownViewProps {
  content?: string | null;
  className?: string;
}

export function MarkdownView({ content, className = "" }: MarkdownViewProps) {
  if (!content) return null;

  return (
    <div className={`prose prose-neutral dark:prose-invert max-w-none text-foreground leading-relaxed break-words [overflow-wrap:anywhere] min-w-0 ${className}`}>
      <ReactMarkdown
        components={{
          h1: ({ ...props }) => (
            <h1
              className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-5 mb-3 border-b border-border/60 pb-2 break-words"
              {...props}
            />
          ),
          h2: ({ ...props }) => (
            <h2
              className="text-lg sm:text-xl font-bold tracking-tight text-foreground mt-5 mb-2.5 text-primary break-words"
              {...props}
            />
          ),
          h3: ({ ...props }) => (
            <h3
              className="text-base sm:text-lg font-semibold tracking-tight text-foreground mt-4 mb-2 break-words"
              {...props}
            />
          ),
          p: ({ ...props }) => (
            <p className="text-foreground/90 leading-relaxed mb-3 text-xs sm:text-sm break-words" {...props} />
          ),
          ul: ({ ...props }) => (
            <ul className="list-disc list-inside space-y-1.5 my-2.5 text-foreground/90 text-xs sm:text-sm pl-2 break-words" {...props} />
          ),
          ol: ({ ...props }) => (
            <ol className="list-decimal list-inside space-y-1.5 my-2.5 text-foreground/90 text-xs sm:text-sm pl-2 break-words" {...props} />
          ),
          li: ({ ...props }) => (
            <li className="leading-relaxed break-words" {...props} />
          ),
          a: ({ href, children, ...props }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:opacity-80 font-medium break-all"
              {...props}
            >
              {children}
            </a>
          ),
          code: ({ className: codeClassName, children, ...props }) => {
            const isInline = !codeClassName && typeof children === "string" && !children.includes("\n");
            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded bg-muted font-mono text-[11px] text-primary border border-border/50 break-words [overflow-wrap:anywhere]"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <pre className="p-3.5 rounded-xl bg-muted/70 border border-border overflow-x-auto my-3 text-xs font-mono text-foreground/90 leading-normal max-w-full whitespace-pre-wrap break-words">
                <code {...props}>{children}</code>
              </pre>
            );
          },
          blockquote: ({ ...props }) => (
            <blockquote className="border-l-2 border-primary pl-4 italic text-muted-foreground my-3 bg-muted/20 py-1 rounded-r break-words" {...props} />
          ),
          strong: ({ ...props }) => (
            <strong className="font-semibold text-foreground" {...props} />
          ),
          hr: ({ ...props }) => (
            <hr className="my-5 border-border/70" {...props} />
          ),
          table: ({ ...props }) => (
            <div className="overflow-x-auto my-4 rounded-lg border border-border">
              <table className="w-full text-xs text-left border-collapse" {...props} />
            </div>
          ),
          th: ({ ...props }) => (
            <th className="border-b border-border bg-muted/60 px-3 py-2 font-semibold text-foreground" {...props} />
          ),
          td: ({ ...props }) => (
            <td className="border-b border-border/60 px-3 py-2 text-foreground/90" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
