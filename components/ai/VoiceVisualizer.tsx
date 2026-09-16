/**
 * components/ai/VoiceVisualizer.tsx
 *
 * Authentic Gemini Live Voice Visualizer:
 * 1. Living, breathing organic fluid glowing orb / blob inspired by Google Gemini Live.
 * 2. Multi-stop iridescent gradients (Google Blue, Cyan, Purple, Fuchsia, White Core).
 * 3. Harmonic polar surface deformations modulated in real-time by mic & assistant audio metrics.
 * 4. Distinct dynamic states: LISTENING (breathing ripple), SPEAKING (vibrant dancing fluid light),
 *    THINKING (fast cosmic vortex with glowing orbital rings).
 * 5. Floating glassmorphic dock for fetched links, projects, and resources with direct redirectable links.
 */

"use client";

import { useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  ExternalLink,
  FileText,
  Code,
  Globe,
  X,
  Bot,
  BookOpen,
  Loader2,
  WifiOff,
  Radio,
} from "lucide-react";
import type { SessionState, FetchedArtifact, KnownPortfolioProject } from "@/types/ai";
import type { AudioManager } from "./AudioManager";

interface VoiceVisualizerProps {
  state: SessionState;
  isMuted: boolean;
  audioManager: AudioManager | null;
  artifacts: FetchedArtifact[];
  projects?: KnownPortfolioProject[];
  onClearArtifacts: () => void;
  onInterrupt?: () => void;
  onSelectSuggested?: (query: string) => void;
}

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

interface Particle {
  x: number;
  y: number;
  radius: number;
  angle: number;
  distance: number;
  speed: number;
  alpha: number;
  color: string;
}

