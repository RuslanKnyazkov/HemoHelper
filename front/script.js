// === ПЕРЕМЕННЫЕ ДЛЯ ОСНОВНОЙ СИСТЕМЫ ===
let savedNumbers = [];
let currentMode = "default";
let currentModeDisplay = "По умолчанию";
let userLogin = "";

// === ПЕРЕМЕННЫЕ ДЛЯ ГЕМОСТАЗА ===
let selectedReagent = null;
let selectedReagentAllowedRacks = [];

// Данные о реагентах и их ограничениях
const reagentsData = {
  d1: [null, null, null, null, null, null],
  d2: [null, null, null, null, null, null],
  d3: [null, null, null, null, null, null],
  r1: [null, null, null, null, null, null],
  r2: [null, null, null, null, null, null],
  r3: [null, null, null, null, null, null],
  r4: [null, null, null, null, null, null],
  r5: [null, null, null, null, null, null],
  r6: [null, null, null, null, null, null],
};

// Названия реагентов для отображения
const reagentDisplayNames = {
  clean_b: "Clean B",
  clean_b_dil: "ClbDil",
  aptt_reagent: "APTT-Reagent",
  aptt_cacl2: "APTT-CaCl",
  at_liquid_reagent: "AT-Reagent",
  at_liquid_substrat: "AT-Substrat",
  recombiplastin: "PT",
  trombintime: "TT",
  fibrinogen: "O.F.A",
  ps_C4PV: "C4PV",
  ps_anti_ps: "PS Latex",
  f_diluent: "Factor_Dil",
  pc_dil: "PC_Dil",
  d_dimer_b: "D-dim B",
  d_dimer_l: "D-dim L",
};

// Полные названия реагентов
const reagentFullNames = {
  clean_b: "Clean B",
  clean_b_dil: "Clean B Diluled",
  aptt_reagent: "APTT reagent",
  aptt_cacl2: "APTT CaCl2",
  at_liquid_reagent: "AT liquid reagent",
  at_liquid_substrat: "AT liquid substrat",
  recombiplastin: "Recombiplastin",
  trombintime: "Trombin Time",
  fibrinogen: "O.F.A Fibrinogen",
  ps_C4PV: "C4BV Latex",
  ps_anti_ps: "Anti pb latex",
  f_diluent: "Factor_Diluent",
  pc_dil: "PC_Diluent",
  d_dimer_b: "D-dimer Buffer",
  d_dimer_l: "D-dimer Latex",
};

// Список меню для элементов t1 и t2
const listMenu = {
  t1: [
    { name: "Баркоды", container: 1 },
    { name: "Аликвоты", container: 2 },
  ],
  t2: [{ name: "Реагенты", container: 3 }],
  t3: [{ name: "Циклы Roche", container: 4 }],
  t4: [{ name: "Расчет 0.1M NaON", container: 5 }],
};

// Текущий активный контейнер
let currentContainer = 1;
let isMenuInitialized = false;

// === ОСНОВНАЯ ИНИЦИАЛИЗАЦИЯ ===
document.addEventListener("DOMContentLoaded", () => {
  loadSavedNumbers();
  setupEventListeners();
  updateDisplay();
  setMode("default", "По умолчанию");
  initReagentSelector();
  initToggleMenu();
  modeCicles("all", "Routine-AUE");
  new Carousel();

  // Инициализация шапки
  updateHeaderNavigation(1);

  // Инициализация мобильного меню
  if (window.innerWidth <= 1100) {
    initMobileMenu();
  }
});

// === ФУНКЦИИ ДЛЯ ШАПКИ И НАВИГАЦИИ ===

// Показать контейнер
function showContainer(containerNumber) {
  // Скрыть все активные контейнеры и меню
  document
    .querySelectorAll(
      ".main-container.active, .into-toggle.active, .toggle.active"
    )
    .forEach((element) => {
      element.classList.remove("active");
    });

  // Скрыть все контейнеры
  document.querySelectorAll(".container").forEach((container) => {
    container.classList.remove("active");
  });

  // Показать выбранный контейнер
  const targetContainer = document.getElementById(
    `container${containerNumber}`
  );
  if (targetContainer) {
    targetContainer.classList.add("active");
  }

  // Обновить навигацию в шапке
  updateHeaderNavigation(containerNumber);

  currentContainer = containerNumber;
}

