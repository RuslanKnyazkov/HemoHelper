// === ПЕРЕМЕННЫЕ ДЛЯ ОСНОВНОЙ СИСТЕМЫ ===
let savedNumbers = [];
let currentMode = "default";
let currentModeDisplay = "По умолчанию";

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
  clean_b: "Clb",
  clean_b_dil: "ClbDil",
  aptt_reagent: "APTT-R",
  aptt_cacl2: "APTT-Ca",
  at_liquid_reagent: "AT-R",
  at_liquid_substrat: "AT-S",
  recombiplastin: "PT",
  trombintime: "TT",
  fibrinogen: "O.F.A",
  ps_C4PV: "C4PV",
  ps_anti_ps: "PS Latex",
  f_diluent: "F_D",
  pc_dil: "PC_D",
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

// === ОСНОВНАЯ ИНИЦИАЛИЗАЦИЯ ===
document.addEventListener("DOMContentLoaded", () => {
  loadSavedNumbers();
  setupEventListeners();
  updateDisplay();
  setMode("default", "По умолчанию");
  initReagentSelector();
  updateHemostasisStatistics();
  document.getElementById("numberInput").focus();

  // Инициализация индикаторов переключения контейнеров
  const indicators = document.querySelectorAll(".indicator");
  indicators.forEach((indicator) => {
    indicator.addEventListener("click", function () {
      const containerNum = this.dataset.container;
      showContainer(parseInt(containerNum));
    });
  });
});

// === ОСНОВНЫЕ ФУНКЦИИ СИСТЕМЫ ===
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
                <div class="number-value">${escapeHtml(item.number)}</div>
                <div>
                    <span class="number-mode ${modeClass}">${escapeHtml(
      item.modeDisplay
    )}</span>
                    <span class="number-time">${item.date}</span>
                </div>
            </div>
            <div class="number-id">ID: ${item.id}</div>
            <div class="number-actions">
                <button onclick="copyNumber('${item.id}')" class="copy-btn">
                    <i class="fas fa-copy"></i> Копировать JSON
                </button>
                <button onclick="deleteNumber('${item.id}')" class="delete-btn">
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

