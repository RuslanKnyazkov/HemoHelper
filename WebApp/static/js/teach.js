// БАЗА ТЕСТОВ (иммунохимия + биохимия) - для анализатора проб
const FULL_ANALYSES_SET = [
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

  return surnames.slice(0, 25).map((surname, idx) => {
    const name = names[idx % names.length];
    const patronymic = [
      "Викторович",
      "Алексеевич",
      "Сергеевич",
      "Владимирович",
      "Иванович",
    ][idx % 5];
    return {
      id: idx + 1,
      fullName: `${surname} ${name} ${patronymic}`,
      initials: `${surname.charAt(0)}${name.charAt(0)}`,
      barcode: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
    };
  });
}

const PATIENTS = generatePatients();

// Генерация 30 проб
function generateThirtySamples() {
  let samples = [];
  for (let i = 0; i < 30; i++) {
    const patient = PATIENTS[i % PATIENTS.length];
    const analysis = FULL_ANALYSES_SET[i % FULL_ANALYSES_SET.length];
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

let currentSamples = [];
let activeFilter = "all";

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

function showNotification(message, type = "success") {
  const old = document.querySelector(".custom-notification");
  if (old) old.remove();
  const notif = document.createElement("div");
  notif.className = `custom-notification notification-${type}`;
  notif.innerHTML = `<i class="fas fa-${type === "success" ? "check-circle" : "info-circle"}"></i><span>${message}</span><button class="notification-close" style="background:none; border:none; color:white; margin-left:12px;"><i class="fas fa-times"></i></button>`;
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

// Функция для загрузки справочника из API Django
async function loadGuideFromAPI(typeTest = "immuno") {
  try {
    let testTypeParam = "";

    if (typeTest === "immuno" || typeTest === "immuno") {
      testTypeParam = "immuno";
    } else if (typeTest === "biochemistry") {
      testTypeParam = "biochemistry";
    } else {
      testTypeParam = typeTest;
    }

    const url = `/teach/guide/${testTypeParam}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-CSRFToken": getCookie("csrftoken"),
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

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
    return getLocalGuideData();
  }
}

// Локальные данные справочника (fallback)
function getLocalGuideData() {
  return [
    {
      code: "TSH-01",
      name: "Тиреотропный гормон",
      sample_type: "Сыворотка",
      lines: [{ code: "EEEE1" }, { code: "CEEE" }],
    },
    {
      code: "FT4-02",
      name: "Свободный T4",
      sample_type: "Сыворотка",
      lines: [{ code: "EEEE2" }, { code: "CEEE" }],
    },
    {
      code: "CORT-03",
      name: "Кортизол",
      sample_type: "Сыворотка",
      lines: [{ code: "EEEE1" }],
    },
    {
      code: "CA125-11",
      name: "CA-125",
      sample_type: "Сыворотка",
      lines: [{ code: "EEEE2" }],
    },
    {
      code: "TPOab-08",
      name: "Anti-TPO",
      sample_type: "Сыворотка",
      lines: [{ code: "EEEE1" }],
    },
    {
      code: "RF-07",
      name: "Ревматоидный фактор",
      sample_type: "Сыворотка",
      lines: [{ code: "CEEE" }],
    },
    {
      code: "PSA-12",
      name: "ПСА общий",
      sample_type: "Сыворотка",
      lines: [{ code: "EEEE1" }, { code: "EEEE2" }],
    },
  ];
}

// Функция для получения CSRF токена из cookies
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

window.showGuideModule = async function (direction) {
  const informerDiv = document.getElementById("testInformer");
  if (!informerDiv) return;

  // Показываем загрузку
  informerDiv.innerHTML = `
    <div class="informer-card">
      <div class="informer-header">
        <h2><i class="fas fa-spinner fa-pulse"></i> Загрузка справочника...</h2>
        <button class="close-informer" onclick="window.closeGuide()">Закрыть</button>
      </div>
      <div class="loading-state">
        <i class="fas fa-spinner fa-pulse"></i>
        <p>Загрузка данных...</p>
      </div>
    </div>
  `;
  informerDiv.classList.add("active");

  // Загружаем данные
  let tests = await loadGuideFromAPI(direction);
  if (!tests || tests.length === 0) {
    tests = getLocalGuideData();
  }

  const typeName =
    direction === "immuno" || direction === "immunochemistry"
      ? "Иммунохимия"
      : "Биохимия";
  const typeIcon =
    direction === "immuno" || direction === "immunochemistry" ? "🧬" : "⚗️";

  // Формируем аккуратную таблицу
  const rows = tests
    .map((test, index) => {
      const linesHtml = (test.lines || [])
        .map(
          (line) =>
            `<span class="line-badge"><i class="fas fa-microchip"></i> ${line.code || line}</span>`,
        )
        .join("");

      return `
      <tr style="animation-delay: ${index * 0.02}s">
        <td><span class="test-code">${escapeHtml(test.code || test.id)}</span></td>
        <td class="test-name">${escapeHtml(test.name)}</td>
        <td>
          <span class="sample-type-badge">
            <i class="fas fa-tint"></i> ${escapeHtml(test.sample_type || "Сыворотка")}
          </span>
        </td>
        <td>
          <div class="lines-container">
            ${linesHtml || '<span style="color: #94a3b8; font-size: 12px;">—</span>'}
          </div>
        </td>
      </tr>
    `;
    })
    .join("");

  informerDiv.innerHTML = `
    <div class="informer-card">
      <div class="informer-header">
        <h2>
          <i class="fas fa-table-list"></i> 
          Справочник тестов ${typeIcon} ${escapeHtml(typeName)}
          <span style="font-size: 14px; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 20px;">${tests.length} тестов</span>
        </h2>
        <button class="close-informer" onclick="window.closeGuide()">
          <i class="fas fa-times"></i> Закрыть
        </button>
      </div>
      
      <div class="search-wrapper">
        <div class="search-container">
          <i class="fas fa-search"></i>
          <input type="text" id="guideSearch" placeholder="Поиск по названию, коду или типу материала...">
        </div>
      </div>
      
      <div class="table-wrapper">
        <table class="guide-table">
          <thead>
            <tr>
              <th style="width: 20%">Код теста</th>
              <th style="width: 40%">Название</th>
              <th style="width: 20%">Материал</th>
              <th style="width: 20%">Линии анализаторов</th>
            </tr>
          </thead>
          <tbody id="guideTbody">
            ${rows}
          </tbody>
        </table>
      </div>
      
      <div class="info-footer">
        <span><i class="fas fa-database"></i> Лабораторная информационная система</span>
        <span><i class="fas fa-microchip"></i> Поддерживаемые линии: EEEE1, EEEE2, CEEE</span>
        <span><i class="fas fa-chart-simple"></i> Актуальные данные</span>
      </div>
    </div>
  `;

  // Поиск
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

          return `
          <tr style="animation-delay: ${index * 0.02}s">
            <td><span class="test-code">${escapeHtml(test.code || test.id)}</span></td>
            <td class="test-name">${escapeHtml(test.name)}</td>
            <td><span class="sample-type-badge"><i class="fas fa-tint"></i> ${escapeHtml(test.sample_type || "Сыворотка")}</span></td>
            <td><div class="lines-container">${linesHtml || '<span style="color: #94a3b8;">—</span>'}</div></td>
          </tr>
        `;
        })
        .join("");

      const tbody = document.getElementById("guideTbody");
      if (filtered.length > 0) {
        tbody.innerHTML = filteredRows;
      } else {
        tbody.innerHTML = `
          <tr>
            <td colspan="4" class="empty-state">
              <i class="fas fa-search"></i>
              <p>Ничего не найдено</p>
              <small>Попробуйте изменить поисковый запрос</small>
            </td>
          </tr>
        `;
      }
    });
  }
};

// Вспомогательная функция для экранирования HTML
function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

window.closeGuide = function () {
  const informer = document.getElementById("testInformer");
  if (informer) informer.classList.remove("active");
};

// ИНИЦИАЛИЗАЦИЯ
document.addEventListener("DOMContentLoaded", () => {
  currentSamples = generateThirtySamples();

  const openBtn = document.getElementById("openRandomPopupBtn");
  if (openBtn) {
    openBtn.addEventListener("click", () => {
      renderAnalysisTable();
      document.getElementById("analysisPopup").classList.add("active");
    });
  }

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

  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () =>
      setFilter(btn.getAttribute("data-filter")),
    );
  });

  const refreshBtn = document.getElementById("refreshAnalysesBtn");
  if (refreshBtn)
    refreshBtn.addEventListener("click", () => refreshThirtySamples());

  const guideBtns = document.querySelectorAll(".start-test-btn[data-guide]");
  guideBtns.forEach((btn) => {
    btn.addEventListener("click", () => showGuideModule("immuno"));
  });
});
