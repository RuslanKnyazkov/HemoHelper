// index.js — главная страница (без дублирования core.js)
// ========== ДАННЫЕ ==========
let quickMode = "default";
let quickRetry = 2;
let quickFormat = "128";
let selectedTemplate = null;
let allTemplates = [];

// РАДИУС КОЛЕСА
const RADIUS = 200;

const MODES = [
  { id: "default", name: "Обычная", desc: "Стандарт", icon: "fa-tag" },
  { id: "testosterone", name: "Тестостерон", desc: "1:10", icon: "fa-flask" },
  { id: "a-tpo", name: "A-TPO", desc: "1:5", icon: "fa-vial" },
  { id: "prog", name: "Прогестерон", desc: "1:10", icon: "fa-flask" },
  { id: "Alinity", name: "Alinity", desc: "Архив", icon: "fa-archive" },
  { id: "HbA1c", name: "Гликогем", desc: "Архив", icon: "fa-microscope" },
];

let modesRotation = 0;
let templatesRotation = 0;

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
                 style="left: 50%; top: 50%; transform: translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%);">
                <div class="item-icon"><i class="fas ${item.icon}"></i></div>
                <div class="item-name">${escapeHtml(item.name)}</div>
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

// ========== РЕЖИМЫ ==========
function initModesWheel() {
  const onSelect = (mode) => {
    quickMode = mode.id;
    showNotification(`Режим: ${mode.name}`, "info");
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

// ========== АЛИКВОТЫ ==========
async function loadTemplates() {
  try {
    const response = await fetch("/aliquots/template/list/");
    const data = await response.json();

    if (data.success && data.templates && data.templates.length > 0) {
      allTemplates = data.templates.map((t) => ({
        id: t.id,
        name: t.name,
        desc: `${t.levels_count || 0} уровней`,
        icon: "fa-folder",
      }));

      initTemplatesWheel();

      if (allTemplates[0]) {
        selectedTemplate = allTemplates[0];
        await loadTemplateDetails(selectedTemplate.id);
        document.getElementById("print-template-btn").disabled = false;
      }
    } else {
      document.getElementById("template-info").innerHTML = `
                <div style="text-align:center;padding:30px;">
                    <i class="fas fa-folder-open" style="font-size: 40px;"></i>
                    <div style="margin-top: 12px;">Нет шаблонов</div>
                    <button class="print-secondary" style="margin-top: 20px;" onclick="location.href='/aliquots/'">Создать шаблон</button>
                </div>
            `;
    }
  } catch (error) {
    console.error("Ошибка:", error);
  }
}

function initTemplatesWheel() {
  const onSelect = (template) => {
    selectedTemplate = template;
    loadTemplateDetails(template.id);
    document.getElementById("print-template-btn").disabled = false;
    showNotification(`Шаблон: ${template.name}`, "success");
  };

  const selectedId = selectedTemplate
    ? selectedTemplate.id
    : allTemplates[0]?.id || null;
  renderWheel(
    "templates-wheel",
    allTemplates,
    selectedId,
    onSelect,
    templatesRotation,
  );

  const container = document.getElementById("templates-wheel");
  let isDragging = false;
  let startX, startRot;

  container.addEventListener("mousedown", (e) => {
    isDragging = true;
    startX = e.clientX;
    startRot = templatesRotation;
    container.style.cursor = "grabbing";
    e.preventDefault();
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const delta = (e.clientX - startX) * 0.6;
    templatesRotation = (startRot + delta) % 360;
    updateWheel("templates-wheel", allTemplates, templatesRotation);
  });

  window.addEventListener("mouseup", () => {
    isDragging = false;
    container.style.cursor = "grab";
  });

  container.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 20 : -20;
    templatesRotation = (templatesRotation + delta) % 360;
    updateWheel("templates-wheel", allTemplates, templatesRotation);
  });
}

