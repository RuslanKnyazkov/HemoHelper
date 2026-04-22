// ============================================================================
// 1. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================

// Получение CSRF токена из cookies
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// Экранирование HTML
function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Показ уведомлений
function showNotification(message, type = "success") {
  const old = document.querySelector(".custom-notification");
  if (old) old.remove();

  const notif = document.createElement("div");
  notif.className = `custom-notification notification-${type}`;
  notif.innerHTML = `<i class="fas fa-${type === "success" ? "check-circle" : type === "error" ? "exclamation-circle" : "info-circle"}"></i><span>${message}</span><button class="notification-close"><i class="fas fa-times"></i></button>`;
  document.body.appendChild(notif);
  setTimeout(() => notif.classList.add("show"), 10);

  const closeBtn = notif.querySelector(".notification-close");
  closeBtn.addEventListener("click", () => {
    notif.classList.remove("show");
    setTimeout(() => notif.remove(), 300);
  });

  setTimeout(() => {
    if (notif.parentNode) {
      notif.classList.remove("show");
      setTimeout(() => notif.remove(), 300);
    }
  }, 4000);
}

// ============================================================================
// 2. АНАЛИЗАТОР ПРОБ (ПАЦИЕНТЫ + МАРКЕРЫ)
// ============================================================================

// Генерация списка пациентов (25 уникальных пациентов)
function generatePatients() {
  const surnames = [
    "Иванов",
    "Петров",
    "Сидоров",
    "Кузнецов",
    "Смирнов",
    "Васильев",
    "Попов",
    "Михайлов",
    "Фёдоров",
    "Морозов",
    "Волков",
    "Алексеев",
    "Лебедев",
    "Семёнов",
    "Егоров",
    "Павлов",
    "Козлов",
    "Степанов",
    "Николаев",
    "Дмитриев",
    "Андреев",
    "Макаров",
    "Соловьёв",
    "Зайцев",
    "Борисов",
  ];
  const names = [
    "Александр",
    "Дмитрий",
    "Максим",
    "Сергей",
    "Андрей",
    "Алексей",
    "Иван",
    "Евгений",
    "Владимир",
    "Павел",
  ];
  const patronymics = [
    "Викторович",
    "Алексеевич",
    "Сергеевич",
    "Владимирович",
    "Иванович",
  ];

  return surnames.slice(0, 25).map((surname, idx) => ({
    id: idx + 1,
    fullName: `${surname} ${names[idx % names.length]} ${patronymics[idx % 5]}`,
    initials: `${surname.charAt(0)}${names[idx % names.length].charAt(0)}`,
    barcode: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
  }));
}

const PATIENTS = generatePatients();
let currentSamples = [];
let activeFilter = "all";

// Локальные тесты для демо
const localTests = [
  {
    id: 1,
    name: "Тиреотропный гормон (ТТГ)",
    initials: "TSH",
    category: "immunochemistry",
    group: "Гормоны",
  },
  {
    id: 2,
    name: "Свободный тироксин (FT4)",
    initials: "FT4",
    category: "immunochemistry",
    group: "Гормоны",
  },
  {
    id: 3,
    name: "Кортизол",
    initials: "CORT",
    category: "immunochemistry",
    group: "Гормоны",
  },
  {
    id: 4,
    name: "Тестостерон",
    initials: "TEST",
    category: "immunochemistry",
    group: "Гормоны",
  },
  {
    id: 5,
    name: "CA-125",
    initials: "CA125",
    category: "immunochemistry",
    group: "Онкомаркеры",
  },
  {
    id: 6,
    name: "CA-19-9",
    initials: "CA199",
    category: "immunochemistry",
    group: "Онкомаркеры",
  },
  {
    id: 7,
    name: "Ревматоидный фактор",
    initials: "RF",
    category: "immunochemistry",
    group: "Аутоиммунные",
  },
  {
    id: 8,
    name: "Anti-TPO",
    initials: "TPOab",
    category: "immunochemistry",
    group: "Аутоиммунные",
  },
  {
    id: 9,
    name: "Анти-CCP",
    initials: "CCP",
    category: "immunochemistry",
    group: "Аутоиммунные",
  },
  {
    id: 10,
    name: "Ферритин",
    initials: "FERR",
    category: "immunochemistry",
    group: "Метаболизм",
  },
  {
    id: 11,
    name: "Витамин B12",
    initials: "B12",
    category: "immunochemistry",
    group: "Витамины",
  },
  {
    id: 12,
    name: "ПСА общий",
    initials: "PSA",
    category: "immunochemistry",
    group: "Онкомаркеры",
  },
  {
    id: 13,
    name: "Глюкоза",
    initials: "GLU",
    category: "biochemistry",
    group: "Углеводы",
  },
  {
    id: 14,
    name: "Общий белок",
    initials: "TP",
    category: "biochemistry",
    group: "Белки",
  },
  {
    id: 15,
    name: "АЛТ",
    initials: "ALT",
    category: "biochemistry",
    group: "Ферменты",
  },
  {
    id: 16,
    name: "АСТ",
    initials: "AST",
    category: "biochemistry",
    group: "Ферменты",
  },
  {
    id: 17,
    name: "Билирубин общий",
    initials: "TBIL",
    category: "biochemistry",
    group: "Пигменты",
  },
  {
    id: 18,
    name: "Креатинин",
    initials: "CREAT",
    category: "biochemistry",
    group: "Азотистый",
  },
  {
    id: 19,
    name: "Мочевина",
    initials: "UREA",
    category: "biochemistry",
    group: "Азотистый",
  },
  {
    id: 20,
    name: "Холестерин",
    initials: "CHOL",
    category: "biochemistry",
    group: "Липиды",
  },
  {
    id: 21,
    name: "ЛДГ",
    initials: "LDH",
    category: "biochemistry",
    group: "Ферменты",
  },
  {
    id: 22,
    name: "Железо",
    initials: "Fe",
    category: "biochemistry",
    group: "Микроэлементы",
  },
  {
    id: 23,
    name: "Калий",
    initials: "K",
    category: "biochemistry",
    group: "Электролиты",
  },
  {
    id: 24,
    name: "Натрий",
    initials: "Na",
    category: "biochemistry",
    group: "Электролиты",
  },
  {
    id: 25,
    name: "Кальций",
    initials: "Ca",
    category: "biochemistry",
    group: "Минералы",
  },
  {
    id: 26,
    name: "Магний",
    initials: "Mg",
    category: "biochemistry",
    group: "Минералы",
  },
  {
    id: 27,
    name: "Амилаза",
    initials: "AMY",
    category: "biochemistry",
    group: "Ферменты",
  },
  {
    id: 28,
    name: "Щелочная фосфатаза",
    initials: "ALP",
    category: "biochemistry",
    group: "Ферменты",
  },
  {
    id: 29,
    name: "ГГТ",
    initials: "GGT",
    category: "biochemistry",
    group: "Ферменты",
  },
  {
    id: 30,
    name: "Мочевая кислота",
    initials: "UA",
    category: "biochemistry",
    group: "Пурины",
  },
];

