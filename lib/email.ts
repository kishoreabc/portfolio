/**
 * Resend email integration
 * Used by the contact form API route.
 * Server-only — RESEND_API_KEY never reaches the browser.
 */
import { Resend } from "resend";

// Lazy init — only instantiated on the server when first called
let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY is not set");
    resend = new Resend(apiKey);
  }
  return resend;
}

export interface ContactEmailPayload {
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
}

/**
 * Sends a contact form email to the portfolio owner.
 * Sets reply-to to the visitor's email for easy replies.
 */
export async function sendContactEmail(payload: ContactEmailPayload): Promise<void> {
  let from = process.env.CONTACT_FROM_EMAIL?.trim();
  if (!from || from.includes("yourdomain.com") || from.includes("example.com")) {
    from = "Kishore R  <noreply@kishoreabc.dev>";
  }
  const to = (process.env.CONTACT_TO_EMAIL ?? "kishorehp134@gmail.com").trim().toLowerCase();

  const { error } = await getResend().emails.send({
    from,
    to,
    replyTo: payload.senderEmail,
    subject: `[Portfolio Contact] ${payload.subject}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; }
            .container { max-width: 600px; margin: 0 auto; padding: 32px 24px; }
            .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 16px; margin-bottom: 24px; }
            .label { font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
            .value { font-size: 15px; color: #111827; margin-bottom: 20px; }
            .message-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-top: 8px; white-space: pre-wrap; font-size: 15px; line-height: 1.6; }
            .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin:0;font-size:20px;">New message from your portfolio</h2>
            </div>

            <div class="label">From</div>
            <div class="value">${payload.senderName} &lt;${payload.senderEmail}&gt;</div>

            <div class="label">Subject</div>
            <div class="value">${payload.subject}</div>

            <div class="label">Message</div>
            <div class="message-box">${payload.message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>

            <div class="footer">
              <p>Sent from your portfolio contact form • ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</p>
              <p>Reply directly to this email — it will go to ${payload.senderEmail}</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
New message from your portfolio

From: ${payload.senderName} <${payload.senderEmail}>
Subject: ${payload.subject}

Message:
${payload.message}

---
Sent from your portfolio contact form
Reply to: ${payload.senderEmail}
    `.trim(),
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}

/**
 * Sends a direct reply email to the message sender.
 */
export async function sendDirectReplyEmail({
  recipientName,
  recipientEmail,
  subject,
  message,
}: {
  recipientName: string;
  recipientEmail: string;
  subject: string;
  message: string;
}): Promise<void> {
  let from = process.env.CONTACT_FROM_EMAIL?.trim();
  if (!from || from.includes("yourdomain.com") || from.includes("example.com")) {
    from = "Kishore R <noreply@kishoreabc.dev>";
  }

  const { error } = await getResend().emails.send({
    from,
    to: recipientEmail,
    replyTo: process.env.CONTACT_TO_EMAIL ?? "kishorehp134@gmail.com",
    subject: subject.startsWith("Re:") ? subject : `Re: ${subject}`,
    text: message,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}
