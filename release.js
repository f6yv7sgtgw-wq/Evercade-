(() => {
  'use strict';

  let VERSION = document.querySelector('meta[name="app-version"]')?.content || 'unknown';

  function applyVersion() {
    document.querySelectorAll('.version-badge').forEach(node => { node.textContent = `Version ${VERSION}`; });
    document.querySelectorAll('#alertsView .eyebrow').forEach(node => {
      if (/^Version\s/i.test(node.textContent || '')) node.textContent = `Version ${VERSION}`;
    });
    document.documentElement.dataset.evercadeVersion = VERSION;
  }

  async function loadCanonicalVersion() {
    try {
      const response = await fetch(`VERSION.json?runtime=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`VERSION.json HTTP ${response.status}`);
      const release = await response.json();
      const canonical = String(release?.version || release?.display_version || '').trim();
      if (canonical) VERSION = canonical;
    } catch (error) {
      console.warn('[Project Evercade] canonical version lookup failed', error);
    }
    applyVersion();
    if (window.ProjectEvercadeRelease) window.ProjectEvercadeRelease.version = VERSION;
  }

  function openLog() {
    const tab = document.querySelector('.tab[data-view="eventlog"]');
    if (tab) { tab.click(); return; }
    document.querySelectorAll('.view').forEach(view => { view.hidden = view.id !== 'eventlogView'; });
    window.EvercadeEventLog?.render?.();
  }

  function installLogAccess() {
    const dialog = document.querySelector('#dataDialog .dialog-body');
    if (!dialog || document.querySelector('#openEventLog')) return;
    const button = document.createElement('button');
    button.id = 'openEventLog';
    button.type = 'button';
    button.className = 'secondary-button full-width';
    button.textContent = 'Eventlog öffnen';
    button.addEventListener('click', () => {
      document.querySelector('#dataDialog')?.close();
      openLog();
    });
    const reset = document.querySelector('#resetButton');
    dialog.insertBefore(button, reset || null);
  }

  async function removeLegacyCachesOnce() {
    const key = `evercade-cache-cleaned-${VERSION}`;
    if (sessionStorage.getItem(key)) return;
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(registration => registration.unregister()));
      }
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.filter(name => /evercade/i.test(name)).map(name => caches.delete(name)));
      }
      sessionStorage.setItem(key, '1');
    } catch (error) {
      console.warn(`[Evercade ${VERSION}] cache cleanup failed`, error);
    }
  }

  async function boot() {
    applyVersion();
    await loadCanonicalVersion();
    installLogAccess();
    setTimeout(installLogAccess, 500);
    await removeLegacyCachesOnce();
    window.EvercadeEventLog?.log?.('info', 'release-loaded', { version: VERSION, logAccess: 'menu-and-tab' });
  }

  window.ProjectEvercadeRelease = { version: VERSION, openLog, installLogAccess, reloadVersion: loadCanonicalVersion };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
