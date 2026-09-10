/**
 * components/ai/AudioManager.ts
 *
 * High-fidelity client-side audio pipeline for voice mode:
 *
 * Input (mic → Gemini):
 *   MediaStream → AudioWorklet (high-quality linear interpolation downsampling to exact 16kHz)
 *   → base64 PCM 16kHz chunks → sendRealtimeInput({ audio: { data, mimeType: "audio/pcm;rate=16000" } })
 *   Barge-in: continuous mic streaming with robust energy gating during playback, allowing
 *   authentic Gemini Live server-side VAD interruption without false triggers from speaker/fan noise.
 *
 * Output (Gemini → speakers):
 *   base64 PCM 24kHz chunks → byte carry-over buffer (zero byte-shift noise) →
 *   sample-rate matched resampler (zero filter impulse / Nyquist ringing beep) →
 *   snappy 60ms pre-roll jitter buffer (zero underrun crackle, low latency) →
 *   master gain node → queued playback.
 *   Interruption: instantaneous click-free gain ramp down + immediate queue clear.
 */

import type { Session } from "@google/genai";
import type { SessionState } from "@/types/ai";

// PCM 16kHz downsampling encoder worklet (inline to avoid separate network asset)
const WORKLET_CODE = `
class PCMEncoderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.targetRate = 16000;
    // AudioWorkletGlobalScope provides global sampleRate (hardware rate: e.g. 48000 or 44100)
    this.sourceRate = typeof sampleRate !== 'undefined' ? sampleRate : 48000;
    this.ratio = this.sourceRate / this.targetRate;
    this.offset = 0;
    this.lastSample = 0;
    this.bufferSize = 2048; // 128ms of 16kHz PCM audio
    this.buffer = new Int16Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input || input.length === 0) return true;

    if (this.ratio === 1) {
      for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]));
        this.buffer[this.bufferIndex++] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        if (this.bufferIndex >= this.bufferSize) {
          const copy = new Int16Array(this.buffer);
          this.port.postMessage(copy.buffer, [copy.buffer]);
          this.bufferIndex = 0;
        }
      }
      return true;
    }

    // High quality linear interpolation downsampling from hardware rate to exact 16000Hz
    while (this.offset < input.length) {
      const idx = Math.floor(this.offset);
      const frac = this.offset - idx;
      const s0 = idx === 0 ? this.lastSample : input[idx - 1];
      const s1 = input[Math.min(idx, input.length - 1)];
      const interpolated = s0 + frac * (s1 - s0);
      const s = Math.max(-1, Math.min(1, interpolated));
      this.buffer[this.bufferIndex++] = s < 0 ? s * 0x8000 : s * 0x7FFF;

      if (this.bufferIndex >= this.bufferSize) {
        const copy = new Int16Array(this.buffer);
        this.port.postMessage(copy.buffer, [copy.buffer]);
        this.bufferIndex = 0;
      }

      this.offset += this.ratio;
    }

    this.offset -= input.length;
    this.lastSample = input[input.length - 1];
    return true;
  }
}
registerProcessor('pcm-encoder', PCMEncoderProcessor);
`;

export class AudioManager {
  private static sharedPlaybackContext: AudioContext | null = null;

