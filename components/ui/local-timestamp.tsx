"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

export interface LocalTimestampProps {
  date: string | number | Date | null | undefined;
  format?: "short" | "full" | "time" | "date" | "shortDate";
  className?: string;
}

/**
 * Renders an ISO date string or Date object in the user's local browser timezone.
 * Defaults to "Asia/Kolkata" (IST, UTC+5:30) on the server to ensure SSR matches
 * the portfolio owner's timezone without hydration warnings or UTC drift.
 */
export function LocalTimestamp({
  date,
  format = "short",
  className,
}: LocalTimestampProps) {
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);

  if (!date) return null;
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (isNaN(d.getTime())) return null;

  const getFormatOptions = (timeZone?: string): Intl.DateTimeFormatOptions => {
    switch (format) {
      case "time":
        return {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
          ...(timeZone ? { timeZone } : {}),
        };
      case "full":
        return {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          ...(timeZone ? { timeZone } : {}),
        };
      case "date":
        return {
          month: "short",
          day: "numeric",
          year: "numeric",
          ...(timeZone ? { timeZone } : {}),
        };
      case "shortDate":
        return {
          month: "short",
          day: "numeric",
          ...(timeZone ? { timeZone } : {}),
        };
      case "short":
      default:
        return {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          ...(timeZone ? { timeZone } : {}),
        };
    }
  };

  // Pre-render in IST (Asia/Kolkata) on server so SSR matches Indian Standard Time (UTC+5:30)
  const serverText = d.toLocaleString("en-US", getFormatOptions("Asia/Kolkata"));

  // On client, format in the visitor's local browser timezone and locale
  const displayText = isClient
    ? d.toLocaleString(undefined, getFormatOptions())
    : serverText;

  const fullTooltip = isClient
    ? d.toLocaleString(undefined, { dateStyle: "full", timeStyle: "long" })
    : serverText;

  return (
    <time
      dateTime={d.toISOString()}
      title={fullTooltip}
      suppressHydrationWarning
      className={className}
    >
      {displayText}
    </time>
  );
}
