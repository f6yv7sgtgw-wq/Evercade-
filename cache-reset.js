(() => {
  'use strict';

  const RESET_KEY = 'evercade-cache-reset-0942';

  async function clearLegacyRuntime() {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(registration => registration.unregister()));
      }
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map(name => caches.delete(name)));
      }
      sessionStorage.setItem(RESET_KEY, 'done');
    } catch (error) {
      console.warn('Project Evercade: alter PWA-Cache konnte nicht vollständig entfernt werden', error);
    }
  }

  window.EvercadeCacheReset = clearLegacyRuntime();
})();
