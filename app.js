const STORAGE_KEY = "project-evercade-v02";
const LEGACY_STORAGE_KEY = "project-evercade-v01";

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
    console.warn("Version-0.2-Daten konnten nicht gelesen werden.", error);
  }

  try {
    const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY));
    if (Array.isArray(legacy)) {
      const migrated = {
        version: 2,
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

  return { version: 2, owned: structuredClone(defaultOwned), wishlist: [], deals: [] };
}

function normalizeState(data) {
  return {
    version: 2,
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
        capturedAt: deal.capturedAt || new Date().toISOString()
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
  const validDeals = state.deals.filter(deal => safeUrl(deal.url));

  if (!validDeals.length) {
    title.textContent = "Noch kein Angebot erfasst";
    content.innerHTML = '<p class="muted">Speichere gefundene Angebote unter „Deals“. Das günstigste verfügbare Angebot erscheint automatisch hier.</p>';
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
    const search = encodeURIComponent(`Evercade ${item.title}`);
    return `
      <article class="cartridge">
        ${itemHeader(item)}
        <div class="market-links">
          <a href="https://www.ebay.de/sch/i.html?_nkw=${search}" target="_blank" rel="noopener">eBay</a>
          <a href="https://www.kleinanzeigen.de/s-${search.replaceAll("%20", "-")}/k0" target="_blank" rel="noopener">Kleinanzeigen</a>
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
    return `
      <article class="cartridge deal-card">
        ${itemHeader(item)}
        <div class="deal-detail">
          <strong>${money(deal.price + deal.shipping)}</strong>
          <span>${escapeHtml(deal.source)} · ${escapeHtml(deal.condition)}</span>
          <small>${money(deal.price)} + ${money(deal.shipping)} Versand</small>
        </div>
        <div class="card-actions">
          <a class="secondary-button link-button" href="${escapeHtml(deal.url)}" target="_blank" rel="noopener">Angebot öffnen</a>
          <button class="text-danger" data-action="remove-deal" data-id="${deal.id}">Löschen</button>
        </div>
      </article>
    `;
  }).join("");
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
  if (action === "remove-deal") {
    state.deals = state.deals.filter(deal => deal.id !== id);
    saveState();
    render();
  }
});

const addDialog = document.querySelector("#addDialog");
const dealDialog = document.querySelector("#dealDialog");
const dataDialog = document.querySelector("#dataDialog");

document.querySelector("#openAddDialog").addEventListener("click", () => addDialog.showModal());
document.querySelector("#openDealDialog").addEventListener("click", () => dealDialog.showModal());
document.querySelector("#openDataDialog").addEventListener("click", () => dataDialog.showModal());
document.querySelectorAll(".close-dialog").forEach(button => {
  button.addEventListener("click", () => button.closest("dialog").close());
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
    capturedAt: new Date().toISOString()
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
    version: "0.2",
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
  state = { version: 2, owned: structuredClone(defaultOwned), wishlist: [], deals: [] };
  saveState();
  dataDialog.close();
  render();
  showToast("Ausgangsstand wiederhergestellt");
});

render();
showView(activeView);
