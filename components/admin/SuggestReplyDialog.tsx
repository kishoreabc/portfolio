"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Cpu,
  Key,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import {
  generateMessageReplySuggestion,
  sendReplyEmailAction,
  markMessageReplied,
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
    replied?: boolean;
    repliedAt?: Date | string | null;
    draftReply?: string | null;
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
      {open && <SuggestReplyDialogContent message={message} onClose={() => setOpen(false)} />}
    </Dialog>
  );
}

function SuggestReplyDialogContent({
  message,
  onClose,
}: {
  message: SuggestReplyDialogProps["message"];
  onClose: () => void;
}) {
  const router = useRouter();
  const [tone, setTone] = useState<ToneType>("professional");
  const [customInstruction, setCustomInstruction] = useState("");
  const [replyText, setReplyText] = useState(message.draftReply || "");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gemini-3.5-flash-lite");
  const [customModel, setCustomModel] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedKey = localStorage.getItem("portfolio_gemini_api_key") || "";
      setApiKey(storedKey);
      const storedModel =
        localStorage.getItem("portfolio_gemini_model") || "gemini-3.5-flash-lite";
      if (
        [
          "gemini-3.5-flash-lite",
          "gemini-2.5-flash",
          "gemini-3.7-flash",
          "gemini-2.5-pro",
        ].includes(storedModel)
      ) {
        setModel(storedModel);
      } else if (storedModel) {
        setModel("custom");
        setCustomModel(storedModel);
      }
    }
  }, []);

  const handleSaveApiKey = (val: string) => {
    setApiKey(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("portfolio_gemini_api_key", val.trim());
    }
  };

  const handleSaveModel = (val: string) => {
    setModel(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("portfolio_gemini_model", val.trim());
    }
  };

  const displayModelName = model === "custom" && customModel ? customModel : model;

  const handleGenerate = async (selectedTone = tone) => {
    const effectiveModel =
      model === "custom" ? (customModel.trim() || "gemini-3.5-flash-lite") : model;

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
        model: effectiveModel,
      });

      if (!res.success) {
        if (res.needsApiKey) {
          setShowSettings(true);
          toast.warning("Gemini API key is required. Please enter it in the AI Settings.");
        } else {
          toast.error(res.error || "Failed to generate reply suggestion.");
        }
        return;
      }

      if (res.replyText) {
        setReplyText(res.replyText);
        toast.success(`✨ Reply suggestion drafted using ${res.modelUsed || effectiveModel}!`);
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
        toast.success(`Reply sent directly to ${message.email} via Resend! Moved to Replied tab.`);
        onClose();
        router.refresh();
        router.push("/admin/messages?view=replied");
      } else {
        toast.error(res.error || "Direct send failed. You can use 'Open Mail App' instead.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to send email reply.");
    } finally {
      setSending(false);
    }
  };

  const [markingReplied, setMarkingReplied] = useState(false);

  const handleMarkReplied = async () => {
    setMarkingReplied(true);
    try {
      await markMessageReplied(message.id, !message.replied);
      toast.success(
        message.replied
          ? "Moved back to Inbox"
          : "Marked as Replied & moved to Replied tab"
      );
      onClose();
      router.refresh();
      if (!message.replied) {
        router.push("/admin/messages?view=replied");
      } else {
        router.push("/admin/messages");
      }
    } catch {
      toast.error("Failed to update reply status");
    } finally {
      setMarkingReplied(false);
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
    <DialogContent className="sm:max-w-4xl lg:max-w-5xl w-[95vw] max-h-[92vh] overflow-y-auto overflow-x-hidden p-6 sm:p-8">
        <DialogHeader className="space-y-1.5 border-b border-border/60 pb-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
              <Sparkles className="w-5 h-5 text-amber-500" />
              AI Suggested Reply
              {message.replied && (
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Replied
                </span>
              )}
            </DialogTitle>

            {/* Model & API Key Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className="text-[11px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 px-2.5 py-1 rounded-md border border-border bg-background hover:bg-muted cursor-pointer font-mono shadow-xs"
                title="Click to change Gemini model"
              >
                <Cpu className="w-3.5 h-3.5 text-primary" />
                <span className="truncate max-w-[130px] font-medium">{displayModelName}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className="text-[11px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 px-2.5 py-1 rounded-md border border-border bg-background hover:bg-muted cursor-pointer font-mono shadow-xs"
                title="Click to configure Gemini API key"
              >
                <Key className="w-3.5 h-3.5 text-amber-500" />
                <span>{apiKey ? "Key Set" : "Add Key"}</span>
              </button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Generate and customize an intelligent, context-aware reply for {message.name}.
          </p>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* AI Settings Drawer (Model & API Key) */}
          {showSettings && (
            <div className="p-3.5 rounded-xl bg-muted/40 border border-primary/25 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" /> Gemini AI Settings
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">Persisted in browser</span>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {/* Model Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-foreground flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-primary" /> Select Model
                  </label>
                  <select
                    value={
                      ["gemini-3.5-flash-lite", "gemini-2.5-flash", "gemini-3.7-flash", "gemini-2.5-pro"].includes(model)
                        ? model
                        : "custom"
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val !== "custom") {
                        handleSaveModel(val);
                      } else {
                        setModel("custom");
                      }
                    }}
                    className="w-full h-8 px-2 text-xs rounded-md border border-input bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite (Ultra-fast)</option>
                    <option value="gemini-2.5-flash">gemini-2.5-flash (Balanced)</option>
                    <option value="gemini-3.7-flash">gemini-3.7-flash (Next-Gen Reasoning)</option>
                    <option value="gemini-2.5-pro">gemini-2.5-pro (Deep Reasoning)</option>
                    <option value="custom">Custom Model ID...</option>
                  </select>

                  {model === "custom" && (
                    <Input
                      type="text"
                      value={customModel}
                      onChange={(e) => {
                        setCustomModel(e.target.value);
                        if (typeof window !== "undefined") {
                          localStorage.setItem("portfolio_gemini_model", e.target.value.trim());
                        }
                      }}
                      placeholder="e.g. gemini-3.8-flash"
                      className="text-xs h-7 font-mono mt-1"
                    />
                  )}
                </div>

                {/* API Key */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-foreground flex items-center gap-1">
                    <Key className="w-3 h-3 text-amber-500" /> API Key
                  </label>
                  <div className="flex gap-1.5">
                    <Input
                      type="password"
                      value={apiKey}
                      onChange={(e) => handleSaveApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="text-xs h-8 font-mono"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 px-2.5 shrink-0 cursor-pointer"
                      onClick={() => {
                        setShowSettings(false);
                        toast.success("AI settings updated.");
                      }}
                    >
                      Done
                    </Button>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Active model: <strong className="font-mono text-primary">{displayModelName}</strong>. You can also configure default values via <code className="font-mono text-primary">GEMINI_MODEL</code> and <code className="font-mono text-primary">GEMINI_API_KEY</code> in <code className="font-mono text-primary">.env.local</code>.
              </p>
            </div>
          )}
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
              <span className="text-[10px] text-muted-foreground">Select tone, then click &quot;Draft Reply&quot; below</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {TONES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTone(t.id)}
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
              placeholder="Select a tone above, add any optional notes, and click 'Draft Reply' to generate a tailored suggestion..."
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

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleMarkReplied}
                disabled={markingReplied}
                className={`text-xs gap-1.5 cursor-pointer ${
                  message.replied
                    ? "border-muted-foreground/30 hover:border-foreground/60 text-muted-foreground"
                    : "border-emerald-500/40 hover:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                }`}
              >
                {markingReplied ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                {message.replied ? "Move to Inbox" : "Mark as Replied"}
              </Button>
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
                    <Send className="w-3.5 h-3.5" /> Send Reply (via Resend)
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-xs cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
  );
}
