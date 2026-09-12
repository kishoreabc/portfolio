/**
 * POST /api/contact
 * Public endpoint — receives contact form submissions.
 *
 * Security layers:
 * 1. Honeypot field check (bot detection)
 * 2. IP-based rate limiting (5/hour)
 * 3. Zod validation (backend)
 * 4. Saves to DB (ContactMessage) — even if email fails
 * 5. Sends email via Resend
 */
import { NextRequest, NextResponse, after } from "next/server";
import { ContactSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendContactEmail } from "@/lib/email";
import { prisma } from "@/lib/db";
import { extractIp } from "@/lib/ai/security";
import { draftProfessionalReply, createReplyToken } from "@/lib/ai/reply-drafter";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ── 1. Honeypot check ──────────────────────────────────────
    // Bots fill in the hidden "website" field — humans don't see it
    if (body.website && body.website.length > 0) {
      // Silently succeed — don't tell bots they were detected
      return NextResponse.json({ success: true });
    }

    // ── 2. Rate limiting ───────────────────────────────────────
    const ip = extractIp(req);

    const rateLimit = checkRateLimit(ip);
    if (rateLimit.limited) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many submissions. Please try again in ${Math.ceil((rateLimit.retryAfter ?? 3600) / 60)} minutes.`,
        },
        { status: 429 }
      );
    }

    // ── 3. Zod validation ──────────────────────────────────────
    const result = ContactSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid form data. Please check your inputs.",
          fieldErrors: result.error.flatten().fieldErrors,
        },
        { status: 422 }
      );
    }

    const { name, email, subject, message } = result.data;

    // ── 4. Save to database immediately (< 25ms) ───────────────
    const savedMessage = await prisma.contactMessage.create({
      data: {
        name,
        email,
        subject,
        message,
      },
    });

    // ── 5. Background AI Drafting & Resend Email Notification ───
    // Run asynchronously after the HTTP response has been sent so the visitor
    // receives an instant confirmation (< 100ms) instead of waiting for Gemini & Resend APIs.
    // Prioritize NEXT_PUBLIC_SITE_URL (https://www.kishoreabc.dev) as specified
    // so notification email action buttons always point to the production deployed domain.
    const baseUrl = (
      process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      "https://www.kishoreabc.dev"
    ).replace(/\/+$/, "");

    const backgroundNotificationTask = async () => {
      let draftReply = "";
      try {
        draftReply = await draftProfessionalReply({
          senderName: name,
          senderEmail: email,
          subject,
          message,
        });

        if (draftReply) {
          await prisma.contactMessage.update({
            where: { id: savedMessage.id },
            data: { draftReply },
          });
        }
      } catch (draftErr) {
        console.warn("[Contact] Background auto-draft reply error:", draftErr);
      }

      try {
        const token = createReplyToken(savedMessage.id, email);
        const replyUrl = `${baseUrl}/contact/reply?id=${savedMessage.id}&token=${token}`;
        const adminUrl = `${baseUrl}/admin/messages?id=${savedMessage.id}`;

        await sendContactEmail({
          senderName: name,
          senderEmail: email,
          subject,
          message,
          draftReply: draftReply || undefined,
          replyUrl,
          adminUrl,
        });
      } catch (emailError) {
        console.error("[Contact] Background email notification failed:", emailError);
      }
    };

    if (typeof after === "function") {
      after(backgroundNotificationTask);
    } else {
      void backgroundNotificationTask();
    }

    // ── 6. Return immediate response to the visitor ────────────
    return NextResponse.json({ success: true, messageId: savedMessage.id });
  } catch (error) {
    console.error("[Contact] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

// Only allow POST
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