// Функция для инициализации выпадающего меню
function initToggleMenu() {
  const toggleMenu = document.querySelector(".toggle, .toggle.active");

  if (!toggleMenu) {
    console.warn("Элемент .toggle не найден");
    return;
  }

  const toggleItem = ["t1", "t2", "t3", "t4"];
  const showListContainers = document.querySelector(".into-toggle");

  if (!showListContainers) {
    console.warn("Элемент .into-toggle не найден");
    return;
  }

  // Функция для закрытия меню
  function closeMenu() {
    showListContainers.classList.remove("active");
    showListContainers.innerHTML = "";
    toggleItem.forEach((id) => {
      const element = document.getElementById(id);
      if (element) element.classList.remove("active");
    });
  }

  // Функция для открытия меню
  function openMenu(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;

    // Закрываем предыдущее меню если открыто
    if (showListContainers.classList.contains("active")) {
      closeMenu();
      // Если кликнули на тот же элемент, просто закрываем
      if (element.classList.contains("active")) {
        return;
      }
    }

    // Показываем меню и подсвечиваем элемент
    showListContainers.classList.add("active");
    element.classList.add("active");

    // Получаем пункты меню для этого элемента
    const items = listMenu[elementId] || [];
    const itemMenu = items
      .map(
        (item) => `
      <li>
        <div class="animated-icon">
          <i class="fas fa-barcode"></i>
        </div>
        <a href="#" onclick="
          showContainer(${item.container});
          document.getElementById('${elementId}').classList.remove('active');
          document.querySelector('.into-toggle').classList.remove('active');
          return false;
        ">
          <span>${item.name}</span>
          <i class="fas fa-chevron-right arrow"></i>
        </a>
      </li>
    `
      )
      .join("");

    showListContainers.innerHTML = `<ul class="animated-list">${itemMenu}</ul>`;
  }

  // Добавляем обработчики для элементов t1 и t2
  toggleItem.forEach((elemId) => {
    const element = document.getElementById(elemId);
    if (element) {
      // Удаляем старые обработчики если они есть
      element.removeEventListener("click", element.clickHandler);

      // Создаем новый обработчик
      element.clickHandler = function (e) {
        e.stopPropagation();
        openMenu(elemId);
      };

      // Добавляем обработчик
      element.addEventListener("click", element.clickHandler);
    }
  });

  // Закрытие меню при клике вне элемента
  function handleClickOutside(event) {
    const isClickOnToggleItem = toggleItem.some((id) => {
      const el = document.getElementById(id);
      return el && el.contains(event.target);
    });

    const isClickOnMenu = showListContainers.contains(event.target);

    if (
      !isClickOnToggleItem &&
      !isClickOnMenu &&
      showListContainers.classList.contains("active")
    ) {
      closeMenu();
    }
  }

  // Закрытие при нажатии Escape
  function handleEscapeKey(event) {
    if (
      event.key === "Escape" &&
      showListContainers.classList.contains("active")
    ) {
      closeMenu();
    }
  }

  // Добавляем глобальные обработчики
  document.addEventListener("click", handleClickOutside);
  document.addEventListener("keydown", handleEscapeKey);

  // Сохраняем ссылки для возможного удаления
  toggleMenu.handleClickOutside = handleClickOutside;
  toggleMenu.handleEscapeKey = handleEscapeKey;
}

// Показать/скрыть toggle меню (старая функция, оставляем для совместимости)
function showToggleMenu(id) {
  const toggle = document.getElementById(id);
  const showListContainers = document.querySelector(".into-toggle");

  if (!toggle || !showListContainers) {
    console.error("Элемент не найден");
    return;
  }

  // Если элемент уже активен - закрываем его
  if (toggle.classList.contains("active")) {
    toggle.classList.remove("active");
    showListContainers.classList.remove("active");
  } else {
    // Открываем элемент
    toggle.classList.add("active");
    showListContainers.classList.add("active");
  }
}

// Обновить навигацию в шапке
function updateHeaderNavigation(containerNumber) {
  // Обновить активную вкладку
  document.querySelectorAll(".nav-tab").forEach((tab) => {
    tab.classList.remove("active");
  });

  const activeTab = document.querySelector(
    `.nav-tab[onclick="showContainer(${containerNumber})"]`
  );
  if (activeTab) {
    activeTab.classList.add("active");
  }

  // Обновить индикаторы
  document.querySelectorAll(".tab-indicator").forEach((indicator) => {
    indicator.classList.remove("active");
  });

  const activeIndicator = document.querySelector(
    `.tab-indicator[data-tab="${containerNumber}"]`
  );
  if (activeIndicator) {
    activeIndicator.classList.add("active");
  }
}