// Генерация 30 проб
function generateThirtySamples() {
  let samples = [];
  for (let i = 0; i < 30; i++) {
    const patient = PATIENTS[i % PATIENTS.length];
    const analysis = localTests[i % localTests.length];
    samples.push({
      ...analysis,
      patientId: patient.id,
      patientFullName: patient.fullName,
      patientInitials: patient.initials,
      barcode: patient.barcode,
      uniqueKey: `${patient.id}_${analysis.id}_${Date.now()}_${Math.random()}_${i}`,
      markType: "clean",
      remarkText: "",
    });
  }
  for (let i = samples.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [samples[i], samples[j]] = [samples[j], samples[i]];
  }
  samples.forEach((s, idx) => {
    s.displayIndex = idx + 1;
  });
  return samples;
}

function getStatusInfo(markType) {
  switch (markType) {
    case "remark":
      return {
        class: "status-remark",
        text: "✏️ Отписана",
        icon: "fa-pencil-alt",
      };
    case "loss":
      return {
        class: "status-loss",
        text: "❌ Потеря",
        icon: "fa-times-circle",
      };
    case "repeat":
      return { class: "status-repeat", text: "🔄 Повтор", icon: "fa-sync-alt" };
    default:
      return {
        class: "status-clean",
        text: "✓ Без отметки",
        icon: "fa-check-circle",
      };
  }
}

function getRowBackground(markType) {
  if (markType === "remark") return "#ffe0e0";
  if (markType === "loss") return "#f3e8ff";
  if (markType === "repeat") return "#ffe4f0";
  return "#ffffff";
}

function renderAnalysisTable() {
  const container = document.getElementById("analysisTableContainer");
  const totalSpan = document.getElementById("totalCountSpan");
  if (!container) return;

  let filtered = [...currentSamples];
  if (activeFilter !== "all")
    filtered = filtered.filter((s) => s.category === activeFilter);
  if (totalSpan) totalSpan.textContent = currentSamples.length;

  if (!filtered.length) {
    container.innerHTML = `<div class="empty-message" style="padding: 40px; text-align:center;">Нет проб в выбранной категории</div>`;
    return;
  }

  const html = `<table class="analysis-table"><thead><tr><th>#</th><th>Штрих-код (10 цифр)</th><th>Пациент</th><th>Инициалы</th><th>Анализ</th><th>Группа</th><th>Статус</th><th>Маркеры</th></tr></thead><tbody>${filtered
    .map((sample) => {
      const status = getStatusInfo(sample.markType);
      const bgColor = getRowBackground(sample.markType);
      return `<tr style="background-color: ${bgColor};"><td><strong>${sample.displayIndex}</strong></td><td><code style="font-size:0.85rem;">${sample.barcode}</code><td>${sample.patientFullName}</td><td>${sample.patientInitials}</td><td>${sample.name}</td><td>${sample.group}</td><td><span class="status-badge ${status.class}"><i class="fas ${status.icon}"></i> ${status.text}</span></td><td class="action-group"><button class="mark-icon-btn clean" data-action="clean" data-unique="${sample.uniqueKey}" data-id="${sample.id}"><i class="fas fa-check-circle"></i> Чисто</button><button class="mark-icon-btn repeat" data-action="repeat" data-unique="${sample.uniqueKey}" data-id="${sample.id}"><i class="fas fa-sync-alt"></i> Повтор</button><button class="mark-icon-btn loss" data-action="loss" data-unique="${sample.uniqueKey}" data-id="${sample.id}"><i class="fas fa-times-circle"></i> Потеря</button><button class="mark-icon-btn remark" data-action="remark" data-unique="${sample.uniqueKey}" data-id="${sample.id}"><i class="fas fa-pencil-alt"></i> Отписана</button></td></tr>`;
    })
    .join("")}</tbody></table>`;
  container.innerHTML = html;

  document.querySelectorAll(".mark-icon-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const action = btn.getAttribute("data-action");
      const uniqueKey = btn.getAttribute("data-unique");
      const sampleId = parseInt(btn.getAttribute("data-id"));
      const targetSample = currentSamples.find(
        (s) => s.uniqueKey === uniqueKey && s.id === sampleId,
      );
      if (targetSample) {
        let newType = "clean",
          msg = "";
        if (action === "remark") {
          newType = "remark";
          msg = `Проба ${targetSample.patientInitials} (${targetSample.initials}) отмечена как "Отписана" ✏️`;
        } else if (action === "loss") {
          newType = "loss";
          msg = `Проба ${targetSample.patientInitials} (${targetSample.initials}) отмечена как "Потеря" ❌`;
        } else if (action === "repeat") {
          newType = "repeat";
          msg = `Проба ${targetSample.patientInitials} (${targetSample.initials}) отмечена как "Повтор" 🔄`;
        } else {
          newType = "clean";
          msg = `С пробы ${targetSample.patientInitials} (${targetSample.initials}) сняты все отметки ✓`;
        }
        targetSample.markType = newType;
        renderAnalysisTable();
        showNotification(msg, "info");
      }
    });
  });
}

