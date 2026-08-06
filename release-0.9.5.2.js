(() => {
  'use strict';
  const VERSION = '0.9.5.2';

  function applyVersion() {
    document.querySelectorAll('.version-badge').forEach(node => { node.textContent = `Version ${VERSION}`; });
    document.querySelectorAll('#alertsView .eyebrow').forEach(node => {
      if (/^Version\s/i.test(node.textContent || '')) node.textContent = `Version ${VERSION}`;
    });
    document.documentElement.dataset.evercadeVersion = VERSION;
  }

  function openLog() {
    const tab = document.querySelector('.tab[data-view="eventlog"]');
    if (tab) { tab.click(); return; }
    if (window.EvercadeEventLog?.render) {
      document.querySelectorAll('.view').forEach(view => { view.hidden = view.id !== 'eventlogView'; });
      window.EvercadeEventLog.render();
    }
  }

  function installLogAccess() {
    const dialog = document.querySelector('#dataDialog .dialog-body');
    if (dialog && !document.querySelector('#openEventLog')) {
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
  }

  async function recoverOldCaches() {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(registration => registration.unregister()));
      }
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.filter(name => /evercade/i.test(name)).map(name => caches.delete(name)));
      }
    } catch (error) {
      console.warn('[Evercade 0.9.5.2] Cache recovery failed', error);
    }
  }

  function boot() {
    applyVersion();
    installLogAccess();
    setTimeout(installLogAccess, 500);
    recoverOldCaches();
    window.EvercadeEventLog?.log?.('info', 'release-finalized', { version: VERSION, logAccess: 'data-dialog-and-tab' });
  }

  window.ProjectEvercadeRelease = { version: VERSION, openLog, installLogAccess };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
