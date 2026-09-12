"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// In React 19 / Turbopack, next-themes renders an inline <script> tag for theme flash (FOUC) prevention.
// React 19's client reconciler logs a console error when encountering an inline <script> in client components:
// "Encountered a script tag while rendering React component..."
// This warning is a known cosmetic artifact of next-themes in React 19. We filter out this specific warning.
if (typeof console !== "undefined" && typeof console.error === "function") {
  const originalError = console.error;
  console.error = function (...args: any[]) {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Encountered a script tag while rendering React component")
    ) {
      return;
    }
    originalError.apply(console, args);
  };
}

type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>;

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

