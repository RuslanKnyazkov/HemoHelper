// ===== Глобальные переменные и состояние =====
const state = {
  currentModule: "home",
  barcodeMode: "default",
  barcodeHistory: JSON.parse(localStorage.getItem("barcodeHistory") || "[]"),
  selectedReagent: null,
  reagentData: {},
  rocheMode: "routine",
  aliquotHistory: JSON.parse(localStorage.getItem("aliquotHistory") || "[]"),
  isContainerOpen: false,
};

// Массив для хранения экземпляров каруселей
const carousels = [];
// ===== Инициализация приложения =====
document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
  setupEventListeners();
  generateRacks();
  updateBarcodeDisplay();
  updateAliquotHistory();
  setTimeout(() => {
    const carousel1 = new Carousel("carousel1", {
      autoplay: true,
      autoplaySpeed: 2000,
      slidesToShow: 5,
      infinite: true,
      dots: false,
      arrows: true,
      draggable: true,
    });
    carousels.push(carousel1);

    const carousel2 = new Carousel("carousel2", {
      autoplay: true,
      autoplaySpeed: 4000,
      slidesToShow: 6,
      infinite: true,
      dots: true,
      arrows: true,
      draggable: true,
    });
    carousels.push(carousel2);
  });

  setTimeout(() => {
    initFloatingTests();
  }, 1500);
});

function initializeApp() {
  // Инициализация данных реагентов
  const racks = ["D1", "D2", "D3", "R1", "R2", "R3", "R4", "R5", "R6"];
  racks.forEach((rack) => {
    state.reagentData[rack] = Array(6).fill(null);
  });
}

function setupEventListeners() {
  // Обработчик ввода баркодов
  const barcodeInput = document.getElementById("barcode-input");
  if (barcodeInput) {
    barcodeInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        saveBarcode();
      }
    });
  }

  // Мобильное меню
  const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener("click", toggleMobileMenu);
  }

  // Обновление при изменении размера окна
  window.addEventListener("resize", handleResize);

  // Закрытие контейнеров по ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && state.isContainerOpen) {
      closeAllContainers();
    }
  });

  // Закрытие по клику на фон
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-backdrop")) {
      closeAllContainers();
    }
  });
}

// ===== Навигация по модулям с выезжающими контейнерами =====
function showModule(moduleId) {
  // Если это главная страница
  if (moduleId === "home") {
    closeAllContainers();
    document.getElementById("home-module")?.classList.add("active");
    state.currentModule = "home";
    state.isContainerOpen = false;

    // Обновить навигацию
    updateNavigation(moduleId);
    return;
  }
  console.log(moduleId);

  // Определяем, какие модули должны выезжать справа
  const slideModules = [
    "barcode",
    "reagent",
    "roche",
    "calculations",
    "aliquots",
    "alicvote-container",
  ];

  if (slideModules.includes(moduleId)) {
    // Открываем выезжающий контейнер
    openSlideContainer(moduleId);
  } else {
    // Для обычных модулей
    closeAllContainers();
    document.getElementById(`${moduleId}-module`)?.classList.add("active");
    state.currentModule = moduleId;
    state.isContainerOpen = false;
  }

  // Обновить навигацию
  updateNavigation(moduleId);

  // Обновить отображение для текущего модуля
  if (moduleId === "barcode") {
    updateBarcodeDisplay();
  } else if (moduleId === "aliquots") {
    updateAliquotHistory();
  } else if (moduleId === "roche") {
    initRocheModule();
  }
}

function updateNavigation(moduleId) {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  const activeBtn = document.querySelector(
    `.nav-btn[onclick="showModule('${moduleId}')"]`
  );
  if (activeBtn) {
    activeBtn.classList.add("active");
  }
}

// ===== Функции для выезжающих контейнеров =====
function openSlideContainer(moduleId) {
  // Скрыть главную страницу
  document.getElementById("home-module")?.classList.remove("active");

  // Скрыть все контейнеры
  document.querySelectorAll(".container-modern.active").forEach((container) => {
    container.classList.remove("active");
  });

  // Показать выбранный контейнер
  const targetContainer =
    document.getElementById(`${moduleId}-module`) ||
    document.getElementById(moduleId);
  if (targetContainer) {
    targetContainer.classList.add("active");
    console.log(targetContainer);

    // Добавить затемнение фона
    document.body.classList.add("container-open");

    // Обновить состояние
    state.currentModule = moduleId;
    state.isContainerOpen = true;

    // Фокус на первый интерактивный элемент
    setTimeout(() => {
      const firstInput = targetContainer.querySelector(
        "input, button, select, textarea"
      );
      if (firstInput) firstInput.focus();
    }, 150);
  }
}

function closeAllContainers() {
  // Скрыть все контейнеры
  document.querySelectorAll(".container-modern.active").forEach((container) => {
    container.classList.remove("active");
  });

  // Убрать затемнение фона
  document.body.classList.remove("container-open");

  // Показать главную страницу
  document.getElementById("home-module")?.classList.add("active");

  // Обновить состояние
  state.currentModule = "home";
  state.isContainerOpen = false;

  // Обновить навигацию
  updateNavigation("home");
}

// ===== Модуль баркодов =====
function selectMode(mode) {
  state.barcodeMode = mode;

  // Обновить отображение выбранного режима
  document.querySelectorAll(".mode-card").forEach((card) => {
    card.classList.remove("active");
  });

  const modeCards = document.querySelectorAll(".mode-card");
  switch (mode) {
    case "testosterone":
      modeCards[0]?.classList.add("active");
      break;
    case "default":
      modeCards[1]?.classList.add("active");
      break;
    case "a-tpo":
      modeCards[2]?.classList.add("active");
      break;
    case "prog":
      modeCards[3]?.classList.add("active");
      break;
  }
}

function saveBarcode() {
  const input = document.getElementById("barcode-input");
  if (!input) return;

  const barcode = input.value.trim();
  if (!barcode) {
    showNotification("Введите номер пробы!", "error");
    input.focus();
    return;
  }

  // Проверка на дубликат
  const isDuplicate = state.barcodeHistory.some(
    (item) => item.number === barcode
  );
  if (
    isDuplicate &&
    !confirm("Такой номер уже существует. Добавить дубликат?")
  ) {
    return;
  }

  const barcodeObject = {
    id: Date.now(),
    number: barcode,
    mode: state.barcodeMode,
    timestamp: new Date().toISOString(),
    date: new Date().toLocaleString("ru-RU"),
  };

  state.barcodeHistory.unshift(barcodeObject);
  localStorage.setItem("barcodeHistory", JSON.stringify(state.barcodeHistory));

  // Копирование в буфер обмена
  const clipboardObject = {
    type: "barcode",
    number: barcode,
    mode: state.barcodeMode,
    barcode: barcode,
    anchor: "h",
    size: "s",
  };

  copyToClipboard(JSON.stringify(clipboardObject, null, 2))
    .then(() => {
      showNotification(
        `✅ Проба "${barcode}" сохранена и скопирована!`,
        "success"
      );
      updateBarcodeDisplay();
      input.value = "";
      input.focus();
    })
    .catch((err) => {
      console.error("Ошибка копирования:", err);
      showNotification(
        "✅ Проба сохранена! (Не удалось скопировать)",
        "success"
      );
    });
}

