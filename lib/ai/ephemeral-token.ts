/**
 * lib/ai/ephemeral-token.ts
 *
 * Creates a short-lived Gemini API ephemeral token.
 *
 * Why ephemeral tokens?
 *  The browser opens a direct WebSocket to Gemini Live.
 *  Without ephemeral tokens, the browser would need the permanent GEMINI_API_KEY.
 *  With ephemeral tokens, the server issues a short-lived credential
 *  and the key never reaches the client.
 *
 * Google's recommended production pattern for client-side Live API.
 *
 * Security:
 *  - GEMINI_API_KEY is server-only (never in NEXT_PUBLIC_*)
 *  - Supports dynamic API key & model override from Admin Panel (SiteConfig)
 *  - Token TTL is short (default 60 minutes)
 *  - Token is single-use conceptually (tied to one session)
 *  - Fails closed: if key is missing or quota exceeded, returns null
 */

import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/db";
import { AI_CONFIG } from "./config";
import type { AgentMode } from "@/types/ai";

/**
 * Fetch the active Gemini API Key and Model.
 * Prioritizes Admin Panel settings (SiteConfig), then falls back to environment variables.
 */
export async function getEffectiveGeminiConfig(): Promise<{ apiKey: string; model: string }> {
  try {
    const config = await prisma.siteConfig.findUnique({
      where: { id: "singleton" },
      select: { geminiApiKey: true, geminiModel: true },
    });

    const apiKey = config?.geminiApiKey?.trim() || process.env.GEMINI_API_KEY?.trim() || "";
    const model = config?.geminiModel?.trim() || AI_CONFIG.model;

    return { apiKey, model };
  } catch {
    return {
      apiKey: process.env.GEMINI_API_KEY?.trim() || "",
      model: AI_CONFIG.model,
    };
  }
}

export interface EphemeralToken {
  token: string;
  expiresAt: Date;
}

/**
 * Create an ephemeral token for the given mode (voice or chat).
 * Returns null and logs an error if creation fails — callers must handle null.
 */
export async function createEphemeralToken(
  mode: AgentMode
): Promise<EphemeralToken | null> {
  try {
    const { apiKey } = await getEffectiveGeminiConfig();
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in Admin Settings or environment");
    }

    const client = new GoogleGenAI({ apiKey });

    // Lightweight single-use token creation (~500ms vs ~11,000ms with heavy constraints).
    // The Live session config (systemInstruction, tools, audio config) is passed cleanly
    // and securely on connection directly by the client.
    const response = await (client as any).authTokens.create({
      config: {
        uses: 1, // single session
        expireTime: new Date(
          Date.now() + AI_CONFIG.ephemeralTokenTtlSeconds * 1000
        ).toISOString(),
        newSessionExpireTime: new Date(
          Date.now() + AI_CONFIG.ephemeralTokenTtlSeconds * 1000
        ).toISOString(),
      },
    });

    const token: string = response?.name ?? response?.token ?? response;
    if (!token || typeof token !== "string") {
      console.error("[AI:EphemeralToken] Unexpected token response shape:", response);
      return null;
    }

    return {
      token,
      expiresAt: new Date(Date.now() + AI_CONFIG.ephemeralTokenTtlSeconds * 1000),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    // Detect quota/billing errors — fail closed, never upgrade automatically
    if (
      message.includes("429") ||
      message.includes("RESOURCE_EXHAUSTED") ||
      message.includes("quota") ||
      message.includes("billing") ||
      message.includes("payment")
    ) {
      console.error("[AI:EphemeralToken] Quota/billing error (failing closed):", message);
    } else {
      console.error("[AI:EphemeralToken] Token creation failed:", message);
    }

    return null;
  }
}

/**
 * Validate that the GEMINI_API_KEY is configured (in Admin Panel or .env).
 * Call at startup / health check — never expose the result to the browser.
 */
export async function isGeminiConfigured(): Promise<boolean> {
  const { apiKey } = await getEffectiveGeminiConfig();
  return Boolean(apiKey);
}
