const STORAGE_KEY = "project-evercade-v04";
const V03_STORAGE_KEY = "project-evercade-v03";
const V02_STORAGE_KEY = "project-evercade-v02";
const LEGACY_STORAGE_KEY = "project-evercade-v01";
const DEAL_API_URL = "https://project-evercade-deal-api.jnldc.chatgpt.site";

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
  announced: (series === "console" && number === 53) || (series === "arcade" && number === 24)
}));

const catalogByKey = new Map(catalog.map(item => [item.key, item]));
const seriesOrder = { console: 0, arcade: 1, computer: 2 };

const defaultOwned = [
  "console-31", "console-34", "console-37", "console-40",
  "console-48", "arcade-1", "computer-8"
].map(key => ({ key, condition: "Geöffnet", price: null }));

let state = loadState();
let activeView = "collection";
let filters = { collection: "all", catalog: "all" };
let latestLiveSearch = null;
let liveSearchController = null;

const views = {
  collection: document.querySelector("#collectionView"),
  catalog: document.querySelector("#catalogView"),
  wishlist: document.querySelector("#wishlistView"),
  deals: document.querySelector("#dealsView")
};

function makeId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.owned)) return normalizeState(saved);
  } catch (error) {
    console.warn("Version-0.4-Daten konnten nicht gelesen werden.", error);
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
        version: 4,
        owned: legacy.map(item => ({
          key: `${item.series}-${Number(item.number)}`,
          condition: item.condition || "Geöffnet",
          price: item.price === "" || item.price == null ? null : Number(item.price)
        })).filter(item => catalogByKey.has(item.key)),
        wishlist: [],
        deals: []
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch (error) {
    console.warn("Version-0.1-Daten konnten nicht migriert werden.", error);
  }

  return { version: 4, owned: structuredClone(defaultOwned), wishlist: [], deals: [] };
}

