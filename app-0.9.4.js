(() => {
  'use strict';

  const VERSION = '0.9.4';
  const SOURCE_NAME = 'Kleinanzeigen';
  const WORKER_URL = 'https://genericparser.f6yv7sgtgw.workers.dev';
  const CONTRACT = 'generic-parser-module-v1';
  const DAILY_KEY = 'evercade-kleinanzeigen-094-last-scan';
  const STATUS_KEY = 'evercade-kleinanzeigen-094-source-status';
  const DAY_MS = 24 * 60 * 60 * 1000;
  const PAUSE_MS = 5000;
  const MAX_INTERACTIVE_PACKETS = 4;
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  let busy = false;
  let current = { key: null, offers: [] };

  function defaultSourceStatus() {
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

  function normalizeSourceStatus(value) {
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

  function readStoredSourceStatus() {
    try {
      return normalizeSourceStatus(JSON.parse(localStorage.getItem(STATUS_KEY) || 'null'));
    } catch {
      return defaultSourceStatus();
    }
  }

  function upsertSourceStatus(value, { rerender = false } = {}) {
    if (typeof state === 'undefined' || !state?.background) return;
    const normalized = normalizeSourceStatus(value || readStoredSourceStatus());
    localStorage.setItem(STATUS_KEY, JSON.stringify(normalized));
    if (!Array.isArray(state.background.sourceStatus)) state.background.sourceStatus = [];
    const withoutKleinanzeigen = state.background.sourceStatus.filter(source => source?.name !== SOURCE_NAME);
    state.background.sourceStatus = [...withoutKleinanzeigen, normalized];
    if (typeof persistState === 'function') persistState();
    if (rerender && typeof render === 'function') render();
  }

  function patchSourceUi() {
    document.querySelectorAll('.version-badge').forEach(node => {
      node.textContent = `Version ${VERSION}`;
    });
    const alertVersion = document.querySelector('#alertsView .eyebrow');
    if (alertVersion && /^Version\s/i.test(alertVersion.textContent || '')) {
      alertVersion.textContent = `Version ${VERSION}`;
    }
    const sourceHeading = [...document.querySelectorAll('.source-heading')]
      .find(node => /Automatische Bezugsquellen/i.test(node.textContent || ''));
    if (sourceHeading) {
      const badge = sourceHeading.querySelector('.badge');
      const count = Array.isArray(state?.background?.sourceStatus)
        ? state.background.sourceStatus.length
        : 10;
      if (badge) badge.textContent = `${count} automatisch`;
    }
    const sourceText = [...document.querySelectorAll('.deal-search-box .muted.compact')]
      .find(node => /Bezugsquellen/i.test(node.textContent || ''));
    if (sourceText) {
      sourceText.textContent = '22 Bezugsquellen: 10 werden automatisch ausgewertet – einschließlich Kleinanzeigen über GenericParser 0.45. 12 weitere öffnen eine gezielte Direktsuche.';
    }
  }

  function wrapStateFunctions() {
    if (typeof applyBackgroundSnapshot === 'function' && !applyBackgroundSnapshot.__ka094Wrapped) {
      const original = applyBackgroundSnapshot;
      applyBackgroundSnapshot = function wrappedApplyBackgroundSnapshot(...args) {
        const result = original.apply(this, args);
        upsertSourceStatus(readStoredSourceStatus());
        return result;
      };
      applyBackgroundSnapshot.__ka094Wrapped = true;
    }

    if (typeof renderAlerts === 'function' && !renderAlerts.__ka094Wrapped) {
      const original = renderAlerts;
      renderAlerts = function wrappedRenderAlerts(...args) {
        upsertSourceStatus(readStoredSourceStatus());
        const result = original.apply(this, args);
        patchSourceUi();
        return result;
      };
      renderAlerts.__ka094Wrapped = true;
    }

    if (typeof runBackgroundScan === 'function' && !runBackgroundScan.__ka094Wrapped) {
      const original = runBackgroundScan;
      runBackgroundScan = async function wrappedRunBackgroundScan(...args) {
        await original.apply(this, args);
        await runDailyScan({ force: true, silent: false });
      };
      runBackgroundScan.__ka094Wrapped = true;
    }
  }

  async function api(path, options = {}) {
    const response = await fetch(`${WORKER_URL}${path}`, {
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
    if (!response.ok) throw new Error(body?.detail || `GenericParser HTTP ${response.status}`);
    return body;
  }

  async function verifyWorker() {
    const version = await api('/api/version');
    const contract = version?.module_contract || version?.api_contract;
    if (contract !== CONTRACT) throw new Error(`Nicht unterstützter Vertrag: ${contract || 'unbekannt'}`);
    const capabilities = await api('/api/module/v1/capabilities');
    if (capabilities?.contract !== CONTRACT) throw new Error('Capabilities melden einen falschen Vertrag.');
    if (!capabilities?.sources?.includes('kleinanzeigen')) throw new Error('Kleinanzeigen wird nicht angeboten.');
    return version;
  }

  function requestFor(item, page) {
    const rawLimit = state?.background?.priceLimits?.[item.key];
    const maxPrice = Number(rawLimit);
    return {
      profile: {
        profile_id: `evercade:${item.key}`,
        display_name: `Evercade · ${item.title}`,
        query: `Evercade ${item.title}`,
        required_terms: [],
        excluded_terms: ['nur Hülle', 'Leerhülle', 'Controller', 'Konsole'],
        model_patterns: [item.title],
        brands: ['Evercade', 'Blaze'],
        max_price: Number.isFinite(maxPrice) && maxPrice > 0 ? maxPrice : null,
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

  function normalizeListing(listing) {
    const price = Number(listing?.price);
    if (!listing?.id || !listing?.url || !Number.isFinite(price) || price < 0) return null;
    return {
      id: `kleinanzeigen-${listing.id}`,
      source: SOURCE_NAME,
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

  async function searchItem(item, maxPackets = MAX_INTERACTIVE_PACKETS) {
    const byId = new Map();
    let page = 0;
    let packets = 0;
    let candidatesExamined = 0;
    while (packets < maxPackets) {
      const result = await api('/api/module/v1/search', {
        method: 'POST',
        body: requestFor(item, page)
      });
      if (result?.contract !== CONTRACT || result?.profile_id !== `evercade:${item.key}`) {
        throw new Error('Inkonsistente GenericParser-Antwort.');
      }
      candidatesExamined += Number(result?.counts?.parsed || result?.counts?.fetched || 0);
      for (const listing of result.listings || []) {
        const offer = normalizeListing(listing);
        if (offer) byId.set(offer.id, offer);
      }
      packets += 1;
      const pagination = result.pagination || {};
      if (pagination.complete || pagination.next_page == null) break;
      page = Number(pagination.next_page);
      if (!Number.isInteger(page) || page < 0) throw new Error('Ungültige Pagination.');
      await wait(PAUSE_MS);
    }
    return { offers: [...byId.values()], packets, candidatesExamined };
  }

  function mergeObservation(item, offers) {
    if (!state?.monitor) return;
    const previous = state.monitor.observations[item.key] || {};
    const nonKleinanzeigen = (previous.offers || []).filter(offer => offer?.source !== SOURCE_NAME);
    state.monitor.observations[item.key] = {
      ...previous,
      checkedAt: new Date().toISOString(),
      offers: [...nonKleinanzeigen, ...offers].slice(0, 20),
      automaticSourcesAvailable: Math.max(10, Number(previous.automaticSourcesAvailable) || 0),
      candidatesExamined: Math.max(Number(previous.candidatesExamined) || 0, offers.length)
    };
    if (typeof persistState === 'function') persistState();
  }

  function resultContainer() {
    const host = document.querySelector('#liveDealResults');
    if (!host) return null;
    let target = document.querySelector('#kleinanzeigen094Results');
    if (!target) {
      target = document.createElement('div');
      target.id = 'kleinanzeigen094Results';
      target.className = 'live-deal-results';
      host.appendChild(target);
    }
    return target;
  }

  function renderOffers(item, offers) {
    const target = resultContainer();
    if (!target) return;
    const esc = typeof escapeHtml === 'function' ? escapeHtml : value => String(value ?? '');
    target.innerHTML = offers.length ? `
      <div class="section-heading saved-deals-heading">
        <div><p class="eyebrow">Automatische Bezugsquelle</p><h3>Kleinanzeigen</h3></div>
        <span class="badge">${offers.length} Treffer</span>
      </div>
      ${offers.map(offer => `
        <article class="cartridge live-offer">
          ${typeof itemHeader === 'function' ? itemHeader(item) : `<strong>${esc(item.title)}</strong>`}
          <div class="deal-detail">
            <strong>${typeof money === 'function' ? money(offer.price) : `${offer.price.toFixed(2)} €`} <span class="best-live-badge">KLEINANZEIGEN</span></strong>
            <span>${esc(offer.title)} · ${esc(offer.place || 'Ort nicht angegeben')}</span>
            <small>${esc(offer.condition)} · Match ${offer.confidence}% · Ampel ${esc(offer.trafficLight)} · Versand im Inserat prüfen</small>
          </div>
          <div class="card-actions">
            <a class="secondary-button link-button" href="${esc(offer.url)}" target="_blank" rel="noopener">Anzeige öffnen</a>
          </div>
        </article>`).join('')}` : '<p class="empty">Keine passenden Kleinanzeigen-Treffer in den geprüften Paketen.</p>';
  }

  function showStatus(message, error = false) {
    const target = document.querySelector('#genericParserStatus') || document.querySelector('#liveSearchStatus');
    if (!target) return;
    target.className = `live-search-status${error ? ' is-error' : ''}`;
    target.textContent = message;
  }

  async function runInteractiveSearch() {
    if (busy) return;
    const key = document.querySelector('#searchCatalogItem')?.value;
    const item = catalogByKey?.get(key);
    if (!item) return;
    busy = true;
    showStatus('Kleinanzeigen wird über GenericParser 0.45 geprüft …');
    try {
      const identity = await verifyWorker();
      const result = await searchItem(item);
      current = { key: item.key, offers: result.offers };
      mergeObservation(item, result.offers);
      renderOffers(item, result.offers);
      const now = new Date().toISOString();
      upsertSourceStatus({
        name: SOURCE_NAME,
        status: 'ok',
        checkedAt: now,
        lastSuccessAt: now,
        note: `${result.offers.length} Treffer in ${result.packets} Paketen`,
        candidatesExamined: result.candidatesExamined,
        accepted: result.offers.length
      }, { rerender: true });
      showStatus(`${result.offers.length} Kleinanzeigen-Treffer · ${result.packets} Pakete · Worker ${identity.version || '0.45.0'}.`);
    } catch (error) {
      upsertSourceStatus({
        ...readStoredSourceStatus(),
        status: 'unavailable',
        checkedAt: new Date().toISOString(),
        note: error.message
      }, { rerender: true });
      showStatus(`Kleinanzeigen-Suche fehlgeschlagen: ${error.message}`, true);
    } finally {
      busy = false;
    }
  }

  function dailyDue() {
    const last = Number(localStorage.getItem(DAILY_KEY) || 0);
    return !last || Date.now() - last >= DAY_MS;
  }

  async function runDailyScan({ force = false, silent = true } = {}) {
    if (busy || (!force && !dailyDue()) || typeof missingItems !== 'function') return;
    const items = missingItems();
    if (!items.length) return;
    busy = true;
    let accepted = 0;
    let candidatesExamined = 0;
    try {
      await verifyWorker();
      for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        if (!silent) showStatus(`Kleinanzeigen ${index + 1}/${items.length}: ${item.title}`);
        try {
          const result = await searchItem(item, 1);
          candidatesExamined += result.candidatesExamined;
          accepted += result.offers.length;
          mergeObservation(item, result.offers);
        } catch (error) {
          console.warn('Kleinanzeigen scan failed', item.key, error);
        }
        if (index < items.length - 1) await wait(PAUSE_MS);
      }
      const now = new Date().toISOString();
      localStorage.setItem(DAILY_KEY, String(Date.now()));
      upsertSourceStatus({
        name: SOURCE_NAME,
        status: 'ok',
        checkedAt: now,
        lastSuccessAt: now,
        note: `Täglicher Lauf abgeschlossen: ${accepted} Treffer`,
        candidatesExamined,
        accepted
      });
      if (typeof persistState === 'function') persistState();
      if (typeof render === 'function') render();
      if (!silent) showStatus(`Kleinanzeigen-Prüfung abgeschlossen: ${accepted} Treffer.`);
    } catch (error) {
      upsertSourceStatus({
        ...readStoredSourceStatus(),
        status: 'unavailable',
        checkedAt: new Date().toISOString(),
        note: error.message
      }, { rerender: true });
      if (!silent) showStatus(`Kleinanzeigen-Prüfung fehlgeschlagen: ${error.message}`, true);
    } finally {
      busy = false;
    }
  }

  function injectStatus() {
    const box = document.querySelector('.deal-search-box');
    if (!box || document.querySelector('#genericParserStatus')) return;
    box.insertAdjacentHTML('beforeend', `
      <p class="muted compact"><strong>Kleinanzeigen ist vollständig als automatische Bezugsquelle integriert.</strong> GenericParser 0.45, kein Token erforderlich.</p>
      <div id="genericParserStatus" class="live-search-status"></div>`);
  }

  function init() {
    wrapStateFunctions();
    upsertSourceStatus(readStoredSourceStatus());
    patchSourceUi();
    injectStatus();
    document.querySelector('#searchDealsButton')?.addEventListener('click', () => setTimeout(runInteractiveSearch, 0));
    const observer = new MutationObserver(() => patchSourceUi());
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => runDailyScan({ silent: true }), 1500);
  }

  window.EvercadeKleinanzeigen094 = {
    version: VERSION,
    workerUrl: WORKER_URL,
    runInteractiveSearch,
    runDailyScan,
    sourceStatus: readStoredSourceStatus
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
