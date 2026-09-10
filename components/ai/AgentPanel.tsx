/**
 * components/ai/AgentPanel.tsx
 *
 * The main AI agent panel — floating dialog with full session lifecycle.
 *
 * Features:
 *  - Voice and Chat modes (toggle via controls)
 *  - 10-minute voice session countdown with 2-minute warning toast
 *  - Tool call bridge: Gemini toolCall → /api/ai/tool → sendToolResponse
 *  - Transcript saving: each exchange → /api/ai/conversation/message
 *  - Queue waiting screen (when voice slots full)
 *  - Clean WebSocket teardown on unmount/close
 *  - Mic-denied auto-fallback to Chat mode
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GoogleGenAI, Modality } from "@google/genai";
import type { Session, LiveServerMessage } from "@google/genai";
import { toast } from "sonner";
import { X, Bot, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentTranscript } from "./AgentTranscript";
import { AgentControls } from "./AgentControls";
import { QueueWaiting } from "./QueueWaiting";
import { AudioManager } from "./AudioManager";
import { VoiceVisualizer } from "./VoiceVisualizer";
import { PORTFOLIO_TOOL_DECLARATIONS } from "@/lib/ai/tools/tool-declarations";
import type {
  SessionState,
  AgentMode,
  TranscriptEntry,
  EphemeralTokenResponse,
  AllowedToolName,
  FetchedArtifact,
} from "@/types/ai";

interface AgentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AgentMode;
  onRequestCloseRef?: React.MutableRefObject<(() => void) | null>;
}

type PanelView = "connecting" | "queued" | "active" | "error";

interface QueueData {
  queueId: string;
  position: number;
  estimatedWaitSeconds: number;
  pollIntervalMs: number;
}

export function AgentPanel({
  isOpen,
  onClose,
  initialMode = "voice",
  onRequestCloseRef,
}: AgentPanelProps) {
  const [view, setView] = useState<PanelView>("connecting");
  const [mode, setMode] = useState<AgentMode>(initialMode);
  const [state, setState] = useState<SessionState>("CONNECTING");
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [queueData, setQueueData] = useState<QueueData | null>(null);
  const [voiceSecondsLeft, setVoiceSecondsLeft] = useState<number | null>(null);
  const [sessionData, setSessionData] = useState<EphemeralTokenResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showLeaveQueueConfirm, setShowLeaveQueueConfirm] = useState(false);
  const [voiceArtifacts, setVoiceArtifacts] = useState<FetchedArtifact[]>([]);
  const [isCompletingSentence, setIsCompletingSentence] = useState(false);
  const sessionGenerationRef = useRef(0);

  const addVoiceArtifact = useCallback(
    (art: Omit<FetchedArtifact, "id" | "timestamp">) => {
      setVoiceArtifacts((prev) => {
        if (
          prev.some(
            (p) =>
              p.url.toLowerCase() === art.url.toLowerCase() ||
              p.title.toLowerCase() === art.title.toLowerCase()
          )
        ) {
          return prev;
        }
        return [
          {
            ...art,
            id: `${art.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: new Date(),
          },
          ...prev,
        ];
      });
    },
    []
  );

  const checkAndAddArtifactsFromText = useCallback(
    (text: string) => {
      if (!text?.trim()) return;
      const lower = text.toLowerCase();
      const res = sessionDataRef.current?.resources;

      // 1. Resume trigger
      if (
        (lower.includes("resume") ||
          lower.includes("cv") ||
          lower.includes("curriculum") ||
          lower.includes("/resume.pdf") ||
          lower.includes("resume link")) &&
        res?.resumeUrl
      ) {
        addVoiceArtifact({
          type: "resume",
          title: "Kishore's Resume (PDF)",
          meta: "Official PDF Document · AI/ML Engineer",
          url: res.resumeUrl,
        });
      }

      // 2. GitHub trigger
      if (
        lower.includes("github") ||
        lower.includes("github.com") ||
        lower.includes("repo") ||
        lower.includes("repository")
      ) {
        const repoMatch = text.match(
          /https?:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+/
        );
        const targetUrl = repoMatch ? repoMatch[0].replace(/[).]+$/, "") : res?.githubUrl;
        if (targetUrl) {
          addVoiceArtifact({
            type: "github",
            title: repoMatch ? "GitHub Repository" : "GitHub Profile",
            meta: repoMatch ? "Source Code" : "Public Profile",
            url: targetUrl,
          });
        }
      }

      // 3. LeetCode trigger
      if (
        (lower.includes("leetcode") ||
          lower.includes("leetcode.com") ||
          lower.includes("problem solving") ||
          lower.includes("dsa")) &&
        res?.leetcodeUrl
      ) {
        addVoiceArtifact({
          type: "leetcode",
          title: "LeetCode Profile",
          meta: "DSA & Problem Solving",
          url: res.leetcodeUrl,
        });
      }

      // 4. LinkedIn trigger
      if (
        (lower.includes("linkedin.com/in/") || (lower.includes("linkedin") && !lower.includes("pulse"))) &&
        res?.linkedinUrl
      ) {
        addVoiceArtifact({
          type: "linkedin",
          title: "LinkedIn Profile",
          meta: "Connect with Kishore",
          url: res.linkedinUrl,
        });
      }

      // 5. Projects
      if (res?.projects && res.projects.length > 0) {
        for (const proj of res.projects) {
          const titleLower = proj.title.toLowerCase();
          const slugClean = proj.slug.replace(/-/g, " ").toLowerCase();
          const words = titleLower.split(/[:—–-]/)[0].trim().split(" ");
          const mainKey = words[0]?.toLowerCase();

          const isMatch =
            lower.includes(titleLower) ||
            lower.includes(slugClean) ||
            (mainKey && mainKey.length > 3 && lower.includes(mainKey));

          const projUrl = proj.githubUrl || proj.liveUrl;
          if (isMatch && projUrl) {
            addVoiceArtifact({
              type: "project",
              title: proj.title,
              description: proj.shortDescription || undefined,
              meta: proj.technologies?.slice(0, 3).join(" · ") || "Portfolio Project",
              url: projUrl,
              secondaryUrl: proj.liveUrl && proj.githubUrl ? proj.liveUrl : undefined,
              secondaryLabel: "Live Demo",
            });
          }
        }
      }

      // 5b. Blog Posts
      if (res?.blogPosts && res.blogPosts.length > 0) {
        for (const post of res.blogPosts) {
          const titleLower = post.title.toLowerCase();
          const slugClean = post.slug.replace(/-/g, " ").toLowerCase();
          const firstWord = titleLower.split(" ")[0];
          const isMatch =
            lower.includes(titleLower) ||
            lower.includes(slugClean) ||
            ((lower.includes("blog") || lower.includes("article") || lower.includes("post")) &&
              Boolean(firstWord && lower.includes(firstWord)));

          const postUrl = post.canonicalUrl || post.url;
          if (isMatch && postUrl) {
            addVoiceArtifact({
              type: "blog",
              title: post.title,
              description: post.summary || undefined,
              meta: `${post.readTime || "5 min read"} · Technical Article`,
              url: postUrl,
            });
          }
        }
      }

      // 6. Markdown links [Title](url) in text
      const mdRegex = /\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g;
      let match: RegExpExecArray | null;
      while ((match = mdRegex.exec(text)) !== null) {
        const title = match[1];
        const url = match[2];
        const isPulseOrBlog = url.includes("pulse") || url.includes("/blog/") || url.includes("article") || (title && title.toLowerCase().includes("article"));
        addVoiceArtifact({
          type: url.includes("github")
            ? "github"
            : url.includes("leetcode")
            ? "leetcode"
            : url.includes(".pdf")
            ? "resume"
            : isPulseOrBlog
            ? "blog"
            : "link",
          title: title || "Verified Link",
          url: url,
          meta: isPulseOrBlog ? "LinkedIn Article" : "Official Resource",
        });
      }

      // 7. Standalone URLs
      const rawUrlRegex = /(https?:\/\/[^\s<>)"]+)/g;
      let urlMatch: RegExpExecArray | null;
      while ((urlMatch = rawUrlRegex.exec(text)) !== null) {
        const url = urlMatch[1].replace(/[).,]+$/, "");
        if (url.includes("api/ai") || url.includes("localhost")) continue;
        addVoiceArtifact({
          type: url.includes("github")
            ? "github"
            : url.includes("leetcode")
            ? "leetcode"
            : url.includes(".pdf")
            ? "resume"
            : "link",
          title: url.includes("github")
            ? "GitHub Repository"
            : url.includes("leetcode")
            ? "LeetCode Profile"
            : url.includes(".pdf")
            ? "Resume (PDF)"
            : "External Resource",
          url: url,
          meta: "Verified Link",
        });
      }
    },
    [addVoiceArtifact]
  );

  const sessionRef = useRef<Session | null>(null);
  const sessionDataRef = useRef<EphemeralTokenResponse | null>(null);
  const queueDataRef = useRef<QueueData | null>(null);
  const audioManagerRef = useRef<AudioManager | null>(null);
  const voiceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatThinkingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);
  const currentAssistantTurnIdRef = useRef<string | null>(null);
  const currentAssistantTextRef = useRef<string>("");
  const currentUserTurnIdRef = useRef<string | null>(null);
  const currentUserTextRef = useRef<string>("");
  const stateRef = useRef<SessionState>(state);
  const pendingTimerDisconnectRef = useRef(false);
  const isModelTurnActiveRef = useRef(false);
  const safetyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs in sync with state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    sessionDataRef.current = sessionData;
  }, [sessionData]);

  useEffect(() => {
    queueDataRef.current = queueData;
  }, [queueData]);

  // ── Voice Timer Helpers ─────────────────────────────────────────────────────

  const stopVoiceTimer = useCallback(() => {
    if (voiceTimerRef.current) {
      clearInterval(voiceTimerRef.current);
      voiceTimerRef.current = null;
    }
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current);
      safetyTimeoutRef.current = null;
    }
    setVoiceSecondsLeft(null);
  }, []);

  // ── Queue & Session Cleanup ─────────────────────────────────────────────────

  const leaveQueue = useCallback(async () => {
    const q = queueDataRef.current;
    if (q) {
      queueDataRef.current = null;
      setQueueData(null);
      try {
        await fetch(`/api/ai/queue/${q.queueId}`, {
          method: "DELETE",
          keepalive: true,
        });
      } catch (err) {
        console.error("[AgentPanel] Failed to leave queue:", err);
      }
    }
  }, []);

  const terminateCurrentSession = useCallback(async () => {
    const s = sessionDataRef.current;
    if (s) {
      sessionDataRef.current = null;
      setSessionData(null);
      try {
        await fetch("/api/ai/session/terminate", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: s.sessionId,
            conversationId: s.conversationId,
          }),
          keepalive: true,
        });
      } catch (err) {
        console.error("[AgentPanel] Failed to terminate session:", err);
      }
    }
  }, []);

  // ── Streaming Turn Accumulators ─────────────────────────────────────────────

  const appendAssistantChunk = useCallback((chunk: string) => {
    if (!chunk) return;

    if (!currentAssistantTurnIdRef.current) {
      const id = crypto.randomUUID();
      currentAssistantTurnIdRef.current = id;
      currentAssistantTextRef.current = chunk;
      setTranscript((prev) => [
        ...prev,
        { id, role: "assistant", content: chunk, timestamp: new Date() },
      ]);
    } else {
      currentAssistantTextRef.current += chunk;
      const turnId = currentAssistantTurnIdRef.current;
      const accumulated = currentAssistantTextRef.current;
      setTranscript((prev) =>
        prev.map((entry) =>
          entry.id === turnId ? { ...entry, content: accumulated } : entry
        )
      );
    }
  }, []);

  const finalizeAssistantTurn = useCallback((conversationId: string) => {
    if (!currentAssistantTurnIdRef.current) return;
    const finalContent = currentAssistantTextRef.current.trim();
    currentAssistantTurnIdRef.current = null;
    currentAssistantTextRef.current = "";

    if (!finalContent) return;

    const sessionId = sessionDataRef.current?.sessionId;
    if (sessionId && conversationId) {
      void fetch("/api/ai/conversation/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          conversationId,
          role: "assistant",
          content: finalContent,
        }),
      }).catch(() => {});
    }
  }, []);

  const appendUserChunk = useCallback((chunk: string) => {
    if (!chunk) return;

    if (!currentUserTurnIdRef.current) {
      const id = crypto.randomUUID();
      currentUserTurnIdRef.current = id;
      currentUserTextRef.current = chunk;
      setTranscript((prev) => [
        ...prev,
        { id, role: "user", content: chunk, timestamp: new Date() },
      ]);
    } else {
      currentUserTextRef.current += chunk;
      const turnId = currentUserTurnIdRef.current;
      const accumulated = currentUserTextRef.current;
      setTranscript((prev) =>
        prev.map((entry) =>
          entry.id === turnId ? { ...entry, content: accumulated } : entry
        )
      );
    }
  }, []);

  const finalizeUserTurn = useCallback((conversationId: string) => {
    if (!currentUserTurnIdRef.current) return;
    const finalContent = currentUserTextRef.current.trim();
    currentUserTurnIdRef.current = null;
    currentUserTextRef.current = "";

    if (!finalContent) return;

    const sessionId = sessionDataRef.current?.sessionId;
    if (sessionId && conversationId) {
      void fetch("/api/ai/conversation/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          conversationId,
          role: "user",
          content: finalContent,
        }),
      }).catch(() => {});
    }
  }, []);

  const handleDisconnect = useCallback(async () => {
    // Invalidate in-flight sessions and callbacks
    sessionGenerationRef.current++;

    stopVoiceTimer();
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current);
      safetyTimeoutRef.current = null;
    }
    pendingTimerDisconnectRef.current = false;
    isModelTurnActiveRef.current = false;

    if (chatThinkingTimerRef.current) {
      clearTimeout(chatThinkingTimerRef.current);
      chatThinkingTimerRef.current = null;
    }

    if (audioManagerRef.current) {
      audioManagerRef.current.stop();
      audioManagerRef.current = null;
    }

    const s = sessionRef.current;
    sessionRef.current = null;
    try {
      void (s as any)?.close?.();
    } catch {}

    const convId = sessionDataRef.current?.conversationId ?? "";
    if (convId) {
      finalizeUserTurn(convId);
      finalizeAssistantTurn(convId);
    }

    // Immediately update UI state without waiting for network calls
    if (isMounted.current) {
      setIsCompletingSentence(false);
      setState("DISCONNECTED");
      setVoiceSecondsLeft(null);
    }

    // Clean up queue and session in background
    void leaveQueue();
    void terminateCurrentSession();
  }, [stopVoiceTimer, leaveQueue, terminateCurrentSession, finalizeUserTurn, finalizeAssistantTurn]);

  const handleRequestClose = useCallback(async () => {
    if (view === "queued" || queueDataRef.current) {
      setShowLeaveQueueConfirm(true);
      return;
    }
    await handleDisconnect();
    onClose();
  }, [view, handleDisconnect, onClose]);

  const handleConfirmLeaveAndClose = useCallback(async () => {
    setShowLeaveQueueConfirm(false);
    await leaveQueue();
    await handleDisconnect();
    onClose();
  }, [leaveQueue, handleDisconnect, onClose]);

  useEffect(() => {
    if (onRequestCloseRef) {
      onRequestCloseRef.current = handleRequestClose;
    }
  }, [onRequestCloseRef, handleRequestClose]);

  const checkAndExecutePendingDisconnect = useCallback(() => {
    if (!pendingTimerDisconnectRef.current) return;

    const isPlaying = audioManagerRef.current?.getIsPlaying() ?? false;
    const isTurnActive = isModelTurnActiveRef.current;
    const isBusy = stateRef.current === "SPEAKING" || stateRef.current === "THINKING";

    // If still actively playing, receiving turn chunks, or busy generating, keep waiting
    if (isPlaying || isTurnActive || isBusy) {
      return;
    }

    pendingTimerDisconnectRef.current = false;
    setIsCompletingSentence(false);

    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current);
      safetyTimeoutRef.current = null;
    }

    toast.info(
      "Your voice session has ended (10-minute limit). You can start a new session anytime.",
      { duration: 6000 }
    );
    void handleDisconnect();
  }, [handleDisconnect]);

  const startVoiceTimer = useCallback(
    (totalSeconds: number, warningSeconds: number) => {
      stopVoiceTimer();
      setVoiceSecondsLeft(totalSeconds);
      let warned = false;

      voiceTimerRef.current = setInterval(() => {
        setVoiceSecondsLeft((prev) => {
          if (prev === null) return null;
          const next = prev - 1;

          // Warning toast
          if (!warned && next <= warningSeconds && next > 0) {
            warned = true;
            toast.warning(
              `⏱ Voice session ends in ${Math.ceil(next / 60)} minute${next > 60 ? "s" : ""}`,
              { duration: 8000 }
            );
          }

          // Session over
          if (next <= 0) {
            if (voiceTimerRef.current) {
              clearInterval(voiceTimerRef.current);
              voiceTimerRef.current = null;
            }

            const isPlaying = audioManagerRef.current?.getIsPlaying() ?? false;
            const isTurnActive = isModelTurnActiveRef.current;
            const isBusy = stateRef.current === "SPEAKING" || stateRef.current === "THINKING";

            if (isPlaying || isTurnActive || isBusy) {
              // Mute mic immediately so user cannot speak or start a new turn
              audioManagerRef.current?.setMuted(true);
              setIsMuted(true);
              pendingTimerDisconnectRef.current = true;
              setIsCompletingSentence(true);
              toast.info("Voice time limit reached. Finishing response...", {
                duration: 5000,
              });

              // Safety timeout: force disconnect after 25s if response hangs
              if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
              safetyTimeoutRef.current = setTimeout(() => {
                pendingTimerDisconnectRef.current = false;
                setIsCompletingSentence(false);
                toast.info(
                  "Your voice session has ended (10-minute limit). You can start a new session anytime.",
                  { duration: 6000 }
                );
                void handleDisconnect();
              }, 25000);

              return 0;
            }

            toast.info(
              "Your voice session has ended (10-minute limit). You can start a new session anytime."
            );
            void handleDisconnect();
            return 0;
          }

          return next;
        });
      }, 1000);
    },
    [stopVoiceTimer, handleDisconnect]
  );

  // ── Tool Calls Bridge ───────────────────────────────────────────────────────

  const handleToolCalls = useCallback(
    async (
      calls: { id: string; name: string; args: Record<string, unknown> }[],
      session: Session,
      sessionId: string
    ) => {
      const responses = await Promise.all(
        calls.map(async (call) => {
          try {
            const res = await fetch("/api/ai/tool", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sessionId,
                toolName: call.name,
                args: call.args,
                callId: call.id,
              }),
            });
            const data = await res.json();

            // Extract artifacts for voice mode display
            if (data?.result) {
              if (call.name === "get_my_resume") {
                const rUrl = data.result?.resumeUrl;
                if (rUrl) {
                  addVoiceArtifact({
                    type: "resume",
                    title: "Kishore's Resume (PDF)",
                    meta: "PDF Document · AI/ML Engineer",
                    url: rUrl,
                  });
                }
              } else if (call.name === "get_my_social_links" && Array.isArray(data.result)) {
                for (const link of data.result) {
                  if (!link.url) continue;
                  const plat = String(link.platform || "").toLowerCase();
                  addVoiceArtifact({
                    type: plat.includes("git")
                      ? "github"
                      : plat.includes("leet")
                      ? "leetcode"
                      : plat.includes("link")
                      ? "linkedin"
                      : "link",
                    title: `${link.platform} Profile`,
                    url: link.url,
                    meta: `@${link.platform}`,
                  });
                }
              } else if (call.name === "get_my_projects" && Array.isArray(data.result)) {
                for (const proj of data.result.slice(0, 3)) {
                  const targetUrl = proj.liveUrl || proj.githubUrl;
                  if (!targetUrl) continue;
                  addVoiceArtifact({
                    type: "project",
                    title: proj.title,
                    description: proj.shortDescription,
                    meta: proj.technologies?.slice(0, 3).join(" · "),
                    url: targetUrl,
                    secondaryUrl: proj.liveUrl && proj.githubUrl && proj.liveUrl !== targetUrl ? proj.githubUrl : undefined,
                    secondaryLabel: "GitHub Repo",
                  });
                }
              } else if (call.name === "get_github_repository" && data.result) {
                if (data.result.htmlUrl) {
                  addVoiceArtifact({
                    type: "github",
                    title: `${data.result.name} (GitHub)`,
                    description: data.result.description || "GitHub Repository",
                    meta: data.result.language || "Code Repository",
                    url: data.result.htmlUrl,
                  });
                }
              } else if (call.name === "get_my_blog_posts" && Array.isArray(data.result)) {
                for (const post of data.result.slice(0, 3)) {
                  const blogUrl = post.canonicalUrl || post.url;
                  if (!blogUrl) continue;
                  addVoiceArtifact({
                    type: "blog",
                    title: post.title,
                    description: post.summary,
                    meta: `${post.readTime || "5 min read"} · Technical Article`,
                    url: post.canonicalUrl || post.url || (post.slug ? `/blog/${post.slug}` : ""),
                  });
                }
              }
            }

            return {
              id: call.id,
              name: call.name as AllowedToolName,
              response: { output: data.result ?? data.error ?? null },
            };
          } catch {
            return {
              id: call.id,
              name: call.name as AllowedToolName,
              response: { output: null },
            };
          }
        })
      );

      try {
        await (session as any).sendToolResponse({ functionResponses: responses });
      } catch {
        // Session may have closed
      }
    },
    [addVoiceArtifact]
  );

  // ── Message Handler ─────────────────────────────────────────────────────────

  const handleMessage = useCallback(
    (
      msg: LiveServerMessage,
      conversationId: string,
      currentMode: AgentMode
    ) => {
      // Audio chunks (voice mode only)
      const candidates = (msg as any)?.serverContent?.modelTurn?.parts;
      let hasModelText = false;

      if (candidates) {
        isModelTurnActiveRef.current = true;
        // As soon as model responds, finalize any speech-to-text user turn
        finalizeUserTurn(conversationId);

        for (const part of candidates) {
          if (part?.inlineData?.mimeType?.startsWith("audio/") && part.inlineData.data) {
            if (currentMode === "voice") {
              audioManagerRef.current?.enqueueAudio(part.inlineData.data);
              setState("SPEAKING");
              stateRef.current = "SPEAKING";
            }
          }
          if (part?.text) {
            hasModelText = true;
            appendAssistantChunk(part.text);
            if (currentMode === "chat") {
              setState("IDLE");
            }
          }
        }
      }

      // Transcriptions (user voice speech-to-text)
      const inputTranscription = (msg as any)?.serverContent?.inputTranscription?.text;
      if (inputTranscription?.trim()) {
        isModelTurnActiveRef.current = true;
        appendUserChunk(inputTranscription);
        checkAndAddArtifactsFromText(inputTranscription);
      }

      // Output transcription (assistant voice text-to-speech)
      const outputTranscription = (msg as any)?.serverContent?.outputTranscription?.text;
      if (outputTranscription?.trim()) {
        if (!hasModelText) {
          appendAssistantChunk(outputTranscription);
        }
        checkAndAddArtifactsFromText(outputTranscription);
        if (currentMode === "chat") {
          setState("IDLE");
        }
      }

      // Fast responsiveness: in chat mode, as soon as text arrives, ensure state returns to IDLE
      if (currentMode === "chat" && (hasModelText || outputTranscription?.trim())) {
        if (chatThinkingTimerRef.current) clearTimeout(chatThinkingTimerRef.current);
        chatThinkingTimerRef.current = setTimeout(() => {
          setState("IDLE");
        }, 350);
      }

      // Extract spoken links & resources from any candidates text
      if (candidates && candidates.length > 0) {
        for (const part of candidates) {
          if (part?.text) {
            checkAndAddArtifactsFromText(part.text);
          }
        }
      }

      // Barge-in interruption (Gemini server-side VAD detected user voice)
      if ((msg as any)?.serverContent?.interrupted) {
        audioManagerRef.current?.handleInterrupted();
        finalizeAssistantTurn(conversationId);
        isModelTurnActiveRef.current = false;
        if (currentMode === "voice") {
          setState("LISTENING");
          stateRef.current = "LISTENING";
          checkAndExecutePendingDisconnect();
        } else {
          if (chatThinkingTimerRef.current) {
            clearTimeout(chatThinkingTimerRef.current);
            chatThinkingTimerRef.current = null;
          }
          setState("IDLE");
        }
      }

      // Generation complete (model finished generating all text/content — eliminates delay waiting for audio playback)
      if ((msg as any)?.serverContent?.generationComplete) {
        if (currentMode === "chat") {
          if (chatThinkingTimerRef.current) {
            clearTimeout(chatThinkingTimerRef.current);
            chatThinkingTimerRef.current = null;
          }
          setState("IDLE");
        }
      }

      // Turn complete
      if ((msg as any)?.serverContent?.turnComplete) {
        finalizeUserTurn(conversationId);
        finalizeAssistantTurn(conversationId);
        isModelTurnActiveRef.current = false;
        if (currentAssistantTextRef.current) {
          checkAndAddArtifactsFromText(currentAssistantTextRef.current);
        }
        if (currentMode === "voice") {
          if (!audioManagerRef.current?.getIsPlaying()) {
            setState("LISTENING");
            stateRef.current = "LISTENING";
          }
          checkAndExecutePendingDisconnect();
        } else {
          if (chatThinkingTimerRef.current) {
            clearTimeout(chatThinkingTimerRef.current);
            chatThinkingTimerRef.current = null;
          }
          setState("IDLE");
        }
      }

      // Tool calls
      const toolCall = (msg as any)?.toolCall;
      if (toolCall?.functionCalls?.length) {
        isModelTurnActiveRef.current = true;
        setState("THINKING");
        stateRef.current = "THINKING";
        const activeSession = sessionRef.current;
        if (activeSession) {
          handleToolCalls(
            toolCall.functionCalls,
            activeSession,
            sessionDataRef.current?.sessionId ?? ""
          );
        }
      }
    },
    [
      handleToolCalls,
      appendAssistantChunk,
      finalizeAssistantTurn,
      appendUserChunk,
      finalizeUserTurn,
      checkAndAddArtifactsFromText,
      checkAndExecutePendingDisconnect,
    ]
  );

  // ── Connect to Gemini Live ──────────────────────────────────────────────────

  const connectToGemini = useCallback(
    async (data: EphemeralTokenResponse, targetMode: AgentMode, genId?: number) => {
      const currentGen = genId ?? ++sessionGenerationRef.current;

      // Clean up previous audio manager & session before connecting new one
      if (audioManagerRef.current) {
        audioManagerRef.current.stop();
        audioManagerRef.current = null;
      }
      if (sessionRef.current) {
        try {
          void (sessionRef.current as any)?.close?.();
        } catch {}
        sessionRef.current = null;
      }

      sessionDataRef.current = data;
      setSessionData(data);
      queueDataRef.current = null;
      setQueueData(null);
      setMode(targetMode);

      try {
        // Authenticate with ephemeral token via apiKey with v1alpha
        const ai = new GoogleGenAI({
          apiKey: data.token,
          httpOptions: { apiVersion: "v1alpha" },
        });

        const session = await ai.live.connect({
          model: data.model || "gemini-3.1-flash-live-preview",
          config: {
            systemInstruction: {
              parts: [{ text: data.systemInstruction || "You are Kishore's portfolio AI assistant." }],
            },
            responseModalities: [Modality.AUDIO],
            tools: PORTFOLIO_TOOL_DECLARATIONS,
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            realtimeInputConfig: {
              automaticActivityDetection: {
                disabled: false,
              },
            },
          },
          callbacks: {
            onopen: () => {
              if (!isMounted.current || currentGen !== sessionGenerationRef.current) return;
              console.log("[AgentPanel] Live WebSocket connected");
            },
            onmessage: (msg: LiveServerMessage) => {
              if (!isMounted.current || currentGen !== sessionGenerationRef.current) return;

              // Live API sends setupComplete when constraints & session are ready
              if ((msg as any)?.setupComplete) {
                setState(targetMode === "voice" ? "LISTENING" : "IDLE");
                setView("active");

                if (targetMode === "voice" && data.voiceTimeoutSeconds) {
                  startVoiceTimer(data.voiceTimeoutSeconds, data.voiceWarningSeconds ?? 120);
                }
              }

              handleMessage(msg, data.conversationId, targetMode);
            },
            onerror: (err: unknown) => {
              console.error("[AgentPanel] WebSocket error:", err);
              if (!isMounted.current || currentGen !== sessionGenerationRef.current) return;
              stopVoiceTimer();
              setState("ERROR");
              setErrorMessage("Connection error. Please try again.");
              setView("error");
            },
            onclose: (e: unknown) => {
              console.log("[AgentPanel] WebSocket closed:", e);
              if (!isMounted.current || currentGen !== sessionGenerationRef.current) return;
              stopVoiceTimer();
              if (audioManagerRef.current) {
                audioManagerRef.current.stop();
                audioManagerRef.current = null;
              }
              sessionRef.current = null;
              setState("DISCONNECTED");
            },
          },
        });

        // Ensure generation hasn't changed while establishing connection
        if (!isMounted.current || currentGen !== sessionGenerationRef.current) {
          try {
            void (session as any)?.close?.();
          } catch {}
          return;
        }

        sessionRef.current = session;

        // Initialize and start audio manager if in voice mode
        if (targetMode === "voice" && isMounted.current && currentGen === sessionGenerationRef.current) {
          const audio = new AudioManager(session, (nextState) => {
            if (isMounted.current && currentGen === sessionGenerationRef.current) {
              setState(nextState);
              stateRef.current = nextState;
              if (nextState === "LISTENING") {
                checkAndExecutePendingDisconnect();
              }
            }
          });
          audio.onPlaybackComplete(() => {
            if (isMounted.current && currentGen === sessionGenerationRef.current) {
              checkAndExecutePendingDisconnect();
            }
          });
          audioManagerRef.current = audio;
          try {
            await audio.start();
            if (!isMounted.current || currentGen !== sessionGenerationRef.current) {
              audio.stop();
              return;
            }
            // In voice mode, prompt a concise, warm 1-sentence greeting
            (session as any).sendRealtimeInput({
              text: "Greet the visitor briefly in one friendly sentence and let them know you can answer any questions about Kishore's projects, skills, or background.",
            });
          } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : "";
            if (errMsg === "MIC_DENIED") {
              toast.warning("Microphone access denied — switching to Chat mode.");
              audioManagerRef.current = null;
              setMode("chat");
            }
          }
        }
      } catch (err) {
        console.error("[AgentPanel] Gemini connect error:", err);
        if (!isMounted.current || currentGen !== sessionGenerationRef.current) return;
        stopVoiceTimer();
        setState("ERROR");
        setErrorMessage("Could not reach the AI assistant. Please try again.");
        setView("error");
      }
    },
    [handleMessage, startVoiceTimer, stopVoiceTimer, checkAndExecutePendingDisconnect]
  );

  // ── Session Lifecycle ───────────────────────────────────────────────────────

  const startSession = useCallback(
    async (targetMode: AgentMode) => {
      if (!isMounted.current) return;

      // Invalidate any existing in-flight startup or callbacks
      const currentGen = ++sessionGenerationRef.current;

      pendingTimerDisconnectRef.current = false;
      isModelTurnActiveRef.current = false;
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
        safetyTimeoutRef.current = null;
      }
      setIsCompletingSentence(false);

      // Immediately tear down previous audio & socket
      stopVoiceTimer();
      if (chatThinkingTimerRef.current) {
        clearTimeout(chatThinkingTimerRef.current);
        chatThinkingTimerRef.current = null;
      }
      if (audioManagerRef.current) {
        audioManagerRef.current.stop();
        audioManagerRef.current = null;
      }
      if (sessionRef.current) {
        try {
          void (sessionRef.current as any)?.close?.();
        } catch {}
        sessionRef.current = null;
      }

      setMode(targetMode);
      if (targetMode === "voice") {
        AudioManager.unlock();
      }

      setState("CONNECTING");
      setView("connecting");
      currentAssistantTurnIdRef.current = null;
      currentAssistantTextRef.current = "";
      currentUserTurnIdRef.current = null;
      currentUserTextRef.current = "";
      setTranscript([]);
      setVoiceArtifacts([]);

      try {
        const res = await fetch("/api/ai/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: targetMode }),
        });

        if (!isMounted.current || currentGen !== sessionGenerationRef.current) return;

        const data = await res.json();

        if (!isMounted.current || currentGen !== sessionGenerationRef.current) return;

        if (res.status === 202 && data.queued) {
          // Voice slots full — show queue screen
          const qd: QueueData = {
            queueId: data.queueId,
            position: data.position,
            estimatedWaitSeconds: data.estimatedWaitSeconds,
            pollIntervalMs: data.pollIntervalMs ?? 3000,
          };
          queueDataRef.current = qd;
          setQueueData(qd);
          setView("queued");
          return;
        }

        if (!res.ok) {
          setErrorMessage(data.error ?? "Failed to start session");
          setView("error");
          setState("ERROR");
          return;
        }

        await connectToGemini(data as EphemeralTokenResponse, targetMode, currentGen);
      } catch (_err) {
        if (!isMounted.current || currentGen !== sessionGenerationRef.current) return;
        setErrorMessage("Could not connect. Please check your connection.");
        setView("error");
        setState("ERROR");
      }
    },
    [connectToGemini, stopVoiceTimer]
  );

  // ── Mode Switch ─────────────────────────────────────────────────────────────

  const handleSwitchMode = useCallback(
    async (newMode: AgentMode) => {
      await handleDisconnect();
      setMode(newMode);
      await startSession(newMode);
    },
    [handleDisconnect, startSession]
  );

  // ── Leave Queue Helper ──────────────────────────────────────────────────────

  const handleQueueLeave = useCallback(async () => {
    await leaveQueue();
    setView("connecting");
    void startSession("chat");
  }, [leaveQueue, startSession]);

  // ── Chat send ───────────────────────────────────────────────────────────────

  const handleSendText = useCallback(
    async (text: string) => {
      if (!sessionRef.current || !sessionData) return;
      // Finalize any prior assistant or user turn
      finalizeUserTurn(sessionData.conversationId);
      finalizeAssistantTurn(sessionData.conversationId);

      setState("THINKING");

      const userEntryId = crypto.randomUUID();
      setTranscript((prev) => [
        ...prev,
        { id: userEntryId, role: "user", content: text, timestamp: new Date() },
      ]);

      void fetch("/api/ai/conversation/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionData.sessionId,
          conversationId: sessionData.conversationId,
          role: "user",
          content: text,
        }),
      }).catch(() => {});

      try {
        await (sessionRef.current as any).sendRealtimeInput({ text });
      } catch {
        setState("ERROR");
      }
    },
    [sessionData, finalizeUserTurn, finalizeAssistantTurn]
  );

  // ── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    isMounted.current = true;
    if (isOpen) {
      void startSession(initialMode);
    }
    return () => {
      isMounted.current = false;
      sessionGenerationRef.current++;
      stopVoiceTimer();
      if (audioManagerRef.current) {
        audioManagerRef.current.stop();
        audioManagerRef.current = null;
      }
      const s = sessionRef.current;
      sessionRef.current = null;
      try {
        void (s as any)?.close?.();
      } catch {}
      void leaveQueue();
      void terminateCurrentSession();
    };
  }, [isOpen]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const q = queueDataRef.current;
      if (q) {
        e.preventDefault();
        e.returnValue = "You are currently waiting in line. Leaving will remove you from the queue.";
        fetch(`/api/ai/queue/${q.queueId}`, { method: "DELETE", keepalive: true });
        return e.returnValue;
      }
      const s = sessionDataRef.current;
      if (s) {
        fetch("/api/ai/session/terminate", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: s.sessionId,
            conversationId: s.conversationId,
          }),
          keepalive: true,
        });
      }
    };

    const handlePageHide = () => {
      const q = queueDataRef.current;
      if (q) {
        fetch(`/api/ai/queue/${q.queueId}`, { method: "DELETE", keepalive: true });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, []);

  if (!isOpen) return null;

  // ── Render ──────────────────────────────────────────────────────────────────

  const isTimerVisible =
    mode === "voice" &&
    (voiceSecondsLeft !== null || isCompletingSentence) &&
    ["LISTENING", "SPEAKING", "THINKING"].includes(state);

  return (
    <div
      className="
        fixed bottom-20 right-4 z-50
        flex flex-col
        w-[340px] sm:w-[380px] h-[520px]
        rounded-2xl border border-border
        bg-background/95 backdrop-blur-md
        shadow-2xl shadow-black/20
        overflow-hidden
      "
      role="dialog"
      aria-label="Kishore's AI Assistant"
      aria-modal="false"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-border px-3.5 py-2.5 shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <Bot className="h-4 w-4 text-primary" />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-sm font-semibold text-foreground leading-tight truncate">
            Kishore&apos;s AI Assistant
          </span>
          <span className="text-[10px] text-muted-foreground capitalize">
            {mode} mode
            {isTimerVisible && (
              <span
                className={
                  isCompletingSentence
                    ? "text-amber-500 font-medium ml-1 animate-pulse"
                    : voiceSecondsLeft !== null && voiceSecondsLeft < 120
                    ? "text-destructive font-medium ml-1"
                    : "ml-1 font-mono"
                }
              >
                · {isCompletingSentence ? "Finishing sentence..." : `${formatDuration(voiceSecondsLeft ?? 0)} left`}
              </span>
            )}
          </span>
        </div>
        <Button
          id="ai-panel-close"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground"
          onClick={handleRequestClose}
          aria-label="Close AI assistant"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Leave Queue Confirmation Modal */}
      {showLeaveQueueConfirm && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3.5 bg-background/95 backdrop-blur-md p-6 text-center animate-in fade-in-0 duration-150">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">Leave voice queue?</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You are currently waiting in line. If you leave or close this card, you will be removed from the queue and lose your spot.
            </p>
          </div>
          <div className="flex w-full gap-2.5 mt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => setShowLeaveQueueConfirm(false)}
            >
              Stay in Queue
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex-1 text-xs"
              onClick={handleConfirmLeaveAndClose}
            >
              Leave Queue
            </Button>
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {view === "queued" && queueData ? (
          <QueueWaiting
            queueId={queueData.queueId}
            initialPosition={queueData.position}
            initialWaitSeconds={queueData.estimatedWaitSeconds}
            pollIntervalMs={queueData.pollIntervalMs}
            onReady={(data) => connectToGemini(data, "voice")}
            onLeave={handleQueueLeave}
          />
        ) : view === "error" || state === "ERROR" ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <span className="text-3xl">⚠️</span>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
            <Button size="sm" variant="outline" onClick={() => startSession(mode)}>
              Try Again
            </Button>
          </div>
        ) : mode === "voice" ? (
          <VoiceVisualizer
            state={state}
            isMuted={isMuted}
            audioManager={audioManagerRef.current}
            artifacts={voiceArtifacts}
            projects={sessionData?.resources?.projects}
            onClearArtifacts={() => setVoiceArtifacts([])}
            onInterrupt={() => {
              audioManagerRef.current?.handleInterrupted();
              finalizeAssistantTurn(sessionDataRef.current?.conversationId ?? "");
              setState("LISTENING");
            }}
            onSelectSuggested={(query) => {
              if (isCompletingSentence) return;
              if (state !== "LISTENING" && state !== "SPEAKING" && state !== "THINKING") return;
              checkAndAddArtifactsFromText(query);
              if (sessionRef.current) {
                try {
                  (sessionRef.current as any).sendRealtimeInput({
                    text: `Please tell me about Kishore's ${query}.`,
                  });
                } catch {}
              }
            }}
          />
        ) : view === "connecting" && state === "CONNECTING" ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Starting chat session...</p>
          </div>
        ) : (
          <AgentTranscript entries={transcript} resources={sessionData?.resources} />
        )}
      </div>

      {/* Controls */}
      {(view === "active" || state === "DISCONNECTED" || (mode === "voice" && state === "CONNECTING")) && (
        <AgentControls
          mode={mode}
          state={state}
          isMuted={isMuted}
          disabled={false}
          onToggleMute={() => {
            if (isCompletingSentence) return;
            const next = !isMuted;
            setIsMuted(next);
            audioManagerRef.current?.setMuted(next);
          }}
          onSwitchMode={handleSwitchMode}
          onSendText={handleSendText}
          onDisconnect={handleDisconnect}
          onInterrupt={() => {
            audioManagerRef.current?.handleInterrupted();
            finalizeAssistantTurn(sessionDataRef.current?.conversationId ?? "");
            setState("LISTENING");
          }}
          onReconnect={() => void startSession(mode)}
        />
      )}
    </div>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