function clearBarcodeInput() {
  const input = document.getElementById("barcode-input");
  if (input) {
    input.value = "";
    input.focus();
  }
  showNotification("Форма очищена", "info");
}

function simulateScan() {
  // Генерация случайного баркода для симуляции
  const randomBarcode = Math.floor(
    100000000 + Math.random() * 900000000
  ).toString();
  const input = document.getElementById("barcode-input");
  if (input) {
    input.value = randomBarcode;
    showNotification(`Симуляция сканирования: ${randomBarcode}`, "info");
  }
}

function updateBarcodeDisplay() {
  const countElement = document.getElementById("barcode-count");
  const historyElement = document.getElementById("barcode-history");

  if (!countElement || !historyElement) return;

  const count = state.barcodeHistory.length;
  countElement.textContent = `${count} ${getRussianPlural(
    count,
    "проба",
    "пробы",
    "проб"
  )}`;

  if (count === 0) {
    historyElement.innerHTML = `
                    <div class="empty-state" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                        <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 16px;"></i>
                        <h3 style="margin-bottom: 8px;">Нет сохраненных проб</h3>
                        <p>Добавьте первую пробу через форму слева</p>
                    </div>
                `;
    return;
  }

  historyElement.innerHTML = state.barcodeHistory
    .map(
      (item) => `
                <div class="history-item">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <div style="font-size: 18px; font-weight: 600;">${
                          item.number
                        }</div>
                        <div style="display: flex; gap: 8px;">
                            <span style="background: rgba(102, 126, 234, 0.1); color: #667eea; padding: 4px 12px; border-radius: 20px; font-size: 12px;">
                                ${getModeDisplayName(item.mode)}
                            </span>
                            <span style="color: var(--text-secondary); font-size: 12px;">
                                ${item.date}
                            </span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-secondary" style="flex: 1;" onclick="reprintBarcode('${
                          item.id
                        }')">
                            <i class="fas fa-print"></i> Печать
                        </button>
                        <button class="btn" style="flex: 1; background: rgba(239, 68, 68, 0.1); color: #ef4444;" onclick="deleteBarcode('${
                          item.id
                        }')">
                            <i class="fas fa-trash"></i> Удалить
                        </button>
                    </div>
                </div>
            `
    )
    .join("");
}

function getModeDisplayName(mode) {
  const modes = {
    default: "По умолчанию",
    testosterone: "Testosterone 1:10",
    "a-tpo": "A-TPO",
    prog: "Progesterone",
  };
  return modes[mode] || mode;
}

function reprintBarcode(id) {
  const item = state.barcodeHistory.find((item) => item.id.toString() === id);
  if (item) {
    const clipboardObject = {
      type: "barcode",
      number: item.number,
      mode: item.mode,
      barcode: item.number,
      anchor: "h",
      size: "s",
    };

    copyToClipboard(JSON.stringify(clipboardObject, null, 2))
      .then(() => {
        showNotification(
          `✅ Проба "${item.number}" скопирована для печати`,
          "success"
        );
      })
      .catch((err) => {
        console.error("Ошибка копирования:", err);
        showNotification("Ошибка копирования", "error");
      });
  }
}

function deleteBarcode(id) {
  state.barcodeHistory = state.barcodeHistory.filter(
    (item) => item.id.toString() !== id
  );
  localStorage.setItem("barcodeHistory", JSON.stringify(state.barcodeHistory));
  updateBarcodeDisplay();
  showNotification("Проба удалена", "success");
}

function specialLabel(type) {
  const labelTemplates = {
    saliva: { type: "text", text: "Sluna", anchor: "c", size: "l" },
    virtual: {
      type: "text",
      text: "VIRTUAL ARCHIVE",
      anchor: "c",
      size: "l",
    },
    duplicate: { type: "text", text: "DUBLI", anchor: "c", size: "l" },
    infinity: {
      type: "barcode",
      code: "BCN",
      text: "As123456",
      barcode: "As123456",
      anchor: "h",
      retry: 1,
    },
  };

  const template = labelTemplates[type];
  if (template) {
    copyToClipboard(JSON.stringify(template, null, 2))
      .then(() => {
        showNotification(`Этикетка "${type}" скопирована в буфер`, "success");
      })
      .catch((err) => {
        console.error("Ошибка копирования:", err);
        showNotification("Ошибка копирования", "error");
      });
  }
}

// ===== Модуль реагентов =====
function selectReagent(reagent) {
  state.selectedReagent = reagent;

  // Обновить отображение
  document.querySelectorAll(".reagent-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  const activeBtn = Array.from(document.querySelectorAll(".reagent-btn")).find(
    (btn) => btn.textContent.includes(getReagentDisplayName(reagent))
  );
  if (activeBtn) {
    activeBtn.classList.add("active");
  }

  document.getElementById("selected-reagent").textContent =
    getReagentDisplayName(reagent);
  showNotification(`Выбран реагент: ${getReagentDisplayName(reagent)}`, "info");
}

function getReagentDisplayName(reagent) {
  const names = {
    f_diluent: "Factor Diluent",
    pc_dil: "PC Diluent",
    aptt_reagent: "APTT reagent",
    aptt_cacl2: "APTT CaCl2",
    recombiplastin: "Recombiplastin",
    trombintime: "Trombin Time",
    fibrinogen: "O.F.A Fibrinogen",
  };
  return names[reagent] || reagent;
}

function generateRacks() {
  const rackContainer = document.querySelector(".rack-container");
  if (!rackContainer) return;

  const racks = ["D1", "D2", "D3", "R1", "R2", "R3", "R4", "R5", "R6"];

  rackContainer.innerHTML = racks
    .map(
      (rack) => `
                <div class="rack">
                    <div class="rack-header">
                        <div class="rack-title">${rack}</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">
                            ${rack.startsWith("D") ? "Разбавитель" : "Реагент"}
                        </div>
                    </div>
                    <div class="rack-holes">
                        ${Array.from(
                          { length: 6 },
                          (_, i) => `
                            <div class="hole" 
                                 data-rack="${rack}" 
                                 data-hole="${i + 1}"
                                 onclick="fillHole('${rack}', ${i + 1})">
                                ${
                                  state.reagentData[rack][i]
                                    ? getReagentShortName(
                                        state.reagentData[rack][i]
                                      )
                                    : ""
                                }
                            </div>
                        `
                        ).join("")}
                    </div>
                </div>
            `
    )
    .join("");
}

function getReagentShortName(reagent) {
  const shortNames = {
    f_diluent: "FD",
    pc_dil: "PD",
    aptt_reagent: "AR",
    aptt_cacl2: "AC",
    recombiplastin: "RP",
    trombintime: "TT",
    fibrinogen: "FG",
  };
  return shortNames[reagent] || reagent.substring(0, 2);
}

