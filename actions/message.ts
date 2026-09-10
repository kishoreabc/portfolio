"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { revalidatePath } from "next/cache";

export async function markMessageRead(id: string, read: boolean = true) {
  await requireAdmin();

  await prisma.contactMessage.update({
    where: { id },
    data: { read },
  });

  revalidatePath("/admin/messages");
  revalidatePath("/admin");
  return { success: true };
}

export async function softDeleteMessage(id: string) {
  await requireAdmin();

  await prisma.contactMessage.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/admin/messages");
  revalidatePath("/admin");
  return { success: true };
}

export async function restoreMessage(id: string) {
  await requireAdmin();

  await prisma.contactMessage.update({
    where: { id },
    data: { deletedAt: null },
  });

  revalidatePath("/admin/messages");
  revalidatePath("/admin");
  return { success: true };
}

import { GoogleGenAI } from "@google/genai";
import { sendDirectReplyEmail } from "@/lib/email";

export async function generateMessageReplySuggestion({
  senderName,
  senderEmail,
  subject,
  message,
  tone = "professional",
  customInstruction = "",
  apiKey,
  model,
}: {
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
  tone?: "professional" | "collaboration" | "technical" | "brief" | "decline";
  customInstruction?: string;
  apiKey?: string;
  model?: string;
}) {
  await requireAdmin();

  const config = await prisma.siteConfig.findUnique({
    where: { id: "singleton" },
    select: { geminiApiKey: true, geminiModel: true },
  });

  const effectiveKey = apiKey?.trim() || config?.geminiApiKey?.trim() || process.env.GEMINI_API_KEY?.trim();
  if (!effectiveKey) {
    return {
      success: false,
      needsApiKey: true,
      error: "Gemini API key is required. Please configure it in Admin Settings (Profile & Config) or .env.local.",
    };
  }

  const effectiveModel = (
    model?.trim() ||
    config?.geminiModel?.trim() ||
    process.env.GEMINI_MODEL?.trim() ||
    "gemini-2.5-flash"
  ).toLowerCase();

  const toneGuidelines: Record<string, string> = {
    professional:
      "Polite, articulate, warm, and professional. Express appreciation for reaching out and invite further conversation.",
    collaboration:
      "Excited and focused on engineering collaboration, AI/ML problem-solving, or freelance project scoping. Propose setting up a brief chat or call.",
    technical:
      "Deep technical focus. Provide architectural insights or analytical commentary responding directly to their technical topic.",
    brief:
      "Concise, high-energy acknowledgment (2-3 sentences max) confirming receipt and interest.",
    decline:
      "Gracious and polite decline explaining limited availability/bandwidth right now while expressing genuine gratitude and keeping in touch.",
  };

  try {
    const ai = new GoogleGenAI({ apiKey: effectiveKey });

    const prompt = `You are assisting Kishore R, a passionate AI/ML and Generative AI Engineer (portfolio: www.kishoreabc.dev).
A visitor sent the following message through Kishore's portfolio contact form:

Sender Name: ${senderName}
Sender Email: ${senderEmail}
Subject: ${subject}
Message:
"""
${message}
"""

Tone / Purpose: ${toneGuidelines[tone] || toneGuidelines.professional}
${customInstruction ? `Kishore's Specific Note: "${customInstruction}"` : ""}

Draft a natural, direct, email reply from Kishore R to ${senderName}.
Guidelines:
- Address ${senderName} warmly by first name.
- Respond directly and thoughtfully to the content and intent of their inquiry.
- Do NOT use bracketed placeholders like [Your Name] or [Phone Number].
- Sign off cleanly as:
Best regards,
Kishore R

Output ONLY the ready-to-send email body text (no markdown formatting, no JSON wrappers, no quotes).`;

    const response = await ai.models.generateContent({
      model: effectiveModel,
      contents: prompt,
    });

    const replyText = response.text?.trim() || "";

    return {
      success: true,
      replyText,
      modelUsed: effectiveModel,
    };
  } catch (err: unknown) {
    console.error("Gemini reply suggestion error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to generate reply suggestion with Gemini.",
    };
  }
}

export async function sendReplyEmailAction({
  messageId,
  senderName,
  senderEmail,
  subject,
  replyText,
}: {
  messageId: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  replyText: string;
}) {
  await requireAdmin();

  if (!replyText || replyText.trim() === "") {
    return { success: false, error: "Reply text cannot be empty." };
  }

  try {
    await sendDirectReplyEmail({
      recipientName: senderName,
      recipientEmail: senderEmail,
      subject,
      message: replyText.trim(),
    });

    // Automatically mark the message as read and replied after sending
    await prisma.contactMessage.update({
      where: { id: messageId },
      data: {
        read: true,
        replied: true,
        repliedAt: new Date(),
      },
    });

    revalidatePath("/admin/messages");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: unknown) {
    console.warn("Direct Resend email sending failed:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Could not send email directly via Resend. You can use 'Open in Email Client' or copy the text to send manually.",
    };
  }
}

export async function markMessageReplied(id: string, replied: boolean = true) {
  await requireAdmin();

  await prisma.contactMessage.update({
    where: { id },
    data: {
      replied,
      repliedAt: replied ? new Date() : null,
      ...(replied ? { read: true } : {}),
    },
  });

  revalidatePath("/admin/messages");
  revalidatePath("/admin");
  return { success: true };
}
