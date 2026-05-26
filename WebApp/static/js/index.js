// index.js — главная страница (использует core.js)

// ========== ДАННЫЕ ==========
let quickMode = "default";
let quickRetry = 1;
let quickFormat = "128";

// РАДИУС КОЛЕСА
const RADIUS = 310;

const MODES = [
  { id: "default", name: "Обычная", desc: "Стандарт", icon: "fa-tag" },
  { id: "testosterone", name: "Тестостерон", desc: "1:10", icon: "fa-flask" },
  { id: "a-tpo", name: "A-TPO", desc: "1:5", icon: "fa-vial" },
  { id: "prog", name: "Прогестерон", desc: "1:10", icon: "fa-flask" },
  { id: "dhea", name: "DHEA", desc: "1:10", icon: "fa-flask" },
  { id: "marco-prl", name: "Макропролактин", desc: "1:1", icon: "fa-flask" },
  {
    id: "a-tshr",
    name: "Антитела к рецепторам ТТГ",
    desc: "1:10",
    icon: "fa-bug",
  },
];

let modesRotation = 0;
let animationTimeout = null;

// ========== РАСЧЕТ ПОЗИЦИЙ ==========
function getPositions(count, rotationDeg) {
  const positions = [];
  const step = 360 / count;
  const startAngle = -90;

  for (let i = 0; i < count; i++) {
    const angle = ((startAngle + i * step + rotationDeg) * Math.PI) / 180;
    const x = RADIUS * Math.cos(angle);
    const y = RADIUS * Math.sin(angle);
    positions.push({ x: Math.round(x), y: Math.round(y) });
  }
  return positions;
}

// ========== ОТРИСОВКА КОЛЕСА ==========
function renderWheel(containerId, items, selectedId, onSelect, rotation) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const positions = getPositions(items.length, rotation);

  let html = "";
  items.forEach((item, idx) => {
    const pos = positions[idx];
    const isActive = item.id === selectedId;
    html += `
      <div class="wheel-item ${isActive ? "active" : ""}" 
           data-id="${item.id}"
           data-name="${item.name}"
           style="left: 80%; top: 50%; transform: translate(${pos.x}px, ${pos.y}px) translate(-70%, -50%);">
        <div class="item-icon"><i class="fas ${item.icon}"></i></div>
        <div class="item-name">${Utils.escapeHtml(item.name)}</div>
        <div class="item-desc">${item.desc || ""}</div>
      </div>
    `;
  });

  container.innerHTML = html;

  const itemsList = container.querySelectorAll(".wheel-item");
  itemsList.forEach((el) => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = el.dataset.id;
      const selected = items.find((i) => i.id == id);
      if (selected) {
        onSelect(selected);
        itemsList.forEach((i) => i.classList.remove("active"));
        el.classList.add("active");
      }
    });
  });
}