function refreshThirtySamples() {
  currentSamples = generateThirtySamples();
  renderAnalysisTable();
  showNotification("Список из 30 проб обновлён, порядок перемешан", "success");
}

function setFilter(filterValue) {
  activeFilter = filterValue;
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    if (btn.getAttribute("data-filter") === filterValue)
      btn.classList.add("active");
    else btn.classList.remove("active");
  });
  renderAnalysisTable();
}

// ============================================================================
// 3. СПРАВОЧНИК ТЕСТОВ (ИЗ DJANGO API)
// ============================================================================

async function loadGuideFromAPI(typeTest = "immuno") {
  try {
    let testTypeParam =
      typeTest === "immuno" || typeTest === "immunochemistry"
        ? "immuno"
        : "biochemistry";
    const url = `/teach/guide/${testTypeParam}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-CSRFToken": getCookie("csrftoken"),
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    if (data.list && Array.isArray(data.list)) {
      return data.list.map((item) => ({
        code: item.code,
        name: item.name,
        sample_type: item.sample_type || "Сыворотка",
        lines: item.lines || [],
      }));
    }
    return [];
  } catch (error) {
    console.error("Ошибка загрузки справочника:", error);
    showNotification("Ошибка загрузки данных справочника", "info");
    return [];
  }
}

window.showGuideModule = async function (direction) {
  const informerDiv = document.getElementById("testInformer");
  if (!informerDiv) return;

  informerDiv.innerHTML = `<div class="informer-card"><div class="informer-header"><h2><i class="fas fa-spinner fa-pulse"></i> Загрузка справочника...</h2><button class="close-informer" onclick="window.closeGuide()">Закрыть</button></div><div class="loading-state"><i class="fas fa-spinner fa-pulse"></i><p>Загрузка данных...</p></div></div>`;
  informerDiv.classList.add("active");

  let tests = await loadGuideFromAPI(direction);
  if (!tests || tests.length === 0) {
    showNotification("Нет данных справочника", "info");
    informerDiv.classList.remove("active");
    return;
  }

  const typeName =
    direction === "immuno" || direction === "immunochemistry"
      ? "Иммунохимия"
      : "Биохимия";
  const typeIcon =
    direction === "immuno" || direction === "immunochemistry" ? "🧬" : "⚗️";

  const rows = tests
    .map((test, index) => {
      const linesHtml = (test.lines || [])
        .map(
          (line) =>
            `<span class="line-badge"><i class="fas fa-microchip"></i> ${line.code || line}</span>`,
        )
        .join("");
      return `<tr style="animation-delay: ${index * 0.02}s"><td><span class="test-code">${escapeHtml(test.code || test.id)}</span></td><td class="test-name">${escapeHtml(test.name)}</span></td><td><span class="sample-type-badge"><i class="fas fa-tint"></i> ${escapeHtml(test.sample_type || "Сыворотка")}</span></td><td><div class="lines-container">${linesHtml || '<span style="color: #94a3b8;">—</span>'}</div></td></tr>`;
    })
    .join("");

  informerDiv.innerHTML = `
        <div class="informer-card">
            <div class="informer-header">
                <h2><i class="fas fa-table-list"></i> Справочник тестов ${typeIcon} ${escapeHtml(typeName)}<span style="font-size: 14px; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 20px;">${tests.length} тестов</span></h2>
                <button class="close-informer" onclick="window.closeGuide()"><i class="fas fa-times"></i> Закрыть</button>
            </div>
            <div class="search-wrapper"><div class="search-container"><i class="fas fa-search"></i><input type="text" id="guideSearch" placeholder="Поиск по названию, коду или типу материала..."></div></div>
            <div class="table-wrapper"><table class="guide-table"><thead><tr><th style="width: 20%">Код теста</th><th style="width: 40%">Название</th><th style="width: 20%">Материал</th><th style="width: 20%">Линии анализаторов</th></tr></thead><tbody id="guideTbody">${rows}</tbody></table></div>
            <div class="info-footer"><span><i class="fas fa-database"></i> Лабораторная информационная система</span><span><i class="fas fa-microchip"></i> Поддерживаемые линии: EEEE1, EEEE2, CEEE</span><span><i class="fas fa-chart-simple"></i> Актуальные данные</span></div>
        </div>
    `;

  const searchInput = document.getElementById("guideSearch");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase().trim();
      const filtered = tests.filter(
        (test) =>
          (test.name && test.name.toLowerCase().includes(term)) ||
          (test.code && test.code.toLowerCase().includes(term)) ||
          (test.sample_type && test.sample_type.toLowerCase().includes(term)),
      );
      const filteredRows = filtered
        .map((test, index) => {
          const linesHtml = (test.lines || [])
            .map(
              (line) =>
                `<span class="line-badge"><i class="fas fa-microchip"></i> ${line.code || line}</span>`,
            )
            .join("");
          return `<tr style="animation-delay: ${index * 0.02}s"><td><span class="test-code">${escapeHtml(test.code || test.id)}</span></td><td class="test-name">${escapeHtml(test.name)}</span><td><td><span class="sample-type-badge"><i class="fas fa-tint"></i> ${escapeHtml(test.sample_type || "Сыворотка")}</span></td><td><div class="lines-container">${linesHtml || '<span style="color: #94a3b8;">—</span>'}</div></td></tr>`;
        })
        .join("");
      const tbody = document.getElementById("guideTbody");
      if (filtered.length > 0) tbody.innerHTML = filteredRows;
      else
        tbody.innerHTML = `<tr><td colspan="4" class="empty-state"><i class="fas fa-search"></i><p>Ничего не найдено</p><small>Попробуйте изменить поисковый запрос</small></td></tr>`;
    });
  }
};

window.closeGuide = function () {
  const informer = document.getElementById("testInformer");
  if (informer) informer.classList.remove("active");
};

// ============================================================================
// 4. API ДЛЯ ROCHE ANALYZER
// ============================================================================

const RocheAPI = {
  baseUrl: "/teach/api/roche/",

  getCsrfToken() {
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
  },

  async getAllAnalyzers() {
    try {
      const response = await fetch(`${this.baseUrl}analyzer/all_analyzers/`, {
        headers: { "X-CSRFToken": this.getCsrfToken() },
      });
      if (!response.ok) throw new Error("Ошибка загрузки анализаторов");
      return await response.json();
    } catch (error) {
      console.error("API Error:", error);
      return [];
    }
  },

  async getAnalyzerById(id) {
    try {
      const response = await fetch(`${this.baseUrl}analyzer/${id}/`, {
        headers: { "X-CSRFToken": this.getCsrfToken() },
      });
      if (!response.ok) throw new Error(`Анализатор с ID ${id} не найден`);
      return await response.json();
    } catch (error) {
      console.error("API Error:", error);
      return null;
    }
  },

  async getAnalyzerModules(analyzerId) {
    try {
      const response = await fetch(
        `${this.baseUrl}analyzer/${analyzerId}/modules/`,
        { headers: { "X-CSRFToken": this.getCsrfToken() } },
      );
      if (!response.ok) throw new Error("Ошибка загрузки модулей");
      return await response.json();
    } catch (error) {
      console.error("API Error:", error);
      return [];
    }
  },

  async getModuleReagents(moduleId) {
    try {
      const response = await fetch(
        `${this.baseUrl}modules/${moduleId}/reagents/`,
        { headers: { "X-CSRFToken": this.getCsrfToken() } },
      );
      if (!response.ok) throw new Error("Ошибка загрузки реагентов");
      return await response.json();
    } catch (error) {
      console.error("API Error:", error);
      return [];
    }
  },

  async getAllReagents() {
    try {
      const response = await fetch(`${this.baseUrl}reagents/`, {
        headers: { "X-CSRFToken": this.getCsrfToken() },
      });
      if (!response.ok) throw new Error("Ошибка загрузки реагентов");
      return await response.json();
    } catch (error) {
      console.error("API Error:", error);
      return [];
    }
  },

  async createReagent(data) {
    const response = await fetch(`${this.baseUrl}reagents/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": this.getCsrfToken(),
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Ошибка создания реагента");
    return await response.json();
  },

  async updateReagent(id, data) {
    const response = await fetch(`${this.baseUrl}reagents/${id}/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": this.getCsrfToken(),
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Ошибка обновления реагента");
    return await response.json();
  },

  async deleteReagent(id) {
    const response = await fetch(`${this.baseUrl}reagents/${id}/`, {
      method: "DELETE",
      headers: { "X-CSRFToken": this.getCsrfToken() },
    });
    if (!response.ok) throw new Error("Ошибка удаления реагента");
    return await response.json();
  },

  async getAllModuleReagents() {
    try {
      const response = await fetch(`${this.baseUrl}module-reagents/`, {
        headers: { "X-CSRFToken": this.getCsrfToken() },
      });
      if (!response.ok) throw new Error("Ошибка загрузки связей");
      return await response.json();
    } catch (error) {
      console.error("API Error:", error);
      return [];
    }
  },

  async addReagentToModule(moduleId, reagentId, channel, isActive = true) {
    const response = await fetch(`${this.baseUrl}module-reagents/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": this.getCsrfToken(),
      },
      body: JSON.stringify({
        module: parseInt(moduleId),
        reagent: parseInt(reagentId),
        channel: channel === "BOTH" ? "BOTH" : channel || null,
        is_active: isActive,
      }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Ошибка добавления реагента");
    }
    return await response.json();
  },

  async deleteModuleReagent(connectionId) {
    const response = await fetch(
      `${this.baseUrl}module-reagents/${connectionId}/`,
      {
        method: "DELETE",
        headers: { "X-CSRFToken": this.getCsrfToken() },
      },
    );
    if (!response.ok) throw new Error("Ошибка удаления связи");
    return await response.json();
  },
};

