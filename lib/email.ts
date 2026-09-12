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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export interface ContactEmailPayload {
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
  draftReply?: string;
  replyUrl?: string;
  adminUrl?: string;
}

/**
 * Sends a contact form email to the portfolio owner.
 * Sets reply-to to the visitor's email for easy replies.
 * Includes AI auto-drafted professional reply and Resend send buttons.
 */
export async function sendContactEmail(payload: ContactEmailPayload): Promise<void> {
  let from = process.env.CONTACT_FROM_EMAIL?.trim();
  if (!from || from.includes("yourdomain.com") || from.includes("example.com")) {
    from = "Kishore R <noreply@kishoreabc.dev>";
  }
  const to = (process.env.CONTACT_TO_EMAIL ?? "kishorehp134@gmail.com").trim().toLowerCase();

  const safeName = escapeHtml(payload.senderName);
  const safeEmail = escapeHtml(payload.senderEmail);
  const safeSubject = escapeHtml(payload.subject);
  const safeMessage = escapeHtml(payload.message);
  const safeDraftReply = payload.draftReply ? escapeHtml(payload.draftReply) : "";

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
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; margin: 0; padding: 0; }
            .container { max-width: 620px; margin: 0 auto; padding: 32px 24px; }
            .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 16px; margin-bottom: 24px; }
            .label { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
            .value { font-size: 15px; color: #111827; margin-bottom: 20px; }
            .message-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-top: 6px; white-space: pre-wrap; font-size: 15px; line-height: 1.6; }
            .reply-section { margin-top: 28px; padding: 20px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; }
            .reply-badge { font-size: 11px; font-weight: 700; color: #15803d; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
            .reply-box { background: #ffffff; border: 1px solid #dcfce7; border-radius: 8px; padding: 16px; font-size: 14px; line-height: 1.65; color: #1e293b; white-space: pre-wrap; }
            .actions-bar { margin-top: 18px; }
            .btn-primary { display: inline-block; background: #16a34a; color: #ffffff !important; font-weight: 600; font-size: 13px; padding: 11px 22px; border-radius: 6px; text-decoration: none; margin-right: 8px; margin-bottom: 8px; }
            .btn-secondary { display: inline-block; background: #ffffff; color: #15803d !important; border: 1px solid #16a34a; font-weight: 600; font-size: 13px; padding: 10px 20px; border-radius: 6px; text-decoration: none; margin-bottom: 8px; }
            .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin:0;font-size:20px;color:#111827;">New message from your portfolio</h2>
            </div>

            <div class="label">From</div>
            <div class="value">${safeName} &lt;${safeEmail}&gt;</div>

            <div class="label">Subject</div>
            <div class="value">${safeSubject}</div>

            <div class="label">Message</div>
            <div class="message-box">${safeMessage}</div>

            ${
              safeDraftReply
                ? `
            <div class="reply-section">
              <div class="reply-badge">🤖 AI Auto-Drafted Professional Reply</div>
              <div class="reply-box">${safeDraftReply}</div>

              <div class="actions-bar">
                ${
                  payload.replyUrl
                    ? `<a href="${payload.replyUrl}" class="btn-primary">✉️ Send This Reply (via Resend)</a>`
                    : ""
                }
                ${
                  payload.adminUrl
                    ? `<a href="${payload.adminUrl}" class="btn-secondary">📝 Open in Admin Panel</a>`
                    : ""
                }
              </div>
            </div>
            `
                : ""
            }

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
${
  payload.draftReply
    ? `
---
AI Auto-Drafted Reply (Professional):
${payload.draftReply}

Send Reply via Resend: ${payload.replyUrl ?? "N/A"}
Open in Admin Panel: ${payload.adminUrl ?? "N/A"}
`
    : ""
}
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
  recipientName: _recipientName,
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