// Инициализация мобильного меню
function initMobileMenu() {
  const mainNav = document.getElementById("mainNav");
  if (!mainNav) return;

  mainNav.style.display = "none";

  // Создать мобильное меню
  const mobileMenu = document.createElement("div");
  mobileMenu.className = "mobile-menu";
  mobileMenu.style.cssText = `
    display: none;
    position: absolute;
    top: 70px;
    left: 0;
    right: 0;
    background: #2c3e50;
    padding: 20px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    z-index: 1001;
  `;

  // Добавить кнопки меню
  const buttons = [
    { id: 1, icon: "fa-hashtag", text: "Номера проб" },
    { id: 2, icon: "fa-cogs", text: "Дополнительно" },
    { id: 3, icon: "fa-tint", text: "Гемостаз" },
  ];

  buttons.forEach((btn) => {
    const button = document.createElement("button");
    button.className = "nav-tab";
    button.style.cssText = `
      width: 100%;
      margin-bottom: 10px;
      justify-content: flex-start;
    `;
    button.innerHTML = `<i class="fas ${btn.icon}"></i> <span>${btn.text}</span>`;
    button.onclick = () => {
      showContainer(btn.id);
      mobileMenu.style.display = "none";
    };
    mobileMenu.appendChild(button);
  });

  document.body.appendChild(mobileMenu);

  // Переключение мобильного меню
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  if (mobileMenuBtn) {
    mobileMenuBtn.onclick = function () {
      mobileMenu.style.display =
        mobileMenu.style.display === "none" ? "block" : "none";
    };
  }

  // Закрытие меню при клике вне его
  document.addEventListener("click", function (event) {
    if (
      !event.target.closest(".mobile-menu-btn") &&
      !event.target.closest(".mobile-menu")
    ) {
      mobileMenu.style.display = "none";
    }
  });
}

// Адаптация к изменению размера окна
window.addEventListener("resize", function () {
  const mainNav = document.getElementById("mainNav");
  if (window.innerWidth > 1100) {
    if (mainNav) mainNav.style.display = "flex";
    const mobileMenu = document.querySelector(".mobile-menu");
    if (mobileMenu) mobileMenu.style.display = "none";
  } else if (mainNav && !document.querySelector(".mobile-menu")) {
    mainNav.style.display = "none";
  }
});

// === ОСНОВНЫЕ ФУНКЦИИ СИСТЕМЫ ===
function setupEventListeners() {
  const numberInput = document.getElementById("numberInput");
  if (numberInput) {
    numberInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        saveNumber();
      }
    });
  }

  document.querySelectorAll(".mode-btn[data-mode]").forEach((btn) => {
    btn.addEventListener("click", function () {
      const mode = this.dataset.mode;
      const display = this.dataset.display;
      setMode(mode, display);
    });
  });

  document.addEventListener("click", (e) => {
    const numberInput = document.getElementById("numberInput");
    if (
      numberInput &&
      !e.target.closest(".right-panel") &&
      !e.target.closest(".mode-btn") &&
      !e.target.closest("button")
    ) {
      numberInput.focus();
    }
  });
}

function setMode(mode, display) {
  currentMode = mode;
  currentModeDisplay = display;

  const displayElement = document.getElementById("currentModeDisplay");
  if (displayElement) {
    displayElement.textContent = display;
  }

  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.classList.remove("active");
    if (btn.dataset.mode === mode) {
      btn.classList.add("active");
    }
  });

  if (display === "Виртуальный") {
    // Ничего не делаем, чтобы не показывать сообщение
  } else {
    showMessage(`Режим установлен: ${display}`, "info");
  }
}

function loadSavedNumbers() {
  try {
    const storedData = localStorage.getItem("labNumbersData");
    if (storedData) {
      savedNumbers = JSON.parse(storedData);
    }
  } catch (e) {
    console.error("Ошибка загрузки данных:", e);
    showMessage("Ошибка загрузки данных", "error");
  }
}

// Функция для копирования в буфер обмена
function copyToClipboard(text) {
  if (navigator.clipboard) {
    console.log(`JSON object : ${text}`);
    return navigator.clipboard.writeText(text);
  }
}