function fillHole(rack, hole) {
  if (!state.selectedReagent) {
    showNotification("Сначала выберите реагент!", "error");
    return;
  }

  const holeIndex = hole - 1;

  // Проверка разрешенных реков для реагента
  const allowedRacks = getAllowedRacks(state.selectedReagent);
  if (!allowedRacks.includes(rack)) {
    showNotification(`Этот реагент нельзя разместить в ${rack}!`, "error");
    return;
  }

  const currentReagent = state.reagentData[rack][holeIndex];

  if (currentReagent === state.selectedReagent) {
    // Очистить лунку
    state.reagentData[rack][holeIndex] = null;
    updateHoleDisplay(rack, hole, null);
    showNotification(`Лунка ${hole} в ${rack} очищена`, "info");
  } else {
    // Заполнить лунку
    state.reagentData[rack][holeIndex] = state.selectedReagent;
    updateHoleDisplay(rack, hole, state.selectedReagent);
    showNotification(
      `${getReagentDisplayName(
        state.selectedReagent
      )} установлен в ${rack} лунка ${hole}`,
      "success"
    );
  }
}

function getAllowedRacks(reagent) {
  const allowedRacks = {
    f_diluent: ["D1", "D2"],
    pc_dil: ["D1", "D2"],
    aptt_reagent: ["D3", "R1", "R2"],
    aptt_cacl2: ["R3", "R4", "R5", "R6"],
    recombiplastin: ["R3", "R4", "R5", "R6"],
    trombintime: ["R3", "R4", "R5", "R6"],
    fibrinogen: ["R3", "R4", "R5", "R6"],
  };
  return allowedRacks[reagent] || [];
}

function updateHoleDisplay(rack, hole, reagent) {
  const holeElement = document.querySelector(
    `.hole[data-rack="${rack}"][data-hole="${hole}"]`
  );
  if (holeElement) {
    holeElement.textContent = reagent ? getReagentShortName(reagent) : "";
    holeElement.classList.toggle("filled", !!reagent);
  }
}

