const STORAGE_KEY = "project-evercade-v01";

const initialCollection = [
  { id: crypto.randomUUID(), series: "console", number: 31, title: "Sunsoft Collection 1", condition: "Geöffnet", price: null },
  { id: crypto.randomUUID(), series: "console", number: 34, title: "Duke Nukem Collection 2", condition: "Geöffnet", price: null },
  { id: crypto.randomUUID(), series: "console", number: 37, title: "Indie Heroes Collection 3", condition: "Geöffnet", price: null },
  { id: crypto.randomUUID(), series: "console", number: 40, title: "Tomb Raider Collection 1", condition: "Geöffnet", price: null },
  { id: crypto.randomUUID(), series: "console", number: 48, title: "Rare Collection 1", condition: "Geöffnet", price: null },
  { id: crypto.randomUUID(), series: "arcade", number: 1, title: "Technos Arcade 1", condition: "Geöffnet", price: null },
  { id: crypto.randomUUID(), series: "computer", number: 8, title: "The Bitmap Brothers Collection 2", condition: "Geöffnet", price: null }
];

let collection = loadCollection();
let activeFilter = "all";

const listEl = document.querySelector("#collectionList");
const dialog = document.querySelector("#addDialog");
const form = document.querySelector("#addForm");

function loadCollection() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : initialCollection;
}

function saveCollection() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
}

function seriesLabel(series) {
  return {
    console: "🔴 Console",
    arcade: "🟣 Arcade",
    computer: "🔵 Home Computer"
  }[series];
}

function render() {
  const filtered = activeFilter === "all"
    ? [...collection]
    : collection.filter(item => item.series === activeFilter);

  filtered.sort((a, b) => {
    if (a.series !== b.series) return a.series.localeCompare(b.series);
    return a.number - b.number;
  });

  listEl.innerHTML = "";

  if (!filtered.length) {
    listEl.innerHTML = '<p class="empty">Keine Cartridges in diesem Bereich.</p>';
  }

  for (const item of filtered) {
    const card = document.createElement("article");
    card.className = "cartridge";
    const priceText = item.price ? ` · ${Number(item.price).toFixed(2).replace(".", ",")} €` : "";
    card.innerHTML = `
      <div class="series-strip ${item.series}"></div>
      <div class="cartridge-main">
        <p class="cartridge-title">${escapeHtml(item.title)}</p>
        <p class="cartridge-meta">${seriesLabel(item.series)} · ${escapeHtml(item.condition)}${priceText}</p>
      </div>
      <div class="cartridge-number">#${String(item.number).padStart(2, "0")}</div>
      <button class="delete-button" data-id="${item.id}">Aus Sammlung entfernen</button>
    `;
    listEl.appendChild(card);
  }

  document.querySelector("#totalOwned").textContent = collection.length;
  document.querySelector("#consoleOwned").textContent = collection.filter(x => x.series === "console").length;
  document.querySelector("#arcadeOwned").textContent = collection.filter(x => x.series === "arcade").length;
  document.querySelector("#computerOwned").textContent = collection.filter(x => x.series === "computer").length;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.querySelector("#openAddDialog").addEventListener("click", () => dialog.showModal());
document.querySelector("#closeDialog").addEventListener("click", () => dialog.close());

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const item = {
    id: crypto.randomUUID(),
    series: document.querySelector("#series").value,
    number: Number(document.querySelector("#number").value),
    title: document.querySelector("#title").value.trim(),
    condition: document.querySelector("#condition").value,
    price: document.querySelector("#price").value || null
  };

  if (!item.title || !item.number) return;

  const duplicate = collection.some(existing =>
    existing.series === item.series && existing.number === item.number
  );

  if (duplicate) {
    alert("Diese Nummer ist in der ausgewählten Serie bereits vorhanden.");
    return;
  }

  collection.push(item);
  saveCollection();
  render();
  form.reset();
  dialog.close();
});

listEl.addEventListener("click", (event) => {
  const button = event.target.closest(".delete-button");
  if (!button) return;

  const item = collection.find(x => x.id === button.dataset.id);
  if (!item) return;

  if (confirm(`${item.title} wirklich aus der Sammlung entfernen?`)) {
    collection = collection.filter(x => x.id !== item.id);
    saveCollection();
    render();
  }
});

document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach(x => x.classList.remove("active"));
    button.classList.add("active");
    activeFilter = button.dataset.filter;
    render();
  });
});

document.querySelector("#resetButton").addEventListener("click", () => {
  if (confirm("Alle lokalen Änderungen verwerfen und Ausgangssammlung wiederherstellen?")) {
    collection = structuredClone(initialCollection);
    saveCollection();
    render();
  }
});

render();