// ============================================================================
// 5. УПРАВЛЕНИЕ НЕСКОЛЬКИМИ АНАЛИЗАТОРАМИ
// ============================================================================

let currentAnalyzer = null;
let allAnalyzers = [];

async function loadAnalyzersSelect() {
  allAnalyzers = await RocheAPI.getAllAnalyzers();
  const select = document.getElementById("analyzer-select");
  if (!select) return;
  if (allAnalyzers.length === 0) {
    select.innerHTML = '<option value="">Нет доступных анализаторов</option>';
    return;
  }
  select.innerHTML = allAnalyzers
    .map(
      (analyzer) =>
        `<option value="${analyzer.id}">${analyzer.name} (${analyzer.code})</option>`,
    )
    .join("");
  if (allAnalyzers[0]) await switchAnalyzer(allAnalyzers[0].id);
  return allAnalyzers;
}

async function switchAnalyzer(analyzerId) {
  const analyzer = await RocheAPI.getAnalyzerById(analyzerId);
  if (!analyzer) return null;

  currentAnalyzer = analyzer;

  // Обновляем заголовок
  const analyzerNameEl = document.getElementById("analyzer-name");
  const analyzerDescEl = document.getElementById("analyzer-description");
  const modulesCountEl = document.getElementById("modules-count");

  if (analyzerNameEl) analyzerNameEl.textContent = analyzer.name;
  if (analyzerDescEl)
    analyzerDescEl.textContent =
      analyzer.description || "Модульная аналитическая система";

  // Обновляем отображение модулей
  await renderRocheModules();

  if (modulesCountEl && currentAnalyzer.modules) {
    modulesCountEl.innerHTML = `<i class="fas fa-microchip"></i> ${currentAnalyzer.modules.length} модулей`;
  }

  // Очищаем select с модулями при смене анализатора
  const select = document.getElementById("module-select");
  if (select) {
    select.innerHTML = '<option value="">Загрузка модулей...</option>';
  }

  console.log(`Переключено на анализатор: ${analyzer.name}`);
  return analyzer;
}

