/**
 * components/ai/AgentControls.tsx
 *
 * Bottom control bar for the AI agent panel.
 *
 * Voice mode: animated waveform, mic mute/unmute, mode toggle, disconnect
 * Chat mode:  text input + send button (Enter key), mode toggle, disconnect
 *
 * Accessibility: all buttons have unique IDs, aria-labels, keyboard navigation.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  MessageSquare,
  SendHorizonal,
  RotateCcw,
  Square,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AgentStatusBadge } from "./AgentStatusBadge";
import { AudioManager } from "./AudioManager";
import type { SessionState, AgentMode } from "@/types/ai";

interface AgentControlsProps {
  mode: AgentMode;
  state: SessionState;
  disconnectReason?: "IDLE_TIMEOUT" | "REVOKED" | "TIME_LIMIT" | "DISCONNECTED" | string | null;
  isMuted: boolean;
  disabled: boolean;
  voiceMaxSeconds?: number | null;
  onToggleMute: () => void;
  onSwitchMode: (mode: AgentMode) => void;
  onSendText: (text: string) => void;
  onDisconnect: () => void;
  onInterrupt?: () => void;
  onReconnect?: () => void;
}

export function AgentControls({
  mode,
  state,
  disconnectReason,
  isMuted,
  disabled,
  voiceMaxSeconds,
  onToggleMute,
  onSwitchMode,
  onSendText,
  onDisconnect,
  onInterrupt: _onInterrupt,
  onReconnect,
}: AgentControlsProps) {
  const [textInput, setTextInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [dynamicLimit, setDynamicLimit] = useState<number | null>(voiceMaxSeconds ?? null);

  useEffect(() => {
    if (voiceMaxSeconds) {
      setDynamicLimit(voiceMaxSeconds);
      return;
    }
    let active = true;
    fetch("/api/ai/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.maxVoiceSessionSeconds) {
          setDynamicLimit(data.maxVoiceSessionSeconds);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [voiceMaxSeconds]);

  const limitMinutes = dynamicLimit ? Math.round(dynamicLimit / 60) : 10;

  const isDisconnected = state === "DISCONNECTED" || state === "ERROR";
  const isConnecting = state === "CONNECTING";
  // Chat input is interactive whenever connected (user can compose next message while reading)
  const canTypeChat = !disabled && !isDisconnected && !isConnecting;
  // Send button is enabled when connected, has text, and not actively processing
  const canSendChat = canTypeChat && state !== "THINKING";
  // Voice controls are interactive whenever connected and not in connecting state
  const canInteractVoice = !disabled && !isDisconnected && state !== "CONNECTING";

  const handleSend = () => {
    const trimmed = textInput.trim();
    if (!trimmed || !canSendChat) return;
    onSendText(trimmed);
    setTextInput("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const targetMode: AgentMode = mode === "voice" ? "chat" : "voice";
  const isVoiceActive = mode === "voice" && ["LISTENING", "SPEAKING", "THINKING"].includes(state);

  return (
    <div className="flex flex-col gap-2 border-t border-border p-3">
      {/* Status + Mode toggle row */}
      <div className="flex items-center justify-between">
        <AgentStatusBadge state={state} disconnectReason={disconnectReason} />
        <Button
          id="ai-mode-toggle"
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => {
            if (targetMode === "voice") {
              AudioManager.unlock();
            }
            onSwitchMode(targetMode);
          }}
          disabled={state === "CONNECTING"}
          aria-label={`Switch to ${targetMode} mode`}
          title={`Switch to ${targetMode} mode`}
        >
          {targetMode === "voice" ? (
            <>
              <Mic className="h-3.5 w-3.5" />
              <span>Voice</span>
            </>
          ) : (
            <>
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Chat</span>
            </>
          )}
        </Button>
      </div>

      {/* Main controls row */}
      {mode === "voice" ? (
        <div className="flex items-center gap-2">
          {/* Animated waveform (visible when SPEAKING) */}
          {state === "SPEAKING" && (
            <div className="flex items-center gap-0.5 h-6 mr-1" aria-hidden>
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className="w-0.5 rounded-full bg-primary animate-bounce"
                  style={{
                    height: `${12 + (i % 3) * 6}px`,
                    animationDelay: `${i * 80}ms`,
                    animationDuration: "600ms",
                  }}
                />
              ))}
            </div>
          )}

          {/* Mic mute/unmute */}
          <Button
            id="ai-mic-toggle"
            variant={isMuted ? "destructive" : "secondary"}
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => {
              AudioManager.unlock();
              onToggleMute();
            }}
            disabled={!canInteractVoice}
            aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
            aria-pressed={isMuted}
          >
            {isMuted ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>

          {/* Listening indicator label */}
          <span className="flex-1 text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
            {state === "CONNECTING" ? (
              <span className="inline-flex items-center gap-1.5 text-blue-400 font-medium">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Connecting voice...</span>
              </span>
            ) : null}
            {state === "LISTENING" && !isMuted ? "Listening for your voice..." : ""}
            {state === "THINKING" ? "Processing..." : ""}
            {state === "SPEAKING" ? "Kishore's assistant is speaking" : ""}
            {state === "DISCONNECTED" ? (
              disconnectReason === "IDLE_TIMEOUT" ? (
                <span className="text-amber-400 font-medium">Session closed due to inactivity</span>
              ) : disconnectReason === "REVOKED" ? (
                <span className="text-destructive font-medium">Session ended by admin</span>
              ) : disconnectReason === "TIME_LIMIT" ? (
                <span className="text-amber-400 font-medium">
                  Session limit reached ({limitMinutes} min)
                </span>
              ) : (
                "Session disconnected"
              )
            ) : null}
            {isMuted && canInteractVoice ? "Microphone muted" : ""}
          </span>

          {/* Disconnect or Reconnect */}
          {state === "DISCONNECTED" ? (
            <Button
              id="ai-voice-reconnect"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs shrink-0 cursor-pointer"
              disabled={isConnecting}
              onClick={() => {
                AudioManager.unlock();
                onReconnect?.();
              }}
              aria-label="Reconnect voice session"
              title="Reconnect voice session"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reconnect</span>
            </Button>
          ) : isVoiceActive || state === "CONNECTING" ? (
            <Button
              id="ai-voice-disconnect"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
              onClick={() => {
                onDisconnect();
              }}
              disabled={disabled}
              aria-label="Stop conversation"
              title="Stop conversation"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
            </Button>
          ) : null}
        </div>
      ) : (
        /* Chat mode */
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            id="ai-chat-input"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              state === "DISCONNECTED"
                ? disconnectReason === "IDLE_TIMEOUT"
                  ? "Session closed due to inactivity"
                  : disconnectReason === "REVOKED"
                  ? "Session ended by admin"
                  : "Session disconnected"
                : state === "CONNECTING"
                ? "Connecting..."
                : state === "THINKING"
                ? "Thinking..."
                : "Ask about Kishore..."
            }
            disabled={!canTypeChat}
            className="flex-1 h-9 text-sm"
            maxLength={1000}
            aria-label="Type your message"
            autoComplete="off"
          />
          {state === "DISCONNECTED" ? (
            <Button
              id="ai-chat-reconnect"
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-xs shrink-0"
              onClick={() => {
                onReconnect?.();
              }}
              aria-label="Reconnect chat session"
              title="Reconnect chat session"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reconnect</span>
            </Button>
          ) : (
            <Button
              id="ai-chat-send"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={handleSend}
              disabled={!canSendChat || !textInput.trim()}
              aria-label="Send message"
            >
              <SendHorizonal className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
