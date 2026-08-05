const STORAGE_KEY = "project-evercade-v07";
const V06_STORAGE_KEY = "project-evercade-v06";
const V05_STORAGE_KEY = "project-evercade-v05";
const V04_STORAGE_KEY = "project-evercade-v04";
const V03_STORAGE_KEY = "project-evercade-v03";
const V02_STORAGE_KEY = "project-evercade-v02";
const LEGACY_STORAGE_KEY = "project-evercade-v01";
const DEAL_API_URL = "https://project-evercade-deal-api.jnldc.chatgpt.site";
const MONITOR_BATCH_SIZE = 18;
const MONITOR_FRESH_DAYS = 1;
const PRICE_SEARCH_INTERVAL_MS = 24 * 60 * 60 * 1000;
const KLEINANZEIGEN_ADAPTER_VERSION = "generic-parser-module-v1";

const catalog = [
  // Console – rote Hüllen
  ["console", 1, "Atari Collection 1"], ["console", 2, "Namco Museum Collection 1"],
  ["console", 3, "Data East Collection 1"], ["console", 4, "Interplay Collection 1"],
  ["console", 5, "Atari Collection 2"], ["console", 6, "Namco Museum Collection 2"],
  ["console", 7, "Interplay Collection 2"], ["console", 8, "Mega Cat Studios Collection 1"],
  ["console", 9, "Piko Interactive Collection 1"], ["console", 10, "Technōs Collection 1"],
  ["console", 11, "Xeno Crisis & Tanglewood"], ["console", 12, "The Oliver Twins Collection"],
  ["console", 13, "Atari Lynx Collection 1"], ["console", 14, "Atari Lynx Collection 2"],
  ["console", 15, "Jaleco Collection 1"], ["console", 16, "Piko Collection 2"],
  ["console", 17, "Indie Heroes Collection 1"], ["console", 18, "Worms Collection 1"],
  ["console", 19, "Codemasters Collection 1"], ["console", 20, "Mega Cat Studios Collection 2"],
  ["console", 21, "Intellivision Collection 1"], ["console", 22, "The Bitmap Brothers Collection 1"],
  ["console", 23, "Renovation Collection 1"], ["console", 24, "Gremlin Collection 1"],
  ["console", 25, "Morphcat Games Collection 1"], ["console", 26, "Intellivision Collection 2"],
  ["console", 27, "Alwa’s Awakening / Cathedral"], ["console", 28, "Indie Heroes Collection 2"],
  ["console", 29, "Piko Collection 3"], ["console", 30, "The Sydney Hunter Collection"],
  ["console", 31, "Sunsoft Collection 1"], ["console", 32, "Full Void"],
  ["console", 33, "Duke Nukem Collection 1"], ["console", 34, "Duke Nukem Collection 2"],
  ["console", 35, "Goodboy Galaxy / Witch n’ Wiz"], ["console", 36, "Demons of Asteborg / Astebros"],
  ["console", 37, "Indie Heroes Collection 3"], ["console", 38, "Sunsoft Collection 2"],
  ["console", 39, "Piko Collection 4"], ["console", 40, "Tomb Raider Collection 1"],
  ["console", 41, "Legacy of Kain Collection"], ["console", 42, "Metal Dragon / Life on Mars"],
  ["console", 43, "Indie Heroes Collection 4"], ["console", 44, "Broken Sword Collection"],
  ["console", 45, "Tomb Raider Collection 2"], ["console", 46, "Gremlin Collection 2"],
  ["console", 47, "Activision Collection 1"], ["console", 48, "Rare Collection 1"],
  ["console", 49, "The Turrican Collection"], ["console", 50, "Activision Collection 2"],
  ["console", 51, "Mega Cat Studios Collection 3"], ["console", 52, "Activision Collection 3"],
  ["console", 53, "Banjo-Kazooie Double Pack"],

  // Arcade – violette Hüllen
  ["arcade", 1, "Technōs Arcade 1"], ["arcade", 2, "Data East Arcade 1"],
  ["arcade", 3, "Gaelco Arcade 1"], ["arcade", 4, "Atari Arcade 1"],
  ["arcade", 5, "Jaleco Arcade 1"], ["arcade", 6, "Gaelco Arcade 2"],
  ["arcade", 7, "Irem Arcade 1"], ["arcade", 8, "Toaplan Arcade 1"],
  ["arcade", 9, "Toaplan Arcade 2"], ["arcade", 10, "Piko Interactive Arcade 1"],
  ["arcade", 11, "Toaplan Arcade 3"], ["arcade", 12, "Data East Arcade 2"],
  ["arcade", 13, "Toaplan Arcade 4"], ["arcade", 14, "Atari Arcade 2"],
  ["arcade", 15, "Windjammers, Karnov & Friends"], ["arcade", 16, "NEOGEO Arcade 1"],
  ["arcade", 17, "TAITO Arcade 1"], ["arcade", 18, "TAITO Arcade 2"],
  ["arcade", 19, "NEOGEO Arcade 2"], ["arcade", 20, "NEOGEO Arcade 3"],
  ["arcade", 21, "TAITO Arcade 3"], ["arcade", 22, "NEOGEO Arcade 4"],
  ["arcade", 23, "Visco Arcade 1"], ["arcade", 24, "Visco Arcade 2"],

  // Home Computer – blaue Hüllen
  ["computer", 1, "THEC64 Collection 1"], ["computer", 2, "THEC64 Collection 2"],
  ["computer", 3, "Team17 Collection 1"], ["computer", 4, "Delphine Software Collection 1"],
  ["computer", 5, "Home Computer Heroes Collection 1"], ["computer", 6, "THEC64 Collection 3"],
  ["computer", 7, "Thalamus Collection 1"], ["computer", 8, "The Bitmap Brothers Collection 2"],
  ["computer", 9, "Roguecraft DX"], ["computer", 10, "The Llamasoft Collection"]
].map(([series, number, title]) => ({
  key: `${series}-${number}`,
  series,
  number,
  title,
  legacy: (
    series === "console" && [1, 2, 5, 6, 9, 10, 12, 13, 14, 16, 17, 19, 20, 21, 26, 30].includes(number)
  ) || (
    series === "arcade" && [1, 4, 7].includes(number)
  ),
  announced: (series === "console" && number === 53) ||
    (series === "arcade" && [23, 24].includes(number))
}));

const catalogByKey = new Map(catalog.map(item => [item.key, item]));
const seriesOrder = { console: 0, arcade: 1, computer: 2 };

const defaultOwned = [
  "console-31", "console-34", "console-37", "console-40",
  "console-48", "arcade-1", "computer-8"
].map(key => ({ key, condition: "Geöffnet", price: null, notes: "" }));

let state = loadState();
let activeView = "collection";
let filters = {
  collection: "all",
  collectionSort: "number",
  catalog: "all",
  catalogStatus: "all",
  catalogSort: "number"
};
let latestLiveSearch = null;
let liveSearchController = null;
let monitorController = null;
let monitorRunning = false;
let monitorError = "";
let backgroundBusy = false;
let backgroundError = "";
let backgroundSyncTimer = null;
let backgroundSyncPromise = null;
let activeDetailKey = null;

const views = {
  collection: document.querySelector("#collectionView"),
  catalog: document.querySelector("#catalogView"),
  monitor: document.querySelector("#monitorView"),
  alerts: document.querySelector("#alertsView"),
  wishlist: document.querySelector("#wishlistView"),
  deals: document.querySelector("#dealsView")
};

function makeId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function emptyMonitorState() {
  return {
    observations: {},
    history: {},
    pendingKeys: [],
    cycleTotal: 0,
    startedAt: null,
    lastCompletedAt: null,
    lastAttemptAt: null
  };
}

function emptyBackgroundState() {
  return {
    enabled: false,
    deviceId: null,
    deviceToken: null,
    automationUrl: null,
    automationReady: false,
    priceLimits: {},
    alerts: [],
    sourceStatus: [],
    recommendation: null,
    lastSyncedAt: null,
    lastScannedAt: null
  };
}

function normalizeBackgroundState(value) {
  const empty = emptyBackgroundState();
  if (!value || typeof value !== "object") return empty;
  const deviceId = String(value.deviceId || "");
  const deviceToken = String(value.deviceToken || "");
  const enabled = value.enabled === true &&
    /^[A-Za-z0-9-]{8,80}$/.test(deviceId) &&
    /^[A-Za-z0-9_-]{24,160}$/.test(deviceToken);
  const priceLimits = {};
  for (const [key, raw] of Object.entries(value.priceLimits || {})) {
    const amount = Number(raw);
    if (catalogByKey.has(key) && Number.isFinite(amount) && amount >= 0 && amount <= 500) {
      priceLimits[key] = Math.round(amount * 100) / 100;
    }
  }
  const alerts = (Array.isArray(value.alerts) ? value.alerts : [])
    .filter(alert => alert && catalogByKey.has(alert.key))
    .map(alert => ({
      id: String(alert.id || makeId()),
      key: alert.key,
      type: String(alert.type || "new_best"),
      title: String(alert.title || "Preisalarm").slice(0, 180),
      message: String(alert.message || "").slice(0, 500),
      source: String(alert.source || ""),
      total: knownMoney(alert.total) ? Number(alert.total) : null,
      url: safeUrl(alert.url),
      createdAt: alert.createdAt || new Date().toISOString(),
      readAt: alert.readAt || null
    }))
    .slice(0, 80);
  const sourceStatus = (Array.isArray(value.sourceStatus) ? value.sourceStatus : [])
    .map(source => ({
      name: String(source.name || "").slice(0, 100),
      status: source.status === "ok" ? "ok" : "unavailable",
      checkedAt: source.checkedAt || null,
      lastSuccessAt: source.lastSuccessAt || null,
      note: String(source.note || "").slice(0, 300),
      candidatesExamined: Math.max(0, Number(source.candidatesExamined) || 0),
      accepted: Math.max(0, Number(source.accepted) || 0)
    }))
    .filter(source => source.name);
  let recommendation = null;
  if (value.recommendation && catalogByKey.has(value.recommendation.key)) {
    const offer = normalizeObservedOffer(value.recommendation.offer);
    if (offer?.shippingKnown) {
      recommendation = {
        ...value.recommendation,
        key: value.recommendation.key,
        offer
      };
    }
  }
  return {
    enabled,
    deviceId: enabled ? deviceId : null,
    deviceToken: enabled ? deviceToken : null,
    automationUrl: enabled ? safeUrl(value.automationUrl) : null,
    automationReady: enabled && value.automationReady === true,
    priceLimits,
    alerts,
    sourceStatus,
    recommendation,
    lastSyncedAt: value.lastSyncedAt || null,
    lastScannedAt: value.lastScannedAt || null
  };
}

function normalizeObservedOffer(offer) {
  const url = safeUrl(offer?.url);
  const price = Number(offer?.price);
  const shipping = offer?.shipping == null ? null : Number(offer.shipping);
  const total = offer?.total == null ? null : Number(offer.total);
  if (!url || !Number.isFinite(price) || price < 0) return null;
  const shippingKnown = offer?.shippingKnown === true &&
    Number.isFinite(shipping) &&
    shipping >= 0 &&
    Number.isFinite(total);
  if (
    shippingKnown &&
    Math.abs(total - Math.round((price + shipping) * 100) / 100) > 0.01
  ) return null;
  return {
    id: String(offer.id || makeId()),
    source: String(offer.source || "Online-Shop"),
    title: String(offer.title || ""),
    price,
    shipping: shippingKnown ? shipping : null,
    total: shippingKnown ? Math.round(total * 100) / 100 : null,
    shippingKnown,
    condition: String(offer.condition || "Neu/OVP"),
    availability: ["in_stock", "preorder", "unknown"].includes(offer.availability)
      ? offer.availability
      : "unknown",
    sellerType: String(offer.sellerType || "Händler"),
    color: String(offer.color || "Automatisch"),
    url,
    confidence: Math.max(0, Math.min(100, Number(offer.confidence) || 0)),
    verifiedAt: offer.verifiedAt || new Date().toISOString()
  };
}