function saveNumber() {
  const numberInput = document.getElementById("numberInput");
  if (!numberInput) {
    showMessage("Поле ввода не найдено", "error");
    return;
  }

  const number = numberInput.value.trim();

  if (!number) {
    showMessage("Введите номер пробы!", "error");
    numberInput.focus();
    return;
  }

  const isDuplicate = savedNumbers.some((item) => item.number === number);
  if (isDuplicate) {
    if (!confirm("Такой номер уже существует. Добавить дубликат?")) {
      return;
    }
  }

  const numberObject = {
    id: Date.now() + "-" + Math.random().toString(36).substr(2, 9),
    number: number,
    mode: currentMode,
    timestamp: new Date().toISOString(),
    date: new Date().toLocaleString("ru-RU"),
    status: "active",
  };

  savedNumbers.unshift(numberObject);
  saveToLocalStorage();

  const clipboardObject = {
    type: "barcode",
    number: number,
    mode: currentMode,
    barcode: number,
    anchor: "h",
    size: "s",
  };

  copyToClipboard(JSON.stringify(clipboardObject, null, 2))
    .then(() => {
      showMessage(
        `✅ Проба "${number}" (${currentModeDisplay}) сохранена и скопирована!`,
        "success"
      );
      const clipboardStatus = document.getElementById("clipboardStatus");
      if (clipboardStatus) {
        clipboardStatus.textContent = `${number} (${currentModeDisplay})`;
      }
    })
    .catch((err) => {
      console.error("Ошибка копирования:", err);
      showMessage(
        `✅ Проба "${number}" сохранена! (Не удалось скопировать)`,
        "success"
      );
    });

  updateDisplay();
  numberInput.value = "";
  numberInput.focus();
}

function saveToLocalStorage() {
  try {
    localStorage.setItem("labNumbersData", JSON.stringify(savedNumbers));
    localStorage.setItem("lastSaveTime", new Date().toISOString());
    localStorage.setItem("lastContainer", currentContainer);
    return true;
  } catch (e) {
    console.error("Ошибка сохранения:", e);
    showMessage("Ошибка сохранения в localStorage", "error");
    return false;
  }
}

function updateDisplay() {
  const count = savedNumbers.length;
  const listElement = document.getElementById("numbersList");

  const countDisplay = document.getElementById("countDisplay");
  if (countDisplay) {
    countDisplay.textContent = count;
  }

  const lastTime = localStorage.getItem("lastSaveTime");
  if (lastTime) {
    const date = new Date(lastTime);
    const lastSaveTime = document.getElementById("lastSaveTime");
    if (lastSaveTime) {
      lastSaveTime.textContent = date.toLocaleString("ru-RU");
    }
  }

  if (listElement) {
    listElement.innerHTML = "";

    if (count === 0) {
      const emptyState = document.createElement("div");
      emptyState.className = "empty-state";
      emptyState.innerHTML = `
        <i class="fas fa-inbox"></i>
        <h3>Нет сохраненных проб</h3>
        <p>Добавьте первую пробу через форму слева</p>
      `;
      listElement.appendChild(emptyState);
      return;
    }

    savedNumbers.forEach((item, index) => {
      const itemElement = document.createElement("div");
      itemElement.className = `number-item ${index === 0 ? "active" : ""}`;
      const modeClass = `mode-${item.mode}`;

      itemElement.innerHTML = `
        <div class="number-header">
          <div class="number-value">Номер: ${escapeHtml(item.number)}</div>
          <div>
            <span class="number-mode ${modeClass}">${escapeHtml(
        item.modeDisplay
      )}</span>
            <span class="number-time">${item.date}</span>
          </div>
        </div>
        <div class="number-id">ID: ${item.id}</div>
        <div class="number-actions">
          <button onclick="copyNumber('${item.id}')" class="btn-success">
            <i class="fas fa-copy"></i> Повторная печать
          </button>
          <button onclick="deleteNumber('${item.id}')" class="btn-danger">
            <i class="fas fa-trash"></i> Удалить
          </button>
        </div>
      `;
      listElement.appendChild(itemElement);
    });
  }
}

function clearInput() {
  const numberInput = document.getElementById("numberInput");
  if (numberInput) {
    numberInput.value = "";
    numberInput.focus();
  }
  showMessage("Форма очищена", "info");
}

function clearAllData() {
  if (savedNumbers.length === 0) {
    showMessage("Нет данных для удаления", "info");
    return;
  }

  if (confirm(`Вы уверены? Будет удалено ${savedNumbers.length} проб.`)) {
    savedNumbers = [];
    localStorage.removeItem("labNumbersData");
    localStorage.removeItem("lastSaveTime");
    updateDisplay();
    showMessage("Все данные удалены", "success");
  }
}

