(() => {
  const CONTRACT = 'generic-parser-module-v1';
  const URL_KEY = 'evercade-generic-parser-url';
  const TOKEN_KEY = 'evercade-generic-parser-token';
  const DEFAULT_URL = 'https://genericparser.f6yv7sgtgw.workers.dev';
  const PAUSE_MS = 5000;
  const MAX_PACKETS = 4;
  const $ = selector => document.querySelector(selector);
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));

  function parserUrl() {
    return ($('#genericParserUrl')?.value || localStorage.getItem(URL_KEY) || DEFAULT_URL)
      .trim()
      .replace(/\/$/, '');
  }

  function parserToken() {
    return ($('#genericParserToken')?.value || localStorage.getItem(TOKEN_KEY) || '').trim();
  }

  function showStatus(message, kind = '') {
    const target = $('#genericParserStatus');
    if (!target) return;
    target.className = `live-search-status ${kind === 'error' ? 'is-error' : kind === 'loading' ? 'is-loading' : ''}`;
    target.textContent = message;
  }

  function saveConfig() {
    const url = parserUrl();
    if (!/^https:\/\//i.test(url)) {
      showStatus('Bitte die aktive HTTPS-URL des GenericParser-Workers eintragen.', 'error');
      return false;
    }
    localStorage.setItem(URL_KEY, url);
    const token = parserToken();
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
    return true;
  }

  function headers(withBody = false) {
    const values = { accept: 'application/json' };
    if (withBody) values['content-type'] = 'application/json';
    const token = parserToken();
    if (token) values['X-GenericParser-Token'] = token;
    return values;
  }

  async function api(path, options = {}) {
    const base = parserUrl();
    if (!base) throw new Error('GenericParser-Worker-URL fehlt.');
    const response = await fetch(`${base}${path}`, {
      method: options.method || 'GET',
      headers: headers(Boolean(options.body)),
      body: options.body ? JSON.stringify(options.body) : undefined,
      cache: 'no-store'
    });
    let body = null;
    try { body = await response.json(); } catch {}
    if (!response.ok) {
      if (response.status === 401) throw new Error('Worker-Token fehlt oder ist ungültig.');
      throw new Error(body?.detail || `GenericParser HTTP ${response.status}`);
    }
    return body;
  }

  async function verify() {
    const version = await api('/api/version');
    if (version?.module_contract !== CONTRACT && version?.api_contract !== CONTRACT) {
      throw new Error(`Nicht unterstützter Vertrag: ${version?.module_contract || version?.api_contract || 'unbekannt'}`);
    }
    const capabilities = await api('/api/module/v1/capabilities');
    if (capabilities?.contract !== CONTRACT) throw new Error('Capabilities melden einen falschen Vertrag.');
    if (!capabilities?.sources?.includes('kleinanzeigen')) throw new Error('Kleinanzeigen wird nicht angeboten.');
    return { version, capabilities };
  }

  function bodyFor(item, page) {
    const rawLimit = state?.background?.priceLimits?.[item.key];
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
      source: 'Kleinanzeigen',
      title: String(listing.title || ''),
      price,
      condition: String(listing.result_info?.condition || 'Gebraucht'),
      url: String(listing.url),
      confidence: Math.max(0, Math.min(100, Number(listing.match?.score) || 0)),
      verifiedAt: new Date().toISOString(),
      place: [listing.postal_code, listing.place].filter(Boolean).join(' '),
      decision: listing.match?.decision || 'review',
      trafficLight: listing.traffic_light?.color || 'yellow'
    };
  }

  function renderOffers(item, offers) {
    const target = $('#genericParserResults');
    if (!target) return;
    target.innerHTML = offers.length ? offers.map(offer => `
      <article class="cartridge live-offer">
        ${typeof itemHeader === 'function' ? itemHeader(item) : ''}
        <div class="deal-detail">
          <strong>${typeof money === 'function' ? money(offer.price) : `${offer.price.toFixed(2)} €`} <span class="best-live-badge">KLEINANZEIGEN</span></strong>
          <span>${esc(offer.title)} · ${esc(offer.place || 'Ort nicht angegeben')}</span>
          <small>${esc(offer.condition)} · ${esc(offer.decision)} · Ampel ${esc(offer.trafficLight)} · Versand im Inserat prüfen</small>
        </div>
        <div class="card-actions">
          <a class="secondary-button link-button" href="${esc(offer.url)}" target="_blank" rel="noopener">Anzeige öffnen</a>
          <button class="primary-button" data-ka-save="${esc(offer.id)}">Als Deal übernehmen</button>
        </div>
      </article>`).join('') : '<p class="empty">Keine passenden Kleinanzeigen-Treffer in den geprüften Paketen.</p>';
  }

  let current = { key: null, offers: [] };

  async function search() {
    const key = $('#searchCatalogItem')?.value;
    const item = typeof catalogByKey !== 'undefined' ? catalogByKey.get(key) : null;
    if (!item || !saveConfig()) return;
    const button = $('#searchKleinanzeigenButton');
    if (button) button.disabled = true;
    showStatus('GenericParser 0.45 wird geprüft …', 'loading');
    try {
      const identity = await verify();
      const byId = new Map();
      let page = 0;
      let packets = 0;
      while (packets < MAX_PACKETS) {
        showStatus(`Kleinanzeigen-Paket ${packets + 1} wird geprüft …`, 'loading');
        const result = await api('/api/module/v1/search', {
          method: 'POST',
          body: bodyFor(item, page)
        });
        if (result?.contract !== CONTRACT || result?.profile_id !== `evercade:${item.key}`) {
          throw new Error('Inkonsistente GenericParser-Antwort.');
        }
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
      current = { key: item.key, offers: [...byId.values()] };
      renderOffers(item, current.offers);
      showStatus(`${current.offers.length} Treffer · ${packets} Paket${packets === 1 ? '' : 'e'} · Worker ${identity.version?.version || '0.45'}.`);
    } catch (error) {
      showStatus(`Kleinanzeigen-Suche fehlgeschlagen: ${error.message}`, 'error');
    } finally {
      if (button) button.disabled = false;
    }
  }

  function saveOffer(id) {
    const offer = current.offers.find(entry => entry.id === id);
    if (!offer || !current.key) return;
    const existing = state.deals.find(deal => deal.url === offer.url);
    const deal = {
      key: current.key,
      price: offer.price,
      shipping: 0,
      condition: offer.condition,
      source: 'Kleinanzeigen',
      url: offer.url,
      color: 'Automatisch',
      sellerType: 'Privat',
      status: 'active',
      capturedAt: offer.verifiedAt,
      checkedAt: offer.verifiedAt
    };
    if (existing) Object.assign(existing, deal);
    else state.deals.push({ id: typeof makeId === 'function' ? makeId() : offer.id, ...deal });
    if (typeof saveState === 'function') saveState();
    if (typeof render === 'function') render();
    if (typeof showToast === 'function') showToast(existing ? 'Kleinanzeigen-Deal aktualisiert' : 'Kleinanzeigen-Deal gespeichert');
  }

  function inject() {
    const box = $('.deal-search-box');
    if (!box || $('#genericParserPanel')) return;
    box.insertAdjacentHTML('afterend', `
      <section id="genericParserPanel" class="deal-search-box">
        <p class="eyebrow">Zusätzliche automatische Quelle</p>
        <h3>Kleinanzeigen über GenericParser 0.45</h3>
        <label>Worker-URL<input id="genericParserUrl" type="url" inputmode="url" placeholder="https://…workers.dev" value="${esc(localStorage.getItem(URL_KEY) || DEFAULT_URL)}"></label>
        <label>Zugriffstoken<input id="genericParserToken" type="password" autocomplete="off" placeholder="aktiver Worker-Token" value="${esc(localStorage.getItem(TOKEN_KEY) || '')}"></label>
        <button id="searchKleinanzeigenButton" class="primary-button full-width" type="button">Kleinanzeigen automatisch prüfen</button>
        <p class="muted compact">Die bisherigen Suchseiten bleiben erhalten. GenericParser verarbeitet zusätzlich bis zu vier Pakete mit je höchstens sieben Anzeigen und fünf Sekunden Pause.</p>
        <div id="genericParserStatus" class="live-search-status"></div>
        <div id="genericParserResults" class="live-deal-results"></div>
      </section>`);
    $('#searchKleinanzeigenButton')?.addEventListener('click', search);
    document.body.addEventListener('click', event => {
      const button = event.target.closest('[data-ka-save]');
      if (button) saveOffer(button.dataset.kaSave);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject);
  else inject();
})();
