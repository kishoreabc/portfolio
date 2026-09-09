"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "motion/react";
import { Eye } from "lucide-react";

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

    const startTime = performance.now();

    const frame = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Exponential ease-out
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const val = Math.round(start + diff * ease);
      setCurrent(val);

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        setCurrent(target);
        prevTarget.current = target;
      }
    };

    requestAnimationFrame(frame);
  }, [target, duration]);

  return current;
}

export function VisitorCounter() {
  const [count, setCount] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const animatedCount = useCountUp(count, 1200);

  useEffect(() => {
    setMounted(true);

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

    // Live dynamic polling every 6 seconds so live views update in real-time
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch("/api/visitors", { method: "GET" });
        if (res.ok) {
          const data = await res.json();
          setCount((prev) => (data.totalVisits !== prev ? data.totalVisits : prev));
        }
      } catch {}
    }, 6000);

    // Refresh immediately when tab gains focus or visibility
    const handleSync = async () => {
      if (document.visibilityState === "visible") {
        try {
          const res = await fetch("/api/visitors", { method: "GET" });
          if (res.ok) {
            const data = await res.json();
            setCount((prev) => (data.totalVisits !== prev ? data.totalVisits : prev));
          }
        } catch {}
      }
    };

    document.addEventListener("visibilitychange", handleSync);
    window.addEventListener("focus", handleSync);

    return () => {
      clearInterval(pollInterval);
      document.removeEventListener("visibilitychange", handleSync);
      window.removeEventListener("focus", handleSync);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: -2 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ scale: 1.04, y: -1 }}
      className="relative group inline-flex items-center gap-2 h-9 px-3 rounded-full bg-card/60 hover:bg-card/90 backdrop-blur-md border border-border/70 hover:border-primary/50 shadow-xs hover:shadow-md hover:shadow-primary/10 transition-all duration-300 select-none cursor-default overflow-hidden"
      title={`Total Site Visits: ${count !== null ? count.toLocaleString() : "Loading..."}`}
      aria-label="Total site visits counter"
    >
      {/* Subtle top edge neon line */}
      <span className="pointer-events-none absolute -top-px left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-70 group-hover:opacity-100 transition-opacity" />

      {/* Ambient background hover glow */}
      <span className="pointer-events-none absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-primary/10 via-transparent to-primary/10" />

      
      <div className="relative flex items-center justify-center w-2 h-2 ml-0.5" aria-hidden="true">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.9)]" />
      </div>

      {/* Live animated numeric counter */}
      <div className="flex items-baseline gap-1 font-mono">
        {mounted && count !== null ? (
          <motion.span
            key="counter"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-bold text-xs sm:text-[13px] tracking-tight text-foreground"
          >
            {animatedCount.toLocaleString()}
          </motion.span>
        ) : (
          <span className="inline-block w-5 h-3.5 bg-muted/60 rounded-xs animate-pulse" />
        )}

        {/* Small uppercase tag */}
        <span className="text-[10px] font-sans font-medium uppercase tracking-wider text-muted-foreground/70 group-hover:text-muted-foreground transition-colors hidden sm:inline">
          visits
        </span>
      </div>

      {/* Pulsing live radar beacon */}
    </motion.div>
  );
}
