// === ПЕРЕМЕННЫЕ ДЛЯ ОСНОВНОЙ СИСТЕМЫ ===
let savedNumbers = [];
let currentMode = "default";
let currentModeDisplay = "По умолчанию";
let userLogin = "";
zpl =
  "^PW456 ^LL200 ^LS0 ^FO150,50 ^BY1.5 ^B2N,80,Y,Y,N ^FD1096379226^FS ^FO50,135 ^A0N,20,20 ^FD1096379226^FS ^XZ";

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

// Полные названия
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

// Текущий активный контейнер
let currentContainer = 1;

// === ОСНОВНАЯ ИНИЦИАЛИЗАЦИЯ ===
document.addEventListener("DOMContentLoaded", () => {
  loadSavedNumbers();
  setupEventListeners();
  updateDisplay();
  setMode("default", "По умолчанию");
  initReagentSelector();
  modeCicles("all", "Routine-AUE");

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
  document.querySelector(".main-container").classList.remove("active");
  // Скрыть все контейнеры
  document.querySelectorAll(".container").forEach((container) => {
    container.classList.remove("active");
  });
  console.log(currentContainer);

  // Показать выбранный контейнер
  document
    .getElementById(`container${containerNumber}`)
    .classList.add("active");

  // Обновить навигацию в шапке
  updateHeaderNavigation(containerNumber);

  currentContainer = containerNumber;
}

function showToggleMenu(id) {
  const toggle = document.getElementById(id);

  if (!toggle) {
    console.error("Элемент не найден");
    return;
  }

  // Если элемент уже активен - закрываем его
  if (toggle.classList.contains("active")) {
    toggle.classList.remove("active");
    document.removeEventListener("click", closeOnClickOutside);
  } else {
    // Открываем элемент
    toggle.classList.add("active");

    // Добавляем обработчик для закрытия при клике вне элемента
    setTimeout(() => {
      document.addEventListener("click", closeOnClickOutside);
    }, 0);
  }

  // Функция для закрытия при клике вне элемента
  function closeOnClickOutside(event) {
    // Проверяем, был ли клик на самом toggle или внутри него
    if (
      !toggle.contains(event.target) &&
      !event.target.matches(`#${id}, #${id} *`)
    ) {
      toggle.classList.remove("active");
      document.removeEventListener("click", closeOnClickOutside);
    }
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
  mainNav.style.display = "none";

  // Создать мобильное меню
  const mobileMenu = document.createElement("div");
  mobileMenu.className = "mobile-menu";
  mobileMenu.style.display = "none";
  mobileMenu.style.position = "absolute";
  mobileMenu.style.top = "70px";
  mobileMenu.style.left = "0";
  mobileMenu.style.right = "0";
  mobileMenu.style.background = "#2c3e50";
  mobileMenu.style.padding = "20px";
  mobileMenu.style.boxShadow = "0 5px 15px rgba(0,0,0,0.3)";
  mobileMenu.style.zIndex = "1001";

  // Добавить кнопки меню
  const buttons = [
    { id: 1, icon: "fa-hashtag", text: "Номера проб" },
    { id: 2, icon: "fa-cogs", text: "Дополнительно" },
    { id: 3, icon: "fa-tint", text: "Гемостаз" },
  ];

  buttons.forEach((btn) => {
    const button = document.createElement("button");
    button.className = "nav-tab";
    button.style.width = "100%";
    button.style.marginBottom = "10px";
    button.style.justifyContent = "flex-start";
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
      if (mobileMenu.style.display === "none") {
        mobileMenu.style.display = "block";
      } else {
        mobileMenu.style.display = "none";
      }
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
function signUser() {
  if (!userLogin) {
  }
}

function setupEventListeners() {
  const numberInput = document.getElementById("numberInput");

  numberInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      saveNumber();
    }
  });

  document.querySelectorAll(".mode-btn[data-mode]").forEach((btn) => {
    btn.addEventListener("click", function () {
      const mode = this.dataset.mode;
      const display = this.dataset.display;
      setMode(mode, display);
    });
  });

  document.addEventListener("click", (e) => {
    if (
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

  document.getElementById("currentModeDisplay").textContent = display;

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

function saveNumber() {
  const numberInput = document.getElementById("numberInput");
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
    modeDisplay: currentModeDisplay,
    timestamp: new Date().toISOString(),
    date: new Date().toLocaleString("ru-RU"),
    status: "active",
  };

  savedNumbers.unshift(numberObject);
  saveToLocalStorage();

  const clipboardObject = {
    number: number,
    mode: currentMode,
    modeDisplay: currentModeDisplay,
    timestamp: new Date().toISOString(),
  };

  navigator.clipboard
    .writeText(JSON.stringify(clipboardObject, null, 2))
    .then(() => {
      showMessage(
        `✅ Проба "${number}" (${currentModeDisplay}) сохранена и скопирована!`,
        "success"
      );
      document.getElementById(
        "clipboardStatus"
      ).textContent = `${number} (${currentModeDisplay})`;
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

  document.getElementById("countDisplay").textContent = count;

  const lastTime = localStorage.getItem("lastSaveTime");
  if (lastTime) {
    const date = new Date(lastTime);
    document.getElementById("lastSaveTime").textContent =
      date.toLocaleString("ru-RU");
  }

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
                <div class="number-value">Номер: ${escapeHtml(
                  item.number
                )}</div>
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

function clearInput() {
  document.getElementById("numberInput").value = "";
  document.getElementById("numberInput").focus();
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

    navigator.clipboard
      .writeText(JSON.stringify(clipboardObject, null, 2))
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

  navigator.clipboard
    .writeText(JSON.stringify(allData, null, 2))
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
  messageDiv.textContent = text;
  messageDiv.className = `message ${type} show`;

  setTimeout(() => {
    messageDiv.classList.remove("show");
  }, 4000);
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function copySalivaInfo() {
  const salivaInfo = {
    material: "Слюна",
  };

  const jsonString = JSON.stringify(salivaInfo, 0, 2);

  navigator.clipboard
    .writeText(jsonString)
    .then(() => {
      showMessage("✅ Информация о слюне скопирована в буфер", "success");
    })
    .catch((err) => {
      console.error("Ошибка копирования:", err);
      showMessage("Ошибка копирования информации", "error");
    });
}

function copyArhiveInfo() {
  const input = document.getElementById("numberInput");

  if (!input.value) {
    showMessage("Вам необходимо ввести номер виртуального штатива", "error");
  } else {
    const archiveInfo = {
      material: "Архив",
      number: input.value,
      original_mode: input.mode,
    };

    navigator.clipboard
      .writeText(JSON.stringify(archiveInfo, null, 2))
      .then(() => {
        showMessage(
          `✅ JSON виртуального архива "${input.value}" скопирован в буфер`,
          "success"
        );
      })
      .catch((err) => {
        console.error("Ошибка копирования:", err);
        showMessage("Ошибка копирования информации", "error");
      });
  }
}

function copyDoubleInfo() {
  const duplicateInfo = {
    material: "Дубли",
  };

  navigator.clipboard
    .writeText(JSON.stringify(duplicateInfo, 0, 2))
    .then(() => {
      showMessage("✅ Информация о дубликате скопирована в буфер", "success");
    })
    .catch((err) => {
      console.error("Ошибка копирования:", err);
      showMessage("Ошибка копирования информации", "error");
    });
}

// === ФУНКЦИИ ДЛЯ АЛИКВОТ ===
function showAlictotContent() {
  const container = document.getElementById("right-panel2");
  const alicvotsContainer = document.createElement("div");
  alicvotsContainer.className = "alicvots-container";
  alicvotsContainer.id = "alicvotsContent";

  alicvotsContainer.innerHTML = `
        <div class="alicvots-header">
            <h2><i class="fas fa-table"></i> Введите данные для аликвот</h2>
        </div>
        
        <div class="alicvots-content">
            <div class="input-section">
                <div class="input-group">
                    <label for="alicvotsName">
                        <i class="fas fa-tag"></i>
                        Название:
                    </label>
                    <div class="input-with-icon">
                        <i class="fas fa-font"></i>
                        <input type="text" id="alicvotsName" placeholder="Введите название" maxlength="50">
                    </div>
                </div>
                
                <div class="input-group">
                    <label for="alicvotsValue">
                        <i class="fas fa-hashtag"></i>
                        Лот:
                    </label>
                    <div class="input-with-icon">
                        <i class="fas fa-calculator"></i>
                        <input type="number" id="alicvotsValue" placeholder="0" step="0.01">
                    </div>
                </div>

                <div class="input-group">
                    <label for="alicvotsCount">
                        <i class="fas fa-hashtag"></i>
                        Количество экземпляров:
                    </label>
                    <div class="input-with-icon">
                        <i class="fas fa-calculator"></i>
                        <input type="number" id="alicvotsCount" placeholder="0" step="1">
                    </div>
                </div>

                <div class="input-group">
                    <label for="alicvotsVolume">
                        <i class="fas fa-hashtag"></i>
                        Объём в [мкл , мл]:
                    </label>
                    <div class="input-with-icon">
                        <i class="fas fa-calculator"></i>
                        <input type="number" id="alicvotsVolume" placeholder="0 мкл">
                    </div>
                </div>
                
                <div class="button-group">
                    <button class="btn-primary" onclick="addAlicvotsItem()">
                        <i class="fas fa-plus"></i>
                        Распечатать
                    </button>
                    <button class="btn-secondary" onclick="clearAlicvotsForm()">
                        <i class="fas fa-eraser"></i>
                        Очистить
                    </button>
                </div>
            </div>
        </div>
    `;

  checkContainer(container, alicvotsContainer);
}

function checkContainer(parent, child) {
  if (parent.hasChildNodes()) {
    while (parent.firstChild) {
      parent.removeChild(parent.firstChild);
    }
  }
  parent.appendChild(child);
}

function addAlicvotsItem() {
  const name = document.getElementById("alicvotsName");
  const lot = document.getElementById("alicvotsValue");
  const count = document.getElementById("alicvotsCount");
  const volume = document.getElementById("alicvotsVolume");

  if (!name.value || !lot.value || !count.value || !volume.value) {
    showMessage("Заполните все поля!", "error");
    return;
  }

  if (count.value > 10) {
    showMessage(
      "Слишком большое количество наклеек. Нельзя распечатать больше 10 наклеек",
      "error"
    );
  } else {
    const newObject = {
      material: "Аликвоты",
      name: name.value,
      lot: lot.value,
      count: count.value,
      volume: volume.value,
    };

    navigator.clipboard
      .writeText(JSON.stringify(newObject, 0, 2))
      .then(() => {
        showMessage(
          `Успешная передача на печать ${count.value} этикеток`,
          "success"
        );
      })
      .catch((error) => {
        showMessage(`Ошибка копирования: ${error}`, "error");
      });
  }
}

function clearAlicvotsForm() {
  document.getElementById("alicvotsName").value = "";
  document.getElementById("alicvotsValue").value = "";
  document.getElementById("alicvotsCount").value = "";
  document.getElementById("alicvotsVolume").value = "";
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

// Добавить стили для сообщений
const style = document.createElement("style");
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    
    .message.info { background: #17a2b8; color: white; }
    .message.success { background: #28a745; color: white; }
    .message.error { background: #dc3545; color: white; }
    .message.warning { background: #ffc107; color: #212529; }
    
    .mobile-open {
        display: flex !important;
        flex-direction: column;
        position: absolute;
        top: 70px;
        left: 0;
        right: 0;
        background: #2c3e50;
        padding: 20px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    }
`;
document.head.appendChild(style);

// Функции для циклов

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
