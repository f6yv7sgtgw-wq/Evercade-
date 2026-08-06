(() => {
  'use strict';
  const VERSION = '0.9.5.1';

  function applyVersion() {
    document.querySelectorAll('.version-badge').forEach(node => {
      node.textContent = `Version ${VERSION}`;
    });
    document.querySelectorAll('#alertsView .eyebrow').forEach(node => {
      if (/^Version\s/i.test(node.textContent || '')) node.textContent = `Version ${VERSION}`;
    });
    document.documentElement.dataset.evercadeVersion = VERSION;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyVersion, { once: true });
  } else {
    applyVersion();
  }

  window.ProjectEvercadeHotfix = {
    version: VERSION,
    baseVersion: '0.9.5',
    purpose: 'deployment and visible version hotfix'
  };
})();
