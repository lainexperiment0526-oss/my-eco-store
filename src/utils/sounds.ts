// Sound utility for app audio effects
export const sounds = {
  loadingComplete: '/sounds/loading-complete.mp3',
  success: '/sounds/success.mp3',
  error: '/sounds/error.mp3',
  notification: '/sounds/notification.mp3',
  click: '/sounds/click.mp3',
} as const;

// Track if user has interacted with the page
let userInteracted = false;
if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', () => { userInteracted = true; }, { once: true });
  window.addEventListener('keydown', () => { userInteracted = true; }, { once: true });
}

export const playSound = (soundPath: string, volume: number = 0.5) => {
  try {
    // Check if audio is supported
    if (typeof Audio === 'undefined') {
      console.warn('Audio not supported in this environment');
      return;
    }
    // Only play if user has interacted
    if (!userInteracted) {
      console.warn('Audio playback blocked: user has not interacted with the document yet.');
      return;
    }
    const audio = new Audio(soundPath);
    audio.volume = Math.min(Math.max(volume, 0), 1); // Clamp volume between 0 and 1
    // Play the sound
    const playPromise = audio.play();
    // Handle promise-based play() method
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Sound played successfully
        })
        .catch((error) => {
          console.warn('Sound playback failed:', error);
        });
    }
  } catch (error) {
    console.warn('Failed to play sound:', error);
  }
};

// Preload sounds for better performance
export const preloadSounds = () => {
  try {
    Object.values(sounds).forEach((soundPath) => {
      const audio = new Audio(soundPath);
      audio.preload = 'auto';
      audio.load();
    });
  } catch (error) {
    console.warn('Failed to preload sounds:', error);
  }
};