function normalizeState(data) {
  return {
    version: 4,
    owned: data.owned
      .filter(item => item && catalogByKey.has(item.key))
      .map(item => ({
        key: item.key,
        condition: item.condition || "Geöffnet",
        price: item.price === "" || item.price == null ? null : Number(item.price)
      })),
    wishlist: [...new Set((data.wishlist || []).filter(key => catalogByKey.has(key)))],
    deals: (data.deals || [])
      .filter(deal => deal && catalogByKey.has(deal.key))
      .map(deal => ({
        id: deal.id || makeId(),
        key: deal.key,
        price: Number(deal.price) || 0,
        shipping: Number(deal.shipping) || 0,
        condition: deal.condition || "Gebraucht",
        source: deal.source || "Sonstige",
        url: safeUrl(deal.url),
        color: deal.color || "Automatisch",
        sellerType: deal.sellerType || "Unbekannt",
        status: ["active", "checked", "expired"].includes(deal.status) ? deal.status : "active",
        capturedAt: deal.capturedAt || new Date().toISOString(),
        checkedAt: deal.checkedAt || null
      }))
      .filter(deal => deal.url)
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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

function money(value) {
  return `${Number(value).toFixed(2).replace(".", ",")} €`;
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

function colorFor(item, selected = "Automatisch") {
  if (selected !== "Automatisch") return selected;
  return { console: "Rot", arcade: "Violett", computer: "Blau" }[item.series];
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

function itemHeader(item) {
  return `
    <div class="series-strip ${item.series}"></div>
    <div class="cartridge-main">
      <p class="cartridge-title">${escapeHtml(item.title)}</p>
      <p class="cartridge-meta">${seriesLabel(item.series)}${item.legacy ? ' · <span class="legacy">Legacy</span>' : ""}${item.announced ? " · angekündigt" : ""}</p>
    </div>
    <div class="cartridge-number">#${String(item.number).padStart(2, "0")}</div>
  `;
}

function render() {
  renderStats();
  renderBestDeal();
  renderCollection();
  renderCatalog();
  renderWishlist();
  renderDeals();
  renderPriceHistory();
  fillSelects();
}

function renderStats() {
  document.querySelector("#totalOwned").textContent = state.owned.length;
  document.querySelector("#totalWishlist").textContent = state.wishlist.length;
  document.querySelector("#totalDeals").textContent = state.deals.length;
  document.querySelector("#totalCatalog").textContent = catalog.length;
}

function renderBestDeal() {
  const title = document.querySelector("#bestDealTitle");
  const content = document.querySelector("#bestDealContent");
  const validDeals = state.deals.filter(deal => deal.status === "active" && safeUrl(deal.url));

  if (!validDeals.length) {
    title.textContent = "Noch kein Angebot erfasst";
    content.innerHTML = '<p class="muted">Starte unter „Deals“ eine Suche. Das günstigste aktive Angebot erscheint automatisch hier.</p>';
    return;
  }

  const best = [...validDeals].sort((a, b) =>
    (a.price + a.shipping) - (b.price + b.shipping)
  )[0];
  const item = catalogByKey.get(best.key);
  title.textContent = item.title;
  content.innerHTML = `
    <div class="best-deal-row">
      <div>
        <strong class="deal-price">${money(best.price + best.shipping)}</strong>
        <p class="muted compact">${escapeHtml(best.source)} · ${escapeHtml(best.condition)} · Preis ${money(best.price)} + Versand ${money(best.shipping)}</p>
      </div>
      <a class="primary-button link-button" href="${escapeHtml(best.url)}" target="_blank" rel="noopener">Zum Angebot</a>
    </div>
  `;
}

function renderCollection() {
  const list = document.querySelector("#collectionList");
  let owned = state.owned
    .map(entry => ({ ...catalogByKey.get(entry.key), ...entry }))
    .filter(item => filters.collection === "all" || item.series === filters.collection);
  owned = sortCatalog(owned);

  if (!owned.length) {
    list.innerHTML = '<p class="empty">Keine Cartridges in diesem Bereich.</p>';
    return;
  }

  list.innerHTML = owned.map(item => `
    <article class="cartridge">
      ${itemHeader(item)}
      <div class="card-detail">
        ${escapeHtml(item.condition)}${item.price != null ? ` · gekauft für ${money(item.price)}` : ""}
      </div>
      <div class="card-actions">
        <button class="secondary-button" data-action="toggle-wish" data-key="${item.key}">${isWished(item.key) ? "★ Gewünscht" : "☆ Wunschliste"}</button>
        <button class="text-danger" data-action="remove-owned" data-key="${item.key}">Entfernen</button>
      </div>
    </article>
  `).join("");
}

function renderCatalog() {
  const list = document.querySelector("#catalogList");
  const query = document.querySelector("#catalogSearch").value.trim().toLocaleLowerCase("de");
  let items = catalog.filter(item => filters.catalog === "all" || item.series === filters.catalog);

  if (query) {
    items = items.filter(item =>
      item.title.toLocaleLowerCase("de").includes(query) ||
      String(item.number).includes(query) ||
      `${seriesLabel(item.series)} ${item.number}`.toLocaleLowerCase("de").includes(query)
    );
  }

  items = sortCatalog(items);
  document.querySelector("#catalogResultCount").textContent = `${items.length} von ${catalog.length}`;

  list.innerHTML = items.length ? items.map(item => `
    <article class="cartridge">
      ${itemHeader(item)}
      <div class="card-actions">
        <button class="secondary-button ${isOwned(item.key) ? "is-active" : ""}" data-action="toggle-owned" data-key="${item.key}">
          ${isOwned(item.key) ? "✓ In Sammlung" : "+ Sammlung"}
        </button>
        <button class="secondary-button ${isWished(item.key) ? "is-active wish-active" : ""}" data-action="toggle-wish" data-key="${item.key}">
          ${isWished(item.key) ? "★ Gewünscht" : "☆ Wunschliste"}
        </button>
      </div>
    </article>
  `).join("") : '<p class="empty">Keine passende Cartridge gefunden.</p>';
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
  searchSelect.innerHTML = prioritized.map(item =>
    `<option value="${item.key}">${isWished(item.key) ? "★ " : ""}${seriesLabel(item.series)} #${String(item.number).padStart(2, "0")} – ${escapeHtml(item.title)}</option>`
  ).join("");
  if (catalogByKey.has(currentSearch)) searchSelect.value = currentSearch;
}

function toggleOwned(key) {
  if (!catalogByKey.has(key)) return;
  if (isOwned(key)) {
    const item = catalogByKey.get(key);
    if (!confirm(`${item.title} wirklich aus der Sammlung entfernen?`)) return;
    state.owned = state.owned.filter(entry => entry.key !== key);
  } else {
    state.owned.push({ key, condition: "Geöffnet", price: null });
    state.wishlist = state.wishlist.filter(entry => entry !== key);
    showToast("Zur Sammlung hinzugefügt");
  }
  saveState();
  render();
}

function toggleWish(key) {
  if (!catalogByKey.has(key)) return;
  state.wishlist = isWished(key)
    ? state.wishlist.filter(entry => entry !== key)
    : [...state.wishlist, key];
  saveState();
  render();
}

function showView(name) {
  activeView = name;
  Object.entries(views).forEach(([key, element]) => {
    element.hidden = key !== name;
  });
  document.querySelectorAll(".tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.view === name);
  });
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
  if (tab) showView(tab.dataset.view);
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

document.body.addEventListener("click", event => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const { action, key, id } = button.dataset;
  if (action === "toggle-owned") toggleOwned(key);
  if (action === "remove-owned") toggleOwned(key);
  if (action === "toggle-wish") toggleWish(key);
  if (action === "save-live-deal") saveLiveOffer(id);
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

const addDialog = document.querySelector("#addDialog");
const dealDialog = document.querySelector("#dealDialog");
const dataDialog = document.querySelector("#dataDialog");
const searchDialog = document.querySelector("#searchDialog");

document.querySelector("#openAddDialog").addEventListener("click", () => addDialog.showModal());
document.querySelector("#openDealDialog").addEventListener("click", () => dealDialog.showModal());
document.querySelector("#openDataDialog").addEventListener("click", () => dataDialog.showModal());
document.querySelectorAll(".close-dialog").forEach(button => {
  button.addEventListener("click", () => button.closest("dialog").close());
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
    document.querySelector("#dealSource").value = offer.source;
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
    price: priceValue === "" ? null : Number(priceValue)
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
  const backup = {
    app: "Project Evercade",
    version: "0.4",
    exportedAt: new Date().toISOString(),
    data: state
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

document.querySelector("#resetButton").addEventListener("click", () => {
  if (!confirm("Sammlung, Wunschliste und Deals wirklich auf den Ausgangsstand zurücksetzen?")) return;
  state = { version: 4, owned: structuredClone(defaultOwned), wishlist: [], deals: [] };
  saveState();
  dataDialog.close();
  render();
  showToast("Ausgangsstand wiederhergestellt");
});

render();
showView(activeView);
