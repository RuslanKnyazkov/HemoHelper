const state = {
  currentModule: "home",
  barcodeMode: "default",
  barcodeHistory: [],
  selectedReagent: null,
  reagentData: {},
  rocheMode: "routine",
  aliquotHistory: [],
  isContainerOpen: false,
  retry: 1,
  selectCodeFormat: "B2N",
};

// Массив для хранения экземпляров каруселей
const carousels = [];

// ===== Инициализация приложения =====
document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
  setupEventListeners();
  generateRacks();
  updateBarcodeDisplay();
  selectCode("2of5");
  selectRetry("2");
  setTimeout(() => {
    const carousel1 = new Carousel("carousel1", {
      autoplay: true,
      autoplaySpeed: 2000,
      slidesToShow: 5,
      infinite: true,
      dots: true,
      arrows: true,
      draggable: true,
    });
    carousels.push(carousel1);

    const carousel2 = new Carousel("carousel2", {
      autoplay: true,
      autoplaySpeed: 4000,
      slidesToShow: 5,
      infinite: true,
      dots: true,
      arrows: true,
      draggable: true,
    });
    carousels.push(carousel2);

    const carousel3 = new Carousel("carousel-test", {
      autoplay: true,
      autoplaySpeed: 4000,
      slidesToShow: 4,
      infinite: true,
      dots: true,
      arrows: true,
      draggable: true,
    });
    carousels.push(carousel3);
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

function getCSRFToken() {
  const cookieValue = document.cookie
    .split("; ")
    .find((row) => row.startsWith("csrftoken="))
    ?.split("=")[1];
  return cookieValue || "";
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

  // Определяем, какие модули должны выезжать справа
  const slideModules = [
    "barcode",
    "reagent",
    "roche",
    "calculations",
    "aliquots",
    "alicvote-container",
    "test-module",
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
  } else if (moduleId === "roche") {
    initRocheModule();
  }
}

function selectCode(code) {
  const selectButtonCode = document.getElementById(code);
  let typeCode = ["128", "2of5"];
  typeCode.forEach((btn) => {
    document.getElementById(btn).classList.remove("active");
  });
  selectButtonCode.classList.add("active");
  if (code === "128") {
    state.selectCodeFormat = "BCN";
    showNotification("Установлен формат печати буквенно-числовой", "success");
  } else {
    state.selectCodeFormat = "B2N";
    showNotification("Установлен формат циферный", "success");
  }
}

function updateNavigation(moduleId) {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  const activeBtn = document.querySelector(
    `.nav-btn[onclick="showModule('${moduleId}')"]`,
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

    // Добавить затемнение фона
    document.body.classList.add("container-open");

    // Обновить состояние
    state.currentModule = moduleId;
    state.isContainerOpen = true;

    // Фокус на первый интерактивный элемент
    setTimeout(() => {
      const firstInput = targetContainer.querySelector(
        "input, button, select, textarea",
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
    case "a-thsr":
      modeCards[4]?.classList.add("active");
      break;
    case "dhea":
      modeCards[5]?.classList.add("active");
      break;
    case "Alinity":
      modeCards[6]?.classList.add("active");
      break;
    case "HbA1c":
      modeCards[7]?.classList.add("active");
      break;
  }
}

function selectRetry(count) {
  state.retry = count;

  document.querySelectorAll(".mode-card-btn").forEach((elem) => {
    elem.classList.remove("active");
  });

  const selectButton = document.querySelectorAll(".mode-card-btn");

  switch (count) {
    case "1":
      selectButton[0]?.classList.add("active");
      break;
    case "2":
      selectButton[1]?.classList.add("active");
      break;
    case "3":
      selectButton[2]?.classList.add("active");
      break;
  }
  console.log(`Колличество наклеек ${state.retry}`);
}

async function sendToDjango(data) {
  console.log(`📤 Отправка данных: ${JSON.stringify(data)}`);

  // Формируем данные для отправки
  const dataToSend = data || {
    type: "barcode",
    barcode: barcode,
    mode: mode || "standard",
    size: "s", // размер штрихкода
    anchor: "h", // позиционирование
    retry: state.retry || 1,
  };

  console.log("📦 Отправляемые данные:", dataToSend);

  try {
    // Отправляем POST запрос
    const response = await fetch("/save-barcode/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCSRFToken(),
      },
      body: JSON.stringify(dataToSend),
    });

    console.log(`📥 Статус ответа: ${response.status}`);

    if (!response.ok) {
      // Пытаемся прочитать текст ошибки
      let errorText = await response.text();
      console.error(`❌ Ошибка сервера: ${response.status}`, errorText);

      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP ${response.status}`);
      } catch {
        throw new Error(`Ошибка сервера: ${response.status} - ${errorText}`);
      }
    }

    const data = await response.json();
    console.log("✅ Ответ сервера:", data);

    if (!data.success) {
      throw new Error(data.error || "Неизвестная ошибка сервера");
    }

    return data;
  } catch (error) {
    console.error("❌ Ошибка отправки на сервер:", error);
    throw error;
  }
}

async function saveBarcode() {
  const input = document.getElementById("barcode-input");
  if (!input) {
    console.error("❌ Не найден элемент barcode-input");
    return;
  }

  const barcode = input.value.trim();
  if (!barcode) {
    showNotification("Введите номер пробы!", "error");
    input.focus();
    return;
  }

  // Проверка на дубликат в текущей сессии
  const isDuplicate = state.barcodeHistory.some(
    (item) => item.number === barcode,
  );
  if (
    isDuplicate &&
    !confirm("Такой номер уже был добавлен. Добавить повторно?")
  ) {
    return;
  }

  // Создаем объект для текущей сессии
  const barcodeObject = {
    type: "barcode",
    barcode: barcode,
    number: barcode,
    mode: state.barcodeMode,
    anchor: "h",
    size: "s",
    retry: state.retry,
    code: state.selectCodeFormat || "B2N",
  };

  // Добавляем в историю текущей сессии
  state.barcodeHistory.unshift(barcodeObject);

  try {
    console.log("🔄 Отправка на Django сервер...");
    const serverResponse = await sendToDjango(barcodeObject);
    console.log("✅ Данные успешно отправлены на сервер:", serverResponse);

    showNotification(`✅ Проба "${barcode}" отправлена на печать!`, "success");
  } catch (error) {
    console.error("❌ Ошибка отправки на сервер:", error);
    showNotification(`❌ Ошибка отправки: ${error.message}`, "error");
  }

  // Обновляем интерфейс и очищаем поле
  updateBarcodeDisplay();
  input.value = "";
  input.focus();
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
    100000000 + Math.random() * 900000000,
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
    "проб",
  )} (текущая сессия)`;

  if (count === 0) {
    historyElement.innerHTML = `
      <div class="empty-state" style="text-align: center; padding: 40px; color: var(--text-secondary);">
        <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 16px;"></i>
        <h3 style="margin-bottom: 8px;">Нет сохраненных проб</h3>
        <p>Добавьте первую пробу через форму слева</p>
        <p style="font-size: 12px; margin-top: 10px; color: #888;">
          <i class="fas fa-info-circle"></i> Данные хранятся только в текущей сессии
        </p>
      </div>
    `;
    return;
  }

  historyElement.innerHTML = state.barcodeHistory
    .map(
      (item) => `
        <div class="history-item" style="
            background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 12px;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div style="
                    font-size: 18px; 
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    position: relative;
                    z-index: 1;
                ">
                    <div style="
                        width: 32px;
                        height: 32px;
                        background: rgba(102, 126, 234, 0.1);
                        color: #667eea;
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 14px;
                        font-weight: 600;
                    ">
                        <i class="fas fa-barcode"></i>
                    </div>
                    <span>Номер пробы: ${item.number}</span>
                </div>
                
                <div style="display: flex; align-items: center; gap: 12px; position: relative; z-index: 1;">
                    <div style="
                        background: rgba(34, 197, 94, 0.1);
                        color: #22c55e;
                        padding: 6px 16px;
                        border-radius: 20px;
                        font-size: 13px;
                        font-weight: 500;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        border: 1px solid rgba(34, 197, 94, 0.2);
                    ">
                        <i class="fas fa-sticky-note"></i>
                        Кол-во наклеек: ${state.retry || 1}
                    </div>
                    
                    <span style="
                        background: rgba(102, 126, 234, 0.1); 
                        color: #667eea; 
                        padding: 6px 16px; 
                        border-radius: 20px; 
                        font-size: 12px;
                        font-weight: 500;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        border: 1px solid rgba(102, 126, 234, 0.2);
                    ">
                        <i class="fas fa-${getModeIcon(item.mode)}"></i>
                        ${getModeDisplayName(item.mode)}
                    </span>
                    
                    <span style="
                        color: var(--text-secondary); 
                        font-size: 12px;
                        background: rgba(255,255,255,0.05);
                        padding: 6px 12px;
                        border-radius: 20px;
                        border: 1px solid rgba(255,255,255,0.1);
                    ">
                        <i class="far fa-clock"></i>
                        ${
                          item.date ||
                          new Date().toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        }
                    </span>
                </div>
            </div>
            
            <!-- Кнопки действий -->
            <div style="display: flex; gap: 8px; position: relative; z-index: 1;">
                <button class="btn" style="
                    flex: 1;
                    background: rgba(59, 130, 246, 0.1);
                    color: #3b82f6;
                    border: 1px solid rgba(59, 130, 246, 0.2);
                    padding: 10px 16px;
                    border-radius: 8px;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.2s ease;
                    cursor: pointer;
                " onclick="reuseBarcode('${item.number}')">
                    <i class="fas fa-redo"></i>
                    Использовать снова
                </button>
                
                <button class="btn" style="
                    flex: 0.5; 
                    background: rgba(239, 68, 68, 0.1); 
                    color: #ef4444;
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    padding: 10px 16px;
                    border-radius: 8px;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.2s ease;
                    cursor: pointer;
                " onclick="deleteBarcode('${item.number}')">
                    <i class="fas fa-trash"></i>
                    Удалить
                </button>
            </div>
            
        </div>
        `,
    )
    .join("");
}

// Вспомогательная функция для иконок
function getModeIcon(mode) {
  const icons = {
    scan: "barcode",
    manual: "keyboard",
    import: "file-import",
    default: "barcode",
  };
  return icons[mode] || icons.default;
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
  const item = state.barcodeHistory.find(
    (item) => item.number.toString() === id,
  );
  if (item) {
    const clipboardObject = {
      type: "barcode",
      number: item.number,
      mode: item.mode,
      barcode: item.number,
      anchor: "h",
      size: "s",
      code: state.selectCodeFormat || "B2N",
    };

    sendToDjango(clipboardObject);
  }
}

function deleteBarcode(id) {
  state.barcodeHistory = state.barcodeHistory.filter(
    (item) => item.number.toString() !== id,
  );
  updateBarcodeDisplay();
  showNotification("Проба удалена из текущей сессии", "success");
}

async function specialLabel(type) {
  const labelTemplates = {
    saliva: { type: "text", text: "Sluna", anchor: "c", size: "l" },
    virtual: {
      type: "text",
      text: "LAMI",
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
    sorted: { type: "barcode", code: "BCN", text: "Sorted", barcode: "Sorted" },
  };

  const template = labelTemplates[type];

  if (type === "virtual") {
    if (!document.getElementById("barcode-input").value) {
      showNotification(
        "Сначала введите номер для штатива. После нажмите на кнопку!!",
        "error",
      );
    } else {
      template.text = `LAMI\n${document.getElementById("barcode-input").value}`;
      showNotification(
        `Виртуальный штатив с номером ${document.getElementById("barcode-input").value} успешно отправлен на сервер для обработкив`,
        "success",
      );
      clearBarcodeInput();
    }
  }
  if (template) {
    const response = await sendToDjango(template);
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
    (btn) => btn.textContent.includes(getReagentDisplayName(reagent)),
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
                      ? getReagentShortName(state.reagentData[rack][i])
                      : ""
                  }
                </div>
              `,
            ).join("")}
          </div>
        </div>
      `,
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
        state.selectedReagent,
      )} установлен в ${rack} лунка ${hole}`,
      "success",
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
    `.hole[data-rack="${rack}"][data-hole="${hole}"]`,
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
                `,
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
    "success",
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

// ===== Модуль расчетов  =====
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

// ===== Утилиты (без изменений) =====
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
  // Создаем контейнер для уведомлений, если его нет
  let notificationContainer = document.getElementById("notification-container");

  if (!notificationContainer) {
    notificationContainer = document.createElement("div");
    notificationContainer.id = "notification-container";
    notificationContainer.style.cssText = `
      position: fixed;
      top: 90px;
      right: 20px;
      width: 400px;
      max-width: calc(100vw - 40px);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
    `;
    document.body.appendChild(notificationContainer);
  }

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

  const bgColor =
    {
      success: "rgba(16, 185, 129, 0.1)",
      error: "rgba(239, 68, 68, 0.1)",
      info: "rgba(102, 126, 234, 0.1)",
      warning: "rgba(245, 158, 11, 0.1)",
    }[type] || "rgba(102, 126, 234, 0.1)";

  const borderColor =
    {
      success: "rgba(16, 185, 129, 0.3)",
      error: "rgba(239, 68, 68, 0.3)",
      info: "rgba(102, 126, 234, 0.3)",
      warning: "rgba(245, 158, 11, 0.3)",
    }[type] || "rgba(102, 126, 234, 0.3)";

  const notificationItem = document.createElement("div");
  notificationItem.className = "notification-item";
  notificationItem.style.cssText = `
    background: var(--bg-card);
    backdrop-filter: blur(10px);
    border: 1px solid ${borderColor};
    border-left: 4px solid ${color};
    border-radius: var(--radius-lg);
    padding: 20px;
    animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: flex-start;
    gap: 16px;
    box-shadow: var(--shadow-md);
    transition: all 0.3s ease;
  `;

  // Добавляем градиентный эффект для фона
  const gradientOverlay = document.createElement("div");
  gradientOverlay.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${bgColor};
    border-radius: var(--radius-lg);
    z-index: -1;
    opacity: 0.3;
  `;
  notificationItem.appendChild(gradientOverlay);

  const iconContainer = document.createElement("div");
  iconContainer.style.cssText = `
    width: 40px;
    height: 40px;
    min-width: 40px;
    background: ${bgColor};
    border: 1px solid ${borderColor};
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    color: ${color};
  `;

  const iconElement = document.createElement("i");
  iconElement.className = `fas ${icon}`;
  iconContainer.appendChild(iconElement);

  const contentContainer = document.createElement("div");
  contentContainer.style.cssText = `
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  `;

  const messageElement = document.createElement("div");
  messageElement.style.cssText = `
    font-weight: 600;
    color: var(--text-primary);
    font-size: 16px;
    line-height: 1.4;
  `;
  messageElement.textContent = message;

  const timeElement = document.createElement("div");
  timeElement.style.cssText = `
    font-size: 12px;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    gap: 8px;
  `;

  const timeIcon = document.createElement("i");
  timeIcon.className = "far fa-clock";

  const timeText = document.createElement("span");
  timeText.textContent = new Date().toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  timeElement.appendChild(timeIcon);
  timeElement.appendChild(timeText);

  const closeButton = document.createElement("button");
  closeButton.style.cssText = `
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    cursor: pointer;
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-fast);
    margin-left: auto;
    align-self: flex-start;
    min-width: 36px;
    min-height: 36px;
  `;

  const closeIcon = document.createElement("i");
  closeIcon.className = "fas fa-times";

  closeButton.appendChild(closeIcon);
  closeButton.addEventListener("mouseenter", () => {
    closeButton.style.background = "rgba(239, 68, 68, 0.1)";
    closeButton.style.borderColor = "#ef4444";
    closeIcon.style.color = "#ef4444";
  });

  closeButton.addEventListener("mouseleave", () => {
    closeButton.style.background = "rgba(255, 255, 255, 0.05)";
    closeButton.style.borderColor = "var(--border-color)";
    closeIcon.style.color = "var(--text-secondary)";
  });

  closeButton.addEventListener("click", () => {
    removeNotification(notificationItem);
  });

  // Собираем элементы
  contentContainer.appendChild(messageElement);
  contentContainer.appendChild(timeElement);

  notificationItem.appendChild(iconContainer);
  notificationItem.appendChild(contentContainer);
  notificationItem.appendChild(closeButton);

  // Добавляем уведомление в контейнер
  notificationContainer.insertBefore(
    notificationItem,
    notificationContainer.firstChild,
  );

  // Автоматическое удаление через 5 секунд
  const autoRemoveTimeout = setTimeout(() => {
    removeNotification(notificationItem);
  }, 5000);

  // Функция для удаления уведомления с анимацией
  function removeNotification(element) {
    if (!element.parentElement) return;

    clearTimeout(autoRemoveTimeout);

    element.style.animation = "slideOutRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
    element.style.opacity = "0";
    element.style.transform = "translateX(100%)";

    setTimeout(() => {
      if (element.parentElement) {
        element.parentElement.removeChild(element);
      }

      // Удаляем контейнер если пустой
      if (notificationContainer.children.length === 0) {
        notificationContainer.remove();
      }
    }, 300);
  }

  // Ограничиваем количество уведомлений
  const maxNotifications = 5;
  const notifications =
    notificationContainer.querySelectorAll(".notification-item");
  if (notifications.length > maxNotifications) {
    const oldNotifications = Array.from(notifications).slice(maxNotifications);
    oldNotifications.forEach((notification) => {
      if (notification !== notificationItem) {
        removeNotification(notification);
      }
    });
  }

  // Добавляем анимацию при наведении
  notificationItem.addEventListener("mouseenter", () => {
    notificationItem.style.transform = "translateX(-4px)";
    notificationItem.style.boxShadow = "var(--shadow-lg)";
  });

  notificationItem.addEventListener("mouseleave", () => {
    notificationItem.style.transform = "";
    notificationItem.style.boxShadow = "var(--shadow-md)";
  });
}

// Добавляем стили анимации в документ если их нет
if (!document.querySelector("#notification-animations")) {
  const style = document.createElement("style");
  style.id = "notification-animations";
  style.textContent = `
    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    @keyframes slideOutRight {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(100%);
      }
    }
    
    .notification-item {
      position: relative;
      overflow: hidden;
    }
    
    .notification-item::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    }
  `;
  document.head.appendChild(style);
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
      infinite: true, // Включена бесконечная прокрутка
      dots: true,
      arrows: true,
      draggable: false,
      ...options,
    };

    // Элементы DOM
    this.track = this.container.querySelector(".carousel-track");
    this.slides = this.track ? Array.from(this.track.children) : [];
    this.prevBtn = this.container.querySelector(".carousel-btn.prev");
    this.nextBtn = this.container.querySelector(".carousel-btn.next");
    this.dotsContainer = this.container.querySelector(".carousel-indicators");

    // Состояние
    this.currentIndex = 0;
    this.slideCount = this.slides.length;
    this.slidesPerView = this.getSlidesPerView();
    this.isTransitioning = false;
    this.isAutoPlaying = this.options.autoplay;
    this.interval = null;
    this.dots = [];

    // Для бесконечной прокрутки
    this.isInfinite =
      this.options.infinite && this.slideCount > this.slidesPerView;

    if (this.slideCount > 0) {
      this.init();
    }
  }

  // Определяем сколько слайдов показывать
  getSlidesPerView() {
    if (!this.container || this.slideCount === 0) return 1;

    const containerWidth = this.container.offsetWidth;

    if (containerWidth <= 768) return 1;
    if (containerWidth <= 1200) return 2;

    return Math.min(this.options.slidesToShow, this.slideCount);
  }

  init() {
    this.setupSlides();

    // Для бесконечной прокрутки добавляем клоны слайдов
    if (this.isInfinite) {
      this.setupInfiniteSlides();
    }

    this.setupArrows();
    this.createDots();
    this.setupEventListeners();
    this.updateCarousel();

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
    });
  }

  setupInfiniteSlides() {
    // Клонируем первые и последние слайды для бесконечной прокрутки
    const firstClones = [];
    const lastClones = [];

    // Клонируем последние slidesPerView слайдов в начало
    for (
      let i = this.slideCount - this.slidesPerView;
      i < this.slideCount;
      i++
    ) {
      const clone = this.slides[i].cloneNode(true);
      clone.classList.add("clone");
      firstClones.push(clone);
    }

    // Клонируем первые slidesPerView слайдов в конец
    for (let i = 0; i < this.slidesPerView; i++) {
      const clone = this.slides[i].cloneNode(true);
      clone.classList.add("clone");
      lastClones.push(clone);
    }

    // Добавляем клоны в трек
    firstClones.forEach((clone) =>
      this.track.insertBefore(clone, this.slides[0]),
    );
    lastClones.forEach((clone) => this.track.appendChild(clone));

    // Обновляем список слайдов
    this.slides = Array.from(this.track.children);

    // Устанавливаем начальную позицию
    this.currentIndex = this.slidesPerView;
  }

  createDots() {
    if (!this.dotsContainer || !this.options.dots) return;

    this.dotsContainer.innerHTML = "";
    this.dots = [];

    // Количество точек равно количеству оригинальных слайдов
    for (let i = 0; i < this.slideCount; i++) {
      const dot = document.createElement("button");
      dot.className = "carousel-indicator";
      dot.setAttribute("data-index", i);
      dot.setAttribute("aria-label", `Перейти к слайду ${i + 1}`);

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
    // Ресайз окна
    window.addEventListener("resize", () => {
      this.handleResize();
    });

    // Пауза при наведении
    if (this.container) {
      this.container.addEventListener("mouseenter", () =>
        this.pauseAutoSlide(),
      );
      this.container.addEventListener("mouseleave", () =>
        this.resumeAutoSlide(),
      );
    }

    // Поддержка клавиатуры
    document.addEventListener("keydown", (e) => {
      if (
        document.activeElement.closest(".carousel-container") === this.container
      ) {
        if (e.key === "ArrowLeft") this.prevSlide();
        if (e.key === "ArrowRight") this.nextSlide();
      }
    });
  }

  handleResize() {
    const newSlidesPerView = this.getSlidesPerView();

    if (newSlidesPerView !== this.slidesPerView) {
      this.slidesPerView = newSlidesPerView;
      this.isInfinite =
        this.options.infinite && this.slideCount > this.slidesPerView;

      // Переинициализируем слайды
      this.setupSlides();

      if (this.isInfinite) {
        // Удаляем старые клоны
        const clones = this.track.querySelectorAll(".clone");
        clones.forEach((clone) => clone.remove());
        this.setupInfiniteSlides();
      }

      this.updateCarousel();
      this.updateDots();
    }
  }

  updateCarousel() {
    if (!this.track || this.slides.length === 0) return;

    this.isTransitioning = true;

    // Рассчитываем смещение
    const slideWidth = 100 / this.slidesPerView;
    const translateX = -this.currentIndex * slideWidth;

    this.track.style.transform = `translateX(${translateX}%)`;
    this.track.style.transition = "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)";

    // Обновляем точки и кнопки
    this.updateDots();
    this.updateArrows();

    // Сбрасываем флаг перехода после анимации
    setTimeout(() => {
      this.isTransitioning = false;

      // Проверяем и корректируем позицию для бесконечной прокрутки
      if (this.isInfinite) {
        this.handleInfiniteBoundary();
      }
    }, 500);
  }

  handleInfiniteBoundary() {
    const originalSlidesCount = this.slideCount;
    const totalSlides = this.slides.length;

    // Если мы в начале клонов (перед первым оригинальным слайдом)
    if (this.currentIndex < this.slidesPerView) {
      // Мгновенно переходим к соответствующим слайдам в конце
      const jumpTo =
        originalSlidesCount + (this.currentIndex - this.slidesPerView);

      // Отключаем анимацию для мгновенного перехода
      this.track.style.transition = "none";
      const slideWidth = 100 / this.slidesPerView;
      const translateX = -jumpTo * slideWidth;
      this.track.style.transform = `translateX(${translateX}%)`;

      // Обновляем текущий индекс
      this.currentIndex = jumpTo;

      // Включаем анимацию обратно
      setTimeout(() => {
        this.track.style.transition =
          "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)";
      }, 50);
    }

    // Если мы в конце клонов (после последнего оригинального слайда)
    else if (this.currentIndex >= originalSlidesCount + this.slidesPerView) {
      // Мгновенно переходим к соответствующим слайдам в начале
      const jumpTo = this.currentIndex - originalSlidesCount;

      // Отключаем анимацию для мгновенного перехода
      this.track.style.transition = "none";
      const slideWidth = 100 / this.slidesPerView;
      const translateX = -jumpTo * slideWidth;
      this.track.style.transform = `translateX(${translateX}%)`;

      // Обновляем текущий индекс
      this.currentIndex = jumpTo;

      // Включаем анимацию обратно
      setTimeout(() => {
        this.track.style.transition =
          "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)";
      }, 50);
    }
  }

  updateDots() {
    if (this.dots.length === 0) return;

    // Рассчитываем индекс оригинального слайда
    let originalIndex;
    if (this.isInfinite) {
      originalIndex =
        (this.currentIndex - this.slidesPerView + this.slideCount) %
        this.slideCount;
    } else {
      originalIndex = Math.min(this.currentIndex, this.slideCount - 1);
    }

    this.dots.forEach((dot, index) => {
      const isActive = index === originalIndex;
      dot.classList.toggle("active", isActive);
      dot.setAttribute("aria-current", isActive);
    });
  }

  updateArrows() {
    if (!this.options.arrows) return;

    // Для бесконечной прокрутки кнопки всегда активны
    if (this.isInfinite) {
      if (this.prevBtn) {
        this.prevBtn.disabled = false;
        this.prevBtn.style.opacity = "1";
        this.prevBtn.style.cursor = "pointer";
      }
      if (this.nextBtn) {
        this.nextBtn.disabled = false;
        this.nextBtn.style.opacity = "1";
        this.nextBtn.style.cursor = "pointer";
      }
    } else {
      // Для обычной прокрутки
      if (this.prevBtn) {
        const isDisabled = this.currentIndex === 0;
        this.prevBtn.disabled = isDisabled;
        this.prevBtn.style.opacity = isDisabled ? "0.3" : "1";
        this.prevBtn.style.cursor = isDisabled ? "not-allowed" : "pointer";
      }

      if (this.nextBtn) {
        const maxSlide = Math.max(0, this.slideCount - this.slidesPerView);
        const isDisabled = this.currentIndex >= maxSlide;
        this.nextBtn.disabled = isDisabled;
        this.nextBtn.style.opacity = isDisabled ? "0.3" : "1";
        this.nextBtn.style.cursor = isDisabled ? "not-allowed" : "pointer";
      }
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

  goToSlide(slideIndex) {
    if (this.isInfinite) {
      // Для бесконечной прокрутки переходим к соответствующей позиции
      this.currentIndex = slideIndex + this.slidesPerView;
    } else {
      // Для обычной прокрутки ограничиваем индекс
      const maxSlide = Math.max(0, this.slideCount - this.slidesPerView);
      this.currentIndex = Math.max(0, Math.min(slideIndex, maxSlide));
    }

    this.updateCarousel();
    this.resetAutoSlide();
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

  destroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }

    // Удаляем клоны слайдов
    if (this.isInfinite) {
      const clones = this.track.querySelectorAll(".clone");
      clones.forEach((clone) => clone.remove());
    }

    // Восстанавливаем оригинальные стили
    this.track.style.transform = "";
    this.track.style.transition = "";
    this.slides.forEach((slide) => {
      slide.style.flex = "";
    });

    console.log("Carousel destroyed");
  }
}

// ===== Расширенные функции =====
function exportData() {
  const exportData = {
    barcodeHistory: state.barcodeHistory,
    aliquotHistory: state.aliquotHistory,
    reagentData: state.reagentData,
    exportDate: new Date().toISOString(),
    version: "1.0.0",
    note: "Данные экспортированы из текущей сессии",
  };

  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });

  const downloadLink = document.createElement("a");
  downloadLink.href = URL.createObjectURL(dataBlob);
  downloadLink.download = `lab-assistant-session-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);

  showNotification("Данные текущей сессии экспортированы", "success");
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const importedData = JSON.parse(e.target.result);

      if (
        confirm("Импортировать данные? Текущие данные сессии будут заменены.")
      ) {
        if (importedData.barcodeHistory) {
          state.barcodeHistory = importedData.barcodeHistory;
        }

        if (importedData.aliquotHistory) {
          state.aliquotHistory = importedData.aliquotHistory;
        }

        if (importedData.reagentData) {
          Object.assign(state.reagentData, importedData.reagentData);
          generateRacks();
        }

        updateBarcodeDisplay();
        showNotification("Данные импортированы в текущую сессию", "success");
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
  if (confirm("Вы уверены? Все данные текущей сессии будут удалены.")) {
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
    generateRacks();
    closeAllContainers();

    showNotification("Данные текущей сессии сброшены", "info");
  }
}

// ===== Горячие клавиши (без изменений) =====
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
  const currentContainer = document.getElementById("alicvote-container");

  if (!currentContainer) {
    console.error("Aliquot container not found!");
    return;
  }

  const placeContent = document.getElementById("container-aliquote");

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
        <div class="input-group">
          <label class="input-label">
            <i class="fas fa-weight"></i>
            Кол-во этикеток
          </label>
          <input 
            type="number" 
            class="input-field" 
            id="aliquot-count" 
            placeholder="Укажите кол-во"
            min="1"
            max="10"
            step="1"
          />
        </div>
      </div>
      
      <div class="aliquot-actions" style="display: flex; gap: 12px;">
        <button class="btn btn-primary" onclick="PrintAliquotsForm()">
          <i class="fas fa-print"></i> Печать этикеток
        </button>
      </div>
    </div>
  `;

  placeContent.innerHTML = content;
}

function PrintAliquotsForm() {
  const aliquoteObject = {
    type: "aliquote",
    text: [
      document.getElementById("aliquot-name-1").value,
      document.getElementById("aliquot-name-2").value,
    ],
    lot: document.getElementById("aliquot-lot").value,
    volume: document.getElementById("aliquot-volume").value,
    count: document.getElementById("aliquot-count").value || 1,
    size: "s",
    anchor: "h",
  };

  if (!aliquoteObject.text || !aliquoteObject.lot || !aliquoteObject.volume) {
    showNotification("Заполните все необходимые поля");
  } else {
    sendToDjango(aliquoteObject)
      .then(() => showNotification("Аликвота отправлена на печать"))
      .catch(() => {
        showNotification("Ошибка печати аликвот", "danger");
      });
  }
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

/// my test function //
let quizSystem = null;

function testRocheModule() {
  showModule("test-module");

  if (quizSystem) {
    quizSystem.resetTimer();
    quizSystem.generateNewTest();
  } else {
    quizSystem = new TestQuizSystem();
  }
}

function printSerialLabelsGLP() {
  const serial = document.getElementById("glp-serial");
  console.log(serial.value);
  let param = {
    type: "serial",
    text: state.barcodeMode,
    retry: serial.value,
  };
  sendToDjango(param);
}

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
window.exportData = exportData;
window.importData = importData;
window.resetApp = resetApp;
window.toggleMobileMenu = toggleMobileMenu;
window.closeAllContainers = closeAllContainers;
