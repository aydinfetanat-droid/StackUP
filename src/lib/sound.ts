// Lightweight synthesized sound effects via the Web Audio API — no audio
// asset files needed. Safe to call from a click handler (satisfies browser
// autoplay policies since it's triggered by a user gesture).
import { isSoundEnabled } from "./preferences";

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined" || !isSoundEnabled()) return null;
  const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!ctx) ctx = new AudioCtx();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(freq: number, startTime: number, duration: number, gain: number, audioCtx: AudioContext) {
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

export function playCorrectSound() {
  const audioCtx = getContext();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  tone(523.25, now, 0.14, 0.12, audioCtx); // C5
  tone(783.99, now + 0.08, 0.18, 0.12, audioCtx); // G5
}

export function playIncorrectSound() {
  const audioCtx = getContext();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  tone(311.13, now, 0.16, 0.08, audioCtx); // Eb4
  tone(261.63, now + 0.1, 0.2, 0.08, audioCtx); // C4
}

export function playCelebrationSound() {
  const audioCtx = getContext();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => tone(freq, now + i * 0.09, 0.22, 0.11, audioCtx));
}