export function VoiceVisualizer({
  state,
  isMuted,
  audioManager,
  artifacts,
  projects,
  onClearArtifacts,
  onInterrupt: _onInterrupt,
  onSelectSuggested,
}: VoiceVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Live Canvas Gemini Live Fluid Orb Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let time = 0;
    let smoothedVolume = 0;
    let rotation = 0;

    // Stardust aura micro-particles
    const particleColors = ["#00E5FF", "#4285F4", "#A855F7", "#EC4899", "#FFFFFF"];
    const particles: Particle[] = Array.from({ length: 28 }, () => ({
      x: 0,
      y: 0,
      radius: 0.8 + Math.random() * 1.6,
      angle: Math.random() * Math.PI * 2,
      distance: 35 + Math.random() * 65,
      speed: (0.003 + Math.random() * 0.007) * (Math.random() > 0.5 ? 1 : -1),
      alpha: 0.2 + Math.random() * 0.6,
      color: particleColors[Math.floor(Math.random() * particleColors.length)],
    }));

    const render = () => {
      // Audio metrics
      const metrics = audioManager?.getLiveAudioMetrics() ?? {
        volume: 0,
        frequencies: [],
      };

      const rawVol = isMuted && state === "LISTENING" ? 0 : metrics.volume;
      smoothedVolume += (rawVol - smoothedVolume) * 0.22;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      // Vertically center in the upper portion if artifacts are visible
      const centerY = artifacts.length > 0 ? height * 0.38 : height * 0.46;

      // Base radius and rotation speed based on state
      let baseRadius = 46;
      let rotSpeed = 0.015;
      let morphIntensity = 0.12;

      if (state === "SPEAKING") {
        baseRadius = 52 + smoothedVolume * 34;
        rotSpeed = 0.035;
        morphIntensity = 0.28 + smoothedVolume * 0.35;
      } else if (state === "LISTENING") {
        baseRadius = isMuted ? 42 : 46 + smoothedVolume * 36;
        rotSpeed = 0.018;
        morphIntensity = isMuted ? 0.06 : 0.14 + smoothedVolume * 0.32;
      } else if (state === "THINKING") {
        baseRadius = 40 + Math.sin(time * 3) * 4;
        rotSpeed = 0.065;
        morphIntensity = 0.24;
      } else if (state === "CONNECTING") {
        baseRadius = 44 + Math.sin(time * 3.5) * 3;
        rotSpeed = 0.04;
        morphIntensity = 0.16;
      } else if (state === "DISCONNECTED") {
        baseRadius = 38;
        rotSpeed = 0.005;
        morphIntensity = 0.04;
      }

      time += 0.03;
      rotation += rotSpeed;

      // ── 1. Cosmic Background Diffuse Bloom ──────────────────────────────────
      const bloomRadius = baseRadius * 2.8;
      const bloomGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        baseRadius * 0.2,
        centerX,
        centerY,
        bloomRadius
      );

      if (state === "SPEAKING") {
        bloomGrad.addColorStop(0, "rgba(168, 85, 247, 0.28)");
        bloomGrad.addColorStop(0.45, "rgba(59, 130, 246, 0.15)");
        bloomGrad.addColorStop(0.8, "rgba(236, 72, 153, 0.06)");
        bloomGrad.addColorStop(1, "transparent");
      } else if (state === "THINKING") {
        bloomGrad.addColorStop(0, "rgba(245, 158, 11, 0.25)");
        bloomGrad.addColorStop(0.5, "rgba(168, 85, 247, 0.14)");
        bloomGrad.addColorStop(1, "transparent");
      } else if (state === "CONNECTING") {
        bloomGrad.addColorStop(0, "rgba(59, 130, 246, 0.28)");
        bloomGrad.addColorStop(0.45, "rgba(14, 165, 233, 0.15)");
        bloomGrad.addColorStop(0.8, "rgba(99, 102, 241, 0.06)");
        bloomGrad.addColorStop(1, "transparent");
      } else if (isMuted) {
        bloomGrad.addColorStop(0, "rgba(239, 68, 68, 0.18)");
        bloomGrad.addColorStop(0.6, "rgba(239, 68, 68, 0.05)");
        bloomGrad.addColorStop(1, "transparent");
      } else if (state === "DISCONNECTED") {
        bloomGrad.addColorStop(0, "rgba(100, 116, 139, 0.14)");
        bloomGrad.addColorStop(0.6, "rgba(71, 85, 105, 0.04)");
        bloomGrad.addColorStop(1, "transparent");
      } else {
        bloomGrad.addColorStop(0, "rgba(0, 229, 255, 0.25)");
        bloomGrad.addColorStop(0.45, "rgba(66, 133, 244, 0.14)");
        bloomGrad.addColorStop(0.8, "rgba(168, 85, 247, 0.05)");
        bloomGrad.addColorStop(1, "transparent");
      }

      ctx.fillStyle = bloomGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, bloomRadius, 0, Math.PI * 2);
      ctx.fill();

      // ── 2. Ambient Stardust Micro-particles ─────────────────────────────────
      for (const p of particles) {
        p.angle += p.speed * (state === "SPEAKING" ? 1.8 : state === "CONNECTING" ? 1.4 : 1);
        const dynamicDist = p.distance + smoothedVolume * 22;
        const px = centerX + Math.cos(p.angle) * dynamicDist;
        const py = centerY + Math.sin(p.angle) * dynamicDist;

        ctx.beginPath();
        ctx.arc(px, py, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha * (0.6 + smoothedVolume * 0.4);
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
      }

      // ── 3. Connecting Radar Beacon Waves ────────────────────────────────────
      if (state === "CONNECTING") {
        ctx.save();
        for (let wave = 0; wave < 3; wave++) {
          const wavePhase = (time * 0.65 + wave * 0.33) % 1.0;
          const waveRadius = baseRadius * (1 + wavePhase * 1.5);
          const waveAlpha = (1 - wavePhase) * 0.45;
          ctx.beginPath();
          ctx.arc(centerX, centerY, waveRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(59, 130, 246, ${waveAlpha})`;
          ctx.lineWidth = 1.4;
          ctx.stroke();
        }
        ctx.restore();
      }

      // ── 4. Thinking Orbital Rings ───────────────────────────────────────────
      if (state === "THINKING") {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(time * 1.5);
        ctx.beginPath();
        ctx.ellipse(0, 0, baseRadius * 1.35, baseRadius * 0.85, Math.PI / 4, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(0, 229, 255, 0.45)";
        ctx.lineWidth = 1.8;
        ctx.shadowColor = "#00E5FF";
        ctx.shadowBlur = 8;
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(0, 0, baseRadius * 1.5, baseRadius * 0.7, -Math.PI / 3, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(236, 72, 153, 0.4)";
        ctx.lineWidth = 1.5;
        ctx.shadowColor = "#EC4899";
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.restore();
      }

      // ── 5. Gemini Organic Fluid Morphing Blob ──────────────────────────────
      const steps = 72;
      const points: { x: number; y: number }[] = [];

      for (let i = 0; i < steps; i++) {
        const theta = (i / steps) * Math.PI * 2;

        // Multi-frequency harmonic surface equation
        const h1 = Math.sin(2 * theta + rotation * 2.5) * 0.35;
        const h2 = Math.sin(3 * theta - rotation * 1.8) * 0.25;
        const h3 = Math.cos(5 * theta + time * 2) * 0.18;
        const h4 = Math.sin(7 * theta - time * 3) * 0.10;

        const deformation = (h1 + h2 + h3 + h4) * morphIntensity;
        const r = Math.max(15, baseRadius * (1 + deformation));

        points.push({
          x: centerX + Math.cos(theta) * r,
          y: centerY + Math.sin(theta) * r,
        });
      }

      // Draw smooth closed bezier curve through points
      ctx.beginPath();
      ctx.moveTo((points[0].x + points[steps - 1].x) / 2, (points[0].y + points[steps - 1].y) / 2);

      for (let i = 0; i < steps; i++) {
        const next = points[(i + 1) % steps];
        const midX = (points[i].x + next.x) / 2;
        const midY = (points[i].y + next.y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
      }
      ctx.closePath();

      // Dynamic rotating iridescent multi-layer gradient
      const gradAngle = rotation;
      const gradX1 = centerX + Math.cos(gradAngle) * baseRadius;
      const gradY1 = centerY + Math.sin(gradAngle) * baseRadius;
      const gradX2 = centerX - Math.cos(gradAngle) * baseRadius;
      const gradY2 = centerY - Math.sin(gradAngle) * baseRadius;

      const blobGrad = ctx.createLinearGradient(gradX1, gradY1, gradX2, gradY2);

      if (state === "SPEAKING") {
        blobGrad.addColorStop(0, "#4285F4"); // Google Blue
        blobGrad.addColorStop(0.3, "#00E5FF"); // Cyan
        blobGrad.addColorStop(0.65, "#A855F7"); // Purple
        blobGrad.addColorStop(1, "#EC4899"); // Magenta
      } else if (state === "THINKING") {
        blobGrad.addColorStop(0, "#F59E0B"); // Amber
        blobGrad.addColorStop(0.4, "#EC4899"); // Pink
        blobGrad.addColorStop(0.8, "#8B5CF6"); // Violet
        blobGrad.addColorStop(1, "#00E5FF"); // Cyan
      } else if (state === "CONNECTING") {
        blobGrad.addColorStop(0, "#3B82F6"); // Blue
        blobGrad.addColorStop(0.35, "#00E5FF"); // Cyan
        blobGrad.addColorStop(0.7, "#6366F1"); // Indigo
        blobGrad.addColorStop(1, "#8B5CF6"); // Violet
      } else if (state === "DISCONNECTED") {
        blobGrad.addColorStop(0, "#475569"); // Slate
        blobGrad.addColorStop(0.5, "#334155");
        blobGrad.addColorStop(1, "#1E293B");
      } else if (isMuted) {
        blobGrad.addColorStop(0, "#EF4444"); // Red
        blobGrad.addColorStop(0.5, "#F97316"); // Orange
        blobGrad.addColorStop(1, "#DC2626"); // Dark Red
      } else {
        blobGrad.addColorStop(0, "#00E5FF"); // Electric Cyan
        blobGrad.addColorStop(0.35, "#38BDF8"); // Sky
        blobGrad.addColorStop(0.7, "#4285F4"); // Google Blue
        blobGrad.addColorStop(1, "#8B5CF6"); // Purple
      }

      ctx.fillStyle = blobGrad;
      ctx.shadowColor =
        state === "SPEAKING"
          ? "#A855F7"
          : state === "CONNECTING"
          ? "#3B82F6"
          : state === "DISCONNECTED"
          ? "#475569"
          : isMuted
          ? "#EF4444"
          : "#00E5FF";
      ctx.shadowBlur = state === "DISCONNECTED" ? 6 : 18 + smoothedVolume * 22;
      ctx.fill();
      ctx.shadowBlur = 0;

      // ── 6. Inner Luminous Core (White/Cyan Star Glow) ───────────────────────
      const coreRadius = Math.max(12, baseRadius * 0.42 + smoothedVolume * 14);
      const coreGrad = ctx.createRadialGradient(
        centerX - baseRadius * 0.15,
        centerY - baseRadius * 0.15,
        2,
        centerX,
        centerY,
        coreRadius
      );
      if (state === "DISCONNECTED") {
        coreGrad.addColorStop(0, "rgba(255, 255, 255, 0.4)");
        coreGrad.addColorStop(0.5, "rgba(148, 163, 184, 0.2)");
        coreGrad.addColorStop(1, "transparent");
      } else if (state === "CONNECTING") {
        coreGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
        coreGrad.addColorStop(0.35, "rgba(191, 219, 254, 0.7)");
        coreGrad.addColorStop(0.7, "rgba(59, 130, 246, 0.35)");
        coreGrad.addColorStop(1, "transparent");
      } else {
        coreGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
        coreGrad.addColorStop(0.35, "rgba(255, 255, 255, 0.65)");
        coreGrad.addColorStop(0.7, "rgba(0, 229, 255, 0.35)");
        coreGrad.addColorStop(1, "transparent");
      }

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
      ctx.fill();

      // Shimmering outer edge highlight
      ctx.strokeStyle = state === "DISCONNECTED" ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 0.45)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [state, isMuted, audioManager, artifacts.length]);

  return (
    <div
      ref={containerRef}
      className="relative flex flex-1 flex-col justify-between overflow-hidden px-4 py-3 select-none"
    >
      {/* Top Status & Audio Mode Indicator */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          {state === "SPEAKING" ? (
            <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-sm backdrop-blur-md">
              <Volume2 className="h-3.5 w-3.5 animate-bounce text-purple-400" />
              <span>Gemini Speaking</span>
            </div>
          ) : state === "THINKING" ? (
            <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 animate-spin text-amber-400" />
              <span>Looking Up Details</span>
            </div>
          ) : state === "LISTENING" ? (
            <div
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border shadow-sm backdrop-blur-md ${
                isMuted
                  ? "bg-destructive/10 text-destructive border-destructive/20"
                  : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
              }`}
            >
              {isMuted ? (
                <>
                  <MicOff className="h-3.5 w-3.5 text-destructive" />
                  <span>Mic Muted</span>
                </>
              ) : (
                <>
                  <Mic className="h-3.5 w-3.5 animate-pulse text-cyan-400" />
                  <span>Listening Live</span>
                </>
              )}
            </div>
          ) : state === "CONNECTING" ? (
            <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-sm backdrop-blur-md animate-pulse">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
              <span>Connecting Voice...</span>
            </div>
          ) : state === "DISCONNECTED" ? (
            <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-muted/60 text-muted-foreground border border-border/60 backdrop-blur-md">
              <WifiOff className="h-3.5 w-3.5 text-muted-foreground/80" />
              <span>Session Inactive</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary border border-primary/20 backdrop-blur-md">
              <Bot className="h-3.5 w-3.5" />
              <span>Voice Ready</span>
            </div>
          )}
        </div>

        {artifacts.length > 0 && (
          <button
            onClick={onClearArtifacts}
            className="text-[11px] text-muted-foreground/70 hover:text-foreground flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
            title="Clear fetched artifacts"
          >
            <span>Clear Cards</span>
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Main Gemini Live Organic Orb Canvas */}
      <div className="relative flex-1 flex flex-col items-center justify-center min-h-[160px]">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Ambient status hint under orb */}
        <div className="relative z-10 mt-28 flex flex-col items-center gap-1.5 pointer-events-none px-4 text-center">
          <p className="text-xs text-foreground/80 font-medium text-center tracking-wide">
            {state === "SPEAKING"
              ? "Speaking response..."
              : state === "THINKING"
              ? "Searching verified portfolio..."
              : state === "CONNECTING"
              ? "Connecting to live voice assistant..."
              : state === "DISCONNECTED"
              ? "Voice session disconnected"
              : isMuted
              ? "Microphone is muted"
              : "Ask about Kishore's projects, resume, or background"}
          </p>
          {state === "CONNECTING" && (
            <div className="flex items-center gap-1.5 text-[10px] text-blue-400 font-medium animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping" />
              <span>Initializing real-time audio pipeline...</span>
            </div>
          )}
          {state === "DISCONNECTED" && (
            <p className="text-[10px] text-muted-foreground/70">
              Tap Reconnect below to resume speaking
            </p>
          )}
          {state === "SPEAKING" && (
            <p className="text-[10px] text-muted-foreground/70">
              Speak anytime to interrupt
            </p>
          )}
          {state === "LISTENING" && !isMuted && (
            <p className="text-[10px] text-muted-foreground/60">
              Speak naturally · Ask about experience, skills, or projects
            </p>
          )}
        </div>
      </div>

      {/* Fetched Links & Artifacts Dock */}
      {artifacts.length > 0 ? (
        <div className="z-10 flex flex-col gap-2 max-h-[190px] overflow-y-auto pr-1 scrollbar-thin mt-2">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[11px] font-semibold tracking-wide uppercase text-primary/80 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-primary" />
              <span>Verified Resources ({artifacts.length})</span>
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {artifacts.map((art) => (
              <div
                key={art.id}
                className="
                  flex items-center justify-between gap-3 rounded-xl
                  border border-border/80 bg-card/90 backdrop-blur-xl
                  p-3 shadow-md hover:border-primary/50 transition-all
                  animate-in fade-in slide-in-from-bottom-2 duration-300
                "
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                    {art.type === "resume" ? (
                      <FileText className="h-4 w-4 text-rose-500" />
                    ) : art.type === "github" ? (
                      <GithubIcon className="h-4 w-4 text-foreground" />
                    ) : art.type === "leetcode" ? (
                      <Code className="h-4 w-4 text-amber-500" />
                    ) : art.type === "linkedin" ? (
                      <LinkedinIcon className="h-4 w-4 text-blue-500" />
                    ) : art.type === "blog" ? (
                      <BookOpen className="h-4 w-4 text-indigo-400" />
                    ) : (
                      <Globe className="h-4 w-4 text-emerald-500" />
                    )}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-foreground truncate">
                      {art.title}
                    </span>
                    {art.meta && (
                      <span className="text-[10px] text-muted-foreground truncate">
                        {art.meta}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={art.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                      inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium
                      bg-primary text-primary-foreground shadow-xs hover:bg-primary/90
                      transition-all cursor-pointer
                    "
                  >
                    <span>Open</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>

                  {art.secondaryUrl && (
                    <a
                      href={art.secondaryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="
                        inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium
                        border border-border hover:bg-muted text-foreground
                        transition-all cursor-pointer
                      "
                    >
                      <span>{art.secondaryLabel || "Live Demo"}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : state === "CONNECTING" ? (
        /* Connecting State Card */
        <div className="z-10 flex flex-col items-center gap-2.5 px-4 py-3 rounded-2xl bg-card/60 border border-blue-500/25 backdrop-blur-md max-w-[320px] mx-auto text-center shadow-lg shadow-blue-500/5 animate-in fade-in-0 duration-300">
          <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold">
            <Radio className="h-4 w-4 animate-pulse text-blue-400" />
            <span>Establishing Live Voice Channel</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Connecting to voice agent WebSocket & starting audio pipeline. You will be able to speak freely in moments.
          </p>
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping" />
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce" />
          </div>
        </div>
      ) : state === "DISCONNECTED" ? (
        /* Disconnected State Card */
        <div className="z-10 flex flex-col items-center gap-2 px-4 py-3 rounded-2xl bg-card/50 border border-border/70 backdrop-blur-md max-w-[300px] mx-auto text-center animate-in fade-in-0 duration-300">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
            <WifiOff className="h-3.5 w-3.5" />
            <span>Voice Session Inactive</span>
          </div>
          <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
            Ready to talk? Tap <span className="font-semibold text-foreground">Reconnect</span> below to restart the voice session.
          </p>
        </div>
      ) : (
        /* Suggested One-Tap Quick Queries (Active Session) */
        <div className="z-10 flex flex-col items-center gap-1.5 pb-1 animate-in fade-in-0 duration-200">
          <span className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground/60">
            Tap to View or Ask
          </span>
          <div className="flex flex-wrap justify-center gap-1.5">
            {[
              { label: "Resume", query: "resume" },
              { label: "Projects", query: "projects" },
              ...(projects && projects.length > 0
                ? projects.slice(0, 2).map((p) => ({
                    label: p.title.split(/[:—–-]/)[0].trim(),
                    query: p.title,
                  }))
                : []),
              { label: "Blog Posts", query: "blog posts" },
              { label: "Skills", query: "skills" },
              { label: "GitHub", query: "github" },
              { label: "LeetCode", query: "leetcode" },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => onSelectSuggested?.(item.query)}
                className="
                  rounded-full border border-border/70 bg-card/60 backdrop-blur-md
                  px-2.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground
                  hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer
                "
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