function copyNumber(id) {
  const numberObj = savedNumbers.find((item) => item.id === id);
  if (numberObj) {
    const clipboardObject = {
      number: numberObj.number,
      mode: numberObj.mode,
      modeDisplay: numberObj.modeDisplay,
      timestamp: numberObj.timestamp,
    };

    copyToClipboard(JSON.stringify(clipboardObject, null, 2))
      .then(() => showMessage("JSON объект скопирован в буфер", "success"))
      .catch(() => showMessage("Ошибка копирования", "error"));
  }
}

function copyAllToClipboard() {
  if (savedNumbers.length === 0) {
    showMessage("Нет данных для копирования", "error");
    return;
  }

  const allData = savedNumbers.map((item) => ({
    number: item.number,
    mode: item.mode,
    modeDisplay: item.modeDisplay,
    date: item.date,
  }));

  copyToClipboard(JSON.stringify(allData, null, 2))
    .then(() =>
      showMessage(
        `Все ${savedNumbers.length} проб скопированы в буфер`,
        "success"
      )
    )
    .catch(() => showMessage("Ошибка копирования", "error"));
}

function deleteNumber(id) {
  savedNumbers = savedNumbers.filter((item) => item.id !== id);
  saveToLocalStorage();
  updateDisplay();
  showMessage("Проба удалена", "success");
}

