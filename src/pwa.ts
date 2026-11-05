import { registerSW } from 'virtual:pwa-register';

/**
 * Initializes and registers the JanmaSaathi Service Worker
 * for offline app shell caching and Android PWA installability.
 */
export function initPWA() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const updateSW = registerSW({
        immediate: true,
        onNeedRefresh() {
          console.log('[JanmaSaathi PWA] New version available. Updating app shell...');
          updateSW(true);
        },
        onOfflineReady() {
          console.log('[JanmaSaathi PWA] Application shell cached. Ready for offline use.');
        },
        onRegisterError(error) {
          console.warn('[JanmaSaathi PWA] Service Worker registration warning:', error);
        },
      });
    } catch (err) {
      console.warn('[JanmaSaathi PWA] Unable to initialize service worker:', err);
    }
  }
}