function normalizeMonitorState(value) {
  const empty = emptyMonitorState();
  if (!value || typeof value !== "object") return empty;
  const observations = {};
  for (const [key, observation] of Object.entries(value.observations || {})) {
    if (!catalogByKey.has(key) || !observation || typeof observation !== "object") continue;
    const offers = (observation.offers || [])
      .map(normalizeObservedOffer)
      .filter(Boolean)
      .slice(0, 8);
    observations[key] = {
      checkedAt: observation.checkedAt || null,
      offers,
      automaticSourcesAvailable: Number(observation.automaticSourcesAvailable) || 0,
      candidatesExamined: Number(observation.candidatesExamined) || 0
    };
  }
  const history = {};
  for (const [key, entries] of Object.entries(value.history || {})) {
    if (!catalogByKey.has(key) || !Array.isArray(entries)) continue;
    history[key] = entries
      .filter(entry =>
        entry &&
        Number.isFinite(Number(entry.total)) &&
        Number(entry.total) >= 0 &&
        safeUrl(entry.url)
      )
      .map(entry => ({
        at: entry.at || new Date().toISOString(),
        total: Number(entry.total),
        source: String(entry.source || "Online-Shop"),
        url: safeUrl(entry.url)
      }))
      .slice(-20);
  }
  return {
    observations,
    history,
    pendingKeys: [...new Set((value.pendingKeys || []).filter(key => catalogByKey.has(key)))],
    cycleTotal: Math.max(0, Number(value.cycleTotal) || 0),
    startedAt: value.startedAt || null,
    lastCompletedAt: value.lastCompletedAt || null,
    lastAttemptAt: value.lastAttemptAt || null
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.owned)) return normalizeState(saved);
  } catch (error) {
    console.warn("Version-0.7-Daten konnten nicht gelesen werden.", error);
  }

  try {
    const previous = JSON.parse(localStorage.getItem(V06_STORAGE_KEY));
    if (previous && Array.isArray(previous.owned)) {
      const migrated = normalizeState(previous);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch (error) {
    console.warn("Version-0.6-Daten konnten nicht migriert werden.", error);
  }

  try {
    const previous = JSON.parse(localStorage.getItem(V05_STORAGE_KEY));
    if (previous && Array.isArray(previous.owned)) {
      const migrated = normalizeState(previous);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch (error) {
    console.warn("Version-0.5-Daten konnten nicht migriert werden.", error);
  }

  try {
    const previous = JSON.parse(localStorage.getItem(V04_STORAGE_KEY));
    if (previous && Array.isArray(previous.owned)) {
      const migrated = normalizeState(previous);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch (error) {
    console.warn("Version-0.4-Daten konnten nicht migriert werden.", error);
  }

  try {
    const previous = JSON.parse(localStorage.getItem(V03_STORAGE_KEY));
    if (previous && Array.isArray(previous.owned)) {
      const migrated = normalizeState(previous);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch (error) {
    console.warn("Version-0.3-Daten konnten nicht migriert werden.", error);
  }

  try {
    const previous = JSON.parse(localStorage.getItem(V02_STORAGE_KEY));
    if (previous && Array.isArray(previous.owned)) {
      const migrated = normalizeState(previous);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch (error) {
    console.warn("Version-0.2-Daten konnten nicht migriert werden.", error);
  }

  try {
    const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY));
    if (Array.isArray(legacy)) {
      const migrated = {
        version: 7,
        owned: legacy.map(item => ({
          key: `${item.series}-${Number(item.number)}`,
          condition: item.condition || "Geöffnet",
          price: item.price === "" || item.price == null ? null : Number(item.price),
          notes: ""
        })).filter(item => catalogByKey.has(item.key)),
        wishlist: [],
        deals: [],
        monitor: emptyMonitorState(),
        background: emptyBackgroundState()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch (error) {
    console.warn("Version-0.1-Daten konnten nicht migriert werden.", error);
  }

  return {
    version: 7,
    owned: structuredClone(defaultOwned),
    wishlist: [],
    deals: [],
    monitor: emptyMonitorState(),
    background: emptyBackgroundState()
  };
}

function normalizeState(data) {
  const ownedByKey = new Map();
  for (const item of data.owned
      .filter(item => item && catalogByKey.has(item.key))
      .map(item => {
        const price = item.price === "" || item.price == null ? null : Number(item.price);
        return {
          key: item.key,
          condition: ["Geöffnet", "Neu/OVP", "Gebraucht"].includes(item.condition)
            ? item.condition
            : "Geöffnet",
          price: Number.isFinite(price) && price >= 0 ? price : null,
          notes: String(item.notes || "").slice(0, 1200)
        };
      })) {
    ownedByKey.set(item.key, item);
  }
  const owned = [...ownedByKey.values()];
  const ownedKeys = new Set(owned.map(item => item.key));
  const monitor = normalizeMonitorState(data.monitor);
  monitor.pendingKeys = monitor.pendingKeys.filter(key => !ownedKeys.has(key));
  return {
    version: 7,
    owned,
    wishlist: [...new Set(
      (data.wishlist || []).filter(key => catalogByKey.has(key) && !ownedKeys.has(key))
    )],
    deals: (data.deals || [])
      .filter(deal => deal && catalogByKey.has(deal.key))
      .map(deal => {
        const price = deal.price === "" || deal.price == null ? null : Number(deal.price);
        const shipping = deal.shipping === "" || deal.shipping == null ? null : Number(deal.shipping);
        return {
          id: deal.id || makeId(),
          key: deal.key,
          price: Number.isFinite(price) && price >= 0 ? price : null,
          shipping: Number.isFinite(shipping) && shipping >= 0 ? shipping : null,
          condition: deal.condition || "Gebraucht",
          source: deal.source || "Sonstige",
          url: safeUrl(deal.url),
          color: deal.color || "Automatisch",
          sellerType: deal.sellerType || "Unbekannt",
          status: ["active", "checked", "expired"].includes(deal.status) ? deal.status : "active",
          capturedAt: deal.capturedAt || new Date().toISOString(),
          checkedAt: deal.checkedAt || null
        };
      })
      .filter(deal => deal.price != null && deal.shipping != null)
      .filter(deal => deal.url),
    monitor,
    background: normalizeBackgroundState(data.background)
  };
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function saveState() {
  persistState();
  if (state.background?.enabled) scheduleBackgroundSync();
}

function seriesLabel(series) {
  return {
    console: "🔴 Console",
    arcade: "🟣 Arcade",
    computer: "🔵 Home Computer"
  }[series];
}

function sortCatalog(items) {
  return [...items].sort((a, b) =>
    seriesOrder[a.series] - seriesOrder[b.series] || a.number - b.number
  );
}

function sortWishlist(items) {
  return [...items].sort((a, b) =>
    a.number - b.number || seriesOrder[a.series] - seriesOrder[b.series]
  );
}

function knownMoney(value) {
  return (
    value !== null &&
    value !== undefined &&
    value !== "" &&
    Number.isFinite(Number(value)) &&
    Number(value) >= 0
  );
}

function money(value) {
  return `${Number(value).toFixed(2).replace(".", ",")} €`;
}

function compactMoney(value) {
  if (!knownMoney(value)) return "–";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(Number(value));
}

function dateLabel(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "unbekannt" : new Intl.DateTimeFormat("de-DE").format(date);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeUrl(value) {
  try {
    const url = new URL(String(value));
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function sourceFromUrl(value) {
  const url = safeUrl(value);
  if (!url) return "Sonstige";
  const host = new URL(url).hostname.toLowerCase();
  if (host.includes("ebay.")) return "eBay Deutschland";
  if (host.includes("kleinanzeigen.")) return "Kleinanzeigen";
  if (host.includes("idealo.")) return "Idealo";
  if (host.includes("geizhals.")) return "Geizhals";
  if (host.includes("amazon.")) return "Amazon Deutschland";
  if (host.includes("dragonbox.")) return "DragonBox";
  if (host.includes("coolshop.")) return "Coolshop Deutschland";
  if (host.includes("asc-shop.")) return "ASC-Shop";
  if (host.includes("shop-justforgames.")) return "Just For Games Deutschland";
  if (host.includes("enzinger.")) return "Enzinger";
  if (host.includes("gamecentervs.")) return "GameCenterVS";
  if (host.includes("mediamarkt.")) return "MediaMarkt";
  if (host.includes("proshop.")) return "Proshop";
  if (host.includes("vitrex-shop.")) return "Vitrex-Shop";
  if (host.includes("kaufland.")) return "Kaufland-Marktplatz";
  if (host.includes("konsolenkost.")) return "Konsolenkost";
  if (host.includes("gameware.")) return "Gameware";
  if (host.includes("retroplace.")) return "Retroplace";
  if (host.includes("funstock.")) return "Funstock";
  if (host.includes("gamesandguides.")) return "Games & Guides";
  if (host.includes("trumox.")) return "Trumox";
  return "Online-Shop";
}

function backgroundAuthorization() {
  const background = state.background;
  if (!background?.enabled || !background.deviceId || !background.deviceToken) return "";
  return `Bearer ${background.deviceId}.${background.deviceToken}`;
}

function backgroundWatchItems() {
  return missingItems().map(item => ({
    title: item.title,
    series: item.series,
    number: item.number,
    wishlist: isWished(item.key),
    legacy: item.legacy,
    announced: item.announced,
    priceLimit: knownMoney(state.background.priceLimits[item.key])
      ? Number(state.background.priceLimits[item.key])
      : null
  }));
}

async function backgroundRequest(path, options = {}) {
  const headers = {
    accept: "application/json",
    ...(options.body ? { "content-type": "application/json" } : {}),
    ...(options.auth === false ? {} : { authorization: backgroundAuthorization() }),
    ...(options.headers || {})
  };
  const response = await fetch(`${DEAL_API_URL.replace(/\/$/, "")}${path}`, {
    method: options.method || "GET",
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
    headers
  });
  let result = null;
  try {
    result = await response.json();
  } catch {
    result = null;
  }
  if (!response.ok) {
    const error = new Error(result?.error || `Anfrage fehlgeschlagen (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return result;
}

function applyBackgroundSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return;
  for (const [key, observation] of Object.entries(snapshot.observations || {})) {
    if (!catalogByKey.has(key) || !observation) continue;
    const offers = (observation.offers || [])
      .map(normalizeObservedOffer)
      .filter(Boolean)
      .slice(0, 8);
    state.monitor.observations[key] = {
      checkedAt: observation.checkedAt || new Date().toISOString(),
      offers,
      automaticSourcesAvailable: Number(observation.automaticSourcesAvailable) || 0,
      candidatesExamined: Number(observation.candidatesExamined) || 0
    };
    const best = offers.find(
      offer => offer.availability === "in_stock" && offer.shippingKnown
    ) || offers.find(offer => offer.shippingKnown);
    if (best) {
      const history = state.monitor.history[key] || [];
      const previous = history[history.length - 1];
      if (!previous || previous.total !== best.total || previous.url !== best.url) {
        history.push({
          at: observation.checkedAt || new Date().toISOString(),
          total: best.total,
          source: best.source,
          url: best.url
        });
      }
      state.monitor.history[key] = history.slice(-20);
    }
  }
  const background = state.background;
  background.automationReady = snapshot.device?.automationReady === true;
  background.lastSyncedAt = snapshot.device?.lastSyncedAt || background.lastSyncedAt;
  background.lastScannedAt = snapshot.device?.lastScannedAt || background.lastScannedAt;
  background.priceLimits = {
    ...background.priceLimits,
    ...(snapshot.priceLimits || {})
  };
  background.alerts = normalizeBackgroundState({
    ...background,
    alerts: snapshot.alerts || [],
    sourceStatus: snapshot.sourceStatus || [],
    recommendation: snapshot.recommendation || null
  }).alerts;
  background.sourceStatus = normalizeBackgroundState({
    ...background,
    alerts: background.alerts,
    sourceStatus: snapshot.sourceStatus || [],
    recommendation: snapshot.recommendation || null
  }).sourceStatus;
  const normalizedRecommendation = normalizeBackgroundState({
    ...background,
    alerts: background.alerts,
    sourceStatus: background.sourceStatus,
    recommendation: snapshot.recommendation || null
  }).recommendation;
  background.recommendation = normalizedRecommendation;
  if (background.lastScannedAt) state.monitor.lastCompletedAt = background.lastScannedAt;
  persistState();
}

function handleBackgroundFailure(error, fallback) {
  if (error?.status === 401 || error?.status === 404) {
    state.background = emptyBackgroundState();
    persistState();
    backgroundError = "Die Geräteverknüpfung ist abgelaufen. Du kannst sie jederzeit neu aktivieren.";
    return;
  }
  backgroundError = fallback;
  console.warn("Hintergrundüberwachung fehlgeschlagen.", error);
}

function scheduleBackgroundSync() {
  if (!state.background?.enabled) return;
  clearTimeout(backgroundSyncTimer);
  backgroundSyncTimer = setTimeout(() => {
    syncBackgroundWatchList({ silent: true }).catch(() => {});
  }, 900);
}

async function syncBackgroundWatchList({ silent = false } = {}) {
  if (!state.background?.enabled) return null;
  if (backgroundSyncPromise) return backgroundSyncPromise;
  if (!silent) {
    backgroundBusy = true;
    backgroundError = "";
    renderAlerts();
  }
  backgroundSyncPromise = (async () => {
    const snapshot = await backgroundRequest("/api/devices/sync", {
      method: "POST",
      body: { items: backgroundWatchItems() }
    });
    applyBackgroundSnapshot(snapshot);
    return snapshot;
  })();
  try {
    return await backgroundSyncPromise;
  } catch (error) {
    handleBackgroundFailure(error, "Die Sammlung konnte gerade nicht mit dem Preisalarm synchronisiert werden.");
    throw error;
  } finally {
    backgroundSyncPromise = null;
    if (!silent) {
      backgroundBusy = false;
      render();
    }
  }
}

async function enableBackgroundMonitoring() {
  if (backgroundBusy || state.background?.enabled) return;
  backgroundBusy = true;
  backgroundError = "";
  renderAlerts();
  try {
    const registration = await backgroundRequest("/api/devices/register", {
      method: "POST",
      auth: false
    });
    state.background = {
      ...emptyBackgroundState(),
      enabled: true,
      deviceId: registration.deviceId,
      deviceToken: registration.deviceToken
    };
    persistState();
    await syncBackgroundWatchList({ silent: true });
    const firstScan = await backgroundRequest("/api/devices/scan", {
      method: "POST",
      body: { force: false }
    });
    applyBackgroundSnapshot(firstScan);
    await createAutomationLink({ copy: false, silent: true });
    showToast("Hintergrundüberwachung aktiviert");
  } catch (error) {
    handleBackgroundFailure(error, "Die Hintergrundüberwachung konnte gerade nicht aktiviert werden.");
  } finally {
    backgroundBusy = false;
    render();
  }
}

async function refreshBackgroundStatus({ silent = true } = {}) {
  if (!state.background?.enabled || backgroundBusy) return;
  if (!silent) {
    backgroundBusy = true;
    backgroundError = "";
    renderAlerts();
  }
  try {
    const snapshot = await backgroundRequest("/api/devices/status");
    applyBackgroundSnapshot(snapshot);
  } catch (error) {
    handleBackgroundFailure(error, "Der Alarmstatus konnte gerade nicht geladen werden.");
  } finally {
    if (!silent) backgroundBusy = false;
    render();
  }
}

function lastPriceSearchAt() {
  const timestamps = [
    state.monitor?.lastCompletedAt,
    state.background?.lastScannedAt
  ]
    .map(value => new Date(value || 0).getTime())
    .filter(Number.isFinite);
  return timestamps.length ? Math.max(...timestamps) : 0;
}

function dailyPriceSearchDue() {
  const last = lastPriceSearchAt();
  return !last || Date.now() - last >= PRICE_SEARCH_INTERVAL_MS;
}

function nextPriceSearchLabel() {
  const last = lastPriceSearchAt();
  if (!last) return "jetzt";
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(last + PRICE_SEARCH_INTERVAL_MS));
}

function kleinanzeigenParserRequest(items) {
  return {
    apiVersion: KLEINANZEIGEN_ADAPTER_VERSION,
    consumer: "evercade-collection-manager",
    requestedAt: new Date().toISOString(),
    source: "kleinanzeigen",
    search: {
      cadence: "daily",
      locale: "de-DE",
      currency: "EUR",
      acceptBundles: false,
      acceptIncomplete: false,
      includeRejected: true
    },
    items: items.map(item => ({
      externalKey: item.key || `${item.series}-${item.number}`,
      title: item.title,
      series: item.series,
      number: Number(item.number),
      requiredTerms: ["Evercade"],
      excludedTerms: ["Konsole", "Controller", "Case", "Hülle leer"]
    }))
  };
}

async function runBackgroundScan() {
  if (!state.background?.enabled || backgroundBusy) return;
  if (!dailyPriceSearchDue()) {
    showToast(`Nächste tägliche Preisprüfung: ${nextPriceSearchLabel()}`);
    return;
  }
  backgroundBusy = true;
  backgroundError = "";
  renderAlerts();
  try {
    await syncBackgroundWatchList({ silent: true });
    const snapshot = await backgroundRequest("/api/devices/scan", {
      method: "POST",
      body: { force: false }
    });
    applyBackgroundSnapshot(snapshot);
    showToast(snapshot.scan?.skipped ? "Preise sind bereits aktuell" : "Hintergrund-Preischeck abgeschlossen");
  } catch (error) {
    handleBackgroundFailure(error, "Der Hintergrund-Preischeck wurde unterbrochen. Deine bisherigen Daten bleiben erhalten.");
  } finally {
    backgroundBusy = false;
    render();
  }
}

async function createAutomationLink({ copy = true, silent = false } = {}) {
  if (!state.background?.enabled) return;
  if (!silent) {
    backgroundBusy = true;
    backgroundError = "";
    renderAlerts();
  }
  try {
    const result = await backgroundRequest("/api/devices/automation-link", {
      method: "POST",
      body: {}
    });
    state.background.automationUrl = safeUrl(result.automationUrl);
    state.background.automationReady = Boolean(state.background.automationUrl);
    persistState();
    if (copy) await copyAutomationLink();
  } catch (error) {
    handleBackgroundFailure(error, "Der Verknüpfungslink konnte gerade nicht erstellt werden.");
  } finally {
    if (!silent) {
      backgroundBusy = false;
      render();
    }
  }
}

async function copyAutomationLink() {
  const url = state.background?.automationUrl;
  if (!url) return;
  try {
    await navigator.clipboard.writeText(url);
    showToast("Verknüpfungslink kopiert");
  } catch {
    const input = document.querySelector("#automationUrl");
    input?.focus();
    input?.select();
    showToast("Link markieren und kopieren");
  }
}

async function markAlertsRead() {
  if (!state.background?.enabled || backgroundBusy) return;
  backgroundBusy = true;
  renderAlerts();
  try {
    const snapshot = await backgroundRequest("/api/devices/alerts/read", {
      method: "POST",
      body: {}
    });
    applyBackgroundSnapshot(snapshot);
  } catch (error) {
    handleBackgroundFailure(error, "Die Preisalarme konnten gerade nicht aktualisiert werden.");
  } finally {
    backgroundBusy = false;
    render();
  }
}

async function disableBackgroundMonitoring() {
  if (!state.background?.enabled || backgroundBusy) return;
  if (!confirm("Hintergrundüberwachung und serverseitige Alarmdaten wirklich löschen? Deine lokale Sammlung bleibt erhalten.")) return;
  backgroundBusy = true;
  renderAlerts();
  try {
    await backgroundRequest("/api/devices/delete", { method: "POST", body: {} });
  } catch (error) {
    if (error?.status !== 401 && error?.status !== 404) {
      handleBackgroundFailure(error, "Die serverseitigen Alarmdaten konnten gerade nicht gelöscht werden.");
      backgroundBusy = false;
      render();
      return;
    }
  }
  state.background = emptyBackgroundState();
  backgroundBusy = false;
  backgroundError = "";
  persistState();
  render();
  showToast("Hintergrundüberwachung gelöscht");
}

function colorFor(item, selected = "Automatisch") {
  if (selected !== "Automatisch") return selected;
  return { console: "Rot", arcade: "Violett", computer: "Blau" }[item.series];
}

function coverUrl(item) {
  const params = new URLSearchParams({
    title: item.title,
    series: item.series,
    number: String(item.number)
  });
  return `${DEAL_API_URL.replace(/\/$/, "")}/api/cover?${params}`;
}

function coverMarkup(item, size = "thumb") {
  return `
    <div class="cover-art cover-${size} ${item.series}" aria-hidden="true">
      <div class="cover-fallback">
        <span>EVERCADE</span>
        <strong>${escapeHtml(item.title)}</strong>
        <em>#${String(item.number).padStart(2, "0")}</em>
      </div>
      <img data-cover src="${escapeHtml(coverUrl(item))}" alt="" loading="lazy" decoding="async">
    </div>
  `;
}

function dealScore(deal, activeDeals) {
  const total = deal.price + deal.shipping;
  const comparable = activeDeals.filter(item => item.key === deal.key);
  const cheapest = Math.min(...comparable.map(item => item.price + item.shipping), total);
  let score = 55;
  if (total === cheapest) score += 25;
  if (deal.condition === "Neu/OVP") score += 6;
  if (deal.sellerType === "Händler") score += 7;
  if ([
    "eBay", "eBay Deutschland", "Idealo", "Geizhals", "Amazon", "Amazon Deutschland",
    "DragonBox Shop", "DragonBox", "Coolshop", "Coolshop Deutschland", "ASC Shop", "ASC-Shop",
    "Just For Games Deutschland", "Enzinger", "GameCenterVS", "MediaMarkt", "Proshop",
    "Vitrex-Shop", "Kaufland-Marktplatz", "Konsolenkost", "Gameware", "Retroplace",
    "Funstock", "Games & Guides", "Trumox", "Online-Shop"
  ].includes(deal.source)) score += 4;
  if (deal.status !== "active") score -= 20;
  return Math.max(0, Math.min(100, score));
}

function scoreLabel(score) {
  if (score >= 85) return "Top-Deal";
  if (score >= 70) return "Guter Deal";
  if (score >= 55) return "Prüfen";
  return "Schwach";
}

function isOwned(key) {
  return state.owned.some(item => item.key === key);
}

function isWished(key) {
  return state.wishlist.includes(key);
}

function missingItems() {
  return sortCatalog(catalog.filter(item => !isOwned(item.key)));
}

function observationIsFresh(observation, days = MONITOR_FRESH_DAYS) {
  const checked = new Date(observation?.checkedAt || 0).getTime();
  return Number.isFinite(checked) && checked > Date.now() - days * 24 * 60 * 60 * 1000;
}

function bestObservedOffer(key) {
  const offers = state.monitor.observations[key]?.offers || [];
  return offers.find(offer => offer.availability === "in_stock" && offer.shippingKnown)
    || offers.find(offer => offer.shippingKnown)
    || null;
}

function cheapestSavedDeal(key) {
  return state.deals
    .filter(deal => deal.key === key && deal.status === "active")
    .map(deal => ({ ...deal, total: deal.price + deal.shipping }))
    .sort((a, b) => a.total - b.total)[0] || null;
}

function latestHistoryEntry(key) {
  const entries = state.monitor.history[key] || [];
  return entries.length ? entries[entries.length - 1] : null;
}

function marketPriceFor(key) {
  const observed = bestObservedOffer(key);
  if (observed?.shippingKnown && knownMoney(observed.total)) {
    return { total: observed.total, source: observed.source, at: observed.verifiedAt, basis: "Preiswächter" };
  }
  const history = latestHistoryEntry(key);
  if (history && knownMoney(history.total)) {
    return { total: history.total, source: history.source, at: history.at, basis: "Preisverlauf" };
  }
  const saved = cheapestSavedDeal(key);
  if (saved && knownMoney(saved.total)) {
    return { total: saved.total, source: saved.source, at: saved.capturedAt, basis: "gespeicherter Deal" };
  }
  return null;
}

function collectionMetrics() {
  const ownedEntries = state.owned
    .map(entry => ({ entry, item: catalogByKey.get(entry.key) }))
    .filter(row => row.item);
  const purchaseRows = ownedEntries.filter(row => knownMoney(row.entry.price));
  const purchaseTotal = purchaseRows.reduce((sum, row) => sum + Number(row.entry.price), 0);
  let estimateTotal = 0;
  let estimateCoverage = 0;
  for (const row of ownedEntries) {
    const market = marketPriceFor(row.item.key);
    const value = market?.total ?? (knownMoney(row.entry.price) ? Number(row.entry.price) : null);
    if (value == null) continue;
    estimateTotal += value;
    estimateCoverage += 1;
  }
  const bySeries = Object.fromEntries(
    Object.keys(seriesOrder).map(series => {
      const total = catalog.filter(item => item.series === series).length;
      const owned = ownedEntries.filter(row => row.item.series === series).length;
      return [series, { total, owned, percent: total ? Math.round(owned / total * 100) : 0 }];
    })
  );
  return {
    owned: ownedEntries.length,
    total: catalog.length,
    missing: catalog.length - ownedEntries.length,
    percent: catalog.length ? Math.round(ownedEntries.length / catalog.length * 100) : 0,
    purchaseTotal: Math.round(purchaseTotal * 100) / 100,
    purchaseCoverage: purchaseRows.length,
    estimateTotal: Math.round(estimateTotal * 100) / 100,
    estimateCoverage,
    bySeries
  };
}

function statusFor(item) {
  if (isOwned(item.key)) return "owned";
  if (isWished(item.key)) return "wishlist";
  return "missing";
}

function statusLabel(item) {
  return {
    owned: "In Sammlung",
    wishlist: "Wunschliste",
    missing: "Fehlend"
  }[statusFor(item)];
}

function sortablePrice(item) {
  const owned = state.owned.find(entry => entry.key === item.key);
  const market = marketPriceFor(item.key);
  if (market) return market.total;
  if (owned && knownMoney(owned.price)) return Number(owned.price);
  return Number.POSITIVE_INFINITY;
}

function sortItems(items, mode = "number") {
  const sorted = [...items];
  sorted.sort((a, b) => {
    if (mode === "title") return a.title.localeCompare(b.title, "de");
    if (mode === "price") {
      return sortablePrice(a) - sortablePrice(b)
        || a.number - b.number
        || seriesOrder[a.series] - seriesOrder[b.series];
    }
    if (mode === "rarity") {
      return Number(b.legacy) - Number(a.legacy)
        || Number(a.announced) - Number(b.announced)
        || a.number - b.number
        || seriesOrder[a.series] - seriesOrder[b.series];
    }
    return seriesOrder[a.series] - seriesOrder[b.series] || a.number - b.number;
  });
  return sorted;
}

function recommendationForMissing() {
  const candidates = missingItems()
    .map(item => ({
      item,
      offer: bestObservedOffer(item.key),
      observation: state.monitor.observations[item.key]
    }))
    .filter(entry => entry.offer);
  if (!candidates.length) return null;
  const fresh = candidates.filter(entry => observationIsFresh(entry.observation));
  const pool = fresh.length ? fresh : candidates;
  pool.sort((a, b) => {
    const availabilityRank = { in_stock: 0, preorder: 1, unknown: 2 };
    const availabilityDifference =
      (availabilityRank[a.offer.availability] ?? 3) -
      (availabilityRank[b.offer.availability] ?? 3);
    if (availabilityDifference) return availabilityDifference;
    const adjustedA = a.offer.total
      - (isWished(a.item.key) ? 4 : 0)
      - (a.item.legacy ? 1.5 : 0)
      - (a.offer.condition === "Neu/OVP" ? 2 : 0)
      - Math.max(0, 1 - a.item.number / 60);
    const adjustedB = b.offer.total
      - (isWished(b.item.key) ? 4 : 0)
      - (b.item.legacy ? 1.5 : 0)
      - (b.offer.condition === "Neu/OVP" ? 2 : 0)
      - Math.max(0, 1 - b.item.number / 60);
    return adjustedA - adjustedB
      || a.offer.total - b.offer.total
      || a.item.number - b.item.number
      || seriesOrder[a.item.series] - seriesOrder[b.item.series];
  });
  return { ...pool[0], fresh: Boolean(fresh.length) };
}

function monitorProgress() {
  const missing = missingItems();
  const freshCount = missing.filter(item =>
    observationIsFresh(state.monitor.observations[item.key])
  ).length;
  return {
    missing: missing.length,
    fresh: freshCount,
    pending: state.monitor.pendingKeys.filter(key => !isOwned(key)).length
  };
}

function priceTrend(key) {
  const entries = state.monitor.history[key] || [];
  if (entries.length < 2) return { symbol: "•", label: "erste Beobachtung" };
  const previous = entries[entries.length - 2].total;
  const current = entries[entries.length - 1].total;
  if (current < previous) return { symbol: "↓", label: `${money(previous - current)} günstiger` };
  if (current > previous) return { symbol: "↑", label: `${money(current - previous)} teurer` };
  return { symbol: "→", label: "Preis unverändert" };
}

function itemHeader(item) {
  return `
    <div class="series-strip ${item.series}"></div>
    ${coverMarkup(item)}
    <div class="cartridge-main">
      <p class="cartridge-title">${escapeHtml(item.title)}</p>
      <p class="cartridge-meta">${seriesLabel(item.series)} · <span class="status-${statusFor(item)}">${statusLabel(item)}</span>${item.legacy ? ' · <span class="legacy">Legacy</span>' : ""}${item.announced ? " · angekündigt" : ""}</p>
    </div>
    <div class="cartridge-number">#${String(item.number).padStart(2, "0")}</div>
  `;
}

function render() {
  renderStats();
  renderBestDeal();
  renderCollection();
  renderSeriesDashboard();
  renderCatalog();
  renderMonitor();
  renderAlerts();
  renderWishlist();
  renderDeals();
  renderPriceHistory();
  fillSelects();
}

function renderStats() {
  const progress = monitorProgress();
  const metrics = collectionMetrics();
  document.querySelector("#totalOwned").textContent = `${metrics.owned} / ${metrics.total}`;
  document.querySelector("#totalMissing").textContent = progress.missing;
  document.querySelector("#totalWishlist").textContent = state.wishlist.length;
  document.querySelector("#totalMonitored").textContent = compactMoney(metrics.estimateTotal);
  const unreadAlerts = state.background?.alerts?.filter(alert => !alert.readAt).length || 0;
  const alertBadge = document.querySelector("#alertTabBadge");
  if (alertBadge) {
    alertBadge.textContent = unreadAlerts ? String(unreadAlerts) : "";
    alertBadge.hidden = unreadAlerts === 0;
  }
  document.querySelector("#collectionProgressRing")?.style.setProperty("--progress", `${metrics.percent}%`);
  if (document.querySelector("#collectionProgressPercent")) {
    document.querySelector("#collectionProgressPercent").textContent = `${metrics.percent} %`;
    document.querySelector("#collectionProgressText").textContent =
      `${metrics.owned} von ${metrics.total} Cartridges`;
    document.querySelector("#purchaseTotal").textContent = money(metrics.purchaseTotal);
    document.querySelector("#purchaseCoverage").textContent =
      `${metrics.purchaseCoverage} von ${metrics.owned} Kaufpreisen erfasst`;
    document.querySelector("#estimatedValue").textContent = money(metrics.estimateTotal);
    document.querySelector("#estimateCoverage").textContent =
      `${metrics.estimateCoverage} von ${metrics.owned} Cartridges bewertet`;
  }
}

function renderSeriesDashboard() {
  const target = document.querySelector("#seriesDashboard");
  if (!target) return;
  const metrics = collectionMetrics();
  target.innerHTML = Object.entries(metrics.bySeries).map(([series, values]) => `
    <article class="series-progress-card">
      <div class="series-progress-heading">
        <span>${seriesLabel(series)}</span>
        <strong>${values.owned}/${values.total}</strong>
      </div>
      <div class="series-progress-track" role="progressbar" aria-label="${seriesLabel(series)}" aria-valuemin="0" aria-valuemax="${values.total}" aria-valuenow="${values.owned}">
        <span class="${series}" style="width:${values.percent}%"></span>
      </div>
      <small>${values.percent} % vollständig</small>
    </article>
  `).join("");
}

function renderBestDeal() {
  const title = document.querySelector("#bestDealTitle");
  const content = document.querySelector("#bestDealContent");
  const recommendation = recommendationForMissing();

  if (recommendation) {
    const { item, offer, observation, fresh } = recommendation;
    const reasons = [
      `${money(offer.total)} Gesamtpreis`,
      isWished(item.key) ? "Wunschliste priorisiert" : null,
      item.legacy ? "Legacy-Cartridge" : null,
      `#${String(item.number).padStart(2, "0")}`,
      fresh ? `geprüft ${dateLabel(observation.checkedAt)}` : "Preisprüfung älter als 24 Stunden"
    ].filter(Boolean);
    title.textContent = item.title;
    content.innerHTML = `
      <div class="best-deal-row">
        <div class="best-deal-copy">
          <strong class="deal-price">${money(offer.total)}</strong>
          <p class="muted compact">${escapeHtml(offer.source)} · ${escapeHtml(offer.condition)} · ${escapeHtml(reasons.join(" · "))}</p>
          <a class="primary-button link-button" href="${escapeHtml(offer.url)}" target="_blank" rel="noopener">Deal ansehen <span aria-hidden="true">→</span></a>
        </div>
        ${coverMarkup(item, "deal")}
      </div>
    `;
    return;
  }

  const validDeals = state.deals.filter(deal =>
    deal.status === "active" &&
    safeUrl(deal.url) &&
    !isOwned(deal.key)
  );

  if (!validDeals.length) {
    title.textContent = "Überwachung starten";
    content.innerHTML = `
      <div class="empty-deal">
        <p class="muted">Prüfe unter „Fehlend“ alle nicht vorhandenen Cartridges. Danach erscheint hier automatisch die beste Kaufempfehlung.</p>
        <button class="secondary-button" data-action="show-view" data-view="monitor">Preisprüfung öffnen</button>
      </div>
    `;
    return;
  }

  const best = [...validDeals].sort((a, b) =>
    (a.price + a.shipping) - (b.price + b.shipping)
  )[0];
  const item = catalogByKey.get(best.key);
  title.textContent = item.title;
  content.innerHTML = `
    <div class="best-deal-row">
      <div class="best-deal-copy">
        <strong class="deal-price">${money(best.price + best.shipping)}</strong>
        <p class="muted compact">${escapeHtml(best.source)} · ${escapeHtml(best.condition)} · Preis ${money(best.price)} + Versand ${money(best.shipping)}</p>
        <a class="primary-button link-button" href="${escapeHtml(best.url)}" target="_blank" rel="noopener">Deal ansehen <span aria-hidden="true">→</span></a>
      </div>
      ${coverMarkup(item, "deal")}
    </div>
  `;
}

function renderCollection() {
  const list = document.querySelector("#collectionList");
  let owned = state.owned
    .map(entry => ({ ...catalogByKey.get(entry.key), ...entry }))
    .filter(item => filters.collection === "all" || item.series === filters.collection);
  owned = sortItems(owned, filters.collectionSort);
  document.querySelector("#ownedCount").textContent =
    `${owned.length} von ${state.owned.length} angezeigt`;

  if (!owned.length) {
    list.innerHTML = '<p class="empty">Keine Cartridges in diesem Bereich.</p>';
    return;
  }

  list.innerHTML = owned.map(item => `
    <article class="cartridge">
      ${itemHeader(item)}
      <div class="card-detail">
        ${escapeHtml(item.condition)}${item.price != null ? ` · gekauft für ${money(item.price)}` : " · Kaufpreis offen"}${item.notes ? ` · ${escapeHtml(item.notes)}` : ""}
      </div>
      <div class="card-actions">
        <button class="secondary-button" data-action="open-detail" data-key="${item.key}">Details</button>
        <button class="text-danger" data-action="remove-owned" data-key="${item.key}">Entfernen</button>
      </div>
    </article>
  `).join("");
}

function renderCatalog() {
  const list = document.querySelector("#catalogList");
  const query = document.querySelector("#catalogSearch").value.trim().toLocaleLowerCase("de");
  let items = catalog.filter(item => filters.catalog === "all" || item.series === filters.catalog);
  if (filters.catalogStatus === "owned") items = items.filter(item => isOwned(item.key));
  if (filters.catalogStatus === "missing") items = items.filter(item => !isOwned(item.key));
  if (filters.catalogStatus === "wishlist") items = items.filter(item => isWished(item.key));
  if (filters.catalogStatus === "legacy") items = items.filter(item => item.legacy);
  if (filters.catalogStatus === "announced") items = items.filter(item => item.announced);

  if (query) {
    items = items.filter(item =>
      item.title.toLocaleLowerCase("de").includes(query) ||
      String(item.number).includes(query) ||
      `${seriesLabel(item.series)} ${item.number}`.toLocaleLowerCase("de").includes(query)
    );
  }

  items = sortItems(items, filters.catalogSort);
  document.querySelector("#catalogResultCount").textContent = `${items.length} von ${catalog.length}`;

  list.innerHTML = items.length ? items.map(item => {
    const market = marketPriceFor(item.key);
    const owned = state.owned.find(entry => entry.key === item.key);
    const priceText = market
      ? `Marktpreis ab ${money(market.total)} · ${escapeHtml(market.source)}`
      : owned && knownMoney(owned.price)
        ? `Kaufpreis ${money(owned.price)}`
        : "Noch kein Preiswert vorhanden";
    return `
      <article class="cartridge">
        ${itemHeader(item)}
        <div class="card-detail catalog-price">${priceText}</div>
        <div class="card-actions">
          <button class="secondary-button" data-action="open-detail" data-key="${item.key}">Details</button>
          ${isOwned(item.key)
            ? '<span class="catalog-owned-hint">✓ In Sammlung</span>'
            : `<button class="secondary-button ${isWished(item.key) ? "is-active wish-active" : ""}" data-action="toggle-wish" data-key="${item.key}">
                ${isWished(item.key) ? "★ Gewünscht" : "☆ Wunschliste"}
              </button>`}
        </div>
      </article>
    `;
  }).join("") : '<p class="empty">Keine passende Cartridge gefunden.</p>';
}

function renderMonitor() {
  const progress = monitorProgress();
  const status = document.querySelector("#monitorStatus");
  const progressBar = document.querySelector("#monitorProgressBar");
  const progressText = document.querySelector("#monitorProgressText");
  const runButton = document.querySelector("#runMonitorButton");
  const stopButton = document.querySelector("#stopMonitorButton");
  const total = Math.max(state.monitor.cycleTotal || progress.missing, 1);
  const completed = Math.max(0, total - progress.pending);
  progressBar.max = total;
  progressBar.value = monitorRunning ? completed : progress.fresh;
  progressText.textContent = monitorRunning
    ? `${completed} von ${total} Cartridges in diesem Lauf geprüft`
    : `${progress.fresh} von ${progress.missing} fehlenden Cartridges in den letzten 24 Stunden geprüft`;
  runButton.disabled = monitorRunning || progress.missing === 0;
  runButton.textContent = progress.pending
    ? `Überwachung fortsetzen (${progress.pending})`
    : progress.missing === 0
      ? "Sammlung vollständig"
      : progress.fresh === progress.missing
        ? "Alle Preise jetzt aktualisieren"
        : "Alle fehlenden Cartridges prüfen";
  stopButton.hidden = !monitorRunning;

  if (monitorError) {
    status.className = "monitor-status is-error";
    status.textContent = monitorError;
  } else if (monitorRunning) {
    status.className = "monitor-status is-loading";
    status.innerHTML = '<span class="loading-dot"></span>Der Preischeck läuft. Die App bitte geöffnet lassen; Ergebnisse werden nach jedem Stapel gespeichert.';
  } else if (state.monitor.lastCompletedAt) {
    status.className = "monitor-status";
    status.textContent = `Letzter vollständiger Lauf: ${dateLabel(state.monitor.lastCompletedAt)} · 9 Händler automatisch · 12 weitere Quellen direkt erreichbar.`;
  } else {
    status.className = "monitor-status";
    status.textContent = "Noch kein vollständiger Lauf. Beim Check werden ausschließlich die Cartridges geprüft, die nicht in deiner Sammlung stehen.";
  }

  let items = missingItems();
  const filter = document.querySelector("#monitorFilter")?.value || "all";
  if (filter === "wishlist") items = items.filter(item => isWished(item.key));
  if (filter === "offers") items = items.filter(item => bestObservedOffer(item.key));
  if (filter === "unchecked") {
    items = items.filter(item => !observationIsFresh(state.monitor.observations[item.key]));
  }
  items.sort((a, b) => {
    const wished = Number(isWished(b.key)) - Number(isWished(a.key));
    if (wished) return wished;
    const aTotal = bestObservedOffer(a.key)?.total ?? Number.POSITIVE_INFINITY;
    const bTotal = bestObservedOffer(b.key)?.total ?? Number.POSITIVE_INFINITY;
    return aTotal - bTotal
      || a.number - b.number
      || seriesOrder[a.series] - seriesOrder[b.series];
  });
  document.querySelector("#monitorCount").textContent = `${items.length} angezeigt`;

  const list = document.querySelector("#monitorList");
  if (!items.length) {
    list.innerHTML = '<p class="empty">Für diesen Filter gibt es keine fehlenden Cartridges.</p>';
    return;
  }
  list.innerHTML = items.map(item => {
    const observation = state.monitor.observations[item.key];
    const offer = bestObservedOffer(item.key);
    const unknownShipping = observation?.offers?.find(entry => !entry.shippingKnown);
    const trend = priceTrend(item.key);
    let detail = "Noch nicht geprüft";
    if (offer) {
      detail = `${money(offer.total)} bei ${escapeHtml(offer.source)} · ${trend.symbol} ${escapeHtml(trend.label)} · geprüft ${dateLabel(observation.checkedAt)}`;
    } else if (unknownShipping) {
      detail = `ab ${money(unknownShipping.price)} · Versand unbekannt · geprüft ${dateLabel(observation.checkedAt)}`;
    } else if (observation?.checkedAt) {
      detail = `Kein eindeutig passendes lieferbares Angebot · geprüft ${dateLabel(observation.checkedAt)}`;
    }
    if (knownMoney(state.background.priceLimits[item.key])) {
      detail += ` · Preisgrenze ${money(state.background.priceLimits[item.key])}`;
    }
    return `
      <article class="cartridge monitor-card ${observationIsFresh(observation) ? "is-fresh" : ""}">
        ${itemHeader(item)}
        <div class="card-detail monitor-detail">${detail}</div>
        <div class="card-actions">
          <button class="secondary-button ${isWished(item.key) ? "wish-active" : ""}" data-action="toggle-wish" data-key="${item.key}">
            ${isWished(item.key) ? "★ Priorisiert" : "☆ Priorisieren"}
          </button>
          ${offer
            ? `<a class="secondary-button link-button" href="${escapeHtml(offer.url)}" target="_blank" rel="noopener">Bestes Angebot</a>`
            : ""}
          <button class="secondary-button" data-action="open-detail" data-key="${item.key}">Details</button>
          <button class="secondary-button" data-action="search-missing" data-key="${item.key}">Detailsuche</button>
        </div>
      </article>
    `;
  }).join("");
}

function renderAlerts() {
  const target = document.querySelector("#alertsContent");
  if (!target) return;
  const background = state.background || emptyBackgroundState();
  if (!background.enabled) {
    target.innerHTML = `
      <article class="automation-card">
        <span class="automation-icon" aria-hidden="true">⏱</span>
        <div>
          <p class="eyebrow">Einmalig aktivieren</p>
          <h3>Preischecks bei geschlossener App</h3>
          <p class="muted">Der Dienst speichert nur deine fehlenden Cartridges, Wunschlisten-Prioritäten und Preisgrenzen unter einer zufälligen Gerätekennung. Namen, E-Mail-Adressen und Kaufnotizen werden nicht übertragen.</p>
        </div>
        <button class="primary-button full-width" data-action="enable-background" ${backgroundBusy ? "disabled" : ""}>
          ${backgroundBusy ? "Wird aktiviert …" : "Hintergrundüberwachung aktivieren"}
        </button>
        ${backgroundError ? `<p class="monitor-status is-error">${escapeHtml(backgroundError)}</p>` : ""}
      </article>
    `;
    return;
  }

  const unread = background.alerts.filter(alert => !alert.readAt).length;
  const automationMarkup = background.automationUrl
    ? `
      <p class="muted compact">Kopiere diesen privaten Link einmal in den Chat. Danach kann ChatGPT einmal täglich nach Preisalarmen schauen und sonntags um 21 Uhr die Kaufempfehlung senden.</p>
      <label class="automation-link-label">
        Verknüpfungslink
        <input id="automationUrl" type="text" readonly value="${escapeHtml(background.automationUrl)}">
      </label>
      <div class="automation-actions">
        <button class="primary-button" data-action="copy-automation">Link kopieren</button>
        <button class="secondary-button" data-action="rotate-automation">Neuen Link erzeugen</button>
      </div>
    `
    : `
      <p class="muted compact">Erzeuge einen privaten Verknüpfungslink und sende ihn einmal in den Chat. Ohne diesen letzten Schritt kann ChatGPT noch keine Meldungen zustellen.</p>
      <button class="primary-button full-width" data-action="create-automation">Verknüpfungslink erzeugen</button>
    `;
  const alertsMarkup = background.alerts.length
    ? background.alerts.map(alert => {
      const item = catalogByKey.get(alert.key);
      const icon = {
        price_limit: "◎",
        price_drop: "↓",
        back_in_stock: "↺",
        new_best: "★"
      }[alert.type] || "!";
      return `
        <article class="alert-card ${alert.readAt ? "is-read" : "is-unread"}">
          <span class="alert-icon" aria-hidden="true">${icon}</span>
          <div>
            <p class="alert-title">${escapeHtml(alert.title)}</p>
            <p class="muted compact">${escapeHtml(alert.message)}</p>
            <small>${item ? `${seriesLabel(item.series)} · #${String(item.number).padStart(2, "0")} · ` : ""}${dateLabel(alert.createdAt)}</small>
          </div>
          ${alert.url ? `<a class="secondary-button link-button" href="${escapeHtml(alert.url)}" target="_blank" rel="noopener">Angebot</a>` : ""}
        </article>
      `;
    }).join("")
    : '<p class="empty">Noch keine Preisalarme. Nach dem ersten Hintergrund-Check erscheinen Preisgrenzen, Preisstürze, neue Bestpreise und wieder verfügbare Titel hier.</p>';
  const sourcesMarkup = background.sourceStatus.length
    ? background.sourceStatus.map(source => `
      <div class="source-status-row">
        <span class="source-status-dot is-${source.status === "ok" ? "ok" : "error"}"></span>
        <div>
          <strong>${escapeHtml(source.name)}</strong>
          <small>${source.status === "ok" ? "Erfolgreich geprüft" : "Beim letzten Lauf nicht erreichbar"} · ${dateLabel(source.checkedAt)}${source.lastSuccessAt && source.status !== "ok" ? ` · zuletzt erfolgreich ${dateLabel(source.lastSuccessAt)}` : ""}</small>
        </div>
        <span>${source.accepted} Treffer</span>
      </div>
    `).join("")
    : '<p class="empty">Der Quellenstatus erscheint nach dem ersten Hintergrund-Check.</p>';

  target.innerHTML = `
    ${backgroundError ? `<p class="monitor-status is-error">${escapeHtml(backgroundError)}</p>` : ""}
    <div class="background-status-grid">
      <article>
        <span>Status</span>
        <strong>${backgroundBusy ? "Arbeitet …" : "Aktiv"}</strong>
      </article>
      <article>
        <span>Überwacht</span>
        <strong>${missingItems().length}</strong>
      </article>
      <article>
        <span>Neue Alarme</span>
        <strong>${unread}</strong>
      </article>
      <article>
        <span>Letzter Check</span>
        <strong>${background.lastScannedAt ? dateLabel(background.lastScannedAt) : "offen"}</strong>
      </article>
    </div>
    <div class="automation-actions">
      <button class="primary-button" data-action="background-scan" ${backgroundBusy ? "disabled" : ""}>Jetzt serverseitig prüfen</button>
      <button class="secondary-button" data-action="background-refresh" ${backgroundBusy ? "disabled" : ""}>Status aktualisieren</button>
    </div>
    <article class="automation-card is-linked">
      <span class="automation-icon" aria-hidden="true">🔔</span>
      <div>
        <p class="eyebrow">ChatGPT-Benachrichtigungen</p>
        <h3>Tägliche Preisprüfung & Sonntagsempfehlung</h3>
      </div>
      ${automationMarkup}
    </article>
    <div class="section-heading alert-heading">
      <div>
        <p class="eyebrow">Posteingang</p>
        <h3>Preisalarme</h3>
      </div>
      ${unread ? `<button class="text-button" data-action="read-alerts">Alle gelesen</button>` : ""}
    </div>
    <div class="alert-list">${alertsMarkup}</div>
    <div class="section-heading source-heading">
      <div>
        <p class="eyebrow">Technischer Status</p>
        <h3>Automatische Bezugsquellen</h3>
      </div>
      <span class="badge">9 automatisch</span>
    </div>
    <div class="source-status-list">${sourcesMarkup}</div>
    <button class="text-danger background-delete" data-action="disable-background" ${backgroundBusy ? "disabled" : ""}>Hintergrundüberwachung und Serverdaten löschen</button>
  `;
}

function renderWishlist() {
  const list = document.querySelector("#wishlistList");
  const items = sortWishlist(state.wishlist.map(key => catalogByKey.get(key)).filter(Boolean));
  document.querySelector("#wishlistCount").textContent = `${items.length} Einträge`;

  if (!items.length) {
    list.innerHTML = '<p class="empty">Deine Wunschliste ist noch leer. Füge Cartridges im Katalog hinzu.</p>';
    return;
  }

  list.innerHTML = items.map(item => {
    const search = encodeURIComponent(`Evercade "${item.title}"`);
    const kleinanzeigenSearch = encodeURIComponent(`Evercade ${item.title}`).replaceAll("%20", "-");
    return `
      <article class="cartridge">
        ${itemHeader(item)}
        <div class="market-links">
          <a href="https://www.ebay.de/sch/i.html?_nkw=${search}" target="_blank" rel="noopener">eBay</a>
          <a href="https://www.kleinanzeigen.de/s-${kleinanzeigenSearch}/k0" target="_blank" rel="noopener">Kleinanzeigen</a>
          <a href="https://www.google.com/search?q=${search}" target="_blank" rel="noopener">Google</a>
        </div>
        <div class="card-actions">
          <button class="secondary-button" data-action="open-detail" data-key="${item.key}">Details</button>
          <button class="secondary-button" data-action="toggle-owned" data-key="${item.key}">${isOwned(item.key) ? "✓ In Sammlung" : "+ Sammlung"}</button>
          <button class="text-danger" data-action="toggle-wish" data-key="${item.key}">Entfernen</button>
        </div>
      </article>
    `;
  }).join("");
}

function renderDeals() {
  const list = document.querySelector("#dealList");
  const deals = [...state.deals].sort((a, b) =>
    (a.price + a.shipping) - (b.price + b.shipping) ||
    String(b.capturedAt).localeCompare(String(a.capturedAt))
  );

  if (!deals.length) {
    list.innerHTML = '<p class="empty">Noch keine Angebote gespeichert.</p>';
    return;
  }

  list.innerHTML = deals.map(deal => {
    const item = catalogByKey.get(deal.key);
    const score = dealScore(deal, state.deals.filter(entry => entry.status === "active"));
    const statusText = {
      active: "Aktiv",
      checked: `Geprüft${deal.checkedAt ? ` am ${dateLabel(deal.checkedAt)}` : ""}`,
      expired: "Abgelaufen"
    }[deal.status];
    return `
      <article class="cartridge deal-card is-${deal.status}">
        ${itemHeader(item)}
        <div class="deal-detail">
          <strong>${money(deal.price + deal.shipping)}</strong>
          <span>${escapeHtml(deal.source)} · ${escapeHtml(deal.condition)} · ${escapeHtml(colorFor(item, deal.color))}</span>
          <small>${money(deal.price)} + ${money(deal.shipping)} Versand · ${escapeHtml(deal.sellerType)} · ${statusText}</small>
          <span class="deal-score">${scoreLabel(score)} ${score}</span>
        </div>
        <div class="card-actions">
          <a class="secondary-button link-button" href="${escapeHtml(deal.url)}" target="_blank" rel="noopener">Angebot öffnen</a>
          <button class="secondary-button" data-action="cycle-deal-status" data-id="${deal.id}">${deal.status === "active" ? "Als geprüft" : deal.status === "checked" ? "Abgelaufen" : "Reaktivieren"}</button>
          <button class="text-danger" data-action="remove-deal" data-id="${deal.id}">Löschen</button>
        </div>
      </article>
    `;
  }).join("");
}

function renderPriceHistory() {
  const panel = document.querySelector("#priceHistory");
  const key = document.querySelector("#searchCatalogItem")?.value;
  const entries = state.deals.filter(deal => !key || deal.key === key);
  if (!entries.length) {
    panel.innerHTML = "";
    return;
  }
  const item = catalogByKey.get(key || entries[0].key);
  const totals = entries.map(deal => deal.price + deal.shipping);
  const newest = [...entries].sort((a, b) => String(b.capturedAt).localeCompare(String(a.capturedAt)))[0];
  panel.innerHTML = `
    <div class="history-card">
      <span>Preisverlauf · ${escapeHtml(item?.title || "Auswahl")}</span>
      <strong>${money(Math.min(...totals))} – ${money(Math.max(...totals))}</strong>
      <small>${entries.length} gespeicherte Beobachtung${entries.length === 1 ? "" : "en"} · zuletzt ${dateLabel(newest.capturedAt)}</small>
    </div>
  `;
}

function fillSelects() {
  const available = sortCatalog(catalog.filter(item => !isOwned(item.key)));
  const addSelect = document.querySelector("#addCatalogItem");
  const currentAdd = addSelect.value;
  addSelect.innerHTML = available.length
    ? available.map(item => `<option value="${item.key}">${seriesLabel(item.series)} #${String(item.number).padStart(2, "0")} – ${escapeHtml(item.title)}</option>`).join("")
    : '<option value="">Katalog vollständig</option>';
  if (available.some(item => item.key === currentAdd)) addSelect.value = currentAdd;

  const dealSelect = document.querySelector("#dealCatalogItem");
  const currentDeal = dealSelect.value;
  const prioritized = sortWishlist(catalog).sort((a, b) =>
    Number(isWished(b.key)) - Number(isWished(a.key)) || a.number - b.number
  );
  dealSelect.innerHTML = prioritized.map(item =>
    `<option value="${item.key}">${isWished(item.key) ? "★ " : ""}${seriesLabel(item.series)} #${String(item.number).padStart(2, "0")} – ${escapeHtml(item.title)}</option>`
  ).join("");
  if (catalogByKey.has(currentDeal)) dealSelect.value = currentDeal;

  const searchSelect = document.querySelector("#searchCatalogItem");
  const currentSearch = searchSelect.value;
  const searchable = prioritized.filter(item => !isOwned(item.key));
  searchSelect.innerHTML = searchable.map(item =>
    `<option value="${item.key}">${isWished(item.key) ? "★ " : ""}${seriesLabel(item.series)} #${String(item.number).padStart(2, "0")} – ${escapeHtml(item.title)}</option>`
  ).join("") || '<option value="">Sammlung vollständig</option>';
  if (searchable.some(item => item.key === currentSearch)) searchSelect.value = currentSearch;
}

function detailHistoryEntries(key) {
  const monitored = (state.monitor.history[key] || []).map(entry => ({
    at: entry.at,
    total: Number(entry.total),
    source: entry.source,
    url: entry.url,
    type: "Preiswächter"
  }));
  const saved = state.deals
    .filter(deal => deal.key === key)
    .map(deal => ({
      at: deal.capturedAt,
      total: Number(deal.price) + Number(deal.shipping),
      source: deal.source,
      url: deal.url,
      type: "gespeicherter Deal"
    }));
  return [...monitored, ...saved]
    .filter(entry => knownMoney(entry.total))
    .sort((a, b) => String(b.at).localeCompare(String(a.at)))
    .slice(0, 20);
}

function renderDetailHistory(key) {
  const panel = document.querySelector("#detailHistory");
  const entries = detailHistoryEntries(key);
  if (!entries.length) {
    panel.innerHTML = '<p class="empty detail-empty">Noch keine Preisbeobachtung für diese Cartridge.</p>';
    return;
  }
  const totals = entries.map(entry => entry.total);
  panel.innerHTML = `
    <div class="detail-price-summary">
      <span><small>Niedrigster Wert</small><strong>${money(Math.min(...totals))}</strong></span>
      <span><small>Letzter Wert</small><strong>${money(entries[0].total)}</strong></span>
      <span><small>Höchster Wert</small><strong>${money(Math.max(...totals))}</strong></span>
    </div>
    <div class="detail-history-list">
      ${entries.slice(0, 6).map(entry => `
        <a href="${escapeHtml(entry.url)}" target="_blank" rel="noopener">
          <span>${dateLabel(entry.at)} · ${escapeHtml(entry.source)}</span>
          <strong>${money(entry.total)}</strong>
        </a>
      `).join("")}
    </div>
  `;
}

function openDetail(key) {
  const item = catalogByKey.get(key);
  if (!item) return;
  activeDetailKey = key;
  const owned = state.owned.find(entry => entry.key === key);
  const market = marketPriceFor(key);
  document.querySelector("#detailCover").innerHTML = coverMarkup(item, "detail");
  document.querySelector("#detailEyebrow").textContent =
    `${seriesLabel(item.series)} · #${String(item.number).padStart(2, "0")}`;
  document.querySelector("#detailTitle").textContent = item.title;
  document.querySelector("#detailBadges").innerHTML = `
    <span class="detail-badge status-${statusFor(item)}">${statusLabel(item)}</span>
    ${item.legacy ? '<span class="detail-badge legacy">Legacy</span>' : ""}
    ${item.announced ? '<span class="detail-badge">Angekündigt</span>' : ""}
    ${market ? `<span class="detail-badge">Markt ${money(market.total)}</span>` : ""}
  `;
  document.querySelector("#detailCondition").value = owned?.condition || "Geöffnet";
  document.querySelector("#detailPrice").value = knownMoney(owned?.price) ? owned.price : "";
  document.querySelector("#detailNotes").value = owned?.notes || "";
  document.querySelector("#detailOwnedFields").hidden = !owned;
  document.querySelector("#detailPriceLimitFields").hidden = Boolean(owned);
  document.querySelector("#detailPriceLimit").value = !owned && knownMoney(state.background.priceLimits[key])
    ? state.background.priceLimits[key]
    : "";
  document.querySelector("#saveDetailButton").hidden = false;
  document.querySelector("#saveDetailButton").textContent = owned
    ? "Details speichern"
    : "Preisgrenze speichern";
  document.querySelector("#detailOwnedButton").textContent = owned
    ? "Aus Sammlung entfernen"
    : "Zur Sammlung hinzufügen";
  document.querySelector("#detailOwnedButton").classList.toggle("danger-button", Boolean(owned));
  document.querySelector("#detailOwnedButton").classList.toggle("primary-button", !owned);
  document.querySelector("#detailWishButton").hidden = Boolean(owned);
  document.querySelector("#detailWishButton").textContent = isWished(key)
    ? "★ Von Wunschliste entfernen"
    : "☆ Zur Wunschliste";
  document.querySelector("#detailDealButton").hidden = Boolean(owned);
  renderDetailHistory(key);
  const dialog = document.querySelector("#detailDialog");
  if (!dialog.open) dialog.showModal();
}

function openDealSearchFor(key) {
  const item = catalogByKey.get(key);
  if (!item || isOwned(key)) return;
  document.querySelector("#detailDialog")?.close();
  showView("deals");
  const select = document.querySelector("#searchCatalogItem");
  select.value = key;
  clearLiveSearch();
  document.querySelector("#dealsView").scrollIntoView?.({ behavior: "smooth", block: "start" });
  runLiveSearch();
}

function toggleOwned(key) {
  if (!catalogByKey.has(key)) return;
  if (isOwned(key)) {
    const item = catalogByKey.get(key);
    if (!confirm(`${item.title} wirklich aus der Sammlung entfernen?`)) return;
    state.owned = state.owned.filter(entry => entry.key !== key);
  } else {
    state.owned.push({ key, condition: "Geöffnet", price: null, notes: "" });
    state.wishlist = state.wishlist.filter(entry => entry !== key);
    state.monitor.pendingKeys = state.monitor.pendingKeys.filter(entry => entry !== key);
    delete state.background.priceLimits[key];
    showToast("Zur Sammlung hinzugefügt");
  }
  saveState();
  render();
  if (activeDetailKey === key && document.querySelector("#detailDialog")?.open) openDetail(key);
}

function toggleWish(key) {
  if (!catalogByKey.has(key)) return;
  if (isOwned(key) && !isWished(key)) {
    showToast("Bereits in deiner Sammlung");
    return;
  }
  state.wishlist = isWished(key)
    ? state.wishlist.filter(entry => entry !== key)
    : [...state.wishlist, key];
  saveState();
  render();
  if (activeDetailKey === key && document.querySelector("#detailDialog")?.open) openDetail(key);
}

function showView(name, { scroll = false } = {}) {
  activeView = name;
  Object.entries(views).forEach(([key, element]) => {
    element.hidden = key !== name;
  });
  document.querySelectorAll(".tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.view === name);
  });
  if (scroll) {
    views[name]?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }
}

let toastTimer;
function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

document.querySelector(".tabs").addEventListener("click", event => {
  const tab = event.target.closest(".tab");
  if (tab) showView(tab.dataset.view, { scroll: true });
});

document.querySelectorAll(".series-filters").forEach(group => {
  group.addEventListener("click", event => {
    const button = event.target.closest(".filter");
    if (!button) return;
    group.querySelectorAll(".filter").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    filters[group.dataset.filterGroup] = button.dataset.filter;
    render();
  });
});

document.querySelector("#catalogSearch").addEventListener("input", renderCatalog);
document.querySelector("#catalogStatusFilter").addEventListener("change", event => {
  filters.catalogStatus = event.target.value;
  renderCatalog();
});
document.querySelector("#catalogSort").addEventListener("change", event => {
  filters.catalogSort = event.target.value;
  renderCatalog();
});
document.querySelector("#collectionSort").addEventListener("change", event => {
  filters.collectionSort = event.target.value;
  renderCollection();
});

document.body.addEventListener("click", event => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const { action, key, id } = button.dataset;
  if (action === "show-view" && button.dataset.view) {
    showView(button.dataset.view, { scroll: true });
  }
  if (action === "toggle-owned") toggleOwned(key);
  if (action === "remove-owned") toggleOwned(key);
  if (action === "toggle-wish") toggleWish(key);
  if (action === "open-detail") openDetail(key);
  if (action === "save-live-deal") saveLiveOffer(id);
  if (action === "enable-background") enableBackgroundMonitoring();
  if (action === "background-scan") runBackgroundScan();
  if (action === "background-refresh") refreshBackgroundStatus({ silent: false });
  if (action === "create-automation") createAutomationLink();
  if (action === "copy-automation") copyAutomationLink();
  if (action === "rotate-automation") {
    if (confirm("Der bisherige Verknüpfungslink wird dadurch ungültig. Neuen Link erzeugen?")) {
      createAutomationLink();
    }
  }
  if (action === "read-alerts") markAlertsRead();
  if (action === "disable-background") disableBackgroundMonitoring();
  if (action === "search-missing" && catalogByKey.has(key)) {
    openDealSearchFor(key);
  }
  if (action === "remove-deal") {
    if (!confirm("Diesen gespeicherten Deal wirklich löschen?")) return;
    state.deals = state.deals.filter(deal => deal.id !== id);
    saveState();
    render();
  }
  if (action === "cycle-deal-status") {
    const deal = state.deals.find(entry => entry.id === id);
    if (!deal) return;
    deal.status = deal.status === "active" ? "checked" : deal.status === "checked" ? "expired" : "active";
    deal.checkedAt = deal.status === "checked" ? new Date().toISOString() : deal.checkedAt;
    saveState();
    render();
  }
});

document.body.addEventListener("error", event => {
  const image = event.target.closest?.("img[data-cover]");
  if (!image) return;
  image.hidden = true;
  image.closest(".cover-art")?.classList.add("is-fallback");
}, true);

const addDialog = document.querySelector("#addDialog");
const dealDialog = document.querySelector("#dealDialog");
const dataDialog = document.querySelector("#dataDialog");
const searchDialog = document.querySelector("#searchDialog");
const detailDialog = document.querySelector("#detailDialog");

document.querySelector("#openAddDialog").addEventListener("click", () => addDialog.showModal());
document.querySelector("#openDealDialog").addEventListener("click", () => dealDialog.showModal());
document.querySelector("#openDataDialog").addEventListener("click", () => dataDialog.showModal());
document.querySelectorAll(".close-dialog").forEach(button => {
  button.addEventListener("click", () => button.closest("dialog").close());
});
detailDialog.addEventListener("close", () => {
  activeDetailKey = null;
});
document.querySelector("#detailOwnedButton").addEventListener("click", () => {
  if (!activeDetailKey) return;
  toggleOwned(activeDetailKey);
});
document.querySelector("#detailWishButton").addEventListener("click", () => {
  if (!activeDetailKey) return;
  toggleWish(activeDetailKey);
});
document.querySelector("#detailDealButton").addEventListener("click", () => {
  if (!activeDetailKey) return;
  openDealSearchFor(activeDetailKey);
});
document.querySelector("#detailForm").addEventListener("submit", event => {
  event.preventDefault();
  const owned = state.owned.find(entry => entry.key === activeDetailKey);
  if (!owned) {
    const limitText = document.querySelector("#detailPriceLimit").value;
    const limit = limitText === "" ? null : Number(limitText);
    if (limit != null && (!Number.isFinite(limit) || limit < 0 || limit > 500)) {
      alert("Bitte eine Preisgrenze zwischen 0 und 500 Euro eingeben.");
      return;
    }
    if (limit == null) delete state.background.priceLimits[activeDetailKey];
    else state.background.priceLimits[activeDetailKey] = Math.round(limit * 100) / 100;
    saveState();
    render();
    openDetail(activeDetailKey);
    showToast(limit == null ? "Preisgrenze entfernt" : "Preisgrenze gespeichert");
    return;
  }
  const priceText = document.querySelector("#detailPrice").value;
  const price = priceText === "" ? null : Number(priceText);
  if (price != null && (!Number.isFinite(price) || price < 0)) {
    alert("Bitte einen gültigen Kaufpreis eingeben.");
    return;
  }
  owned.condition = document.querySelector("#detailCondition").value;
  owned.price = price;
  owned.notes = document.querySelector("#detailNotes").value.trim().slice(0, 1200);
  saveState();
  render();
  openDetail(activeDetailKey);
  showToast("Cartridge-Details gespeichert");
});

function marketSearches(item) {
  const exact = `Evercade "${item.title}"`;
  const regular = `Evercade ${item.title}`;
  const q = encodeURIComponent(exact);
  const qRegular = encodeURIComponent(regular);
  return [
    { name: "DragonBox", hint: "Automatische Suche + Kontrolllink", url: `https://dragonbox.de/en-de/search?controller=search&s=${qRegular}` },
    { name: "ASC-Shop", hint: "Automatische Suche + Kontrolllink", url: `https://www.asc-shop.de/shop/action/modul/side/27/action3/psearch/psearch/show2/modul/10/suchstring/${qRegular}` },
    { name: "Just For Games Deutschland", hint: "Automatische Suche + Kontrolllink", url: `https://www.shop-justforgames.eu/search?q=${qRegular}&type=product` },
    { name: "Coolshop Deutschland", hint: "Automatische Suche + Kontrolllink", url: `https://www.coolshop.de/s/?q=${qRegular}` },
    { name: "Enzinger", hint: "Automatische Suche + Kontrolllink", url: "https://www.enzinger.com/brands/evercade/" },
    { name: "GameCenterVS", hint: "Automatische Suche + Kontrolllink", url: `https://www.gamecentervs.de/search?q=${qRegular}&type=product` },
    { name: "Amazon Deutschland", hint: "Direktsuche", url: `https://www.amazon.de/s?k=${qRegular}` },
    { name: "MediaMarkt", hint: "Direktsuche", url: `https://www.mediamarkt.de/de/search.html?query=${qRegular}` },
    { name: "Proshop", hint: "Direktsuche", url: `https://www.proshop.de/?s=${qRegular}` },
    { name: "Vitrex-Shop", hint: "Automatische Suche + Kontrolllink", url: `https://www.vitrex-shop.de/de/erweiterte-suche__13/?itid=13&quicksearch=${qRegular}&search_button=1&send_form=1&vtx_search=1` },
    { name: "Kaufland-Marktplatz", hint: "Direktsuche", url: `https://www.kaufland.de/s/?search_value=${qRegular}` },
    { name: "Konsolenkost", hint: "Direktsuche", url: `https://www.konsolenkost.de/search/?sSearch=${qRegular}` },
    { name: "Gameware", hint: "Direktsuche", url: `https://www.gameware.at/info/spaces/gameware/gamewareSearch?actionTag=search&query=${qRegular}` },
    { name: "eBay Deutschland", hint: "Auktionen & Sofortkauf", url: `https://www.ebay.de/sch/i.html?_nkw=${q}&_sop=15` },
    { name: "Kleinanzeigen", hint: "Private Schnäppchen", url: `https://www.kleinanzeigen.de/s-${qRegular.replaceAll("%20", "-")}/k0` },
    { name: "Retroplace", hint: "Sammler-Marktplatz", url: "https://www.retroplace.com/de/spiele/marktplatz?system_short=evercade" },
    { name: "Idealo", hint: "Preisvergleich", url: `https://www.idealo.de/preisvergleich/MainSearchProductCategory.html?q=${qRegular}` },
    { name: "Geizhals", hint: "Preisvergleich", url: `https://geizhals.de/?fs=${qRegular}` },
    { name: "Funstock", hint: "Automatische Suche + Kontrolllink", url: `https://funstock.co.uk/search?q=${qRegular}&type=product&country=DE` },
    { name: "Games & Guides", hint: "Evercade-Kategorie", url: "https://www.gamesandguides.de/Evercade" },
    { name: "Trumox", hint: "Automatische Suche + Kontrolllink", url: `https://trumox.de/advanced_search_result.php?keywords=${qRegular}` }
  ];
}

function apiIsConfigured() {
  return /^https:\/\/[^_]+/i.test(DEAL_API_URL) && !DEAL_API_URL.startsWith("__");
}

function clearLiveSearch() {
  liveSearchController?.abort();
  liveSearchController = null;
  latestLiveSearch = null;
  const status = document.querySelector("#liveSearchStatus");
  status.className = "live-search-status";
  status.textContent = "";
  document.querySelector("#liveDealResults").innerHTML = "";
  document.querySelector("#sourceCoverage").innerHTML = "";
}

function renderLiveSearch(result, item) {
  const status = document.querySelector("#liveSearchStatus");
  const list = document.querySelector("#liveDealResults");
  const coverage = document.querySelector("#sourceCoverage");
  const offers = Array.isArray(result.offers) ? result.offers : [];
  const checkedAt = new Date(result.searchedAt);
  const time = Number.isNaN(checkedAt.getTime())
    ? "gerade eben"
    : new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(checkedAt);

  status.className = "live-search-status";
  status.textContent = offers.length
    ? `${offers.length} gültige${offers.length === 1 ? "s Angebot" : " Angebote"} gefunden · geprüft um ${time} Uhr`
    : `Keine lieferbaren, eindeutig passenden Angebote automatisch gefunden · geprüft um ${time} Uhr. Nutze zusätzlich die direkten Quellen.`;

  list.innerHTML = offers.map((offer, index) => {
    const shippingText = offer.shippingKnown
      ? `${money(offer.price)} + ${money(offer.shipping)} Versand`
      : `${money(offer.price)} · Versand noch unbekannt`;
    const totalText = offer.total == null ? money(offer.price) : money(offer.total);
    const availabilityText = {
      in_stock: "auf Lager",
      preorder: "vor-/nachbestellbar",
      unknown: "Verfügbarkeit prüfen"
    }[offer.availability] || "Verfügbarkeit prüfen";
    return `
      <article class="cartridge live-offer ${index === 0 && offer.shippingKnown ? "is-best" : ""}">
        ${itemHeader(item)}
        <div class="deal-detail">
          <strong>${totalText}${index === 0 && offer.shippingKnown ? '<span class="best-live-badge">BESTER TREFFER</span>' : ""}</strong>
          <span>${escapeHtml(offer.source)} · ${escapeHtml(offer.condition || "Neu/OVP")} · ${escapeHtml(availabilityText)} · ${escapeHtml(offer.color || colorFor(item))}</span>
          <small>${shippingText} · Titelabgleich ${Number(offer.confidence) || 0} %</small>
        </div>
        <div class="card-actions">
          <a class="secondary-button link-button" href="${escapeHtml(offer.url)}" target="_blank" rel="noopener">Angebot öffnen</a>
          <button class="primary-button" data-action="save-live-deal" data-id="${escapeHtml(offer.id)}">${offer.shippingKnown ? "Deal speichern" : "Versand ergänzen"}</button>
        </div>
      </article>
    `;
  }).join("");

  const sourcePills = (result.sources || []).map(source => `
    <span class="source-pill is-${source.status === "ok" ? "ok" : "unavailable"}">
      ${source.status === "ok" ? "✓" : "!"} ${escapeHtml(source.name)}: ${Number(source.accepted) || 0}
    </span>
  `).join("");
  coverage.innerHTML = `
    <span><strong>${Number(result.coverage?.totalSources) || 21} Quellen:</strong> ${Number(result.coverage?.automaticSources) || 9} automatisch · ${Number(result.coverage?.directOnlySources) || 12} als Direktsuche</span>
    <span>${Number(result.coverage?.candidatesExamined) || 0} Kandidaten geprüft · ${offers.length} nach Titel, Verfügbarkeit, Preis und Versand übernommen</span>
    <div class="source-pills">${sourcePills}</div>
    <span>Treffer mit unbekanntem Versand werden nicht als günstigster Gesamtpreis gewertet.</span>
  `;
}

function applyMonitorBatch(result, batchKeys) {
  if (!result || !Array.isArray(result.results)) {
    throw new Error("Ungültige Antwort des Überwachungsdienstes");
  }
  const byKey = new Map(result.results.map(entry => [entry.key, entry]));
  const updates = batchKeys.map(key => {
    const item = catalogByKey.get(key);
    const entry = byKey.get(key);
    if (
      !item ||
      !entry ||
      entry.query?.title !== item.title ||
      entry.query?.series !== item.series ||
      Number(entry.query?.number) !== item.number
    ) {
      throw new Error(`Inkonsistentes Ergebnis für ${item?.title || key}`);
    }
    const offers = (entry.offers || [])
      .map(normalizeObservedOffer)
      .filter(Boolean)
      .slice(0, 8);
    return {
      key,
      observation: {
        checkedAt: result.searchedAt || new Date().toISOString(),
        offers,
        automaticSourcesAvailable:
          Number(entry.coverage?.automaticSourcesAvailable) ||
          Number(result.coverage?.automaticSourcesAvailable) ||
          0,
        candidatesExamined: Number(entry.coverage?.candidatesExamined) || 0
      }
    };
  });

  for (const update of updates) {
    state.monitor.observations[update.key] = update.observation;
    const best = update.observation.offers.find(
      offer => offer.availability === "in_stock" && offer.shippingKnown
    ) || update.observation.offers.find(offer => offer.shippingKnown);
    if (best) {
      const history = state.monitor.history[update.key] || [];
      history.push({
        at: update.observation.checkedAt,
        total: best.total,
        source: best.source,
        url: best.url
      });
      state.monitor.history[update.key] = history.slice(-20);
    }
  }
  state.monitor.pendingKeys = state.monitor.pendingKeys.filter(
    key => !batchKeys.includes(key)
  );
  state.monitor.lastAttemptAt = result.searchedAt || new Date().toISOString();
  saveState();
}

async function runMonitoring() {
  if (monitorRunning || !apiIsConfigured()) return;
  if (!dailyPriceSearchDue()) {
    showToast(`Nächste tägliche Preisprüfung: ${nextPriceSearchLabel()}`);
    return;
  }
  const missing = missingItems();
  if (!missing.length) {
    showToast("Deine Sammlung ist vollständig");
    return;
  }
  monitorError = "";
  const currentMissing = new Set(missing.map(item => item.key));
  state.monitor.pendingKeys = state.monitor.pendingKeys.filter(key => currentMissing.has(key));
  if (!state.monitor.pendingKeys.length) {
    const queue = [...missing].sort((a, b) =>
      Number(isWished(b.key)) - Number(isWished(a.key)) ||
      a.number - b.number ||
      seriesOrder[a.series] - seriesOrder[b.series]
    );
    state.monitor.pendingKeys = queue.map(item => item.key);
    state.monitor.cycleTotal = queue.length;
    state.monitor.startedAt = new Date().toISOString();
  }
  saveState();
  monitorRunning = true;
  render();

  try {
    while (state.monitor.pendingKeys.length) {
      const batchKeys = state.monitor.pendingKeys.slice(0, MONITOR_BATCH_SIZE);
      const items = batchKeys
        .map(key => catalogByKey.get(key))
        .filter(Boolean)
        .map(item => ({
          title: item.title,
          series: item.series,
          number: item.number
        }));
      if (!items.length) break;
      monitorController = new AbortController();
      const response = await fetch(`${DEAL_API_URL.replace(/\/$/, "")}/api/monitor`, {
        method: "POST",
        signal: monitorController.signal,
        headers: {
          accept: "application/json",
          "content-type": "application/json"
        },
        body: JSON.stringify({ items })
      });
      if (!response.ok) throw new Error(`Überwachung fehlgeschlagen (${response.status})`);
      const result = await response.json();
      applyMonitorBatch(result, batchKeys);
      render();
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    state.monitor.pendingKeys = [];
    state.monitor.cycleTotal = missingItems().length;
    state.monitor.startedAt = null;
    state.monitor.lastCompletedAt = new Date().toISOString();
    saveState();
    showToast("Alle fehlenden Cartridges geprüft");
  } catch (error) {
    if (error.name === "AbortError") {
      showToast("Überwachung pausiert");
    } else {
      monitorError = "Der Preischeck wurde unterbrochen. Bereits geprüfte Ergebnisse sind gespeichert; mit „Fortsetzen“ geht es an derselben Stelle weiter.";
      console.warn("Überwachung fehlgeschlagen.", error);
    }
  } finally {
    monitorController = null;
    monitorRunning = false;
    render();
  }
}

function stopMonitoring() {
  monitorController?.abort();
}

async function runLiveSearch() {
  const key = document.querySelector("#searchCatalogItem").value;
  const item = catalogByKey.get(key);
  if (!item) return;
  if (!apiIsConfigured()) {
    const status = document.querySelector("#liveSearchStatus");
    status.className = "live-search-status is-error";
    status.textContent = "Der kostenlose Suchdienst ist in diesem Paket noch nicht veröffentlicht. Die direkten Suchquellen funktionieren bereits.";
    return;
  }

  liveSearchController?.abort();
  liveSearchController = new AbortController();
  const button = document.querySelector("#searchDealsButton");
  const status = document.querySelector("#liveSearchStatus");
  button.disabled = true;
  button.textContent = "Angebote werden geprüft …";
  status.className = "live-search-status is-loading";
  status.innerHTML = '<span class="loading-dot"></span>Neun Bezugsquellen werden live geprüft. Preise, Versand, Zustand und Verfügbarkeit werden abgeglichen.';
  document.querySelector("#liveDealResults").innerHTML = "";
  document.querySelector("#sourceCoverage").innerHTML = "";

  try {
    const params = new URLSearchParams({
      title: item.title,
      series: item.series,
      number: String(item.number)
    });
    const response = await fetch(`${DEAL_API_URL.replace(/\/$/, "")}/api/search?${params}`, {
      signal: liveSearchController.signal,
      headers: { accept: "application/json" }
    });
    if (!response.ok) throw new Error(`Suche fehlgeschlagen (${response.status})`);
    const result = await response.json();
    if (!result || !Array.isArray(result.offers) || !Array.isArray(result.manualSearches)) {
      throw new Error("Ungültige Antwort des Suchdienstes");
    }
    latestLiveSearch = { key, result };
    renderLiveSearch(result, item);
  } catch (error) {
    if (error.name === "AbortError") return;
    status.className = "live-search-status is-error";
    status.textContent = "Die automatische Suche ist gerade nicht erreichbar. Nutze die direkten Quellen; deine gespeicherten Daten bleiben unverändert.";
    console.warn("Automatische Deal-Suche fehlgeschlagen.", error);
  } finally {
    button.disabled = false;
    button.textContent = "🔎 Angebote automatisch prüfen";
    liveSearchController = null;
  }
}

function openManualSearch() {
  const key = document.querySelector("#searchCatalogItem").value;
  const item = catalogByKey.get(key);
  if (!item) return;
  const liveSources = latestLiveSearch?.key === key
    ? latestLiveSearch.result.manualSearches.map(source => ({
      name: source.name,
      hint: source.reason,
      url: source.url
    }))
    : marketSearches(item);
  document.querySelector("#searchDialogTitle").textContent = item.title;
  document.querySelector("#manualSearchSummary").textContent =
    `${liveSources.length} Bezugsquellen insgesamt: 9 automatisch, 12 als Direktsuche. Direkttreffer fließen nach dem Speichern in den Preisvergleich ein.`;
  document.querySelector("#marketSearchLinks").innerHTML = liveSources.map(source => `
    <a class="search-source" href="${escapeHtml(source.url)}" target="_blank" rel="noopener" title="${escapeHtml(source.hint)}">
      <strong>${escapeHtml(source.name)}</strong>
      <span>Öffnen ↗</span>
    </a>
  `).join("");
  searchDialog.dataset.key = key;
  searchDialog.showModal();
}

function saveLiveOffer(id) {
  const key = latestLiveSearch?.key;
  const item = catalogByKey.get(key);
  const offer = latestLiveSearch?.result?.offers?.find(entry => entry.id === id);
  if (!item || !offer) return;

  if (!offer.shippingKnown) {
    document.querySelector("#dealCatalogItem").value = key;
    document.querySelector("#dealPrice").value = offer.price;
    document.querySelector("#dealShipping").value = "";
    document.querySelector("#dealCondition").value = offer.condition || "Neu/OVP";
    const sourceSelect = document.querySelector("#dealSource");
    const exactSourceExists = [...sourceSelect.options].some(option => option.value === offer.source);
    sourceSelect.value = exactSourceExists ? offer.source : sourceFromUrl(offer.url);
    document.querySelector("#dealUrl").value = offer.url;
    document.querySelector("#dealColor").value = offer.color || "Automatisch";
    document.querySelector("#dealSellerType").value = "Händler";
    dealDialog.showModal();
    setTimeout(() => document.querySelector("#dealShipping").focus(), 0);
    return;
  }

  const values = {
    key,
    price: Number(offer.price),
    shipping: Number(offer.shipping),
    condition: offer.condition || "Neu/OVP",
    source: offer.source,
    url: safeUrl(offer.url),
    color: offer.color || "Automatisch",
    sellerType: "Händler",
    status: "active",
    capturedAt: offer.verifiedAt || new Date().toISOString(),
    checkedAt: new Date().toISOString()
  };
  const existing = state.deals.find(deal => deal.key === key && deal.url === values.url);
  if (existing) Object.assign(existing, values);
  else state.deals.push({ id: makeId(), ...values });
  saveState();
  render();
  showToast(existing ? "Deal aktualisiert" : "Deal gespeichert");
}

document.querySelector("#searchDealsButton").addEventListener("click", runLiveSearch);
document.querySelector("#openManualSearch").addEventListener("click", openManualSearch);
document.querySelector("#runMonitorButton").addEventListener("click", runMonitoring);
document.querySelector("#stopMonitorButton").addEventListener("click", stopMonitoring);
document.querySelector("#monitorFilter").addEventListener("change", renderMonitor);
document.querySelector("#searchCatalogItem").addEventListener("change", () => {
  clearLiveSearch();
  renderPriceHistory();
});
document.querySelector("#saveSearchResult").addEventListener("click", () => {
  const key = searchDialog.dataset.key;
  if (catalogByKey.has(key)) document.querySelector("#dealCatalogItem").value = key;
  searchDialog.close();
  dealDialog.showModal();
  setTimeout(() => document.querySelector("#dealUrl").focus(), 0);
});

document.querySelector("#dealUrl").addEventListener("change", event => {
  const detected = sourceFromUrl(event.target.value);
  const sourceSelect = document.querySelector("#dealSource");
  if ([...sourceSelect.options].some(option => option.value === detected)) {
    sourceSelect.value = detected;
  }
});

document.querySelector("#addForm").addEventListener("submit", event => {
  event.preventDefault();
  const key = document.querySelector("#addCatalogItem").value;
  if (!catalogByKey.has(key) || isOwned(key)) return;
  const priceValue = document.querySelector("#addPrice").value;
  state.owned.push({
    key,
    condition: document.querySelector("#addCondition").value,
    price: priceValue === "" ? null : Number(priceValue),
    notes: document.querySelector("#addNotes").value.trim().slice(0, 1200)
  });
  state.wishlist = state.wishlist.filter(entry => entry !== key);
  saveState();
  event.currentTarget.reset();
  addDialog.close();
  render();
  showToast("Zur Sammlung hinzugefügt");
});

document.querySelector("#dealForm").addEventListener("submit", event => {
  event.preventDefault();
  const url = safeUrl(document.querySelector("#dealUrl").value);
  if (!url) {
    alert("Bitte einen vollständigen Link mit https:// eingeben.");
    return;
  }
  state.deals.push({
    id: makeId(),
    key: document.querySelector("#dealCatalogItem").value,
    price: Number(document.querySelector("#dealPrice").value),
    shipping: Number(document.querySelector("#dealShipping").value),
    condition: document.querySelector("#dealCondition").value,
    source: document.querySelector("#dealSource").value,
    url,
    color: document.querySelector("#dealColor").value,
    sellerType: document.querySelector("#dealSellerType").value,
    status: "active",
    capturedAt: new Date().toISOString(),
    checkedAt: null
  });
  saveState();
  event.currentTarget.reset();
  document.querySelector("#dealShipping").value = "0";
  dealDialog.close();
  render();
  showToast("Deal gespeichert");
});

document.querySelector("#exportButton").addEventListener("click", () => {
  const exportData = structuredClone(state);
  exportData.background = {
    ...emptyBackgroundState(),
    priceLimits: structuredClone(state.background.priceLimits),
    alerts: structuredClone(state.background.alerts),
    sourceStatus: structuredClone(state.background.sourceStatus),
    recommendation: structuredClone(state.background.recommendation)
  };
  const backup = {
    app: "Project Evercade",
    version: "0.9",
    exportedAt: new Date().toISOString(),
    data: exportData
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `project-evercade-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("Sicherung exportiert");
});

document.querySelector("#importInput").addEventListener("change", async event => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const imported = parsed.data || parsed;
    if (!imported || !Array.isArray(imported.owned)) throw new Error("Ungültiges Format");
    const normalized = normalizeState(imported);
    if (!confirm(`Sicherung mit ${normalized.owned.length} Cartridges importieren und aktuelle Daten ersetzen?`)) return;
    state = normalized;
    saveState();
    dataDialog.close();
    render();
    showToast("Sicherung importiert");
  } catch {
    alert("Diese Datei ist keine gültige Project-Evercade-Sicherung.");
  } finally {
    event.target.value = "";
  }
});

document.querySelector("#resetButton").addEventListener("click", async () => {
  if (!confirm("Sammlung, Wunschliste und Deals wirklich auf den Ausgangsstand zurücksetzen?")) return;
  if (state.background?.enabled) {
    try {
      await backgroundRequest("/api/devices/delete", { method: "POST", body: {} });
    } catch {
      alert("Die serverseitigen Alarmdaten konnten gerade nicht gelöscht werden. Der Reset wurde abgebrochen; bitte später erneut versuchen.");
      return;
    }
  }
  state = {
    version: 7,
    owned: structuredClone(defaultOwned),
    wishlist: [],
    deals: [],
    monitor: emptyMonitorState(),
    background: emptyBackgroundState()
  };
  saveState();
  dataDialog.close();
  render();
  showToast("Ausgangsstand wiederhergestellt");
});

render();
showView(activeView);

if (dailyPriceSearchDue() && missingItems().length) {
  if (!state.background.enabled) setTimeout(() => runMonitoring(), 900);
}
if (state.background.enabled) {
  setTimeout(() => refreshBackgroundStatus({ silent: true }), 700);
}