// === ФУНКЦИИ ДЛЯ ПЕРЕКЛЮЧЕНИЯ КОНТЕЙНЕРОВ ===
function showContainer(containerNumber) {
  document.querySelectorAll(".container").forEach((container) => {
    container.classList.remove("active");
  });

  document
    .getElementById(`container${containerNumber}`)
    .classList.add("active");

  document.querySelectorAll(".indicator").forEach((indicator) => {
    indicator.classList.remove("active");
  });

  document
    .querySelector(`.indicator[data-container="${containerNumber}"]`)
    .classList.add("active");
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

  if (["d1", "d2", "d3"].includes(rack) && [3, 4, 4, 5, 6].includes(hole)) {
    showMessage(
      `Реагент "${reagentFullNames[selectedReagent]}" не может быть размещен в R${rack}!`,
      "error"
    );
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

  if (reagentsData[rack][hole - 1] === selectedReagent) {
    // Очистить лунку, если там уже этот реагент
    reagentsData[rack][hole - 1] = null;
    if (holeEl) holeEl.textContent = "";
    if (holeContainer)
      holeContainer.classList.remove(colorHoles[selectedReagent] || "filled");
    showMessage(`Лунка ${hole} в R${rack} очищена`, "info");
  } else {
    // Установить реагент

    console.log(reagentsData, selectedReagent);
    reagentsData[rack][hole - 1] = selectedReagent;
    if (holeEl) holeEl.textContent = reagentDisplayNames[selectedReagent];
    if (holeContainer)
      holeContainer.classList.add(colorHoles[selectedReagent] || "filled");
    showMessage(
      `${reagentFullNames[selectedReagent]} установлен в R${rack}, лунка ${hole}`,
      "success"
    );
  }

  updateHemostasisStatistics();
}

function clearAllRacks() {
  if (confirm("Очистить все реки?")) {
    ["d1", "d2", "d3", "r1", "r2", "r3", "r4", "r5", "r6"].forEach((rack) => {
      for (let i = 1; i <= 9; i++) {
        reagentsData[rack][i - 1] = null;
        const holeEl = document.getElementById(`hole_${rack}_${i}`);
        if (holeEl) holeEl.textContent = "";
        const holeContainer = document.querySelector(
          `#rack-${rack} .hole[data-hole="${i}"]`
        );
        if (holeContainer) {
          holeContainer.classList.remove("filled");
        }
      }
    });
    showMessage("Все реки очищены", "success");
    updateHemostasisStatistics();
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

function fillRandom() {
  if (
    confirm("Заполнить все реки случайными реагентами с учетом ограничений?")
  ) {
    const reagentOptions = {
      r1: ["aptt_reagent", "at_liquid_reagent"],
      r2: ["aptt_reagent", "at_liquid_reagent"],
      r3: [
        "aptt_cacl2",
        "at_liquid_substrat",
        "recombiplastin",
        "trombintime",
        "fibrinogen",
      ],
      r4: [
        "aptt_cacl2",
        "at_liquid_substrat",
        "recombiplastin",
        "trombintime",
        "fibrinogen",
      ],
      r5: [
        "aptt_cacl2",
        "at_liquid_substrat",
        "recombiplastin",
        "trombintime",
        "fibrinogen",
      ],
      r6: [
        "aptt_cacl2",
        "at_liquid_substrat",
        "recombiplastin",
        "trombintime",
        "fibrinogen",
      ],
    };

    ["r1", "r2", "r3", "r4", "r5", "r6"].forEach((rack) => {
      const allowedReagents = reagentOptions[rack];
      for (let i = 1; i <= 6; i++) {
        const randomReagent =
          allowedReagents[Math.floor(Math.random() * allowedReagents.length)];
        reagentsData[rack][i - 1] = randomReagent;
        const holeEl = document.getElementById(`hole_${rack}_${i}`);
        if (holeEl) {
          holeEl.textContent = reagentDisplayNames[randomReagent];
        }
        const holeContainer = document.querySelector(
          `#rack-${rack} .hole[data-hole="${i}"]`
        );
        if (holeContainer) {
          holeContainer.classList.add("filled");
        }
      }
    });

    showMessage(
      "Все реки заполнены случайными реагентами с учетом ограничений",
      "success"
    );
    updateHemostasisStatistics();
  }
}

function generateReport() {
  let report = "=== ОТЧЕТ ПО РЕАГЕНТАМ ГЕМОСТАЗА ===\n\n";

  ["r1", "r2", "r3", "r4", "r5", "r6"].forEach((rack) => {
    report += `Рек ${rack}:\n`;

    let filledCount = 0;
    reagentsData[rack].forEach((reagent, index) => {
      const reagentName = reagent ? reagentFullNames[reagent] : "пусто";
      report += `  Лунка ${index + 1}: ${reagentName}\n`;
      if (reagent) filledCount++;
    });

    report += `  Заполнено: ${filledCount}/6\n\n`;
  });

  // Подсчет по типам реагентов
  const reagentCounts = {};
  Object.values(reagentsData).forEach((rack) => {
    rack.forEach((reagent) => {
      if (reagent) {
        reagentCounts[reagent] = (reagentCounts[reagent] || 0) + 1;
      }
    });
  });

  report += "=== СТАТИСТИКА ===\n";
  Object.entries(reagentCounts).forEach(([reagent, count]) => {
    report += `${reagentFullNames[reagent]}: ${count}\n`;
  });

  alert(report);
  showMessage("Отчет сформирован", "success");
}

function updateHemostasisStatistics() {
  const totalHoles = 36; // 6 реков * 6 лунок
  let filledHoles = 0;

  ["r1", "r2", "r3", "r4", "r5", "r6"].forEach((rack) => {
    reagentsData[rack].forEach((hole) => {
      if (hole) filledHoles++;
    });
  });

  const emptyHoles = totalHoles - filledHoles;
  const completionPercent = Math.round((filledHoles / totalHoles) * 100);

  const totalEl = document.getElementById("totalHoles");
  const filledEl = document.getElementById("filledHoles");
  const emptyEl = document.getElementById("emptyHoles");
  const percentEl = document.getElementById("completionPercent");

  if (totalEl) totalEl.textContent = totalHoles;
  if (filledEl) filledEl.textContent = filledHoles;
  if (emptyEl) emptyEl.textContent = emptyHoles;
  if (percentEl) percentEl.textContent = `${completionPercent}%`;
}