function clearSelection() {
  state.selectedReagent = null;
  document.querySelectorAll(".reagent-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  document.getElementById("selected-reagent").textContent = "Реагент не выбран";
  showNotification("Выбор реагента снят", "info");
}

function clearAllRacks() {
  if (!confirm("Очистить все реки?")) return;

  const racks = ["D1", "D2", "D3", "R1", "R2", "R3", "R4", "R5", "R6"];
  racks.forEach((rack) => {
    state.reagentData[rack] = Array(6).fill(null);
  });

  generateRacks();
  showNotification("Все реки очищены", "success");
}

// ===== Модуль Roche =====
function setRocheMode(mode, buttonElement) {
  state.rocheMode = mode;

  // Обновляем активную кнопку
  document.querySelectorAll(".roche-mode-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  if (buttonElement) {
    buttonElement.classList.add("active");
  }

  const typeMode = {
    routine: ["line-e1", "line-e2", "line-c1", "line-cc", "line-ce"],
    mode1: ["line-e1", "line-ce", "line-cc"],
    mode2: ["line-e2", "line-c1"],
  };

  const testMode = {
    routine: [],
    mode1: ["Zinc", "Lpa", "Cu", "CHE", "LIP", "CK-Total"],
    mode2: [
      "C-peptid",
      "AFP",
      "A-CCP",
      "IGF",
      "PAAP-P",
      "GH",
      "TP1NP",
      "Cyfra",
    ],
  };

  const modeNames = {
    routine: "Routine-AUE",
    mode1: "CEE+EEEE1+CC",
    mode2: "EEEE2+CCC",
  };

  // Валидация режима
  if (!typeMode[mode]) {
    console.error(`Неизвестный режим: ${mode}`);
    return;
  }

  const activeLines = typeMode[mode];
  const currentTests = testMode[mode] || [];

  // Обновляем визуализацию линий
  const allLines = ["line-e1", "line-e2", "line-ce", "line-c1", "line-cc"];

  allLines.forEach((lineId) => {
    const line = document.getElementById(lineId);
    if (line) {
      line.classList.toggle("active-line", activeLines.includes(lineId));

      // Обновляем статус
      const statusElement = line.querySelector(".analyze-status");
      if (statusElement) {
        if (activeLines.includes(lineId)) {
          statusElement.textContent = "Active";
          statusElement.className = "analyze-status active";
        } else {
          statusElement.textContent = "Standby";
          statusElement.className = "analyze-status standby";
        }
      }

      // Обновляем сегменты
      const segments = line.querySelectorAll(".segment");
      segments.forEach((segment, index) => {
        segment.classList.remove("active");
        if (activeLines.includes(lineId) && Math.random() > 0.5) {
          segment.classList.add("active");
        }
      });

      // Обновляем счетчики
      const sampleCount = line.querySelector(".sample-count");
      const testCount = line.querySelector(".test-count");
      if (sampleCount && testCount) {
        if (activeLines.includes(lineId)) {
          const samples = Math.floor(Math.random() * 30) + 10;
          const tests = Math.floor(samples / 3);
          sampleCount.textContent = `Пробы: ${samples}`;
          testCount.textContent = `Тесты: ${tests}`;
        } else {
          sampleCount.textContent = "Пробы: 0";
          testCount.textContent = "Тесты: 0";
        }
      }
    }
  });

  // Обновляем визуализацию сортеров
  updateSortersVisualization(mode);

  // Обновляем информацию в заголовке
  const activeLinesElement = document.getElementById("active-lines");
  if (activeLinesElement) {
    activeLinesElement.textContent = activeLines.length;
  }

  // Обновляем описание
  const descriptionElement = document.getElementById("roche-description");
  if (descriptionElement) {
    descriptionElement.innerHTML = `
            <h4><i class="fas fa-info-circle"></i> Режим: ${
              modeNames[mode] || mode
            }</h4>
            <p><strong>Активные линии:</strong> ${activeLines
              .map((l) => l.replace("line-", ""))
              .join(", ")}</p>
            <p><strong>Аналиты сортирующиеся в зону Roche:</strong></p>
            <div class="test-list">
                ${currentTests
                  .map(
                    (test) => `
                    <button class="test-button" onclick="selectTest('${test}')">${test}</button>
                `
                  )
                  .join("")}
            </div>
            <p><strong>Всего активных элементов:</strong> ${
              activeLines.length
            } из ${allLines.length}</p>
        `;
  }

  showNotification(
    `Режим Roche установлен: ${modeNames[mode] || mode}`,
    "success"
  );
}

function updateSortersVisualization(mode) {
  const sorters = ["sorter-s2", "sorter-s3"];

  sorters.forEach((sorterId) => {
    const sorter = document.getElementById(sorterId);
    if (!sorter) return;

    // Обновляем контейнер Roche
    const rocheContainer = sorter.querySelector(".roche-container");
    if (rocheContainer) {
      rocheContainer.innerHTML = "";

      // Создаем сетку точек
      for (let i = 0; i < 8; i++) {
        const row = document.createElement("div");
        row.className = "row";

        for (let j = 0; j < 5; j++) {
          const circle = document.createElement("div");
          circle.className = "circle";

          // Случайная активация точек в зависимости от режима
          if (
            Math.random() >
            (mode === "routine" ? 0.4 : mode === "mode1" ? 0.6 : 0.7)
          ) {
            circle.classList.add("active");
          }

          row.appendChild(circle);
        }

        rocheContainer.appendChild(row);
      }
    }

    // Обновляем зоны ввода/вывода
    updateSorterZones(sorterId);
  });
}

function updateSorterZones(sorterId) {
  const sorter = document.getElementById(sorterId);
  if (!sorter) return;

  const zones = ["input", "aliquot"];

  zones.forEach((zone) => {
    const zoneElement = sorter.querySelector(`.${zone}-zone .zone-content`);
    if (zoneElement) {
      zoneElement.innerHTML = "";

      // Добавляем случайное количество элементов
      const count = Math.floor(Math.random() * 5) + 1;
      for (let i = 0; i < count; i++) {
        const sample = document.createElement("div");
        sample.className = "sample-item";
        sample.style.cssText = `
                    width: 12px;
                    height: 12px;
                    background: ${zone === "input" ? "#667eea" : "#10b981"};
                    border-radius: 2px;
                    margin: 2px;
                    display: inline-block;
                `;
        zoneElement.appendChild(sample);
      }
    }
  });
}

function selectTest(testName) {
  showNotification(`Выбран тест: ${testName}`, "info");

  // Добавляем анимацию выделения
  const testButtons = document.querySelectorAll(".test-button");
  testButtons.forEach((btn) => {
    if (btn.textContent === testName) {
      btn.style.animation = "pulse 0.5s";
      setTimeout(() => {
        btn.style.animation = "";
      }, 500);
    }
  });
}

// Инициализация Roche модуля при загрузке
function initRocheModule() {
  // Устанавливаем начальный режим
  setRocheMode("routine");

  // Запускаем анимацию
  animateRocheSystem();

  // Обновляем статус системы
  updateSystemStatus();
}

function animateRocheSystem() {
  // Анимация точек в контейнерах Roche
  setInterval(() => {
    document.querySelectorAll(".circle").forEach((circle) => {
      if (Math.random() > 0.8) {
        circle.classList.toggle("active");
      }
    });
  }, 1000);

  // Анимация сегментов линий
  setInterval(() => {
    document.querySelectorAll(".active-line .segment").forEach((segment) => {
      if (Math.random() > 0.7) {
        segment.classList.toggle("active");
      }
    });
  }, 2000);
}

function updateSystemStatus() {
  // Обновляем счетчики в реальном времени
  setInterval(() => {
    const samplesElement = document.getElementById("samples-hour");
    if (samplesElement) {
      const current = parseInt(samplesElement.textContent) || 120;
      const change = Math.floor(Math.random() * 20) - 10;
      const newValue = Math.max(80, Math.min(200, current + change));
      samplesElement.textContent = newValue;
    }

    const loadElement = document.getElementById("system-load");
    if (loadElement) {
      const current = parseInt(loadElement.textContent) || 78;
      const change = Math.floor(Math.random() * 10) - 5;
      const newValue = Math.max(60, Math.min(95, current + change));
      loadElement.textContent = `${newValue}%`;
    }
  }, 5000);
}

// ===== Модуль расчетов =====
function calculateNaOH() {
  const waterVolume = parseFloat(document.getElementById("water-volume").value);
  const molarity = parseFloat(document.getElementById("molarity").value);

  if (!waterVolume || !molarity || waterVolume < 1 || waterVolume > 1000) {
    showNotification("Введите корректные значения!", "error");
    return;
  }

  const molarMassNaOH = 40; // г/моль
  const result = molarity * molarMassNaOH * (waterVolume / 1000);

  const resultElement = document.getElementById("calculation-result");
  resultElement.innerHTML = `
                <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: var(--radius-lg); padding: 20px;">
                    <h4 style="margin-bottom: 16px; color: #10b981;">
                        <i class="fas fa-check-circle"></i> Результаты расчета
                    </h4>
                    <div style="margin-bottom: 12px;">
                        <div style="color: var(--text-secondary); font-size: 14px;">Объем воды:</div>
                        <div style="font-size: 18px; font-weight: 600;">${waterVolume} мл</div>
                    </div>
                    <div style="margin-bottom: 12px;">
                        <div style="color: var(--text-secondary); font-size: 14px;">Молярность:</div>
                        <div style="font-size: 18px; font-weight: 600;">${molarity} M</div>
                    </div>
                    <div style="margin-bottom: 12px;">
                        <div style="color: var(--text-secondary); font-size: 14px;">Молярная масса NaOH:</div>
                        <div style="font-size: 18px; font-weight: 600;">40 г/моль</div>
                    </div>
                    <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border-color);">
                        <div style="color: var(--text-secondary); font-size: 14px;">Необходимое количество NaOH:</div>
                        <div style="font-size: 24px; font-weight: 700; color: #10b981; margin-top: 8px;">
                            ${result.toFixed(2)} г
                        </div>
                    </div>
                </div>
            `;
  resultElement.style.display = "block";

  showNotification("Расчет выполнен успешно", "success");
}

// ===== Модуль аликвот =====
function printAliquots() {
  const name = document.getElementById("aliquot-name").value.trim();
  const lot = document.getElementById("aliquot-lot").value.trim();
  const count = document.getElementById("aliquot-count").value;
  const volume = document.getElementById("aliquot-volume").value.trim();

  if (!name || !lot || !count || !volume) {
    showNotification("Заполните все поля!", "error");
    return;
  }

  const countNum = parseInt(count, 10);
  if (isNaN(countNum) || countNum > 10) {
    showNotification("Максимум 10 этикеток за раз!", "error");
    return;
  }

  const aliquotData = {
    type: "custom",
    text: name,
    lot: lot,
    retry: countNum,
    volume: volume,
    timestamp: new Date().toISOString(),
  };

  // Сохранить в историю
  let history = JSON.parse(localStorage.getItem("aliquotHistory") || "[]");
  history.unshift({
    ...aliquotData,
    date: new Date().toLocaleString("ru-RU"),
  });
  localStorage.setItem("aliquotHistory", JSON.stringify(history.slice(0, 20))); // Храним последние 20 записей

  // Копировать в буфер обмена
  copyToClipboard(JSON.stringify(aliquotData, null, 2))
    .then(() => {
      showNotification(
        `✅ Этикетки "${name}" (${count} шт.) скопированы в буфер`,
        "success"
      );
      updateAliquotHistory();
    })
    .catch((err) => {
      console.error("Ошибка копирования:", err);
      showNotification("Ошибка копирования в буфер", "error");
    });
}

function clearAliquotForm() {
  document.getElementById("aliquot-name").value = "";
  document.getElementById("aliquot-lot").value = "";
  document.getElementById("aliquot-count").value = "";
  document.getElementById("aliquot-volume").value = "";
  showNotification("Форма очищена", "info");
}

function updateAliquotHistory() {
  const historyElement = document.getElementById("aliquot-history");
  if (!historyElement) return;

  const history = JSON.parse(localStorage.getItem("aliquotHistory") || "[]");

  if (history.length === 0) {
    historyElement.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 16px;"></i>
                <h3>Нет данных</h3>
                <p>Здесь появится история распечатанных этикеток</p>
            </div>
        `;
    return;
  }

  historyElement.innerHTML = history
    .map(
      (item) => `
        <div style="
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            padding: 16px;
            margin-bottom: 12px;
        ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="font-weight: 600; color: var(--text-primary);">${item.text}</div>
                <div style="font-size: 12px; color: var(--text-secondary);">${item.date}</div>
            </div>
            <div style="display: flex; gap: 16px; font-size: 14px; color: var(--text-secondary);">
                <span>Лот: ${item.lot}</span>
                <span>Кол-во: ${item.retry} шт.</span>
                <span>Объем: ${item.volume}</span>
            </div>
        </div>
    `
    )
    .join("");
}

// ===== Утилиты =====
function copyToClipboard(text) {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  } else {
    // Fallback для старых браузеров
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    return Promise.resolve();
  }
}

function showNotification(message, type = "info") {
  const notification = document.getElementById("notification");
  if (!notification) return;

  // Очищаем предыдущие уведомления
  notification.innerHTML = "";

  const icon =
    {
      success: "fa-check-circle",
      error: "fa-exclamation-circle",
      info: "fa-info-circle",
      warning: "fa-exclamation-triangle",
    }[type] || "fa-info-circle";

  const color =
    {
      success: "#10b981",
      error: "#ef4444",
      info: "#667eea",
      warning: "#f59e0b",
    }[type] || "#667eea";

  const notificationItem = document.createElement("div");
  notificationItem.className = "notification-item";
  notificationItem.style.cssText = `
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid ${color}30;
    border-left: 4px solid ${color};
    border-radius: var(--radius-md);
    padding: 16px;
    margin-bottom: 10px;
    animation: slideInRight 0.3s ease;
    display: flex;
    align-items: center;
    gap: 12px;
  `;

  notificationItem.innerHTML = `
    <i class="fas ${icon}" style="color: ${color}; font-size: 20px;"></i>
    <div style="flex: 1;">
      <div style="font-weight: 600; color: var(--text-primary);">${message}</div>
      <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
        ${new Date().toLocaleTimeString("ru-RU", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>
    </div>
    <button onclick="this.parentElement.remove()" style="
      background: none;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      padding: 4px;
      border-radius: var(--radius-sm);
    ">
      <i class="fas fa-times"></i>
    </button>
  `;

  notification.appendChild(notificationItem);

  // Автоматическое удаление через 5 секунд
  setTimeout(() => {
    if (notificationItem.parentElement) {
      notificationItem.style.animation = "slideOutRight 0.3s ease";
      setTimeout(() => {
        if (notificationItem.parentElement) {
          notificationItem.remove();
        }
      }, 300);
    }
  }, 2000);
}

function getRussianPlural(number, one, two, five) {
  let n = Math.abs(number);
  n %= 100;
  if (n >= 5 && n <= 20) {
    return five;
  }
  n %= 10;
  if (n === 1) {
    return one;
  }
  if (n >= 2 && n <= 4) {
    return two;
  }
  return five;
}

function toggleMobileMenu() {
  const mobileMenu = document.getElementById("mobile-menu");
  const hamburger = document.querySelector(".hamburger");

  if (mobileMenu && hamburger) {
    mobileMenu.classList.toggle("active");
    hamburger.classList.toggle("active");

    // Блокировка скролла
    document.body.style.overflow = mobileMenu.classList.contains("active")
      ? "hidden"
      : "";
  }
}

function handleResize() {
  // Закрыть мобильное меню при увеличении экрана
  if (window.innerWidth >= 1024) {
    const mobileMenu = document.getElementById("mobile-menu");
    const hamburger = document.querySelector(".hamburger");

    if (mobileMenu && mobileMenu.classList.contains("active")) {
      mobileMenu.classList.remove("active");
      hamburger?.classList.remove("active");
      document.body.style.overflow = "";
    }
  }
}

// ===== Карусель для баннеров =====
class Carousel {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Carousel container #${containerId} not found`);
      return;
    }

    // Настройки
    this.options = {
      autoplay: true,
      autoplaySpeed: 5000,
      slidesToShow: 3,
      infinite: true,
      dots: true,
      arrows: true,
      draggable: false,
      ...options,
    };

    // Элементы DOM - используем querySelector для поиска внутри контейнера
    this.track = this.container.querySelector(".carousel-track");

    // Ищем слайды внутри трека
    if (this.track) {
      this.slides = this.track.querySelectorAll(".carousel-slide");
    } else {
      this.slides = [];
    }

    // Ищем элементы управления внутри контейнера карусели
    this.prevBtn = this.container.querySelector(".carousel-btn.prev");
    this.nextBtn = this.container.querySelector(".carousel-btn.next");
    this.dotsContainer = this.container.querySelector(".carousel-indicators");
    this.progressBar = this.container.querySelector(".carousel-progress-bar");

    // Состояние
    this.currentIndex = 0;
    this.slideCount = this.slides.length;
    this.slidesPerView = Math.min(this.options.slidesToShow, this.slideCount);

    // Для бесконечной карусели
    if (this.options.infinite && this.slideCount > 0) {
      this.setupInfiniteSlides();
    } else {
      this.maxIndex = Math.max(0, this.slideCount - this.slidesPerView);
    }

    this.interval = null;
    this.isAutoPlaying = this.options.autoplay;
    this.dots = [];
    this.isTransitioning = false;

    console.log(`Carousel ${containerId} initialized:`, {
      slides: this.slideCount,
      slidesPerView: this.slidesPerView,
      infinite: this.options.infinite,
      elementsFound: {
        track: !!this.track,
        slides: this.slides.length,
        prevBtn: !!this.prevBtn,
        nextBtn: !!this.nextBtn,
        dotsContainer: !!this.dotsContainer,
      },
    });

    if (this.slideCount > 0) {
      this.init();
    }
  }

  setupInfiniteSlides() {
    // Клонируем первый и последний слайды
    if (this.slideCount < 2) return;

    const firstSlide = this.slides[0];
    const lastSlide = this.slides[this.slideCount - 1];

    // Клонируем
    const firstClone = firstSlide.cloneNode(true);
    const lastClone = lastSlide.cloneNode(true);

    // Добавляем клоны
    this.track.appendChild(firstClone); // Клон первого в конец
    this.track.insertBefore(lastClone, firstSlide); // Клон последнего в начало

    // Обновляем список слайдов
    this.slides = this.track.querySelectorAll(".carousel-slide");

    // Устанавливаем начальную позицию (1, потому что добавили клон в начало)
    this.currentIndex = 1;
    this.slideCount = this.slides.length;
    this.maxIndex = this.slideCount - 1;

    console.log("Infinite slides setup:", {
      originalCount: this.slideCount - 2, // минус 2 клона
      totalCount: this.slideCount,
      currentIndex: this.currentIndex,
    });
  }

  init() {
    // Устанавливаем размеры
    this.setupSlides();

    // Создаем точки навигации
    if (this.options.dots) {
      this.generateDots();
    }

    // Настраиваем кнопки
    if (this.options.arrows) {
      this.setupArrows();
    }

    // Обновляем отображение
    this.updateCarousel();

    // Настраиваем обработчики
    this.setupEventListeners();

    // Запускаем автопрокрутку
    if (this.options.autoplay) {
      this.startAutoSlide();
    }
  }

  setupSlides() {
    if (this.slides.length === 0) return;

    // Рассчитываем ширину слайда
    const slideWidth = 100 / this.slidesPerView;

    // Устанавливаем стили для каждого слайда
    this.slides.forEach((slide) => {
      slide.style.flex = `0 0 ${slideWidth}%`;
      slide.style.maxWidth = `${slideWidth}%`;
    });

    // Рассчитываем ширину трека
    const trackWidth = (100 * this.slideCount) / this.slidesPerView;
    this.track.style.width = `${trackWidth}%`;
  }

  generateDots() {
    if (!this.dotsContainer) return;

    this.dotsContainer.innerHTML = "";
    this.dots = [];

    // Количество точек = количество оригинальных слайдов
    const originalSlides = this.options.infinite
      ? this.slideCount - 2 // минус клоны
      : this.slideCount;

    console.log(`Generating ${originalSlides} dots`);

    for (let i = 0; i < originalSlides; i++) {
      const dot = document.createElement("button");
      dot.className = "carousel-indicator";
      dot.setAttribute("data-index", i);

      dot.addEventListener("click", () => {
        if (this.isTransitioning) return;
        this.goToSlide(i);
      });

      this.dotsContainer.appendChild(dot);
      this.dots.push(dot);
    }

    this.updateDots();
  }

  setupArrows() {
    if (this.prevBtn) {
      this.prevBtn.addEventListener("click", () => {
        if (this.isTransitioning) return;
        this.prevSlide();
      });
    }

    if (this.nextBtn) {
      this.nextBtn.addEventListener("click", () => {
        if (this.isTransitioning) return;
        this.nextSlide();
      });
    }
  }

  setupEventListeners() {
    // Ресайз
    window.addEventListener("resize", () => this.handleResize());

    // Пауза при наведении
    if (this.container) {
      this.container.addEventListener("mouseenter", () =>
        this.pauseAutoSlide()
      );
      this.container.addEventListener("mouseleave", () =>
        this.resumeAutoSlide()
      );
    }

    // Обработчик завершения анимации
    if (this.track) {
      this.track.addEventListener("transitionend", () =>
        this.handleTransitionEnd()
      );
    }
  }

  handleResize() {
    // Пересчитываем при изменении размера
    const newSlidesPerView = this.calculateSlidesPerView();

    if (newSlidesPerView !== this.slidesPerView) {
      this.slidesPerView = newSlidesPerView;

      if (!this.options.infinite) {
        this.maxIndex = Math.max(0, this.slideCount - this.slidesPerView);
      }

      this.setupSlides();
      this.updateCarousel();
    }
  }

  calculateSlidesPerView() {
    if (!this.container || this.slideCount === 0) return 1;

    const containerWidth = this.container.offsetWidth;

    // Адаптивные брейкпоинты
    if (containerWidth <= 768) return 1;
    if (containerWidth <= 1200) return 2;

    return Math.min(this.options.slidesToShow, this.slideCount);
  }

  updateCarousel() {
    if (!this.track || this.slides.length === 0) return;

    this.isTransitioning = true;

    // Рассчитываем смещение
    const slideWidth = 100 / this.slidesPerView;
    const translateX = this.currentIndex * slideWidth;

    console.log(
      `Update: index=${this.currentIndex}, translateX=${translateX}%`
    );

    this.track.style.transform = `translateX(-${translateX}%)`;
    this.track.style.transition = "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)";

    // Обновляем точки
    this.updateDots();

    // Обновляем кнопки
    this.updateArrows();
  }

  updateDots() {
    if (this.dots.length === 0) return;

    // Рассчитываем активный индекс для точек
    let activeIndex;
    if (this.options.infinite) {
      // Для бесконечной карусели: учитываем клоны
      const originalSlides = this.slideCount - 2;
      if (this.currentIndex === 0) {
        activeIndex = originalSlides - 1; // Последний оригинальный слайд
      } else if (this.currentIndex === this.slideCount - 1) {
        activeIndex = 0; // Первый оригинальный слайд
      } else {
        activeIndex = (this.currentIndex - 1) % originalSlides;
      }
    } else {
      activeIndex = this.currentIndex;
    }

    this.dots.forEach((dot, index) => {
      const isActive = index === activeIndex;
      dot.classList.toggle("active", isActive);
      dot.setAttribute("aria-current", isActive);
    });
  }

  updateArrows() {
    if (!this.options.arrows) return;

    if (this.prevBtn) {
      // Для бесконечной карусели кнопки всегда активны
      const isDisabled = !this.options.infinite && this.currentIndex === 0;
      this.prevBtn.disabled = isDisabled;
      this.prevBtn.style.opacity = isDisabled ? "0.3" : "1";
    }

    if (this.nextBtn) {
      const isDisabled =
        !this.options.infinite && this.currentIndex >= this.maxIndex;
      this.nextBtn.disabled = isDisabled;
      this.nextBtn.style.opacity = isDisabled ? "0.3" : "1";
    }
  }

  nextSlide() {
    this.currentIndex++;
    this.updateCarousel();
    this.resetAutoSlide();
  }

  prevSlide() {
    this.currentIndex--;
    this.updateCarousel();
    this.resetAutoSlide();
  }

  goToSlide(index) {
    if (this.options.infinite) {
      // Для бесконечной карусели: индекс + 1 (из-за клона в начале)
      this.currentIndex = index + 1;
    } else {
      this.currentIndex = Math.min(index, this.maxIndex);
    }

    this.updateCarousel();
    this.resetAutoSlide();
  }

  handleTransitionEnd() {
    this.isTransitioning = false;

    if (!this.options.infinite) return;

    // Проверяем границы для бесконечной карусели
    if (this.currentIndex === 0) {
      // Перескакиваем на предпоследний слайд (который оригинальный последний)
      this.track.style.transition = "none";
      this.currentIndex = this.slideCount - 2;
      const slideWidth = 100 / this.slidesPerView;
      const translateX = this.currentIndex * slideWidth;
      this.track.style.transform = `translateX(-${translateX}%)`;

      // Восстанавливаем transition
      setTimeout(() => {
        this.track.style.transition =
          "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)";
      }, 50);
    } else if (this.currentIndex === this.slideCount - 1) {
      // Перескакиваем на второй слайд (который оригинальный первый)
      this.track.style.transition = "none";
      this.currentIndex = 1;
      const slideWidth = 100 / this.slidesPerView;
      const translateX = this.currentIndex * slideWidth;
      this.track.style.transform = `translateX(-${translateX}%)`;

      // Восстанавливаем transition
      setTimeout(() => {
        this.track.style.transition =
          "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)";
      }, 50);
    }

    this.updateDots();
  }

  startAutoSlide() {
    if (this.interval) clearInterval(this.interval);

    this.interval = setInterval(() => {
      if (this.isAutoPlaying && !this.isTransitioning) {
        this.nextSlide();
      }
    }, this.options.autoplaySpeed);
  }

  pauseAutoSlide() {
    this.isAutoPlaying = false;
  }

  resumeAutoSlide() {
    this.isAutoPlaying = true;
  }

  resetAutoSlide() {
    if (this.interval) {
      clearInterval(this.interval);
      this.startAutoSlide();
    }
  }
}

// ===== Расширенные функции =====
function exportData() {
  const exportData = {
    barcodeHistory: state.barcodeHistory,
    aliquotHistory: JSON.parse(localStorage.getItem("aliquotHistory") || "[]"),
    reagentData: state.reagentData,
    exportDate: new Date().toISOString(),
    version: "1.0.0",
  };

  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });

  const downloadLink = document.createElement("a");
  downloadLink.href = URL.createObjectURL(dataBlob);
  downloadLink.download = `lab-assistant-export-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);

  showNotification("Данные экспортированы", "success");
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const importedData = JSON.parse(e.target.result);

      if (confirm("Импортировать данные? Текущие данные будут заменены.")) {
        if (importedData.barcodeHistory) {
          state.barcodeHistory = importedData.barcodeHistory;
          localStorage.setItem(
            "barcodeHistory",
            JSON.stringify(state.barcodeHistory)
          );
        }

        if (importedData.aliquotHistory) {
          localStorage.setItem(
            "aliquotHistory",
            JSON.stringify(importedData.aliquotHistory)
          );
        }

        if (importedData.reagentData) {
          Object.assign(state.reagentData, importedData.reagentData);
          generateRacks();
        }

        updateBarcodeDisplay();
        updateAliquotHistory();
        showNotification("Данные импортированы", "success");
      }
    } catch (error) {
      console.error("Ошибка импорта:", error);
      showNotification("Ошибка импорта данных", "error");
    }
  };

  reader.readAsText(file);

  // Сброс input для возможности повторного выбора того же файла
  event.target.value = "";
}

function resetApp() {
  if (confirm("Вы уверены? Все данные будут удалены.")) {
    localStorage.clear();
    Object.assign(state, {
      barcodeHistory: [],
      aliquotHistory: [],
      reagentData: {},
      currentModule: "home",
      barcodeMode: "default",
      selectedReagent: null,
      rocheMode: "routine",
    });

    // Инициализация данных реагентов
    const racks = ["D1", "D2", "D3", "R1", "R2", "R3", "R4", "R5", "R6"];
    racks.forEach((rack) => {
      state.reagentData[rack] = Array(6).fill(null);
    });

    updateBarcodeDisplay();
    updateAliquotHistory();
    generateRacks();
    closeAllContainers();

    showNotification("Приложение сброшено", "info");
  }
}

// ===== Горячие клавиши =====
document.addEventListener("keydown", (e) => {
  // Ctrl+B - открыть модуль баркодов
  if (e.ctrlKey && e.key === "b") {
    e.preventDefault();
    showModule("barcode");
  }

  // Ctrl+R - открыть модуль реагентов
  if (e.ctrlKey && e.key === "r") {
    e.preventDefault();
    showModule("reagent");
  }

  // Ctrl+A - открыть модуль аликвот
  if (e.ctrlKey && e.key === "a") {
    e.preventDefault();
    showModule("aliquots");
  }

  // Ctrl+H - вернуться на главную
  if (e.ctrlKey && e.key === "h") {
    e.preventDefault();
    showModule("home");
  }

  // Ctrl+Shift+R - сброс приложения
  if (e.ctrlKey && e.shiftKey && e.key === "R") {
    e.preventDefault();
    resetApp();
  }
});

function generateAlictoveContainer(name) {
  showModule("alicvote-container");
  // 2. Получаем контейнер правильно
  const currentContainer = document.getElementById("alicvote-container");

  // 3. Проверяем, что контейнер существует
  if (!currentContainer) {
    console.error("Aliquot container not found!");
    return;
  }

  const placeContent = document.getElementById("container-aliquote");

  // 4. Создаем содержимое
  const content = `<div class="aliquot-content">
      <h2><i class="fas fa-flask"></i> Создание аликвот для: ${
        name || "Образец"
      }</h2>
      
      <div class="aliquot-form">
        <div class="input-group">
          <label class="input-label">
            <i class="fas fa-tag"></i>
            Аликвот 1
          </label>
          <input 
            type="text" 
            class="input-field" 
            id="aliquot-name-1" 
            value="${name || ""} 1"
            placeholder="Название аликвота 1"
          />
        </div>
        
        <div class="input-group">
          <label class="input-label">
            <i class="fas fa-tag"></i>
            Аликвот 2
          </label>
          <input 
            type="text" 
            class="input-field" 
            id="aliquot-name-2" 
            value="${name || ""} 2"
            placeholder="Название аликвота 2"
          />
        </div>
        
        <div class="input-group">
          <label class="input-label">
            <i class="fas fa-hashtag"></i>
            Номер лота
          </label>
          <input 
            type="text" 
            class="input-field" 
            id="aliquot-lot" 
            placeholder="Введите номер лота"
            autocomplete="off"
          />
        </div>
        
        <div class="input-group">
          <label class="input-label">
            <i class="fas fa-weight"></i>
            Объем (мкл)
          </label>
          <input 
            type="number" 
            class="input-field" 
            id="aliquot-volume" 
            placeholder="Укажите объем"
            min="1"
            max="10000"
            step="1"
          />
        </div>
      </div>
      
      <div class="aliquot-actions" style="display: flex; gap: 12px;">
        <button class="btn btn-primary" onclick="printAliquotsFromForm()">
          <i class="fas fa-print"></i> Печать этикеток
        </button>
      </div>
    </div>
  `;

  placeContent.innerHTML = content;
}

// Данные тестов
const floatingTests = [
  // Биохимические
  { name: "АЛТ", type: "biochem" },
  { name: "АСТ", type: "biochem" },
  { name: "Глюкоза", type: "biochem" },
  { name: "Креатинин", type: "biochem" },
  { name: "Мочевина", type: "biochem" },
  { name: "Билирубин", type: "biochem" },
  { name: "Холестерин", type: "biochem" },
  { name: "Триглицериды", type: "biochem" },
  { name: "Калий", type: "biochem" },
  { name: "Натрий", type: "biochem" },
  { name: "Кальций", type: "biochem" },
  { name: "Альбумин", type: "biochem" },
  { name: "ЛДГ", type: "biochem" },
  { name: "ЩФ", type: "biochem" },
  { name: "ГГТ", type: "biochem" },
  { name: "Амилаза", type: "biochem" },
  { name: "СРБ", type: "biochem" },
  { name: "Мочевая кислота", type: "biochem" },
  { name: "Железо", type: "biochem" },
  { name: "Ферритин", type: "biochem" },

  // Иммунохимические
  { name: "ТТГ", type: "immuno" },
  { name: "Т4 свободный", type: "immuno" },
  { name: "Т3 свободный", type: "immuno" },
  { name: "АТ-ТПО", type: "immuno" },
  { name: "Кортизол", type: "immuno" },
  { name: "Инсулин", type: "immuno" },
  { name: "С-пептид", type: "immuno" },
  { name: "Пролактин", type: "immuno" },
  { name: "ФСГ", type: "immuno" },
  { name: "ЛГ", type: "immuno" },
  { name: "Прогестерон", type: "immuno" },
  { name: "Эстрадиол", type: "immuno" },
  { name: "Тестостерон", type: "immuno" },
  { name: "ПСА", type: "immuno" },
  { name: "Витамин D", type: "immuno" },
  { name: "В12", type: "immuno" },
  { name: "ХГЧ", type: "immuno" },
  { name: "Иммуноглобулин E", type: "immuno" },
  { name: "Ревматоидный фактор", type: "immuno" },
  { name: "Анти-ЦЦП", type: "immuno" },

  // Специальные
  { name: "Гемоглобин", type: "special" },
  { name: "Лейкоциты", type: "special" },
  { name: "Тромбоциты", type: "special" },
  { name: "СОЭ", type: "special" },
  { name: "Гликозилированный Hb", type: "special" },
  { name: "МНО", type: "special" },
  { name: "АЧТВ", type: "special" },
  { name: "Протромбин", type: "special" },
  { name: "Фибриноген", type: "special" },
];

class FloatingTests {
  constructor() {
    this.container = document.querySelector(".floating-container");
    this.testElements = [];
    this.isPlaying = true;
    this.speed = "fast";
    this.speedSettings = {
      slow: { duration: 20, delay: 5 },
      normal: { duration: 15, delay: 3 },
      fast: { duration: 10, delay: 1 },
    };

    this.init();
  }

  init() {
    this.createTestElements();
    this.startAnimation();
    this.setupEventListeners();
  }

  createTestElements() {
    floatingTests.forEach((test, index) => {
      const bubble = document.createElement("div");
      bubble.className = `test-bubble ${test.type}`;
      bubble.textContent = test.name;
      bubble.style.left = `${Math.random() * 90}%`;
      bubble.style.animationDuration = `${
        this.speedSettings[this.speed].duration + Math.random() * 5
      }s`;
      bubble.style.animationDelay = `${Math.random() * 10}s`;

      // Случайный размер
      const size = 0.8 + Math.random() * 0.4;
      bubble.style.transform = `scale(${size})`;

      // Клик по тесту
      bubble.addEventListener("click", () => {
        this.showTestInfo(test.name);
      });

      this.container.appendChild(bubble);
      this.testElements.push(bubble);
    });
  }

  startAnimation() {
    this.testElements.forEach((bubble) => {
      bubble.style.animationPlayState = "running";
    });
  }

  pauseAnimation() {
    this.testElements.forEach((bubble) => {
      bubble.style.animationPlayState = "paused";
    });
  }

  resumeAnimation() {
    this.testElements.forEach((bubble) => {
      bubble.style.animationPlayState = "running";
    });
  }

  changeSpeed(newSpeed) {
    this.speed = newSpeed;
    const settings = this.speedSettings[newSpeed];

    this.testElements.forEach((bubble, index) => {
      bubble.style.animationDuration = `${
        settings.duration + Math.random() * 5
      }s`;
      bubble.style.animationDelay = `${Math.random() * 5}s`;
    });

    // Обновляем активную кнопку скорости
    document.querySelectorAll(".control-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    document
      .querySelector(`[onclick="changeTestSpeed('${newSpeed}')"]`)
      .classList.add("active");
  }

  showTestInfo(testName) {
    showNotification(`Тест: ${testName}`, "info");

    // Эффект при клике
    const bubble = event.target;
    bubble.style.transform = "scale(1.3)";
    bubble.style.boxShadow = "0 15px 30px rgba(255, 255, 255, 0.5)";

    setTimeout(() => {
      bubble.style.transform = "";
      bubble.style.boxShadow = "";
    }, 300);
  }

  setupEventListeners() {
    // Обработчики уже установлены через onclick в HTML
  }

  toggleAnimation() {
    this.isPlaying = !this.isPlaying;

    const pauseIcon = document.getElementById("pauseIcon");
    const pauseText = document.getElementById("pauseText");

    if (this.isPlaying) {
      this.resumeAnimation();
      pauseIcon.className = "fas fa-pause";
      pauseText.textContent = "Пауза";
    } else {
      this.pauseAnimation();
      pauseIcon.className = "fas fa-play";
      pauseText.textContent = "Продолжить";
    }
  }
}

// Глобальные функции для кнопок
let floatingTestsInstance;

function initFloatingTests() {
  floatingTestsInstance = new FloatingTests();
}

function changeTestSpeed(speed) {
  if (floatingTestsInstance) {
    floatingTestsInstance.changeSpeed(speed);
  }
}

function toggleTestsAnimation() {
  if (floatingTestsInstance) {
    floatingTestsInstance.toggleAnimation();
  }
}

// Инициализация при загрузке страницы
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    initFloatingTests();
  }, 1000);
});

// ===== Экспорт функций в глобальную область видимости =====
// Нужно для обработчиков onclick в HTML
window.showModule = showModule;
window.selectMode = selectMode;
window.saveBarcode = saveBarcode;
window.clearBarcodeInput = clearBarcodeInput;
window.simulateScan = simulateScan;
window.reprintBarcode = reprintBarcode;
window.deleteBarcode = deleteBarcode;
window.specialLabel = specialLabel;
window.selectReagent = selectReagent;
window.fillHole = fillHole;
window.clearSelection = clearSelection;
window.clearAllRacks = clearAllRacks;
window.setRocheMode = setRocheMode;
window.selectTest = selectTest;
window.calculateNaOH = calculateNaOH;
window.printAliquots = printAliquots;
window.clearAliquotForm = clearAliquotForm;
window.exportData = exportData;
window.importData = importData;
window.resetApp = resetApp;
window.toggleMobileMenu = toggleMobileMenu;
window.closeAllContainers = closeAllContainers;