  /**
   * Synchronously unlock/resume AudioContext on a user click gesture.
   * Satisfies browser autoplay policies on Chromium, Safari, and Firefox by playing
   * a 1-sample silent sound buffer within the click event stack.
   */
  public static unlock(): void {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!AudioManager.sharedPlaybackContext || AudioManager.sharedPlaybackContext.state === "closed") {
        AudioManager.sharedPlaybackContext = new AudioCtx();
      }
      const ctx = AudioManager.sharedPlaybackContext;
      if (ctx.state === "suspended") {
        void ctx.resume();
      }
      // Play a 1-sample silent buffer directly on the gesture
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    } catch (e) {
      console.warn("[AudioManager] Could not unlock AudioContext:", e);
    }
  }

  public static getPlaybackContext(): AudioContext {
    AudioManager.unlock();
    if (!AudioManager.sharedPlaybackContext || AudioManager.sharedPlaybackContext.state === "closed") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      AudioManager.sharedPlaybackContext = new AudioCtx();
    }
    return AudioManager.sharedPlaybackContext;
  }

  private session: Session;
  private onStateChange: (state: SessionState) => void;

  private audioContext: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private micAnalyser: AnalyserNode | null = null;
  private playbackAnalyser: AnalyserNode | null = null;
  private masterPlaybackGain: GainNode | null = null;

  // Playback queue & tracking
  private playbackContext: AudioContext | null = null;
  private nextPlayTime = 0;
  private isPlaying = false;
  private isMuted = false;
  private activeSources: Set<AudioBufferSourceNode> = new Set();

  // Decoding & sample continuity buffers to eliminate clicks, noise & beeps
  private leftoverByte: number | null = null;
  private lastResampleSample = 0;

  private stopped = false;

  constructor(session: Session, onStateChange: (state: SessionState) => void) {
    this.session = session;
    this.onStateChange = onStateChange;
  }

  /**
   * Whether audio playback is actively playing through the speakers.
   * Self-healing: if no sources are playing or context is not running, ensures false.
   */
  getIsPlaying(): boolean {
    if (!this.playbackContext || this.playbackContext.state !== "running") {
      this.isPlaying = false;
      return false;
    }
    if (this.activeSources.size === 0 && this.nextPlayTime <= this.playbackContext.currentTime + 0.05) {
      this.isPlaying = false;
    }
    return this.isPlaying;
  }

  /** Start microphone capture and begin streaming to Gemini. */
  async start(): Promise<void> {
    this.stopped = false;
    this.clearPlaybackQueue();
    this.leftoverByte = null;
    this.lastResampleSample = 0;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (err) {
      console.error("[AudioManager] Mic access denied:", err);
      this.onStateChange("ERROR");
      throw new Error("MIC_DENIED");
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
    } catch {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
    }

    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    // Register inline AudioWorklet for 16kHz linear downsampling
    const blob = new Blob([WORKLET_CODE], { type: "application/javascript" });
    const workletUrl = URL.createObjectURL(blob);
    await this.audioContext.audioWorklet.addModule(workletUrl);
    URL.revokeObjectURL(workletUrl);

    this.workletNode = new AudioWorkletNode(this.audioContext, "pcm-encoder");
    this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.sourceNode.connect(this.workletNode);

    // Setup mic analyser for real-time live voice graph
    try {
      this.micAnalyser = this.audioContext.createAnalyser();
      this.micAnalyser.fftSize = 64;
      this.micAnalyser.smoothingTimeConstant = 0.75;
      this.sourceNode.connect(this.micAnalyser);
    } catch (e) {
      console.warn("[AudioManager] Could not create micAnalyser:", e);
    }

    // Reuse or initialize the shared playback context & master gain
    this.playbackContext = AudioManager.getPlaybackContext();
    if (this.playbackContext.state === "suspended") {
      await this.playbackContext.resume();
    }
    this.initPlaybackGraph();

    // Stream PCM 16kHz chunks to Gemini Live with barge-in support
    this.workletNode.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
      if (this.stopped || this.isMuted) return;

      // When the assistant is speaking through speakers, stream mic audio
      // if it has genuine speech energy above ambient background / speaker bleed.
      // This enables authentic Gemini Live barge-in interruption while
      // preventing room noise from aborting the assistant's speech.
      if (this.getIsPlaying()) {
        const samples = new Int16Array(event.data);
        let sum = 0;
        const step = 4;
        for (let i = 0; i < samples.length; i += step) {
          const s = samples[i] / 32768;
          sum += s * s;
        }
        const rms = Math.sqrt(sum / (samples.length / step));
        // Threshold for barge-in while speaking: must be actual speech, not laptop fan / room hum
        if (rms < 0.035) return;
      }

      const b64 = arrayBufferToBase64(event.data);
      try {
        (this.session as any).sendRealtimeInput({
          audio: { data: b64, mimeType: "audio/pcm;rate=16000" },
        });
      } catch {
        // Silently ignore — session may have closed
      }
    };

    this.onStateChange("LISTENING");
  }

  private initPlaybackGraph(): void {
    if (!this.playbackContext || this.playbackContext.state === "closed") return;

    if (!this.playbackAnalyser) {
      try {
        this.playbackAnalyser = this.playbackContext.createAnalyser();
        this.playbackAnalyser.fftSize = 64;
        this.playbackAnalyser.smoothingTimeConstant = 0.75;
        this.playbackAnalyser.connect(this.playbackContext.destination);
      } catch {}
    }

    if (!this.masterPlaybackGain) {
      try {
        this.masterPlaybackGain = this.playbackContext.createGain();
        this.masterPlaybackGain.gain.setValueAtTime(1.0, this.playbackContext.currentTime);
        if (this.playbackAnalyser) {
          this.masterPlaybackGain.connect(this.playbackAnalyser);
        } else {
          this.masterPlaybackGain.connect(this.playbackContext.destination);
        }
      } catch {}
    }
  }

  /**
   * Resamples raw PCM float buffer to match playbackContext sample rate.
   * Preserves sample continuity across chunks to eliminate boundary clicks and Nyquist ringing.
   */
  private resampleToContextRate(
    input: Float32Array,
    fromRate: number,
    toRate: number
  ): Float32Array {
    if (fromRate === toRate || input.length === 0) return input;
    const ratio = toRate / fromRate;
    const outLen = Math.round(input.length * ratio);
    const output = new Float32Array(outLen);
    for (let i = 0; i < outLen; i++) {
      const srcPos = i / ratio;
      const idx = Math.floor(srcPos);
      const frac = srcPos - idx;
      const s0 = idx === 0 ? this.lastResampleSample : input[idx - 1];
      const s1 = input[Math.min(idx, input.length - 1)];
      output[i] = s0 + frac * (s1 - s0);
    }
    this.lastResampleSample = input[input.length - 1] || 0;
    return output;
  }

  /**
   * Enqueue a base64-encoded PCM 24kHz audio chunk for playback.
   * Resamples to AudioContext sample rate and applies jitter lookahead to eliminate beeps and noise.
   */
  async enqueueAudio(base64Pcm: string): Promise<void> {
    if (this.stopped) return;
    if (!this.playbackContext || this.playbackContext.state === "closed") {
      this.playbackContext = AudioManager.getPlaybackContext();
    }

    if (this.playbackContext.state === "suspended") {
      try {
        await this.playbackContext.resume();
      } catch {}
    }

    this.initPlaybackGraph();

    const raw = base64ToArrayBuffer(base64Pcm);
    if (raw.byteLength === 0) return;

    // ── Carry-over byte handling (ensures 100% 16-bit alignment across chunks) ──
    let combined: Uint8Array;
    if (this.leftoverByte !== null) {
      combined = new Uint8Array(raw.byteLength + 1);
      combined[0] = this.leftoverByte;
      combined.set(new Uint8Array(raw), 1);
      this.leftoverByte = null;
    } else {
      combined = new Uint8Array(raw);
    }

    if (combined.byteLength % 2 !== 0) {
      this.leftoverByte = combined[combined.byteLength - 1];
      combined = combined.subarray(0, combined.byteLength - 1);
    }

    if (combined.byteLength < 2) return;

    const samples = new Int16Array(
      combined.buffer,
      combined.byteOffset,
      combined.byteLength / 2
    );

    const float24k = new Float32Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
      float24k[i] = samples[i] / 32768;
    }

    const ctxRate = this.playbackContext.sampleRate || 48000;
    const floatData = this.resampleToContextRate(float24k, 24000, ctxRate);

    // AudioBuffer created at EXACT context rate — zero internal browser resampler filter resets!
    const buffer = this.playbackContext.createBuffer(1, floatData.length, ctxRate);

    const now = this.playbackContext.currentTime;
    const isStartingFromSilence = this.nextPlayTime < now + 0.02;

    let startTime: number;
    if (isStartingFromSilence) {
      // 60ms pre-roll lookahead jitter buffer prevents audio starvation and DAC clicks
      startTime = now + 0.06;
      // Gentle 8ms micro-ramp on utterance start eliminates step discontinuities
      const rampSamples = Math.min(Math.round(ctxRate * 0.008), floatData.length);
      for (let i = 0; i < rampSamples; i++) {
        floatData[i] *= i / rampSamples;
      }
    } else {
      // Contiguous seamless playback
      startTime = Math.max(this.nextPlayTime, now + 0.005);
    }

    buffer.getChannelData(0).set(floatData);

    const source = this.playbackContext.createBufferSource();
    source.buffer = buffer;

    if (this.masterPlaybackGain) {
      source.connect(this.masterPlaybackGain);
    } else if (this.playbackAnalyser) {
      source.connect(this.playbackAnalyser);
    } else {
      source.connect(this.playbackContext.destination);
    }

    source.start(startTime);
    this.nextPlayTime = startTime + buffer.duration;
    this.isPlaying = true;
    this.activeSources.add(source);

    source.onended = () => {
      this.activeSources.delete(source);
      if (
        this.activeSources.size === 0 &&
        this.nextPlayTime <= (this.playbackContext?.currentTime ?? 0) + 0.08
      ) {
        setTimeout(() => {
          if (this.activeSources.size === 0 && !this.stopped) {
            this.isPlaying = false;
            this.lastResampleSample = 0;
            this.onStateChange("LISTENING");
          }
        }, 80);
      }
    };

    this.onStateChange("SPEAKING");
  }

  /**
   * Get audio frequency data and normalized RMS volume (0.0 to 1.0)
   * from active mic or playback analyser for live voice graph animation.
   */
  public getLiveAudioMetrics(): { volume: number; frequencies: number[] } {
    const fallback = { volume: 0, frequencies: new Array(16).fill(0) };
    try {
      const activeAnalyser =
        this.getIsPlaying() && this.playbackAnalyser
          ? this.playbackAnalyser
          : !this.getIsPlaying() && !this.isMuted && this.micAnalyser
          ? this.micAnalyser
          : null;

      if (!activeAnalyser) return fallback;

      const binCount = activeAnalyser.frequencyBinCount;
      const dataArray = new Uint8Array(binCount);
      activeAnalyser.getByteFrequencyData(dataArray);

      let sum = 0;
      const frequencies: number[] = [];
      const step = Math.max(1, Math.floor(binCount / 16));
      for (let i = 0; i < 16; i++) {
        const val = (dataArray[i * step] || 0) / 255;
        frequencies.push(val);
        sum += val * val;
      }

      const volume = Math.min(1, Math.sqrt(sum / 16) * 1.6);
      return { volume, frequencies };
    } catch {
      return fallback;
    }
  }

  /**
   * Handle Gemini Live "interrupted" signal — instantly halts playback click-free.
   */
  handleInterrupted(): void {
    this.isPlaying = false;
    if (this.playbackContext && this.masterPlaybackGain) {
      const now = this.playbackContext.currentTime;
      try {
        // Quick 8ms smooth fade to zero eliminates cutoff clicks
        this.masterPlaybackGain.gain.setValueAtTime(
          this.masterPlaybackGain.gain.value,
          now
        );
        this.masterPlaybackGain.gain.linearRampToValueAtTime(0.0001, now + 0.008);
      } catch {}

      setTimeout(() => {
        this.clearPlaybackQueue();
        if (this.masterPlaybackGain && this.playbackContext) {
          try {
            this.masterPlaybackGain.gain.setValueAtTime(
              1.0,
              this.playbackContext.currentTime
            );
          } catch {}
        }
      }, 10);
    } else {
      this.clearPlaybackQueue();
    }

    this.leftoverByte = null;
    this.lastResampleSample = 0;
    if (!this.stopped) this.onStateChange("LISTENING");
  }

  /** Mute/unmute microphone input. */
  setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (!this.mediaStream) return;
    for (const track of this.mediaStream.getAudioTracks()) {
      track.enabled = !muted;
    }
  }

  /** Full cleanup — call on disconnect. */
  stop(): void {
    this.stopped = true;
    this.clearPlaybackQueue();

    this.workletNode?.disconnect();
    this.sourceNode?.disconnect();
    this.micAnalyser?.disconnect();
    this.playbackAnalyser?.disconnect();
    this.masterPlaybackGain?.disconnect();

    for (const track of this.mediaStream?.getAudioTracks() ?? []) {
      track.stop();
    }

    void this.audioContext?.close().catch(() => {});

    this.audioContext = null;
    this.workletNode = null;
    this.sourceNode = null;
    this.micAnalyser = null;
    this.playbackAnalyser = null;
    this.masterPlaybackGain = null;
    this.mediaStream = null;
    this.playbackContext = null;
    this.leftoverByte = null;
    this.lastResampleSample = 0;
  }

  private clearPlaybackQueue(): void {
    for (const src of this.activeSources) {
      try {
        src.stop();
        src.disconnect();
      } catch {}
    }
    this.activeSources.clear();
    this.nextPlayTime = this.playbackContext?.currentTime ?? 0;
    this.isPlaying = false;
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  // Strip whitespace/newlines if present
  const cleaned = base64.replace(/\s/g, "");
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
