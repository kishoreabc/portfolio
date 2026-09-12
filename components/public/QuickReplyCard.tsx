"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { sendQuickReplyAction } from "@/actions/message";
import { Send, CheckCircle2, User, Mail, MessageSquare, ExternalLink, Sparkles, AlertCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface QuickReplyCardProps {
  message: {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    draftReply: string | null;
    replied: boolean;
    repliedAt: Date | string | null;
    createdAt: Date | string;
  };
  token: string;
}

export function QuickReplyCard({ message, token }: QuickReplyCardProps) {
  const [replyText, setReplyText] = useState(message.draftReply || "");
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(message.replied);
  const [sentDate, setSentDate] = useState<string | null>(null);

  useEffect(() => {
    if (message.repliedAt) {
      setSentDate(new Date(message.repliedAt).toLocaleString());
    }
  }, [message.repliedAt]);

  const handleSend = async () => {
    if (!replyText.trim()) {
      toast.error("Reply text cannot be empty.");
      return;
    }

    setIsSending(true);
    try {
      const res = await sendQuickReplyAction({
        messageId: message.id,
        token,
        replyText,
      });

      if (res.success) {
        setIsSent(true);
        setSentDate(new Date().toLocaleString());
        toast.success(`Reply sent successfully to ${message.email} via Resend!`);
      } else {
        toast.error(res.error || "Failed to send email via Resend.");
      }
    } catch {
      toast.error("An unexpected error occurred while sending.");
    } finally {
      setIsSending(false);
    }
  };

  if (isSent) {
    return (
      <Card className="max-w-2xl w-full mx-auto border-emerald-500/40 bg-card/80 backdrop-blur-md shadow-lg overflow-hidden">
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Reply Sent Successfully</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Delivered via Resend to <span className="font-mono text-foreground font-medium">{message.email}</span>
              <span suppressHydrationWarning>{sentDate ? ` on ${sentDate}` : ""}</span>
            </p>
          </div>
        </div>

        <CardContent className="p-6 space-y-4">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Sent Message
            </span>
            <div className="p-4 rounded-lg bg-muted/40 border border-border/80 text-sm whitespace-pre-wrap leading-relaxed text-foreground/90 font-sans">
              {replyText}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              render={<Link href="/" />}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Back to Home
            </Button>
            <Button
              render={<Link href="/admin/messages?view=replied" />}
              size="sm"
              className="text-xs gap-1.5"
            >
              View in Replied Messages <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl w-full mx-auto border-border/80 bg-card/80 backdrop-blur-md shadow-xl overflow-hidden">
      <CardHeader className="border-b border-border/60 bg-muted/20 p-6 pb-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[11px] gap-1 border-primary/40 text-primary bg-primary/10">
              <Sparkles className="w-3 h-3 text-amber-400" /> AI-Drafted Professional Reply
            </Badge>
            <Badge variant="outline" className="text-[11px] text-muted-foreground">
              Resend Delivery
            </Badge>
          </div>
          <Link
            href={`/admin/messages?id=${message.id}`}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            Open in Admin <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        <CardTitle className="text-lg font-bold text-foreground mt-3 flex items-center gap-2">
          <span>Reply to {message.name}</span>
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
          <Mail className="w-3 h-3" /> {message.email} • Re: {message.subject}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 space-y-5">
        {/* Original Message Quote */}
        <div className="rounded-lg border border-border/70 bg-muted/30 p-3.5 space-y-1">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare className="w-3 h-3" /> Original Message
          </div>
          <p className="text-xs text-foreground/80 italic leading-relaxed">
            &ldquo;{message.message}&rdquo;
          </p>
        </div>

        {/* Editable Drafted Reply */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <span>Review &amp; Edit Reply Text</span>
              <span className="text-muted-foreground font-normal text-[11px]">(Sent via Resend from noreply@kishoreabc.dev)</span>
            </label>
          </div>

          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={8}
            className="text-sm font-sans leading-relaxed bg-background/80 border-border/80 focus:border-primary resize-y"
            placeholder="Write your reply here..."
          />
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/60">
          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500/80 shrink-0" />
            <span>Sends directly to {message.email} from your verified domain.</span>
          </div>

          <Button
            type="button"
            onClick={handleSend}
            disabled={isSending || !replyText.trim()}
            className="gap-2 font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md cursor-pointer shrink-0"
          >
            {isSending ? (
              <>Sending via Resend...</>
            ) : (
              <>
                <Send className="w-4 h-4" /> Send Reply via Resend
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
