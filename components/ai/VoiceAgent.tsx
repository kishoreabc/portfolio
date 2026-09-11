/**
 * components/ai/VoiceAgent.tsx
 *
 * Unified AI Assistant floating launcher + interaction mode selector.
 * Combines the previous dual buttons into a single, elegant AI floating action button (FAB).
 * Clicking the button opens a sleek glassmorphic modal / popover with options
 * to choose between Live Voice Chat (Gemini Live) and Interactive Text Chat.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Sparkles, Mic, MessageSquare, X, ArrowRight, Bot } from "lucide-react";
import { AgentPanel } from "./AgentPanel";
import { AudioManager } from "./AudioManager";
import type { AgentMode } from "@/types/ai";

export function VoiceAgent() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [mode, setMode] = useState<AgentMode>("voice");
  const panelCloseRef = useRef<(() => void) | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);

  const handleOpen = (openMode: AgentMode) => {
    if (openMode === "voice") {
      AudioManager.unlock();
    }
    setMode(openMode);
    setIsPickerOpen(false);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsPickerOpen(false);
  };

  const handleFabClick = () => {
    if (isOpen) {
      if (panelCloseRef.current) {
        panelCloseRef.current();
      } else {
        handleClose();
      }
      return;
    }

    setIsPickerOpen((prev) => !prev);
  };

  // Close picker on outside click or Escape key
  useEffect(() => {
    if (!isPickerOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        pickerRef.current &&
        !pickerRef.current.contains(target) &&
        fabRef.current &&
        !fabRef.current.contains(target)
      ) {
        setIsPickerOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPickerOpen]);

  // Do not render the floating AI launcher on the admin panel
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      {/* Dimmed backdrop when mode picker is open */}
      {isPickerOpen && !isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
          onClick={() => setIsPickerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mode Selection Popover Card */}
      {isPickerOpen && !isOpen && (
        <div
          ref={pickerRef}
          className="
            fixed bottom-24 right-4 left-4 sm:left-auto z-50
            w-auto sm:w-[350px] max-w-[calc(100vw-2rem)]
            rounded-2xl border border-border/80
            bg-card/95 backdrop-blur-xl
            p-4 shadow-2xl shadow-black/30
            animate-in fade-in zoom-in-95 slide-in-from-bottom-3 duration-200
          "
          role="dialog"
          aria-label="Choose AI Assistant Mode"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xs">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground leading-tight">
                  Kishore&apos;s AI Assistant
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Choose your interaction mode
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsPickerOpen(false)}
              className="rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Mode Options */}
          <div className="flex flex-col gap-2.5">
            {/* 1. Live Voice Chat Option */}
            <button
              id="ai-select-voice"
              onClick={() => handleOpen("voice")}
              className="
                group relative flex items-start gap-3 rounded-xl
                border border-border/80 bg-background/70 hover:bg-cyan-500/5
                hover:border-cyan-500/50 p-3 text-left transition-all duration-200
                shadow-xs hover:shadow-md cursor-pointer
              "
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 border border-cyan-500/20 group-hover:scale-105 transition-transform">
                <Mic className="h-5 w-5 animate-pulse" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-sm font-semibold text-foreground group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors">
                    Live Voice Chat
                  </span>
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                    Gemini Live
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Real-time spoken conversation with organic audio visualizer and instant interruption.
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-cyan-500 group-hover:translate-x-0.5 transition-all self-center shrink-0" />
            </button>

            {/* 2. Text Chat Option */}
            <button
              id="ai-select-chat"
              onClick={() => handleOpen("chat")}
              className="
                group relative flex items-start gap-3 rounded-xl
                border border-border/80 bg-background/70 hover:bg-purple-500/5
                hover:border-purple-500/50 p-3 text-left transition-all duration-200
                shadow-xs hover:shadow-md cursor-pointer
              "
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 dark:text-purple-400 border border-purple-500/20 group-hover:scale-105 transition-transform">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-sm font-semibold text-foreground group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors">
                    Text Chat
                  </span>
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    Instant
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ask questions, browse projects & blog articles, and get direct clickable links.
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all self-center shrink-0" />
            </button>
          </div>
        </div>
      )}

      {/* Single Unified Floating Action Button */}
      <button
        ref={fabRef}
        id="ai-assistant-fab"
        onClick={handleFabClick}
        className={`
          fixed bottom-6 right-4 z-50 group
          flex h-14 w-14 items-center justify-center rounded-full
          transition-all duration-300 active:scale-95 cursor-pointer
          ${
            isOpen || isPickerOpen
              ? "bg-muted text-foreground border border-border/80 shadow-lg hover:bg-muted/80"
              : "bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105"
          }
        `}
        aria-label={isOpen || isPickerOpen ? "Close AI assistant" : "Open Kishore's AI assistant"}
        aria-expanded={isOpen || isPickerOpen}
        title={isOpen || isPickerOpen ? "Close" : "Talk or Chat with Kishore's AI"}
      >
        {/* Ambient breathing halo when idle */}
        {!isOpen && !isPickerOpen && (
          <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-purple-600 opacity-50 blur-sm group-hover:opacity-100 transition-opacity animate-pulse pointer-events-none" />
        )}

        {/* Icon */}
        {isOpen || isPickerOpen ? (
          <X className="h-6 w-6 relative z-10 transition-transform duration-200 rotate-0 group-hover:rotate-90" />
        ) : (
          <Sparkles className="h-6 w-6 relative z-10 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
        )}
      </button>

      {/* Main Agent Panel */}
      <AgentPanel
        isOpen={isOpen}
        onClose={handleClose}
        initialMode={mode}
        onRequestCloseRef={panelCloseRef}
      />
    </>
  );
}