async function loadTemplateDetails(templateId) {
  try {
    const response = await fetch(`/aliquots/template/get/${templateId}/`);
    const data = await response.json();

    if (data.success && data.template) {
      const levelsHtml = (data.template.levels || [])
        .map(
          (level) => `
                    <div class="level-line">
                        <span>${escapeHtml(level.level_name)}</span>
                        <span style="color:#10b981;">${level.volume} мкл × ${level.count}</span>
                    </div>
                `,
        )
        .join("");

      document.getElementById("template-info").innerHTML = `
                <div class="selected-template-name">
                    <i class="fas fa-check-circle" style="color:#10b981;"></i> ${escapeHtml(data.template.name)}
                </div>
                <div class="template-levels">
                    ${levelsHtml || '<div style="color:var(--text-secondary);">Нет уровней</div>'}
                </div>
            `;
    }
  } catch (error) {
    console.error("Ошибка:", error);
  }
}

// ========== ПЕЧАТЬ ==========
async function printBarcode() {
  const input = document.getElementById("barcode-input");
  const barcode = input?.value.trim();
  if (!barcode) {
    showNotification("Введите номер пробы!", "error");
    return;
  }

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
    const response = await fetch("/save-barcode/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCSRFToken(),
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (result.success) {
      showNotification(`✅ Проба "${barcode}" отправлена!`, "success");
      input.value = "";
    } else {
      showNotification(result.error || "Ошибка", "error");
    }
  } catch (error) {
    showNotification("Ошибка отправки", "error");
  }
}

async function printTemplate() {
  if (!selectedTemplate) {
    showNotification("Выберите шаблон", "warning");
    return;
  }

  try {
    const response = await fetch("/aliquots/print/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCSRFToken(),
      },
      body: JSON.stringify({ template_id: selectedTemplate.id }),
    });
    const result = await response.json();
    if (result.success) {
      showNotification("Шаблон отправлен на печать", "success");
    } else {
      showNotification("Ошибка печати", "error");
    }
  } catch (error) {
    showNotification("Ошибка печати", "error");
  }
}

// ========== ВСПОМОГАТЕЛЬНЫЕ (используем глобальные из core.js) ==========
function escapeHtml(str) {
  if (typeof window.Utils !== "undefined" && Utils.escapeHtml) {
    return Utils.escapeHtml(str);
  }
  if (!str) return "";
  return str.replace(
    /[&<>]/g,
    (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[m],
  );
}

function showNotification(message, type = "info") {
  if (typeof window.showNotification === "function") {
    window.showNotification(message, type);
  } else {
    console.log(`[${type}] ${message}`);
  }
}

function getCSRFToken() {
  if (typeof window.Utils !== "undefined" && Utils.getCSRFToken) {
    return Utils.getCSRFToken();
  }
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, 10) === "csrftoken=") {
        cookieValue = decodeURIComponent(cookie.substring(10));
        break;
      }
    }
  }
  return cookieValue;
}

function quickAliquot() {
  const name = prompt("Введите название образца:", "Образец");
  if (name) location.href = `/aliquots/?quick=${encodeURIComponent(name)}`;
}

function initControls() {
  document.querySelectorAll(".retry-btn").forEach((btn) => {
    btn.onclick = () => {
      document
        .querySelectorAll(".retry-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      quickRetry = parseInt(btn.dataset.retry);
    };
  });
  document.querySelectorAll(".format-btn").forEach((btn) => {
    btn.onclick = () => {
      document
        .querySelectorAll(".format-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      quickFormat = btn.dataset.format;
    };
  });
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
}

// ========== ЗАПУСК ==========
document.addEventListener("DOMContentLoaded", () => {
  initModesWheel();
  initControls();
  loadTemplates();
  updateQuickStats();

  document
    .getElementById("print-barcode-btn")
    ?.addEventListener("click", printBarcode);
  document
    .getElementById("print-template-btn")
    ?.addEventListener("click", printTemplate);
  document.getElementById("clear-input-btn")?.addEventListener("click", () => {
    document.getElementById("barcode-input").value = "";
    showNotification("Поле очищено", "info");
  });
  document
    .getElementById("quick-aliquot-btn")
    ?.addEventListener("click", quickAliquot);

  // Обновляем статистику при изменении режима/количества
  const observer = new MutationObserver(updateQuickStats);
  observer.observe(document.body, {
    attributes: true,
    subtree: true,
    attributeFilter: ["class"],
  });

  setInterval(updateQuickStats, 1000);
});