function showMessage(text, type) {
  const messageDiv = document.getElementById("message");
  if (messageDiv) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type} show`;

    setTimeout(() => {
      messageDiv.classList.remove("show");
    }, 4000);
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function sendModeLabel(name) {
  const userModeLabel = {
    salvia: { type: "custom", text: "Sluna", anchor: "c", size: "l" },
    dublicat: { type: "custom", text: "Dubli", anchor: "c", size: "l" },
    infinity: {
      type: "custom",
      code: "BCN",
      text: "As123456",
      barcode: "As123456",
      anchor: "h",
    },
  };

  copyToClipboard(JSON.stringify(userModeLabel[name], 0, 2));
}

function copyArhiveInfo() {
  const input = document.getElementById("numberInput");
  if (!input) {
    showMessage("Поле ввода не найдено", "error");
    return;
  }

  if (!input.value.trim()) {
    showMessage("Вам необходимо ввести номер виртуального штатива", "error");
    return;
  }

  const archiveInfo = {
    type: "custom",
    text: `LAMI\n${input.value.trim()}`,
    size: "l",
  };

  copyToClipboard(JSON.stringify(archiveInfo, null, 2))
    .then(() => {
      showMessage(
        `✅ JSON виртуального архива "${input.value.trim()}" скопирован в буфер`,
        "success"
      );
    })
    .catch((err) => {
      console.error("Ошибка копирования:", err);
      showMessage("Ошибка копирования информации", "error");
    });
}

function addAlicvotsItem() {
  const nameInput = document.getElementById("alicvotsName");
  const lotInput = document.getElementById("alicvotsValue");
  const countInput = document.getElementById("alicvotsCount");
  const volumeInput = document.getElementById("alicvotsVolume");

  if (!nameInput || !lotInput || !countInput || !volumeInput) {
    showMessage("Не удалось найти поля формы", "error");
    return;
  }

  const name = nameInput.value.trim();
  const lot = lotInput.value.trim();
  const count = countInput.value.trim();
  const volume = volumeInput.value.trim();

  if (!name || !lot || !count || !volume) {
    showMessage("Заполните все поля!", "error");
    return;
  }

  const countNum = parseInt(count, 10);
  if (isNaN(countNum) || countNum > 10) {
    showMessage(
      "Слишком большое количество наклеек. Нельзя распечатать больше 10 наклеек",
      "error"
    );
    return;
  }

  const newObject = {
    type: "custom",
    text: name,
    lot: lot,
    retry: count,
    volume: volume,
  };

  copyToClipboard(JSON.stringify(newObject, null, 2))
    .then(() => {
      showMessage(`Успешная передача на печать ${count} этикеток`, "success");
    })
    .catch((error) => {
      showMessage(`Ошибка копирования: ${error}`, "error");
    });
}

function clearAlicvotsForm() {
  const nameInput = document.getElementById("alicvotsName");
  const lotInput = document.getElementById("alicvotsValue");
  const countInput = document.getElementById("alicvotsCount");
  const volumeInput = document.getElementById("alicvotsVolume");

  if (nameInput) nameInput.value = "";
  if (lotInput) lotInput.value = "";
  if (countInput) countInput.value = "";
  if (volumeInput) volumeInput.value = "";

  showMessage("Форма очищена", "info");
}

// === ФУНКЦИИ ДЛЯ ГЕМОСТАЗА ===

const colorHoles = {
  clean_b: "maintenance",
  aptt_reagent: "paired_one",
  at_liquid_reagent: "paired_one",
  ps_C4PV: "paired_one",
  aptt_cacl2: "paired_two",
  at_liquid_substrat: "paired_two",
  ps_anti_ps: "paired_two",
  f_diluent: "diluent",
};

function initReagentSelector() {
  const reagentButtons = document.querySelectorAll(".reagent-btn-select");

  reagentButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      if (this.classList.contains("disabled")) return;

      // Убрать выделение со всех кнопок
      reagentButtons.forEach((b) => b.classList.remove("active"));

      // Выделить выбранную кнопку
      this.classList.add("active");

      // Установить выбранный реагент
      selectedReagent = this.dataset.reagent;
      selectedReagentAllowedRacks = this.dataset.allowed.split(",");

      // Обновить отображение
      const displayElement = document.getElementById("selectedReagentDisplay");
      if (displayElement) {
        displayElement.textContent =
          reagentFullNames[selectedReagent] || selectedReagent;
      }
    });
  });
}

function setHole(rack, hole) {
  if (!selectedReagent) {
    showMessage("Сначала выберите реагент!", "error");
    return;
  }

  if (!selectedReagentAllowedRacks.includes(rack)) {
    // Проверить, доступен ли этот реагент для данного река
    showMessage(
      `Реагент "${reagentFullNames[selectedReagent]}" не может быть размещен в R${rack}!`,
      "error"
    );
    return;
  }

  const holeEl = document.getElementById(`hole_${rack}_${hole}`);
  const holeContainer = document.querySelector(
    `#rack-${rack} .hole[data-hole="${hole}"]`
  );

  if (reagentsData[rack][hole - 1] === selectedReagent) {
    // Очистить лунку, если там уже этот реагент
    reagentsData[rack][hole - 1] = null;
    if (holeEl) holeEl.textContent = "";
    if (holeContainer)
      holeContainer.classList.remove(colorHoles[selectedReagent] || "filled");
    showMessage(`Лунка ${hole} в R${rack} очищена`, "info");
  } else {
    // Установить реагент
    reagentsData[rack][hole - 1] = selectedReagent;
    if (holeEl) holeEl.textContent = reagentDisplayNames[selectedReagent];
    if (holeContainer)
      holeContainer.classList.add(colorHoles[selectedReagent] || "filled");
    showMessage(
      `${reagentFullNames[selectedReagent]} установлен в R${rack}, лунка ${hole}`,
      "success"
    );
  }
}

function clearAllRacks() {
  if (confirm("Очистить все реки?")) {
    ["d1", "d2", "d3", "r1", "r2", "r3", "r4", "r5", "r6"].forEach((rack) => {
      for (let i = 1; i <= 6; i++) {
        const holeEl = document.getElementById(`hole_${rack}_${i}`);
        if (holeEl) holeEl.textContent = "";
        const holeContainer = document.querySelector(
          `#rack-${rack} .hole[data-hole="${i}"]`
        );

        if (holeContainer) {
          holeContainer.classList.remove(
            colorHoles[reagentsData[rack][i - 1]] || "filled"
          );
        }
        reagentsData[rack][i - 1] = null;
      }
    });
    showMessage("Все реки очищены", "success");
  }
}

function clearSelection() {
  selectedReagent = null;
  selectedReagentAllowedRacks = [];

  document.querySelectorAll(".reagent-btn-select").forEach((btn) => {
    btn.classList.remove("active");
  });

  const displayElement = document.getElementById("selectedReagentDisplay");
  if (displayElement) {
    displayElement.textContent = "Ничего не выбрано";
  }

  // Убрать подсветку с реков
  document.querySelectorAll(".rack-container").forEach((rack) => {
    rack.classList.remove("active");
  });

  showMessage("Выбор реагента снят", "info");
}

// === ФУНКЦИИ ДЛЯ ЦИКЛОВ ROCHE ===

