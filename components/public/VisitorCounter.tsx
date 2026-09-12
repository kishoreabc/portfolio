"use client";

import { useEffect, useState, useRef, useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

/**
 * Hook to smoothly animate a number count-up with ease-out curve
 */
function useCountUp(target: number | null, duration: number = 1000) {
  const [current, setCurrent] = useState<number>(0);
  const prevTarget = useRef<number>(0);

  useEffect(() => {
    if (target === null) return;

    const start = prevTarget.current;
    const diff = target - start;
    if (diff === 0) {
      setCurrent(target);
      return;
    }

    let startTime: number | null = null;
    let animationFrameId: number;

    const frame = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out quart
      const ease = 1 - Math.pow(1 - progress, 4);
      setCurrent(Math.round(start + diff * ease));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(frame);
      } else {
        prevTarget.current = target;
      }
    };

    animationFrameId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animationFrameId);
  }, [target, duration]);

  return current;
}

export function VisitorCounter() {
  const [count, setCount] = useState<number | null>(null);
  const mounted = useMounted();
  const animatedCount = useCountUp(count, 1200);

  useEffect(() => {
    const recordVisit = async () => {
      try {
        const DEBOUNCE_KEY = "portfolio_last_visit_time";
        const lastVisit = sessionStorage.getItem(DEBOUNCE_KEY);
        const now = Date.now();

        // Allow views to increment dynamically on each visit/reload with a 2.5s anti-spam debounce
        const shouldIncrement = !lastVisit || now - Number(lastVisit) > 2500;

        if (shouldIncrement) {
          sessionStorage.setItem(DEBOUNCE_KEY, now.toString());
          const res = await fetch("/api/visitors", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
          if (res.ok) {
            const data = await res.json();
            setCount(data.totalVisits);
            return;
          }
        }

        // Otherwise fetch latest count
        const res = await fetch("/api/visitors", { method: "GET" });
        if (res.ok) {
          const data = await res.json();
          setCount(data.totalVisits);
        }
      } catch (err) {
        console.error("[VisitorCounter] Error recording visit:", err);
      }
    };

    recordVisit();
  }, []);

  return (
    <div
      className="relative group inline-flex items-center gap-1.5 sm:gap-2 h-9 px-2.5 sm:px-3 rounded-full bg-card/60 hover:bg-card/90 backdrop-blur-md border border-border/70 hover:border-primary/50 shadow-xs hover:shadow-md hover:shadow-primary/10 hover:scale-[1.02] transition-all duration-300 select-none cursor-default overflow-hidden shrink-0"
      title={`Total Site Visitors: ${count !== null ? count.toLocaleString() : "Loading..."}`}
      aria-label="Total site visitors counter"
    >
      {/* Subtle top edge neon line */}
      <span className="pointer-events-none absolute -top-px left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-70 group-hover:opacity-100 transition-opacity" />

      {/* Ambient background hover glow */}
      <span className="pointer-events-none absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-primary/10 via-transparent to-primary/10" />

      
      <div className="relative flex items-center justify-center w-2 h-2 ml-0.5 shrink-0" aria-hidden="true">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.9)]" />
      </div>

      {/* Live animated numeric counter */}
      <div className="flex items-baseline gap-1 font-mono shrink-0">
        {mounted && count !== null ? (
          <span className="font-bold text-xs sm:text-[13px] tracking-tight text-foreground whitespace-nowrap">
            {animatedCount.toLocaleString()}
          </span>
        ) : (
          <span className="inline-block w-5 h-3.5 bg-muted/60 rounded-xs animate-pulse" />
        )}

        {/* Visitors tag - visible on mobile as requested */}
        <span className="text-[10px] font-sans font-medium text-muted-foreground/80 group-hover:text-muted-foreground transition-colors whitespace-nowrap inline">
          visitors
        </span>
      </div>

      {/* Pulsing live radar beacon */}
    </div>
  );
}
