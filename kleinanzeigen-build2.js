(() => {
  const BUILD = '0.9.2 Build 2';
  const SOURCE_NAME = 'Kleinanzeigen';
  const STORAGE_KEY = 'evercade-kleinanzeigen-source-status-v2';
  const $ = selector => document.querySelector(selector);

  function readStored() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {}
    return {
      name: SOURCE_NAME,
      status: 'unavailable',
      checkedAt: null,
      lastSuccessAt: null,
      note: 'GenericParser 0.45 bereit – noch nicht geprüft',
      candidatesExamined: 0,
      accepted: 0
    };
  }

  function normalize(value) {
    return {
      name: SOURCE_NAME,
      status: value?.status === 'ok' ? 'ok' : 'unavailable',
      checkedAt: value?.checkedAt || null,
      lastSuccessAt: value?.lastSuccessAt || null,
      note: String(value?.note || '').slice(0, 300),
      candidatesExamined: Math.max(0, Number(value?.candidatesExamined) || 0),
      accepted: Math.max(0, Number(value?.accepted) || 0)
    };
  }

  function same(a, b) {
    return JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));
  }

  function upsertSourceStatus(next, rerender = true) {
    const normalized = normalize(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    if (typeof state === 'undefined' || !state?.background) return;
    if (!Array.isArray(state.background.sourceStatus)) state.background.sourceStatus = [];
    const index = state.background.sourceStatus.findIndex(source => source?.name === SOURCE_NAME);
    const previous = index >= 0 ? state.background.sourceStatus[index] : null;
    if (same(previous, normalized)) return;
    if (index >= 0) state.background.sourceStatus[index] = normalized;
    else state.background.sourceStatus.push(normalized);
    if (typeof saveState === 'function') saveState();
    if (rerender && typeof render === 'function') render();
  }

  function parseCount(text) {
    const match = String(text || '').match(/(\d+)\s+(?:Kleinanzeigen-)?Treffer/i) ||
      String(text || '').match(/abgeschlossen:\s*(\d+)\s+Angebote/i);
    return match ? Number(match[1]) : 0;
  }

  function consumeStatus(text) {
    const message = String(text || '').trim();
    if (!message) return;
    const now = new Date().toISOString();
    const current = readStored();
    if (/fehlgeschlagen|HTTP\s+\d+|falschen Vertrag|nicht angeboten/i.test(message)) {
      upsertSourceStatus({
        ...current,
        status: 'unavailable',
        checkedAt: now,
        note: message
      });
      return;
    }
    if (/Treffer|abgeschlossen/i.test(message)) {
      const accepted = parseCount(message);
      upsertSourceStatus({
        name: SOURCE_NAME,
        status: 'ok',
        checkedAt: now,
        lastSuccessAt: now,
        note: message,
        candidatesExamined: Math.max(current.candidatesExamined || 0, accepted),
        accepted
      });
    }
  }

  function ensureCoverage() {
    const coverage = $('#sourceCoverage');
    if (!coverage || !coverage.innerHTML) return;
    coverage.innerHTML = coverage.innerHTML
      .replace(/<strong>\s*21\s+Quellen:/i, '<strong>22 Quellen:')
      .replace(/\b9\s+automatisch\b/i, '10 automatisch');
    let pills = coverage.querySelector('.source-pills');
    if (!pills) return;
    let pill = pills.querySelector('[data-source="kleinanzeigen"]');
    const source = readStored();
    if (!pill) {
      pill = document.createElement('span');
      pill.dataset.source = 'kleinanzeigen';
      pills.appendChild(pill);
    }
    pill.className = `source-pill is-${source.status === 'ok' ? 'ok' : 'unavailable'}`;
    pill.textContent = `${source.status === 'ok' ? '✓' : '!'} Kleinanzeigen: ${source.accepted || 0}`;
  }

  function setBuildLabel() {
    document.querySelectorAll('.version-badge').forEach(node => {
      node.textContent = `Version ${BUILD}`;
    });
    const alertVersion = $('#alertsView .eyebrow');
    if (alertVersion && /^Version\s/i.test(alertVersion.textContent || '')) {
      alertVersion.textContent = `Version ${BUILD}`;
    }
  }

  function bindObservers() {
    const status = $('#genericParserStatus') || $('#liveSearchStatus');
    if (status) {
      const observe = () => consumeStatus(status.textContent);
      new MutationObserver(observe).observe(status, { childList: true, subtree: true, characterData: true, attributes: true });
      observe();
    }
    const coverage = $('#sourceCoverage');
    if (coverage) {
      new MutationObserver(ensureCoverage).observe(coverage, { childList: true, subtree: true });
      ensureCoverage();
    }
  }

  function init() {
    setBuildLabel();
    upsertSourceStatus(readStored(), false);
    bindObservers();
    setTimeout(() => {
      setBuildLabel();
      ensureCoverage();
      if (typeof render === 'function') render();
    }, 250);
  }

  window.EvercadeBuild2 = { build: BUILD, source: SOURCE_NAME, readStored };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