function getModuleIcon(moduleType) {
  const icons = {
    e801: "fa-microchip",
    e601: "fa-microchip",
    c702: "fa-flask",
  };
  return icons[moduleType] || "fa-cube";
}

function updateChannelIndicators(moduleId, reagents) {
  const card = document.querySelector(
    `.module-card[data-module-id="${moduleId}"]`,
  );
  if (!card) return;
  const hasCH1 = reagents.some(
    (r) => r.channel === "CH1" || r.channel === "BOTH",
  );
  const hasCH2 = reagents.some(
    (r) => r.channel === "CH2" || r.channel === "BOTH",
  );
  const ch1Led = card.querySelector(".channel-status:first-child .channel-led");
  const ch2Led = card.querySelector(".channel-status:last-child .channel-led");
  if (ch1Led) ch1Led.className = `channel-led ${hasCH1 ? "green" : "gray"}`;
  if (ch2Led) ch2Led.className = `channel-led ${hasCH2 ? "green" : "gray"}`;
}

async function loadModuleReagents(moduleId, hasChannels) {
  try {
    const reagents = await RocheAPI.getModuleReagents(moduleId);
    const tbody = document.getElementById(`module-reagents-${moduleId}`);
    const countSpan = document.getElementById(`reagent-count-${moduleId}`);
    if (!tbody) return;
    if (reagents.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="3" style="text-align:center; color:#94a3b8;">Нет реагентов</td></tr>';
      if (countSpan)
        countSpan.innerHTML = `<i class="fas fa-vial"></i> 0 реагентов`;
      return;
    }
    const rows = reagents
      .map((reagent) => {
        const isOnCH1 = reagent.channel === "CH1" || reagent.channel === "BOTH";
        const isOnCH2 = reagent.channel === "CH2" || reagent.channel === "BOTH";
        const isBoth = reagent.channel === "BOTH";
        const channelHtml = hasChannels
          ? `<td class="channel-cell"><div style="display: flex; gap: 8px; justify-content: center;"><span class="channel-dot ${isOnCH1 ? "active" : "inactive"}" style="${isBoth ? "background: #10b981;" : ""}"></span><span class="channel-dot ${isOnCH2 ? "active" : "inactive"}" style="${isBoth ? "background: #10b981;" : ""}"></span></div></td>`
          : "";
        const bothIcon = isBoth
          ? '<span class="both-icon" title="Работает на обоих каналах">⚡</span>'
          : "";
        return `<tr><td class="reagent-name">${escapeHtml(reagent.reagent.name)} ${bothIcon}</td><td class="reagent-code">${escapeHtml(reagent.reagent.code)}</td>${channelHtml}</tr>`;
      })
      .join("");
    tbody.innerHTML = rows;
    updateChannelIndicators(moduleId, reagents);
    if (countSpan)
      countSpan.innerHTML = `<i class="fas fa-vial"></i> ${reagents.length} реагентов`;
  } catch (error) {
    console.error("Ошибка загрузки реагентов:", error);
    const tbody = document.getElementById(`module-reagents-${moduleId}`);
    if (tbody)
      tbody.innerHTML =
        '<tr><td colspan="3" style="text-align:center; color:#ef4444;">Ошибка загрузки</td></tr>';
  }
}