function updateWheel(containerId, items, rotation) {
  const positions = getPositions(items.length, rotation);
  const container = document.getElementById(containerId);
  const itemsList = container.querySelectorAll(".wheel-item");

  itemsList.forEach((el, idx) => {
    const pos = positions[idx];
    el.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)`;
  });
}

// ========== ГЕНЕРАЦИЯ АНИМАЦИИ ШТРИХ-КОДА ==========
function generateBarcodeAnimation(barcodeNumber) {
  const container = document.getElementById("barcode-animation");
  const linesContainer = document.getElementById("barcode-lines");
  const numberContainer = document.getElementById("barcode-number");

  if (!container || !linesContainer) return;

  // Очищаем предыдущие таймауты
  if (animationTimeout) clearTimeout(animationTimeout);

  // Скрываем и показываем заново
  container.classList.remove("active");

  setTimeout(() => {
    // Генерируем случайные линии для имитации штрих-кода
    let linesHtml = "";
    const patterns = [1, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2];

    for (let i = 0; i < 35; i++) {
      const pattern = patterns[i % patterns.length];
      let widthClass = "";
      if (pattern === 3) widthClass = "thick";
      if (pattern === 4) widthClass = "very-thick";
      linesHtml += `<span class="barcode-line ${widthClass}"></span>`;
    }

    linesContainer.innerHTML = linesHtml;
    numberContainer.textContent = barcodeNumber;
    container.classList.add("active");
  }, 50);
}

// ========== РЕЖИМЫ ==========
function initModesWheel() {
  const onSelect = (mode) => {
    quickMode = mode.id;
    if (typeof window.showNotification === "function") {
      window.showNotification(`Режим: ${mode.name}`, "info");
    }
  };

  renderWheel("modes-wheel", MODES, quickMode, onSelect, modesRotation);

  const container = document.getElementById("modes-wheel");
  let isDragging = false;
  let startX, startRot;

  container.addEventListener("mousedown", (e) => {
    isDragging = true;
    startX = e.clientX;
    startRot = modesRotation;
    container.style.cursor = "grabbing";
    e.preventDefault();
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const delta = (e.clientX - startX) * 0.6;
    modesRotation = (startRot + delta) % 360;
    updateWheel("modes-wheel", MODES, modesRotation);
  });

  window.addEventListener("mouseup", () => {
    isDragging = false;
    container.style.cursor = "grab";
  });

  container.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 20 : -20;
    modesRotation = (modesRotation + delta) % 360;
    updateWheel("modes-wheel", MODES, modesRotation);
  });
}

// ========== ПЕЧАТЬ (используем глобальный API из core.js) ==========
async function printBarcode() {
  const input = document.getElementById("barcode-input");
  const barcode = input?.value.trim();
  if (!barcode) {
    if (typeof window.showNotification === "function") {
      window.showNotification("Введите номер пробы!", "error");
    }
    return;
  }

  // Запускаем анимацию штрих-кода
  generateBarcodeAnimation(barcode);

  const data = {
    type: "barcode",
    anchor: "h",
    size: "s",
    retry: quickRetry,
    code: quickFormat === "128" ? "BCN" : "B2N",
    date: true,
    number: barcode,
    barcode: barcode,
    mode: quickMode,
    printer: localStorage.getItem("selectedPrinter") || null,
  };

  try {
    const result = await API.sendToDjango(data);
    if (result.success) {
      if (typeof window.showNotification === "function") {
        window.showNotification(`✅ Проба "${barcode}" отправлена!`, "success");
      }
      input.value = "";
      input.focus();
    }
  } catch (error) {
    if (typeof window.showNotification === "function") {
      window.showNotification("Ошибка отправки", "error");
    }
  }
}

// ========== УПРАВЛЕНИЕ ==========
function initControls() {
  document.querySelectorAll(".retry-btn").forEach((btn) => {
    btn.onclick = () => {
      document
        .querySelectorAll(".retry-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      quickRetry = parseInt(btn.dataset.retry);
      updateQuickStats();
    };
  });

  document.querySelectorAll(".format-btn").forEach((btn) => {
    btn.onclick = () => {
      document
        .querySelectorAll(".format-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      quickFormat = btn.dataset.format;
      updateQuickStats();
    };
  });

  const input = document.getElementById("barcode-input");
  if (input) {
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        printBarcode();
      }
    });
  }
}

// ========== ОБНОВЛЕНИЕ СТАТИСТИКИ ==========
function updateQuickStats() {
  const printer = localStorage.getItem("selectedPrinter") || "Не выбран";
  const printerShort =
    printer.length > 25 ? printer.substring(0, 22) + "..." : printer;
  const printerEl = document.getElementById("quick-stats-printer");
  if (printerEl) printerEl.textContent = printerShort;

  const modeEl = document.getElementById("quick-stats-mode");
  if (modeEl) {
    const currentMode = MODES.find((m) => m.id === quickMode);
    modeEl.textContent = currentMode ? currentMode.name : "Обычная";
  }

  const retryEl = document.getElementById("quick-stats-retry");
  if (retryEl) retryEl.textContent = quickRetry;

  const formatEl = document.getElementById("quick-stats-format");
  if (formatEl)
    formatEl.textContent = quickFormat === "128" ? "CODE128" : "2of5";
}

// ========== ПАДАЮЩИЕ ПРОБИРКИ ==========
function createFallingVials() {
  const container = document.getElementById("hero-vials");
  if (!container) return;

  const vialTypes = ["", "blood", "blue", "green"];
  const sizes = ["", "small", "large"];

  for (let i = 0; i < 35; i++) {
    const vial = document.createElement("div");
    const type = vialTypes[Math.floor(Math.random() * vialTypes.length)];
    const size = sizes[Math.floor(Math.random() * sizes.length)];

    vial.className = `vial ${type} ${size}`;
    vial.style.left = `${Math.random() * 100}%`;
    vial.style.animationDuration = `${4 + Math.random() * 8}s`;
    vial.style.animationDelay = `${Math.random() * 15}s`;
    vial.style.transform = `rotate(${-10 + Math.random() * 20}deg)`;

    container.appendChild(vial);
  }
}

// ========== ЗАПУСК ==========
document.addEventListener("DOMContentLoaded", () => {
  initModesWheel();
  initControls();
  updateQuickStats();
  createFallingVials();

  document
    .getElementById("print-barcode-btn")
    ?.addEventListener("click", printBarcode);
  document.getElementById("clear-input-btn")?.addEventListener("click", () => {
    document.getElementById("barcode-input").value = "";
    if (typeof window.showNotification === "function") {
      window.showNotification("Поле очищено", "info");
    }
    document.getElementById("barcode-input").focus();
  });

  setInterval(updateQuickStats, 3000);
});
