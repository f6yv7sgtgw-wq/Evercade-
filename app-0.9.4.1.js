(() => {
  'use strict';

  const VERSION = '0.9.4.2';
  const SOURCE = 'Kleinanzeigen';
  const STATUS_KEY = 'evercade-kleinanzeigen-094-source-status';
  let repairing = false;

  function storedStatus() {
    try {
      const value = JSON.parse(localStorage.getItem(STATUS_KEY) || 'null');
      if (value && typeof value === 'object') return {
        name: SOURCE,
        status: value.status === 'ok' ? 'ok' : 'unavailable',
        checkedAt: value.checkedAt || null,
        lastSuccessAt: value.lastSuccessAt || null,
        note: String(value.note || 'GenericParser 0.45 bereit – noch nicht geprüft'),
        candidatesExamined: Math.max(0, Number(value.candidatesExamined) || 0),
        accepted: Math.max(0, Number(value.accepted) || 0)
      };
    } catch {}
    return {
      name: SOURCE,
      status: 'unavailable',
      checkedAt: null,
      lastSuccessAt: null,
      note: 'GenericParser 0.45 bereit – noch nicht geprüft',
      candidatesExamined: 0,
      accepted: 0
    };
  }

  function ensureState() {
    if (repairing || typeof state === 'undefined' || !state?.background) return false;
    repairing = true;
    try {
      if (!Array.isArray(state.background.sourceStatus)) state.background.sourceStatus = [];
      const status = storedStatus();
      const index = state.background.sourceStatus.findIndex(entry => entry?.name === SOURCE);
      if (index >= 0) state.background.sourceStatus[index] = status;
      else state.background.sourceStatus.push(status);
      if (typeof persistState === 'function') persistState();
      return true;
    } finally {
      repairing = false;
    }
  }

  function formatDate(value) {
    if (!value) return 'noch nicht geprüft';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'noch nicht geprüft' : new Intl.DateTimeFormat('de-DE').format(date);
  }

  function repairUi() {
    document.querySelectorAll('.version-badge').forEach(node => {
      node.textContent = `Version ${VERSION}`;
    });
    const version = document.querySelector('#alertsView .eyebrow');
    if (version && /^Version\s/i.test(version.textContent || '')) version.textContent = `Version ${VERSION}`;

    ensureState();
    const statuses = Array.isArray(state?.background?.sourceStatus) ? state.background.sourceStatus : [];
    const heading = [...document.querySelectorAll('.source-heading')]
      .find(node => /Automatische Bezugsquellen/i.test(node.textContent || ''));
    const badge = heading?.querySelector('.badge');
    if (badge) badge.textContent = `${statuses.length} automatisch`;

    const list = document.querySelector('.source-status-list');
    if (list && ![...list.querySelectorAll('.source-status-row strong')].some(node => node.textContent.trim() === SOURCE)) {
      const status = storedStatus();
      const row = document.createElement('div');
      row.className = 'source-status-row';
      row.dataset.source = 'kleinanzeigen';
      row.innerHTML = `
        <span class="source-status-dot is-${status.status === 'ok' ? 'ok' : 'error'}"></span>
        <div>
          <strong>Kleinanzeigen</strong>
          <small>${status.status === 'ok' ? 'Erfolgreich geprüft' : 'Beim letzten Lauf nicht erreichbar'} · ${formatDate(status.checkedAt)}</small>
        </div>
        <span>${status.accepted || 0} Treffer</span>`;
      list.appendChild(row);
    }

    const sourceText = [...document.querySelectorAll('.deal-search-box .muted.compact')]
      .find(node => /Bezugsquellen/i.test(node.textContent || ''));
    if (sourceText) sourceText.textContent = '23 Bezugsquellen: 11 werden automatisch ausgewertet – einschließlich Kleinanzeigen über GenericParser 0.45. 12 weitere öffnen eine gezielte Direktsuche.';
  }

  function repairAfterServerAction() {
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      ensureState();
      repairUi();
      if (attempts >= 30) clearInterval(timer);
    }, 1000);

    setTimeout(() => {
      const runner = window.EvercadeKleinanzeigen094?.runDailyScan;
      if (typeof runner === 'function') {
        runner({ force: true, silent: false });
      } else {
        console.error('Evercade 0.9.4.2: GenericParser runner is unavailable');
      }
    }, 1500);
  }

  function init() {
    ensureState();
    repairUi();
    const target = document.querySelector('#alertsContent') || document.body;
    new MutationObserver(() => {
      ensureState();
      repairUi();
    }).observe(target, { childList: true, subtree: true });

    document.addEventListener('click', event => {
      const button = event.target.closest('[data-action="background-scan"], [data-action="background-refresh"]');
      if (button) repairAfterServerAction();
    }, true);

    setInterval(() => {
      ensureState();
      repairUi();
    }, 5000);
  }

  window.Evercade0942 = { version: VERSION, ensureState, repairUi, repairAfterServerAction };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