function createModuleCard(module) {
  const card = document.createElement("div");
  card.className = "module-card";
  card.dataset.moduleId = module.id;
  card.dataset.moduleType = module.module_type;
  const moduleIcon = getModuleIcon(module.module_type);
  const hasChannels = module.has_channels;
  card.innerHTML = `
        <div class="module-header">
            <div class="module-number">${String(module.module_number).padStart(2, "0")}</div>
            <div class="module-title"><i class="fas ${moduleIcon}"></i><h3>${escapeHtml(module.name)}</h3><span class="module-type">${escapeHtml(module.module_type_display)}</span></div>
            ${hasChannels ? `<div class="module-channels"><div class="channel-status"><span class="channel-led gray"></span><span class="channel-label">CH1</span></div><div class="channel-status"><span class="channel-led gray"></span><span class="channel-label">CH2</span></div></div>` : ""}
        </div>
        <div class="module-body">
            <table class="module-table">
                <thead><tr><th>Реагент</th><th>Код</th>${hasChannels ? '<th width="100">Каналы</th>' : ""}</thead>
                <tbody id="module-reagents-${module.id}"><tr><td colspan="3" style="text-align:center">Загрузка...</td></tr></tbody>
            </table>
        </div>
        <div class="module-footer"><span class="reagent-count" id="reagent-count-${module.id}"><i class="fas fa-vial"></i> 0 реагентов</span></div>
    `;
  loadModuleReagents(module.id, hasChannels);
  return card;
}

async function renderRocheModules() {
  const container = document.querySelector(".analyzer-modules");
  if (!container) return;
  if (!currentAnalyzer) {
    container.innerHTML =
      '<div style="grid-column:1/-1;text-align:center;padding:40px;">Выберите анализатор</div>';
    return;
  }
  container.innerHTML =
    '<div style="grid-column:1/-1;text-align:center;padding:40px;"><i class="fas fa-spinner fa-pulse"></i> Загрузка модулей...</div>';
  try {
    const modules = await RocheAPI.getAnalyzerModules(currentAnalyzer.id);
    if (!modules.length) {
      container.innerHTML =
        '<div style="grid-column:1/-1;text-align:center;padding:40px;">Нет модулей для этого анализатора</div>';
      return;
    }
    container.innerHTML = "";
    for (const module of modules) {
      const reagents = await RocheAPI.getModuleReagents(module.id);
      module.reagents_data = reagents;
      container.appendChild(createModuleCard(module));
    }
    const modulesCountEl = document.getElementById("modules-count");
    if (modulesCountEl)
      modulesCountEl.innerHTML = `<i class="fas fa-microchip"></i> ${modules.length} модулей`;
  } catch (error) {
    console.error("Ошибка:", error);
    container.innerHTML =
      '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#ef4444;">Ошибка загрузки модулей</div>';
  }
}

// ============================================================================
// 6. ИНИЦИАЛИЗАЦИЯ ROCHE АНАЛИЗАТОРА (для обратной совместимости)
// ============================================================================

function initRocheAnalyzer() {
  console.log("Roche Cobas 8000 анализатор инициализирован");
  const dots = document.querySelectorAll(".channel-dot.active");
  dots.forEach((dot) => {
    dot.addEventListener("click", function (e) {
      e.stopPropagation();
      console.log("Канал кликнут");
    });
  });
  const rows = document.querySelectorAll(".module-table tbody tr");
  rows.forEach((row) => {
    const dots = row.querySelectorAll(".channel-dot");
    dots.forEach((dot) => {
      dot.addEventListener("mouseenter", () => {
        row.style.backgroundColor = "#f0fdf4";
      });
      dot.addEventListener("mouseleave", () => {
        row.style.backgroundColor = "";
      });
    });
  });
}

// ============================================================================
// 7. CRUD УПРАВЛЕНИЕ РЕАГЕНТАМИ
// ============================================================================