function modeCicles(mode, buttonElement) {
  const buttonText = buttonElement?.textContent?.trim() || "Routine-AUE";

  const typeMode = {
    one: ["e1", "ce", "c2"],
    two: ["e2", "c1"],
    all: ["e1", "e2", "ce", "c1", "c2"],
  };

  const testMode = {
    one: ["Zinc", "Lpa", "Cu", "CHE", "LIP", "CK-Total"],
    two: [
      "C-peptid",
      "AFP",
      "A-CCP",
      "IGF",
      "PAAP-P",
      "GH",
      "TP1NP",
      "Cyfra",
      "PTH",
      "PCT",
      "FBC",
      "HAV",
      "HAV-IgM",
      "HBE-AG",
    ],
    all: ["Все тесты доступны для закрытия"],
  };

  const modeNames = {
    one: "Режим 1",
    two: "Режим 2",
    all: "Все режимы",
  };

  // Валидация режима
  if (!typeMode[mode]) {
    console.error(`Неизвестный режим: ${mode}`);
    return;
  }

  const activeElements = typeMode[mode];
  const currentTests = testMode[mode] || [];

  // Очистка предыдущего описания
  const oldDescriptions = document.querySelectorAll(".description");
  oldDescriptions.forEach((desc) => desc.remove());

  // Управление видимостью элементов
  const allIds = ["e1", "e2", "ce", "c1", "c2"];

  allIds.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.classList.toggle("active-analyze", activeElements.includes(id));
    }
  });

  // Обновление информации в сортировщиках
  const allSorter = ["s2", "s3"];

  allSorter.forEach((id) => {
    const sorter = document.getElementById(id);
    if (sorter) {
      sorter.innerHTML = `<div class="sorter-title">
                            <h6>p612 (${buttonText})</h6>
                        </div>
                        <div class="work-group">
                          <div class="input-area"></div>
                          <div class="alicvote-zone"></div>
                           <div class="output-zone">
                                <div class="roche-container" id="roche-${id}">
                           </div>
                          
                        </div>
                        </div>`;
    }
    const block = document.getElementById(`roche-${id}`);
    if (block) {
      for (let i = 0; i < 9; i++) {
        const row = document.createElement("div");
        row.className = "row";
        for (let j = 0; j < 5; j++) {
          const circle = document.createElement("div");
          circle.className = "circle";
          row.appendChild(circle);
        }
        block.appendChild(row);
      }
    }
  });

  // Создание информационного блока
  const visualElements = document.getElementsByClassName("visual");

  if (visualElements.length > 0) {
    const visualWindow = visualElements[0];

    const description = document.createElement("div");
    description.className = "description";
    description.innerHTML = `
      <h4>${modeNames[mode] || mode}</h4>
      <p><strong>Активные блоки:</strong> ${activeElements.join(", ")}</p>
      <p><strong>Аналиты сортирующиеся в зону Roche:</strong></p>
      <div class="description-not-avaliable">
        <div class="button-group">
            ${(testMode[mode] || [])
              .map((test) => `<button class="test-button">${test}</button>`)
              .join("")}
        </div>
      </div>
      </div>
      <p><strong>Всего элементов:</strong> ${activeElements.length} из ${
      allIds.length
    }</p>
    `;

    visualWindow.appendChild(description);
  }

  // Логирование
  console.log(`Режим ${mode} активирован. Активные элементы:`, activeElements);
}

function getMolarSum() {
  // 1. Получаем элементы
  const volumeInput = document.getElementById("con");
  const molarInput = document.getElementById("molar");

  // 2. Проверяем, что элементы существуют
  if (!volumeInput || !molarInput) {
    console.error("Не найдены необходимые элементы");
    return;
  }

  // 3. Получаем значения и преобразуем в числа
  const volume = parseFloat(volumeInput.value);
  const molar = parseFloat(molarInput.value);
  const naohMolar = 40;

  // 4. Проверяем корректность введенных данных
  if (isNaN(volume) || isNaN(molar)) {
    alert("Пожалуйста, введите корректные числовые значения");
    return;
  }

  // 5. Выполняем расчет
  const result = molar * naohMolar * (volume / 1000);

  // 6. Форматируем результат
  const formattedResult = result.toFixed(1);

  // 7. Находим или создаем контейнер для результатов
  let resultContainer = document.getElementById("result-container");

  // 8. Отображаем результат
  if (resultContainer) {
    resultContainer.innerHTML = `
            <div style="margin-top: 20px; padding: 15px; background: #e7f5ff; border-radius: 8px; border-left: 4px solid #339af0;">
                <h4 style="margin: 0 0 10px 0; color: #1864ab;">
                    <i class="fas fa-calculator"></i> Результаты расчета:
                </h4>
                <div style="font-size: 14px;">
                    <p><strong>Введенные данные:</strong></p>
                    <ul style="margin: 5px 0 10px 0;">
                        <li>Молярность: ${molar} M</li>
                        <li>Объем: ${volume} мл</li>
                        <li>Молярная масса NaOH: ${naohMolar} г/моль</li>
                    </ul>
                    <p><strong>Результат:</strong></p>
                    <p style="font-size: 18px; font-weight: bold; color: #2b8a3e;">
                        ${formattedResult} г NaOH
                    </p>
                    <p style="font-size: 12px; color: #666; margin-top: 5px;">
                        Для приготовления ${volume} мл ${molar}M раствора NaOH
                    </p>
                </div>
            </div>
        `;
  } else {
    console.error("Контейнер для результатов не найден");
  }

  return result;
}

