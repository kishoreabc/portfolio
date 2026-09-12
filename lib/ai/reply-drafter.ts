import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/db";
import crypto from "crypto";

export interface DraftReplyInput {
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
}

/**
 * Automatically drafts an articulate, warm, professional email reply
 * using Gemini on behalf of Kishore R.
 *
 * If Gemini fails or API key is not configured, provides a high quality
 * professional fallback template so email delivery never breaks.
 */
export async function draftProfessionalReply({
  senderName,
  senderEmail,
  subject,
  message,
}: DraftReplyInput): Promise<string> {
  const fallbackReply = `Hi ${senderName || "there"},

Thank you for reaching out through my portfolio regarding "${subject || "your inquiry"}".

I have received your message and will review the details shortly. I will get back to you as soon as possible to discuss further.

Best regards,
Kishore R`;

  try {
    const config = await prisma.siteConfig.findUnique({
      where: { id: "singleton" },
      select: { geminiApiKey: true, geminiModel: true },
    });

    const apiKey = config?.geminiApiKey?.trim() || process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      console.warn("[ReplyDrafter] No Gemini API key found, using fallback reply.");
      return fallbackReply;
    }

    let model = (
      config?.geminiModel?.trim() ||
      process.env.GEMINI_MODEL?.trim() ||
      "gemini-3.6-flash"
    ).toLowerCase();

    // Models with "live" only support WebSockets (bidiGenerateContent)
    if (model.includes("live") || model.includes("2.5")) {
      model = "gemini-3.6-flash";
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are assisting Kishore R, a passionate AI/ML and Generative AI Engineer (portfolio: www.kishoreabc.dev).
A visitor sent the following message through Kishore's portfolio contact form:

Sender Name: ${senderName}
Sender Email: ${senderEmail}
Subject: ${subject}
Message:
"""
${message}
"""

Tone / Purpose: Polite, articulate, warm, and professional. Express genuine appreciation for reaching out and invite further constructive conversation or collaboration.

Draft a natural, direct email reply from Kishore R to ${senderName}.
Guidelines:
- Address ${senderName} warmly by first name.
- Respond directly and thoughtfully to the content, questions, and intent of their message.
- Do NOT use bracketed placeholders like [Your Name] or [Phone Number].
- Sign off cleanly as:
Best regards,
Kishore R

Output ONLY the ready-to-send email body text (no markdown, no quotes, no subject line, no JSON).`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    const replyText = response.text?.trim();
    return replyText && replyText.length > 20 ? replyText : fallbackReply;
  } catch (err) {
    console.error("[ReplyDrafter] Error drafting reply with Gemini:", err);
    return fallbackReply;
  }
}

/**
 * Creates a secure HMAC token for 1-click email reply links.
 */
export function createReplyToken(messageId: string, senderEmail: string): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "portfolio-reply-auth-secret";
  return crypto
    .createHmac("sha256", secret)
    .update(`${messageId}:${senderEmail.trim().toLowerCase()}`)
    .digest("hex");
}

/**
 * Validates the HMAC token.
 */
export function verifyReplyToken(messageId: string, senderEmail: string, token: string): boolean {
  if (!token || typeof token !== "string") return false;
  const expected = createReplyToken(messageId, senderEmail);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(token, "hex"));
  } catch {
    return false;
  }
}