class ReagentCRUD {
  constructor() {
    this.init();
  }
  async init() {
    this.bindEvents();
    await this.loadReagentsList();
    await this.loadModulesForSelect();
    this.initTabs();
  }
  bindEvents() {
    const addForm = document.getElementById("add-reagent-form");
    if (addForm)
      addForm.addEventListener("submit", (e) => this.createReagent(e));
    const editForm = document.getElementById("edit-reagent-form");
    if (editForm)
      editForm.addEventListener("submit", (e) => this.updateReagent(e));
    const moduleForm = document.getElementById("add-to-module-form");
    if (moduleForm)
      moduleForm.addEventListener("submit", (e) => this.addReagentToModule(e));
    document.querySelectorAll(".close-modal").forEach((btn) => {
      btn.addEventListener("click", () => this.closeModal(btn.dataset.modal));
    });
    const addReagentBtn = document.querySelector(".btn-add-reagent");
    if (addReagentBtn)
      addReagentBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.showAddReagentModal();
      });
  }
  initTabs() {
    const tabs = document.querySelectorAll(".tab-btn");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const tabName = tab.dataset.tab;
        document
          .querySelectorAll(".tab-content")
          .forEach((content) => content.classList.remove("active"));
        document
          .querySelectorAll(".tab-btn")
          .forEach((btn) => btn.classList.remove("active"));
        document.getElementById(`tab-${tabName}`).classList.add("active");
        tab.classList.add("active");
        if (tabName === "assignments") this.loadAssignments();
      });
    });
  }
  getCategoryName(category) {
    const names = {
      hormones: "Гормоны",
      oncomarkers: "Онкомаркеры",
      autoimmune: "Аутоиммунные",
      vitamins: "Витамины",
      special: "Специальные",
      biochemistry: "Биохимия",
      hepatitis: "Гепатиты",
    };
    return names[category] || category;
  }
  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = "flex";
  }
  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = "none";
  }
  showAddReagentModal() {
    document.getElementById("add-reagent-form")?.reset();
    this.showModal("add-reagent-modal");
  }
  async loadReagentsList() {
    try {
      const reagents = await RocheAPI.getAllReagents();
      this.renderAdminTable(reagents);
    } catch (error) {
      console.error("Ошибка загрузки:", error);
    }
  }
  renderAdminTable(reagents) {
    const container = document.getElementById("reagents-admin-table");
    if (!container) return;
    if (!reagents.length) {
      container.innerHTML = '<tr><td colspan="5">Нет реагентов</td></tr>';
      return;
    }
    container.innerHTML = reagents
      .map(
        (reagent) => `
            <tr><td>${escapeHtml(reagent.code)}</td><td>${escapeHtml(reagent.name)}</td><td>${escapeHtml(reagent.short_name)}</td><td>${this.getCategoryName(reagent.category)}</td>
            <td><button onclick="reagentCRUD.editReagent(${reagent.id})" class="btn-edit"><i class="fas fa-edit"></i></button>
            <button onclick="reagentCRUD.deleteReagent(${reagent.id})" class="btn-delete"><i class="fas fa-trash"></i></button>
            <button onclick="reagentCRUD.showAddToModule(${reagent.id}, '${escapeHtml(reagent.code)}')" class="btn-add"><i class="fas fa-plus-circle"></i></button></td></tr>
        `,
      )
      .join("");
  }
  async loadModulesForSelect() {
    try {
      // Проверяем, есть ли выбранный анализатор
      if (!currentAnalyzer) {
        console.warn("Анализатор не выбран");
        const select = document.getElementById("module-select");
        if (select) {
          select.innerHTML =
            '<option value="">Сначала выберите анализатор</option>';
        }
        return;
      }

      // Загружаем модули для текущего анализатора
      const modules = await RocheAPI.getAnalyzerModules(currentAnalyzer.id);
      const select = document.getElementById("module-select");

      if (select) {
        if (modules.length === 0) {
          select.innerHTML =
            '<option value="">Нет модулей для этого анализатора</option>';
        } else {
          select.innerHTML =
            '<option value="">Выберите модуль</option>' +
            modules
              .map(
                (m) =>
                  `<option value="${m.id}">Модуль ${m.module_number}: ${escapeHtml(m.name)} (${escapeHtml(m.module_type)})</option>`,
              )
              .join("");
        }
      }
    } catch (error) {
      console.error("Ошибка загрузки модулей:", error);
      const select = document.getElementById("module-select");
      if (select) {
        select.innerHTML = '<option value="">Ошибка загрузки модулей</option>';
      }
    }
  }
  async createReagent(event) {
    event.preventDefault();
    const formData = {
      code: document.getElementById("reagent-code").value,
      name: document.getElementById("reagent-name").value,
      short_name: document.getElementById("reagent-short-name").value,
      category: document.getElementById("reagent-category").value,
      description: document.getElementById("reagent-description").value || "",
    };
    try {
      await RocheAPI.createReagent(formData);
      showNotification("Реагент успешно добавлен", "success");
      this.closeModal("add-reagent-modal");
      await this.loadReagentsList();
      document.getElementById("add-reagent-form").reset();
    } catch (error) {
      showNotification("Ошибка при добавлении реагента", "error");
    }
  }
  async editReagent(id) {
    try {
      const reagent = await RocheAPI.getReagentById(id);
      document.getElementById("edit-reagent-id").value = reagent.id;
      document.getElementById("edit-reagent-code").value = reagent.code;
      document.getElementById("edit-reagent-name").value = reagent.name;
      document.getElementById("edit-reagent-short-name").value =
        reagent.short_name;
      document.getElementById("edit-reagent-category").value = reagent.category;
      document.getElementById("edit-reagent-description").value =
        reagent.description || "";
      this.showModal("edit-reagent-modal");
    } catch (error) {
      showNotification("Ошибка загрузки данных", "error");
    }
  }
  async updateReagent(event) {
    event.preventDefault();
    const id = document.getElementById("edit-reagent-id").value;
    const formData = {
      code: document.getElementById("edit-reagent-code").value,
      name: document.getElementById("edit-reagent-name").value,
      short_name: document.getElementById("edit-reagent-short-name").value,
      category: document.getElementById("edit-reagent-category").value,
      description:
        document.getElementById("edit-reagent-description").value || "",
    };
    try {
      await RocheAPI.updateReagent(id, formData);
      showNotification("Реагент обновлен", "success");
      this.closeModal("edit-reagent-modal");
      await this.loadReagentsList();
    } catch (error) {
      showNotification("Ошибка при обновлении", "error");
    }
  }
  async deleteReagent(id) {
    if (!confirm("Вы уверены, что хотите удалить этот реагент?")) return;
    try {
      await RocheAPI.deleteReagent(id);
      showNotification("Реагент удален", "success");
      await this.loadReagentsList();
    } catch (error) {
      showNotification("Ошибка при удалении", "error");
    }
  }
  showAddToModule(reagentId, reagentCode) {
    document.getElementById("add-reagent-id").value = reagentId;
    document.getElementById("add-reagent-name").value = reagentCode;

    // Обновляем список модулей перед показом модального окна
    this.loadModulesForSelect();

    this.showModal("add-to-module-modal");
  }
  async addReagentToModule(event) {
    if (event) event.preventDefault();
    const reagentId = document.getElementById("add-reagent-id")?.value;
    const moduleId = document.getElementById("module-select")?.value;
    const channel = document.querySelector(
      'input[name="channel"]:checked',
    )?.value;
    if (!moduleId) {
      showNotification("Выберите модуль", "error");
      return;
    }
    if (!reagentId) {
      showNotification("ID реагента не найден", "error");
      return;
    }
    try {
      await RocheAPI.addReagentToModule(
        moduleId,
        reagentId,
        channel === "" ? null : channel,
      );
      showNotification("Реагент добавлен в модуль", "success");
      this.closeModal("add-to-module-modal");
      await renderRocheModules();
      if (
        document.querySelector(".tab-btn.active")?.dataset.tab === "assignments"
      )
        await this.loadAssignments();
    } catch (error) {
      showNotification(error.message || "Ошибка при добавлении", "error");
    }
  }
  async loadAssignments() {
    try {
      const assignments = await RocheAPI.getAllModuleReagents();
      this.renderAssignmentsTable(assignments);
    } catch (error) {
      console.error("Ошибка загрузки назначений:", error);
    }
  }
  renderAssignmentsTable(assignments) {
    const tbody = document.querySelector("#assignments-table tbody");
    if (!tbody) return;
    if (!assignments.length) {
      tbody.innerHTML = '<tr><td colspan="5">Нет назначений</td></tr>';
      return;
    }
    tbody.innerHTML = assignments
      .map(
        (assignment) => `
            <tr><td>Модуль ${assignment.module?.module_number || "?"}: ${escapeHtml(assignment.module?.name || "?")}</td>
            <td>${escapeHtml(assignment.reagent?.name || "?")} (${escapeHtml(assignment.reagent?.code || "?")})</td>
            <td>${assignment.channel === "BOTH" ? "CH1+CH2" : assignment.channel || "—"}</td>
            <td>${assignment.is_active ? "✅ Активен" : "❌ Неактивен"}</td>
            <td><button onclick="reagentCRUD.deleteAssignment(${assignment.id})" class="btn-delete"><i class="fas fa-trash"></i></button></td></tr>
        `,
      )
      .join("");
  }
  async deleteAssignment(id) {
    if (!confirm("Удалить реагент из модуля?")) return;
    try {
      await RocheAPI.deleteModuleReagent(id);
      showNotification("Реагент удален из модуля", "success");
      await this.loadAssignments();
      await renderRocheModules();
    } catch (error) {
      showNotification("Ошибка при удалении", "error");
    }
  }
}

