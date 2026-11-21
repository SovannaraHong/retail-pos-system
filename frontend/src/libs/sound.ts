"use client";

// Audio utility for payment notification sound
export function playPaymentSuccessSound() {
  try {
    const audio = new Audio("/sound/notification.mp3");
    audio.volume = 0.85;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay policy prevented playback until user interaction
      });
    }
  } catch {
    // Audio playback not supported or failed
  }
}
