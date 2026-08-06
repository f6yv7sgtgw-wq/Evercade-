(() => {
  const VERSION = '0.9.3';
  const CONTRACT = 'generic-parser-module-v1';
  const SOURCE_NAME = 'Kleinanzeigen';
  const WORKER_URL = 'https://genericparser.f6yv7sgtgw.workers.dev';
  const PAUSE_MS = 5000;
  const MAX_PACKETS_INTERACTIVE = 4;
  const DAILY_KEY = 'evercade-kleinanzeigen-last-daily-run-v093';
  const DAY_MS = 24 * 60 * 60 * 1000;
  const $ = selector => document.querySelector(selector);
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));

  let busy = false;
  let current = { key: null, offers: [] };
  let renderingSourceStatus = false;

  function persist() {
    if (typeof persistState === 'function') persistState();
  }

  function sourceEntry() {
    if (typeof state === 'undefined') return null;
    state.background ||= {};
    state.background.sourceStatus = Array.isArray(state.background.sourceStatus)
      ? state.background.sourceStatus
      : [];
    return state.background.sourceStatus.find(source => source.name === SOURCE_NAME) || null;
  }

  function updateSourceStatus({ status, accepted = 0, candidatesExamined = 0, note = '', checkedAt = new Date().toISOString() }) {
    if (typeof state === 'undefined') return;
    state.background ||= {};
    state.background.sourceStatus = Array.isArray(state.background.sourceStatus)
      ? state.background.sourceStatus
      : [];
    const previous = sourceEntry();
    const next = {
      name: SOURCE_NAME,
      status: status === 'ok' ? 'ok' : 'unavailable',
      checkedAt,
      lastSuccessAt: status === 'ok' ? checkedAt : previous?.lastSuccessAt || null,
      note: String(note || ''),
      candidatesExamined: Math.max(0, Number(candidatesExamined) || 0),
      accepted: Math.max(0, Number(accepted) || 0)
    };
    const others = state.background.sourceStatus.filter(source => source.name !== SOURCE_NAME);
    state.background.sourceStatus = [...others, next]
      .sort((a, b) => String(a.name).localeCompare(String(b.name), 'de'));
    persist();
    refreshSourceUi();
  }

  function ensureInitialSource() {
    if (sourceEntry()) return;
    updateSourceStatus({
      status: 'unavailable',
      note: 'Noch nicht geprüft',
      checkedAt: null
    });
  }

  function refreshSourceUi() {
    if (renderingSourceStatus) return;
    renderingSourceStatus = true;
    try {
      if (typeof renderAlerts === 'function') renderAlerts();
      const heading = [...document.querySelectorAll('.source-heading')]
        .find(node => /Automatische Bezugsquellen/i.test(node.textContent || ''));
      const badge = heading?.querySelector('.badge');
      if (badge) badge.textContent = '10 automatisch';
    } finally {
      renderingSourceStatus = false;
    }
  }

  function installRenderHook() {
    if (typeof renderAlerts !== 'function' || renderAlerts.__kleinanzeigenIntegrated) return;
    const original = renderAlerts;
    const integrated = function (...args) {
      const result = original.apply(this, args);
      const heading = [...document.querySelectorAll('.source-heading')]
        .find(node => /Automatische Bezugsquellen/i.test(node.textContent || ''));
      const badge = heading?.querySelector('.badge');
      if (badge) badge.textContent = '10 automatisch';
      return result;
    };
    integrated.__kleinanzeigenIntegrated = true;
    renderAlerts = integrated;
  }

  function syncReleaseUi() {
    document.querySelectorAll('.version-badge').forEach(node => {
      node.textContent = `Version ${VERSION}`;
    });
    document.querySelectorAll('#alertsView .eyebrow').forEach(node => {
      if (/^Version\s/i.test(node.textContent || '')) node.textContent = `Version ${VERSION}`;
    });
    const sourceText = [...document.querySelectorAll('.deal-search-box .muted.compact')]
      .find(node => /Bezugsquellen/i.test(node.textContent || ''));
    if (sourceText) {
      sourceText.textContent = '22 Bezugsquellen: 10 werden automatisch ausgewertet – einschließlich Kleinanzeigen über GenericParser 0.45. 12 weitere öffnen eine gezielte Direktsuche.';
    }
    document.documentElement.dataset.evercadeVersion = VERSION;
  }

  function statusTarget() {
    return $('#genericParserStatus') || $('#liveSearchStatus');
  }

  function showStatus(message, kind = '') {
    const target = statusTarget();
    if (!target) return;
    target.className = `live-search-status ${kind === 'error' ? 'is-error' : kind === 'loading' ? 'is-loading' : ''}`;
    target.textContent = message;
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

  async function verify() {
    const version = await api('/api/version');
    const contract = version?.module_contract || version?.api_contract;
    if (contract !== CONTRACT) throw new Error(`Nicht unterstützter Vertrag: ${contract || 'unbekannt'}`);
    const capabilities = await api('/api/module/v1/capabilities');
    if (capabilities?.contract !== CONTRACT) throw new Error('Capabilities melden einen falschen Vertrag.');
    if (!capabilities?.sources?.includes('kleinanzeigen')) throw new Error('Kleinanzeigen wird nicht angeboten.');
    return version;
  }

  function profileFor(item, page) {
    const rawLimit = typeof state !== 'undefined' ? state?.background?.priceLimits?.[item.key] : null;
    const limit = Number(rawLimit);
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
      decision: listing.match?.decision || 'review',
      trafficLight: listing.traffic_light?.color || 'yellow'
    };
  }

  async function searchItem(item, maxPackets = MAX_PACKETS_INTERACTIVE) {
    const byId = new Map();
    let page = 0;
    let packets = 0;
    let candidatesExamined = 0;
    while (packets < maxPackets) {
      const result = await api('/api/module/v1/search', {
        method: 'POST',
        body: profileFor(item, page)
      });
      if (result?.contract !== CONTRACT || result?.profile_id !== `evercade:${item.key}`) {
        throw new Error('Inkonsistente GenericParser-Antwort.');
      }
      candidatesExamined += Number(result?.metrics?.candidates_examined || result?.candidates_examined || (result.listings || []).length) || 0;
      for (const listing of result.listings || []) {
        const offer = normalize(listing);
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

  function mergeOffersIntoMonitor(item, offers) {
    if (typeof state === 'undefined') return;
    state.monitor ||= { observations: {}, history: {} };
    state.monitor.observations ||= {};
    const existing = state.monitor.observations[item.key] || { offers: [] };
    const byId = new Map((existing.offers || []).map(offer => [String(offer.id || offer.url), offer]));
    for (const offer of offers) byId.set(String(offer.id || offer.url), offer);
    state.monitor.observations[item.key] = {
      ...existing,
      checkedAt: new Date().toISOString(),
      offers: [...byId.values()].slice(0, 20),
      automaticSourcesAvailable: 10,
      candidatesExamined: Math.max(Number(existing.candidatesExamined) || 0, offers.length)
    };
    persist();
  }

  function resultContainer() {
    const host = $('#liveDealResults');
    if (!host) return null;
    let target = $('#genericParserResults');
    if (!target) {
      target = document.createElement('div');
      target.id = 'genericParserResults';
      target.className = 'live-deal-results';
      host.appendChild(target);
    }
    return target;
  }

  function renderOffers(item, offers) {
    const target = resultContainer();
    if (!target) return;
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
            <button class="primary-button" data-ka-save="${esc(offer.id)}">Als Deal übernehmen</button>
          </div>
        </article>`).join('')}` : '<p class="empty">Keine passenden Kleinanzeigen-Treffer in den geprüften Paketen.</p>';
  }

  function saveOffer(offer, key, silent = false) {
    if (typeof state === 'undefined' || !state?.deals) return;
    const existing = state.deals.find(deal => deal.url === offer.url);
    const deal = {
      key,
      price: offer.price,
      shipping: 0,
      condition: offer.condition,
      source: SOURCE_NAME,
      url: offer.url,
      color: 'Automatisch',
      sellerType: 'Privat',
      status: 'active',
      capturedAt: offer.verifiedAt,
      checkedAt: offer.verifiedAt,
      parserScore: offer.confidence,
      parserTrafficLight: offer.trafficLight,
      shippingUnknown: true
    };
    if (existing) Object.assign(existing, deal);
    else state.deals.push({ id: typeof makeId === 'function' ? makeId() : offer.id, ...deal });
    persist();
    if (!silent && typeof render === 'function') render();
    if (!silent && typeof showToast === 'function') showToast(existing ? 'Kleinanzeigen-Deal aktualisiert' : 'Kleinanzeigen-Deal gespeichert');
  }

  async function runInteractiveSearch() {
    if (busy) return;
    const key = $('#searchCatalogItem')?.value;
    const item = typeof catalogByKey !== 'undefined' ? catalogByKey.get(key) : null;
    if (!item) return;
    busy = true;
    showStatus('Kleinanzeigen wird als zehnte automatische Bezugsquelle geprüft …', 'loading');
    try {
      const identity = await verify();
      const { offers, packets, candidatesExamined } = await searchItem(item);
      current = { key: item.key, offers };
      mergeOffersIntoMonitor(item, offers);
      updateSourceStatus({ status: 'ok', accepted: offers.length, candidatesExamined });
      renderOffers(item, offers);
      showStatus(`${offers.length} Kleinanzeigen-Treffer · ${packets} Paket${packets === 1 ? '' : 'e'} · Worker ${identity.version || '0.45.0'}.`);
    } catch (error) {
      updateSourceStatus({ status: 'unavailable', note: error.message });
      showStatus(`Kleinanzeigen-Suche fehlgeschlagen: ${error.message}`, 'error');
    } finally {
      busy = false;
    }
  }

  function dailyDue() {
    const last = Number(localStorage.getItem(DAILY_KEY) || 0);
    return !last || Date.now() - last >= DAY_MS;
  }

  async function runDailyScan({ force = false } = {}) {
    if (busy || (!force && !dailyDue())) return;
    if (typeof missingItems !== 'function') return;
    const items = missingItems();
    if (!Array.isArray(items) || !items.length) return;
    busy = true;
    let totalAccepted = 0;
    let totalCandidates = 0;
    try {
      await verify();
      for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        showStatus(`Tägliche Kleinanzeigen-Prüfung ${index + 1}/${items.length}: ${item.title}`, 'loading');
        try {
          const { offers, candidatesExamined } = await searchItem(item, 1);
          totalAccepted += offers.length;
          totalCandidates += candidatesExamined;
          mergeOffersIntoMonitor(item, offers);
        } catch (error) {
          console.warn('Kleinanzeigen daily scan failed', item.key, error);
        }
        if (index < items.length - 1) await wait(PAUSE_MS);
      }
      localStorage.setItem(DAILY_KEY, String(Date.now()));
      updateSourceStatus({ status: 'ok', accepted: totalAccepted, candidatesExamined: totalCandidates });
      if (typeof render === 'function') render();
      showStatus(`Tägliche Kleinanzeigen-Prüfung abgeschlossen: ${totalAccepted} passende Anzeigen.`);
    } catch (error) {
      updateSourceStatus({ status: 'unavailable', note: error.message });
      showStatus(`Kleinanzeigen-Prüfung fehlgeschlagen: ${error.message}`, 'error');
    } finally {
      busy = false;
    }
  }

  function injectStatus() {
    const box = $('.deal-search-box');
    if (!box || $('#genericParserStatus')) return;
    box.insertAdjacentHTML('beforeend', `
      <p class="muted compact"><strong>Kleinanzeigen ist vollständig als zehnte automatische Bezugsquelle integriert.</strong> Prüfung über GenericParser 0.45; kein Zugriffstoken erforderlich.</p>
      <div id="genericParserStatus" class="live-search-status"></div>`);
  }

  function bind() {
    installRenderHook();
    syncReleaseUi();
    ensureInitialSource();
    injectStatus();
    refreshSourceUi();

    $('#searchDealsButton')?.addEventListener('click', () => setTimeout(runInteractiveSearch, 0));
    document.body.addEventListener('click', event => {
      const saveButton = event.target.closest('[data-ka-save]');
      if (saveButton) {
        const offer = current.offers.find(entry => entry.id === saveButton.dataset.kaSave);
        if (offer && current.key) saveOffer(offer, current.key);
      }
      const backgroundButton = event.target.closest('[data-action="background-scan"]');
      if (backgroundButton) setTimeout(() => runDailyScan({ force: true }), 0);
      const refreshButton = event.target.closest('[data-action="background-refresh"]');
      if (refreshButton) setTimeout(refreshSourceUi, 300);
    });

    setTimeout(runDailyScan, 1500);
  }

  window.EvercadeKleinanzeigen = {
    version: VERSION,
    workerUrl: WORKER_URL,
    automaticSource: true,
    fullyIntegrated: true,
    runInteractiveSearch,
    runDailyScan,
    updateSourceStatus
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