class Carousel {
  constructor() {
    this.track = document.getElementById("carouselTrack");
    this.container = document.getElementById("carouselContainer");
    this.prevBtn = document.getElementById("carouselPrev");
    this.nextBtn = document.getElementById("carouselNext");
    this.indicatorsContainer = document.getElementById("carouselIndicators");

    this.cards = Array.from(this.track.children);
    this.currentIndex = 0;
    this.cardWidth = this.cards[0].offsetWidth + 25; // width + gap
    this.visibleCards = Math.floor(this.container.offsetWidth / this.cardWidth);

    this.init();
  }

  init() {
    // Создаем индикаторы
    this.cards.forEach((_, index) => {
      const indicator = document.createElement("button");
      indicator.className = "indicator";
      indicator.setAttribute("aria-label", `Перейти к слайду ${index + 1}`);
      indicator.addEventListener("click", () => this.goToSlide(index));
      this.indicatorsContainer.appendChild(indicator);
    });

    // Назначаем обработчики
    this.prevBtn.addEventListener("click", () => this.prev());
    this.nextBtn.addEventListener("click", () => this.next());

    // Инициализируем состояние
    this.updateIndicators();
    this.updateNavButtons();
    this.updateGradients();

    // Обработчик ресайза
    window.addEventListener("resize", () => {
      this.cardWidth = this.cards[0].offsetWidth + 25;
      this.visibleCards = Math.floor(
        this.container.offsetWidth / this.cardWidth
      );
      this.goToSlide(this.currentIndex);
    });

    // Swipe для мобильных
    this.setupSwipe();
  }

  goToSlide(index) {
    this.currentIndex = Math.max(
      0,
      Math.min(index, this.cards.length - this.visibleCards)
    );
    const translateX = -this.currentIndex * this.cardWidth;
    this.track.style.transform = `translateX(${translateX}px)`;

    this.updateIndicators();
    this.updateNavButtons();
    this.updateGradients();
  }

  prev() {
    if (this.currentIndex > 0) {
      this.goToSlide(this.currentIndex - 1);
    }
  }

  next() {
    if (this.currentIndex < this.cards.length - this.visibleCards) {
      this.goToSlide(this.currentIndex + 1);
    }
  }

  updateIndicators() {
    const indicators = this.indicatorsContainer.children;
    Array.from(indicators).forEach((indicator, index) => {
      indicator.classList.toggle(
        "active",
        index >= this.currentIndex &&
          index < this.currentIndex + this.visibleCards
      );
    });
  }

  updateNavButtons() {
    this.prevBtn.disabled = this.currentIndex === 0;
    this.nextBtn.disabled =
      this.currentIndex >= this.cards.length - this.visibleCards;
  }

  updateGradients() {
    this.container.classList.toggle("start", this.currentIndex === 0);
    this.container.classList.toggle(
      "end",
      this.currentIndex >= this.cards.length - this.visibleCards
    );
  }

  setupSwipe() {
    let startX = 0;
    let isDragging = false;

    this.track.addEventListener("mousedown", (e) => {
      startX = e.clientX;
      isDragging = true;
    });

    this.track.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      const diff = startX - e.clientX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) this.next();
        else this.prev();
        isDragging = false;
      }
    });

    this.track.addEventListener("mouseup", () => (isDragging = false));
    this.track.addEventListener("mouseleave", () => (isDragging = false));
  }
}
