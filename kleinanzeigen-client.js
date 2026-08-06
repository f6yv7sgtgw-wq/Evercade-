(() => {
  'use strict';

  const VERSION = '0.9.5';
  const CONTRACT = 'generic-parser-module-v1';
  const SOURCE = 'Kleinanzeigen';
  const WORKER = 'https://genericparser.f6yv7sgtgw.workers.dev';
  const DAY = 24 * 60 * 60 * 1000;
  const PAUSE = 5000;
  const DAILY_KEY = 'evercade-ka-v095-daily';
  const STATUS_KEY = 'evercade-ka-v095-status';
  const LOG_KEY = 'evercade-ka-v095-log';
  const $ = selector => document.querySelector(selector);
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  let busy = false;
  let abortRequested = false;

  const persist = () => {
    if (typeof persistState === 'function') persistState();
  };

  function writeLog(event, details = {}) {
    const entry = { at: new Date().toISOString(), event, ...details };
    let log = [];
    try { log = JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); } catch {}
    log.push(entry);
    localStorage.setItem(LOG_KEY, JSON.stringify(log.slice(-200)));
    console.info('[Evercade 0.9.5][Kleinanzeigen]', event, details);
  }

  function storedStatus() {
    try { return JSON.parse(localStorage.getItem(STATUS_KEY) || 'null'); }
    catch { return null; }
  }

  function setStatus({ status = 'unavailable', accepted = 0, candidatesExamined = 0, note = '', checkedAt = null } = {}) {
    const next = {
      name: SOURCE,
      status: status === 'ok' ? 'ok' : status === 'running' ? 'running' : 'unavailable',
      checkedAt,
      lastSuccessAt: status === 'ok' ? checkedAt : storedStatus()?.lastSuccessAt || null,
      note: String(note || '').slice(0, 300),
      accepted: Math.max(0, Number(accepted) || 0),
      candidatesExamined: Math.max(0, Number(candidatesExamined) || 0)
    };

    localStorage.setItem(STATUS_KEY, JSON.stringify(next));

    if (typeof state !== 'undefined') {
      state.background ||= {};
      state.background.sourceStatus = Array.isArray(state.background.sourceStatus)
        ? state.background.sourceStatus
        : [];
      state.background.sourceStatus = [
        ...state.background.sourceStatus.filter(item => item?.name !== SOURCE),
        next
      ].sort((a, b) => String(a.name).localeCompare(String(b.name), 'de'));
      persist();
    }
  }

  function restoreStatus() {
    setStatus(storedStatus() || { status: 'unavailable', note: 'Noch nicht geprüft', checkedAt: null });
  }

  function syncVersion() {
    document.querySelectorAll('.version-badge').forEach(node => {
      node.textContent = `Version ${VERSION}`;
    });
    document.querySelectorAll('#alertsView .eyebrow').forEach(node => {
      if (/^Version\s/i.test(node.textContent || '')) node.textContent = `Version ${VERSION}`;
    });
    document.documentElement.dataset.evercadeVersion = VERSION;
  }

  function show(message, kind = '') {
    const target = $('#genericParserStatus') || $('#liveSearchStatus') || $('#monitorStatus');
    if (!target) return;
    target.className = `live-search-status${kind === 'error' ? ' is-error' : kind === 'loading' ? ' is-loading' : ''}`;
    target.textContent = message;
  }

  async function api(path, options = {}) {
    writeLog('request', { path, method: options.method || 'GET' });
    const response = await fetch(`${WORKER}${path}`, {
      method: options.method || 'GET',
      headers: {
        accept: 'application/json',
        ...(options.body ? { 'content-type': 'application/json' } : {})
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      cache: 'no-store'
    });
    let body = null;
    try { body = await response.json(); } catch {}
    writeLog('response', { path, status: response.status, ok: response.ok });
    if (!response.ok) throw new Error(body?.detail || body?.error || `GenericParser HTTP ${response.status}`);
    return body;
  }

  async function verify() {
    const version = await api('/api/version');
    const contract = version?.module_contract || version?.api_contract;
    if (contract && contract !== CONTRACT) {
      throw new Error(`Nicht unterstützter Vertrag: ${contract}`);
    }

    const capabilities = await api('/api/module/v1/capabilities');
    if (capabilities?.contract && capabilities.contract !== CONTRACT) {
      throw new Error(`Capabilities-Vertrag nicht unterstützt: ${capabilities.contract}`);
    }
    if (Array.isArray(capabilities?.sources) && !capabilities.sources.includes('kleinanzeigen')) {
      throw new Error('Kleinanzeigen-Modul wird vom Worker nicht angeboten.');
    }
    return version;
  }

  function requestFor(item, page) {
    const limit = Number(state?.background?.priceLimits?.[item.key]);
    return {
      profile: {
        profile_id: `evercade:${item.key}`,
        display_name: `Evercade · ${item.title}`,
        query: `Evercade ${item.title}`,
        required_terms: [],
        excluded_terms: ['nur Hülle', 'Leerhülle', 'Controller', 'Konsole'],
        model_patterns: [item.title],
        brands: ['Evercade', 'Blaze'],
        max_price: Number.isFinite(limit) && limit > 0 ? limit : null,
        accept_bundles: false,
        accept_incomplete: false,
        include_review: true,
        include_rejected: false,
        sort_by: 'date'
      },
      page,
      source: 'auto',
      debug: { enabled: false }
    };
  }

  function normalize(listing) {
    const price = Number(listing?.price);
    if (!listing?.id || !listing?.url || !Number.isFinite(price) || price < 0) return null;
    return {
      id: `kleinanzeigen-${listing.id}`,
      source: SOURCE,
      title: String(listing.title || ''),
      price,
      shipping: null,
      total: null,
      shippingKnown: false,
      condition: String(listing.result_info?.condition || 'Gebraucht'),
      availability: 'in_stock',
      sellerType: 'Privat',
      color: 'Automatisch',
      url: String(listing.url),
      confidence: Math.max(0, Math.min(100, Number(listing.match?.score) || 0)),
      verifiedAt: new Date().toISOString(),
      place: [listing.postal_code, listing.place].filter(Boolean).join(' '),
      trafficLight: listing.traffic_light?.color || 'yellow'
    };
  }

  async function searchItem(item, maxPackets = 1) {
    const offers = new Map();
    let page = 0;
    let packets = 0;
    let candidatesExamined = 0;

    while (packets < maxPackets && !abortRequested) {
      const result = await api('/api/module/v1/search', {
        method: 'POST',
        body: requestFor(item, page)
      });
      if (result?.contract && result.contract !== CONTRACT) throw new Error('Inkonsistente GenericParser-Antwort.');
      if (result?.profile_id && result.profile_id !== `evercade:${item.key}`) throw new Error('Falsche Profil-ID in der Parser-Antwort.');

      candidatesExamined += Number(
        result?.metrics?.candidates_examined ||
        result?.counts?.parsed ||
        (result.listings || []).length
      ) || 0;

      for (const listing of result.listings || []) {
        const offer = normalize(listing);
        if (offer) offers.set(offer.id, offer);
      }

      packets += 1;
      const pagination = result.pagination || {};
      if (pagination.complete || pagination.next_page == null) break;
      page = Number(pagination.next_page);
      if (!Number.isInteger(page) || page < 0) throw new Error('Ungültige Pagination.');
      await wait(PAUSE);
    }

    return { offers: [...offers.values()], packets, candidatesExamined };
  }

  function merge(item, offers) {
    if (typeof state === 'undefined') return;
    state.monitor ||= { observations: {}, history: {} };
    state.monitor.observations ||= {};
    const previous = state.monitor.observations[item.key] || { offers: [] };
    const otherSources = (previous.offers || []).filter(offer => offer?.source !== SOURCE);
    state.monitor.observations[item.key] = {
      ...previous,
      checkedAt: new Date().toISOString(),
      offers: [...otherSources, ...offers].slice(0, 20),
      automaticSourcesAvailable: Math.max(10, Number(previous.automaticSourcesAvailable) || 0),
      candidatesExamined: Math.max(Number(previous.candidatesExamined) || 0, offers.length)
    };
    persist();
  }

  function renderOffers(offers) {
    const host = $('#liveDealResults');
    if (!host) return;
    let target = $('#genericParserResults');
    if (!target) {
      target = document.createElement('div');
      target.id = 'genericParserResults';
      target.className = 'live-deal-results';
      host.appendChild(target);
    }
    target.innerHTML = offers.length
      ? offers.map(offer => `<article class="cartridge live-offer"><div class="deal-detail"><strong>${offer.price.toFixed(2).replace('.', ',')} € · Kleinanzeigen</strong><span>${offer.title}</span><small>${offer.place || 'Ort nicht angegeben'} · Versand im Inserat prüfen</small></div><div class="card-actions"><a class="secondary-button link-button" href="${offer.url}" target="_blank" rel="noopener">Anzeige öffnen</a></div></article>`).join('')
      : '<p class="empty">Keine passenden Kleinanzeigen-Treffer gefunden.</p>';
  }

  async function runInteractiveSearch() {
    if (busy) return;
    const key = $('#searchCatalogItem')?.value;
    const item = typeof catalogByKey !== 'undefined' ? catalogByKey.get(key) : null;
    if (!item) return;

    busy = true;
    abortRequested = false;
    show('Kleinanzeigen wird über GenericParser 0.45 geprüft …', 'loading');
    setStatus({ status: 'running', note: `Suche nach ${item.title}`, checkedAt: new Date().toISOString() });
    writeLog('interactive-start', { key: item.key, title: item.title });

    try {
      const workerVersion = await verify();
      const result = await searchItem(item, 4);
      merge(item, result.offers);
      const checkedAt = new Date().toISOString();
      setStatus({ status: 'ok', accepted: result.offers.length, candidatesExamined: result.candidatesExamined, checkedAt });
      renderOffers(result.offers);
      show(`${result.offers.length} Kleinanzeigen-Treffer · ${result.packets} Paket(e) · Worker ${workerVersion?.version || '0.45.0'}.`);
      writeLog('interactive-complete', { accepted: result.offers.length, packets: result.packets });
      if (typeof renderAlerts === 'function') renderAlerts();
    } catch (error) {
      setStatus({ status: 'unavailable', note: error.message, checkedAt: new Date().toISOString() });
      show(`Kleinanzeigen-Suche fehlgeschlagen: ${error.message}`, 'error');
      writeLog('interactive-error', { message: error.message });
      if (typeof renderAlerts === 'function') renderAlerts();
    } finally {
      busy = false;
    }
  }

  function due() {
    const last = Number(localStorage.getItem(DAILY_KEY) || 0);
    return !last || Date.now() - last >= DAY;
  }

  async function runDailyScan({ force = false, silent = false } = {}) {
    if (busy || (!force && !due()) || typeof missingItems !== 'function') return;
    const items = missingItems();
    if (!Array.isArray(items) || !items.length) return;

    busy = true;
    abortRequested = false;
    let accepted = 0;
    let candidatesExamined = 0;
    let completed = 0;
    setStatus({ status: 'running', note: `0/${items.length} Cartridges geprüft`, checkedAt: new Date().toISOString() });
    writeLog('daily-start', { force, items: items.length });

    try {
      await verify();
      for (let index = 0; index < items.length && !abortRequested; index += 1) {
        const item = items[index];
        show(`Kleinanzeigen ${index + 1}/${items.length}: ${item.title}`, 'loading');
        setStatus({ status: 'running', accepted, candidatesExamined, note: `${index + 1}/${items.length}: ${item.title}`, checkedAt: new Date().toISOString() });
        if (typeof renderAlerts === 'function' && index % 5 === 0) renderAlerts();

        try {
          const result = await searchItem(item, 1);
          accepted += result.offers.length;
          candidatesExamined += result.candidatesExamined;
          merge(item, result.offers);
        } catch (error) {
          writeLog('item-error', { key: item.key, message: error.message });
        }
        completed += 1;
        if (index < items.length - 1 && !abortRequested) await wait(PAUSE);
      }

      const checkedAt = new Date().toISOString();
      if (!abortRequested) localStorage.setItem(DAILY_KEY, String(Date.now()));
      setStatus({
        status: abortRequested ? 'unavailable' : 'ok',
        accepted,
        candidatesExamined,
        note: abortRequested ? `Abgebrochen nach ${completed}/${items.length}` : `${completed}/${items.length} Cartridges geprüft`,
        checkedAt
      });
      show(abortRequested
        ? `Kleinanzeigen-Prüfung nach ${completed}/${items.length} abgebrochen.`
        : `Kleinanzeigen-Prüfung abgeschlossen: ${accepted} passende Anzeigen.`,
        abortRequested ? 'error' : '');
      writeLog('daily-complete', { completed, total: items.length, accepted, aborted: abortRequested });
      if (typeof render === 'function') render();
      if (typeof renderAlerts === 'function') renderAlerts();
    } catch (error) {
      setStatus({ status: 'unavailable', note: error.message, checkedAt: new Date().toISOString() });
      show(`Kleinanzeigen-Prüfung fehlgeschlagen: ${error.message}`, 'error');
      writeLog('daily-error', { message: error.message });
    } finally {
      busy = false;
    }
  }

  function installHooks() {
    if (typeof applyBackgroundSnapshot === 'function' && !applyBackgroundSnapshot.__ka095) {
      const original = applyBackgroundSnapshot;
      applyBackgroundSnapshot = function (...args) {
        const result = original.apply(this, args);
        restoreStatus();
        return result;
      };
      applyBackgroundSnapshot.__ka095 = true;
    }

    if (typeof runBackgroundScan === 'function' && !runBackgroundScan.__ka095) {
      const original = runBackgroundScan;
      runBackgroundScan = async function (...args) {
        const result = await original.apply(this, args);
        await runDailyScan({ force: true, silent: false });
        return result;
      };
      runBackgroundScan.__ka095 = true;
    }
  }

  function bind() {
    syncVersion();
    restoreStatus();
    installHooks();

    $('#searchDealsButton')?.addEventListener('click', () => setTimeout(runInteractiveSearch, 0));

    document.body.addEventListener('click', event => {
      const refreshButton = event.target.closest('[data-action="background-refresh"]');
      if (refreshButton) {
        writeLog('background-button-click');
        setTimeout(() => runDailyScan({ force: true, silent: false }), 50);
      }
    }, true);

    setTimeout(() => runDailyScan({ silent: true }), 1500);
  }

  window.EvercadeKleinanzeigen = {
    version: VERSION,
    workerUrl: WORKER,
    runInteractiveSearch,
    runDailyScan,
    stop() { abortRequested = true; },
    getLog() {
      try { return JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); }
      catch { return []; }
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
})();