(() => {
  'use strict';

  const FALLBACK_VERSION = '0.9.4';

  function applyRelease(release) {
    const version = String(release?.display_version || release?.version || FALLBACK_VERSION);
    window.EvercadeRelease = release || { version, display_version: version };

    document.querySelectorAll('.version-badge').forEach(node => {
      node.textContent = `Version ${version}`;
    });

    const alertVersion = document.querySelector('#alertsView .eyebrow');
    if (alertVersion && /^Version\s/i.test(alertVersion.textContent || '')) {
      alertVersion.textContent = `Version ${version}`;
    }

    document.documentElement.dataset.appVersion = version;
    document.documentElement.dataset.kleinanzeigenAutomatic =
      release?.generic_parser?.automatic === true ? 'true' : 'false';

    window.dispatchEvent(new CustomEvent('evercade:release-loaded', {
      detail: window.EvercadeRelease
    }));
  }

  async function loadRelease() {
    try {
      const response = await fetch(`VERSION.json?ts=${Date.now()}`, {
        cache: 'no-store',
        headers: { accept: 'application/json' }
      });
      if (!response.ok) throw new Error(`VERSION.json HTTP ${response.status}`);
      applyRelease(await response.json());
    } catch (error) {
      console.warn('Project Evercade: VERSION.json konnte nicht geladen werden', error);
      applyRelease(null);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadRelease, { once: true });
  } else {
    loadRelease();
  }
})();
