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
import { NextRequest, NextResponse } from "next/server";
import { ContactSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendContactEmail } from "@/lib/email";
import { prisma } from "@/lib/db";
import { extractIp } from "@/lib/ai/security";

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

    // ── 4. Save to database ────────────────────────────────────
    // Always save first — message is preserved even if email fails
    await prisma.contactMessage.create({
      data: { name, email, subject, message },
    });

    // ── 5. Send email via Resend ───────────────────────────────
    // Non-blocking: we return success even if email fails
    // The message is already in the DB for admin to see
    try {
      await sendContactEmail({
        senderName: name,
        senderEmail: email,
        subject,
        message,
      });
    } catch (emailError) {
      // Log the error but don't fail the request
      console.error("[Contact] Email send failed (message saved to DB):", emailError);
    }

    return NextResponse.json({ success: true });
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