// ============================================================================
// 8. ПОЛНАЯ ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
// ============================================================================

document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Инициализация страницы...");

  currentSamples = generateThirtySamples();

  const openBtn = document.getElementById("openRandomPopupBtn");
  if (openBtn)
    openBtn.addEventListener("click", () => {
      renderAnalysisTable();
      document.getElementById("analysisPopup").classList.add("active");
    });

  const closePopupBtn = document.getElementById("closePopupBtn");
  const popup = document.getElementById("analysisPopup");
  if (closePopupBtn)
    closePopupBtn.addEventListener("click", () =>
      popup.classList.remove("active"),
    );
  if (popup)
    popup.addEventListener("click", (e) => {
      if (e.target === popup) popup.classList.remove("active");
    });

  document
    .querySelectorAll(".filter-btn")
    .forEach((btn) =>
      btn.addEventListener("click", () =>
        setFilter(btn.getAttribute("data-filter")),
      ),
    );

  const refreshBtn = document.getElementById("refreshAnalysesBtn");
  if (refreshBtn)
    refreshBtn.addEventListener("click", () => refreshThirtySamples());

  const guideBtns = document.querySelectorAll(".start-test-btn[data-guide]");
  guideBtns.forEach((btn) =>
    btn.addEventListener("click", () => showGuideModule("immuno")),
  );

  await loadAnalyzersSelect();

  const analyzerSelect = document.getElementById("analyzer-select");
  if (analyzerSelect)
    analyzerSelect.addEventListener("change", async (e) => {
      if (e.target.value) await switchAnalyzer(parseInt(e.target.value));
    });

  window.reagentCRUD = new ReagentCRUD();
  initRocheAnalyzer();

  console.log("✅ Инициализация завершена!");
});
