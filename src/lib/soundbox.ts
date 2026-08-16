/**
 * Soundbox — Web Audio API voice synthesis
 * Announces payment received to merchant using Speech Synthesis API.
 * Falls back to a pleasant chime tone if speech synthesis is unavailable.
 */

export interface SoundboxOptions {
  amount: number;
  customerName?: string | null;
  totalToday?: number;
  volume?: number; // 0-100
}

export function announcePayment({
  amount,
  customerName,
  totalToday,
  volume = 80,
}: SoundboxOptions): void {
  if (typeof window === 'undefined') return;

  const amountFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);

  let message = `Payment received! ${amountFormatted}`;

  if (customerName) {
    message += ` from ${customerName}.`;
  }

  if (totalToday) {
    const totalFormatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(totalToday);
    message += ` Your total today is ${totalFormatted}.`;
  }

  if ('speechSynthesis' in window) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.volume = volume / 100;
    utterance.rate = 0.95;
    utterance.pitch = 1.1;

    // Try to find a good US English voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) =>
        v.lang === 'en-US' &&
        (v.name.includes('Samantha') ||
          v.name.includes('Alex') ||
          v.name.includes('Google') ||
          v.name.includes('Microsoft'))
    );

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
  } else {
    // Fallback: play a pleasant chime using Web Audio API
    playChime(volume / 100);
  }
}

function playChime(volumeLevel: number = 0.8): void {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContext();

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const noteDuration = 0.15;

    notes.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime + i * noteDuration);

      gainNode.gain.setValueAtTime(0, ctx.currentTime + i * noteDuration);
      gainNode.gain.linearRampToValueAtTime(
        volumeLevel * 0.5,
        ctx.currentTime + i * noteDuration + 0.02
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + i * noteDuration + noteDuration
      );

      oscillator.start(ctx.currentTime + i * noteDuration);
      oscillator.stop(ctx.currentTime + i * noteDuration + noteDuration);
    });
  } catch (err) {
    console.warn('Audio playback failed:', err);
  }
}

export function preloadVoices(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }
}
