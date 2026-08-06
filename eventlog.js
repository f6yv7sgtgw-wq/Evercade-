(() => {
  'use strict';

  const VERSION = '0.9.5.2';
  const LOG_KEY = 'evercade-eventlog-v0952';
  const MAX_ENTRIES = 1000;
  const originalFetch = window.fetch.bind(window);
  const listeners = new Set();

  function safe(value) {
    try {
      if (value instanceof Error) return { name: value.name, message: value.message, stack: value.stack };
      return JSON.parse(JSON.stringify(value));
    } catch {
      return String(value);
    }
  }

  function readLog() {
    try {
      const value = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  function saveLog(entries) {
    localStorage.setItem(LOG_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)));
  }

  function log(level, event, details = {}) {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      at: new Date().toISOString(),
      level,
      event,
      details: safe(details),
      view: document.querySelector('.tab.active')?.dataset?.view || null,
      online: navigator.onLine
    };
    const entries = readLog();
    entries.push(entry);
    saveLog(entries);
    listeners.forEach(listener => listener(entry));
    return entry;
  }

  function collectKleinanzeigenLog() {
    try {
      const keys = Object.keys(localStorage).filter(key => /evercade-ka-.*-log/i.test(key));
      return keys.flatMap(key => {
        try {
          const items = JSON.parse(localStorage.getItem(key) || '[]');
          return Array.isArray(items) ? items.map(item => ({ ...item, sourceLog: key })) : [];
        } catch { return []; }
      });
    } catch {
      return [];
    }
  }

  function exportPayload() {
    return {
      product: 'Project Evercade',
      version: VERSION,
      exportedAt: new Date().toISOString(),
      environment: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        online: navigator.onLine,
        viewport: { width: innerWidth, height: innerHeight },
        location: location.href
      },
      events: readLog(),
      kleinanzeigen: collectKleinanzeigenLog()
    };
  }

  function downloadJson() {
    const blob = new Blob([JSON.stringify(exportPayload(), null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `project-evercade-eventlog-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    log('info', 'eventlog-exported');
  }

  async function copyLog() {
    const text = JSON.stringify(exportPayload(), null, 2);
    await navigator.clipboard.writeText(text);
    log('info', 'eventlog-copied');
  }

  function clearLog() {
    localStorage.removeItem(LOG_KEY);
    log('info', 'eventlog-cleared');
  }

  function fmt(entry) {
    const time = new Date(entry.at).toLocaleTimeString('de-DE');
    const details = Object.keys(entry.details || {}).length ? JSON.stringify(entry.details) : '';
    return `<article class="eventlog-entry eventlog-${entry.level}">
      <div class="eventlog-meta"><strong>${time}</strong><span>${entry.level.toUpperCase()}</span></div>
      <div class="eventlog-name">${escapeHtml(entry.event)}</div>
      ${details ? `<pre>${escapeHtml(details)}</pre>` : ''}
    </article>`;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[character]));
  }

  function render() {
    const list = document.querySelector('#eventLogList');
    const count = document.querySelector('#eventLogCount');
    if (!list) return;
    const level = document.querySelector('#eventLogLevel')?.value || 'all';
    const query = (document.querySelector('#eventLogSearch')?.value || '').trim().toLowerCase();
    const entries = readLog().filter(entry => {
      if (level !== 'all' && entry.level !== level) return false;
      if (!query) return true;
      return `${entry.event} ${JSON.stringify(entry.details || {})}`.toLowerCase().includes(query);
    }).reverse();
    if (count) count.textContent = `${entries.length} Einträge`;
    list.innerHTML = entries.length ? entries.map(fmt).join('') : '<p class="empty">Noch keine Logeinträge.</p>';
  }

  function installPage() {
    if (document.querySelector('#eventlogView')) return;

    const style = document.createElement('style');
    style.textContent = `
      #eventlogView{margin-bottom:24px}.eventlog-toolbar{display:grid;grid-template-columns:1fr auto;gap:8px;margin:12px 0}.eventlog-toolbar input,.eventlog-toolbar select{width:100%;min-height:42px}.eventlog-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0}.eventlog-list{display:grid;gap:8px}.eventlog-entry{padding:10px;border:1px solid #2a303c;border-radius:10px;background:#141821}.eventlog-meta{display:flex;justify-content:space-between;gap:8px;color:#9aa4b2;font-size:11px}.eventlog-name{font-weight:700;margin-top:4px;overflow-wrap:anywhere}.eventlog-entry pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:11px;color:#bac3cf;margin:6px 0 0}.eventlog-error{border-color:#ef405c}.eventlog-warn{border-color:#e1a83a}.eventlog-info{border-color:#2a8ae8}.eventlog-debug{border-color:#626b78}@media(max-width:520px){.eventlog-actions{grid-template-columns:1fr}.eventlog-toolbar{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);

    const nav = document.querySelector('.tabs');
    if (nav) {
      const button = document.createElement('button');
      button.className = 'tab';
      button.dataset.view = 'eventlog';
      button.textContent = 'Log';
      nav.appendChild(button);
    }

    const main = document.querySelector('main');
    const section = document.createElement('section');
    section.id = 'eventlogView';
    section.className = 'view panel';
    section.hidden = true;
    section.innerHTML = `
      <div class="section-heading"><div><p class="eyebrow">Diagnose</p><h2>Eventlog</h2></div><span id="eventLogCount" class="badge">0 Einträge</span></div>
      <p class="muted compact">Protokolliert Benutzeraktionen, Netzwerkaufrufe, Suchläufe, Fehler und Statusänderungen lokal auf diesem Gerät.</p>
      <div class="eventlog-toolbar"><input id="eventLogSearch" type="search" placeholder="Log durchsuchen …"><select id="eventLogLevel"><option value="all">Alle Stufen</option><option value="error">Fehler</option><option value="warn">Warnungen</option><option value="info">Information</option><option value="debug">Debug</option></select></div>
      <div class="eventlog-actions"><button id="eventLogCopy" class="secondary-button">Log kopieren</button><button id="eventLogExport" class="secondary-button">JSON exportieren</button><button id="eventLogClear" class="danger-button">Log löschen</button></div>
      <div id="eventLogList" class="eventlog-list"></div>`;
    main?.appendChild(section);

    document.querySelector('#eventLogSearch')?.addEventListener('input', render);
    document.querySelector('#eventLogLevel')?.addEventListener('change', render);
    document.querySelector('#eventLogCopy')?.addEventListener('click', async () => { try { await copyLog(); render(); } catch (error) { log('error', 'eventlog-copy-failed', error); render(); } });
    document.querySelector('#eventLogExport')?.addEventListener('click', () => { downloadJson(); render(); });
    document.querySelector('#eventLogClear')?.addEventListener('click', () => { clearLog(); render(); });

    document.body.addEventListener('click', event => {
      const tab = event.target.closest('.tab[data-view="eventlog"]');
      if (!tab) return;
      document.querySelectorAll('.view').forEach(view => { view.hidden = view.id !== 'eventlogView'; });
      document.querySelectorAll('.tab').forEach(item => item.classList.toggle('active', item === tab));
      render();
      log('info', 'view-opened', { view: 'eventlog' });
    });

    listeners.add(() => {
      if (!section.hidden) render();
    });

    render();
  }

  window.fetch = async function loggedFetch(input, init = {}) {
    const url = typeof input === 'string' ? input : input?.url;
    const method = init.method || (typeof input !== 'string' ? input?.method : null) || 'GET';
    const started = performance.now();
    log('debug', 'fetch-start', { method, url });
    try {
      const response = await originalFetch(input, init);
      log(response.ok ? 'info' : 'warn', 'fetch-complete', {
        method, url, status: response.status, ok: response.ok,
        durationMs: Math.round(performance.now() - started)
      });
      return response;
    } catch (error) {
      log('error', 'fetch-error', { method, url, durationMs: Math.round(performance.now() - started), error: safe(error) });
      throw error;
    }
  };

  document.addEventListener('click', event => {
    const target = event.target.closest('button,a,[data-action]');
    if (!target) return;
    log('info', 'ui-click', {
      tag: target.tagName,
      id: target.id || null,
      action: target.dataset?.action || null,
      view: target.dataset?.view || null,
      text: (target.textContent || '').trim().slice(0, 120),
      href: target.href || null
    });
  }, true);

  window.addEventListener('error', event => {
    log('error', 'window-error', { message: event.message, filename: event.filename, line: event.lineno, column: event.colno, error: safe(event.error) });
  });

  window.addEventListener('unhandledrejection', event => {
    log('error', 'unhandled-rejection', { reason: safe(event.reason) });
  });

  window.addEventListener('online', () => log('info', 'network-online'));
  window.addEventListener('offline', () => log('warn', 'network-offline'));
  document.addEventListener('visibilitychange', () => log('debug', 'visibility-change', { state: document.visibilityState }));

  window.EvercadeEventLog = { version: VERSION, log, read: readLog, clear: clearLog, export: exportPayload, render };

  function boot() {
    document.querySelectorAll('.version-badge').forEach(node => { node.textContent = `Version ${VERSION}`; });
    document.querySelectorAll('#alertsView .eyebrow').forEach(node => { if (/^Version\s/i.test(node.textContent || '')) node.textContent = `Version ${VERSION}`; });
    installPage();
    log('info', 'app-start', { version: VERSION, userAgent: navigator.userAgent, href: location.href });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();