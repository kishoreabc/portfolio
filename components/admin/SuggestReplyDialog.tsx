"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Loader2,
  Copy,
  Check,
  Mail,
  Send,
  User,
  Clock,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import {
  generateMessageReplySuggestion,
  sendReplyEmailAction,
  markMessageRead,
} from "@/actions/message";

interface SuggestReplyDialogProps {
  message: {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    createdAt: Date | string;
    read: boolean;
  };
  trigger?: React.ReactNode;
}

type ToneType = "professional" | "collaboration" | "technical" | "brief" | "decline";

const TONES: { id: ToneType; label: string; emoji: string }[] = [
  { id: "professional", label: "Professional", emoji: "💼" },
  { id: "collaboration", label: "Collaboration & Projects", emoji: "🚀" },
  { id: "technical", label: "Technical Deep-Dive", emoji: "💡" },
  { id: "brief", label: "Quick & Friendly", emoji: "⚡" },
  { id: "decline", label: "Polite Decline", emoji: "🙏" },
];

export function SuggestReplyDialog({ message, trigger }: SuggestReplyDialogProps) {
  const [open, setOpen] = useState(false);
  const [tone, setTone] = useState<ToneType>("professional");
  const [customInstruction, setCustomInstruction] = useState("");
  const [replyText, setReplyText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gemini-3.5-flash-lite");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedKey = localStorage.getItem("portfolio_gemini_api_key") || "";
      const storedModel =
        localStorage.getItem("portfolio_gemini_model") || "gemini-3.5-flash-lite";
      setApiKey(storedKey);
      setModel(storedModel);
    }
  }, []);

  const handleGenerate = async (selectedTone = tone) => {
    setGenerating(true);
    try {
      const res = await generateMessageReplySuggestion({
        senderName: message.name,
        senderEmail: message.email,
        subject: message.subject,
        message: message.message,
        tone: selectedTone,
        customInstruction: customInstruction.trim() || undefined,
        apiKey: apiKey.trim() || undefined,
        model,
      });

      if (!res.success) {
        toast.error(res.error || "Failed to generate reply suggestion.");
        return;
      }

      if (res.replyText) {
        setReplyText(res.replyText);
        toast.success(`✨ Reply suggestion drafted using ${res.modelUsed || model}!`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to generate reply");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!replyText) return;
    try {
      await navigator.clipboard.writeText(replyText);
      setCopied(true);
      toast.success("Reply copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy text to clipboard");
    }
  };

  const handleSendDirect = async () => {
    if (!replyText.trim()) {
      toast.error("Reply text is empty.");
      return;
    }

    setSending(true);
    try {
      const res = await sendReplyEmailAction({
        messageId: message.id,
        senderName: message.name,
        senderEmail: message.email,
        subject: message.subject,
        replyText: replyText.trim(),
      });

      if (res.success) {
        toast.success(`Email reply sent directly to ${message.email}!`);
        setOpen(false);
      } else {
        toast.error(res.error || "Direct send failed. You can use 'Open Mail App' instead.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to send email reply.");
    } finally {
      setSending(false);
    }
  };

  const mailtoLink = `mailto:${encodeURIComponent(message.email)}?subject=${encodeURIComponent(
    message.subject.startsWith("Re:") ? message.subject : `Re: ${message.subject}`
  )}&body=${encodeURIComponent(replyText || "")}`;

  const formattedDate = new Date(message.createdAt).toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger render={trigger as React.ReactElement} />
      ) : (
        <DialogTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-8 border-primary/40 hover:border-primary text-primary"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Suggest Reply
            </Button>
          }
        />
      )}

      <DialogContent className="sm:max-w-3xl lg:max-w-4xl w-[95vw] max-h-[92vh] overflow-y-auto overflow-x-hidden p-6 sm:p-8">
        <DialogHeader className="space-y-1.5 border-b border-border/60 pb-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
              <Sparkles className="w-5 h-5 text-amber-500" />
              AI Suggested Reply
            </DialogTitle>
            <Badge variant="secondary" className="font-mono text-xs px-2.5 py-0.5">
              {model}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Generate and customize an intelligent, context-aware reply for {message.name}.
          </p>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Incoming Message Card */}
          <div className="p-4 rounded-xl border border-border/80 bg-muted/30 space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary" /> {message.name}
                </span>
                <span>•</span>
                <a
                  href={`mailto:${message.email}`}
                  className="text-primary hover:underline font-mono"
                >
                  {message.email}
                </a>
              </div>
              <span className="flex items-center gap-1 font-mono text-[11px]">
                <Clock className="w-3 h-3 text-muted-foreground" /> {formattedDate}
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold text-foreground">Subject: {message.subject}</p>
              <div className="p-3 rounded-lg bg-background border border-border/60 text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                {message.message}
              </div>
            </div>
          </div>

          {/* Tone / Intent Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-primary" /> Select Reply Tone & Intent
              </label>
              <span className="text-[10px] text-muted-foreground">Click to draft suggestion</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {TONES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTone(t.id);
                    handleGenerate(t.id);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                    tone === t.id
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-background hover:bg-muted text-foreground/80 border-border"
                  }`}
                >
                  <span>{t.emoji}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Instruction (Optional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Custom Instruction / Key Points (Optional)
            </label>
            <div className="flex gap-2">
              <Input
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                placeholder="e.g. Mention that I am free for a call this Thursday afternoon..."
                className="text-xs h-9 bg-background"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
              />
              <Button
                type="button"
                onClick={() => handleGenerate()}
                disabled={generating}
                className="shrink-0 text-xs font-semibold h-9 px-4 gap-1.5 cursor-pointer shadow-xs"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Draft Reply
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Reply Text Draft Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">
                Suggested Email Reply Body
              </label>
              {replyText && (
                <span className="text-[10px] text-muted-foreground font-mono">
                  {replyText.split(/\s+/).filter(Boolean).length} words • Editable
                </span>
              )}
            </div>

            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={9}
              placeholder="Click a tone above or 'Draft Reply' to generate an AI suggestion tailored to this message..."
              className="text-xs leading-relaxed font-sans bg-background"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={!replyText}
                className="text-xs gap-1.5 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" /> Copy Reply Text
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!replyText}
                render={
                  <a href={mailtoLink} target="_blank" rel="noopener noreferrer">
                    <Mail className="w-3.5 h-3.5 text-primary" /> Open in Mail App{" "}
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </a>
                }
                className="text-xs gap-1.5 cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleSendDirect}
                disabled={sending || !replyText}
                className="text-xs gap-1.5 cursor-pointer bg-primary text-primary-foreground shadow-xs font-semibold"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Send Direct Email
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                className="text-xs cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
