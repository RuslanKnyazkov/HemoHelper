let savedNumbers = [];
let currentMode = "default";
let currentModeDisplay = "По умолчанию";

document.addEventListener("DOMContentLoaded", () => {
  loadSavedNumbers();
  setupEventListeners();
  updateDisplay();

  setMode("default", "По умолчанию");

  document.getElementById("numberInput").focus();
});

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

  document
    .getElementById("customMode")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        const customMode = this.value.trim();
        if (customMode) {
          setMode("custom", customMode);
          this.value = "";
          this.parentElement.style.display = "none";
        }
      }
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

  console.log("Сохраненная проба:", numberObject);
  console.log("Скопировано в буфер:", clipboardObject);
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
                        <div class="number-value">${escapeHtml(
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
                    <div style="margin-top: 10px; display: flex; gap: 10px;">
                        <button onclick="copyNumber('${
                          item.id
                        }')" style="padding: 5px 10px; font-size: 12px; background: #339af0; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            <i class="fas fa-copy"></i> Копировать JSON
                        </button>
                        <button onclick="deleteNumber('${
                          item.id
                        }')" style="padding: 5px 10px; font-size: 12px; background: #ff6b6b; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            <i class="fas fa-trash"></i> Удалить
                        </button>
                    </div>
                `;
    listElement.appendChild(itemElement);
  });
}

function clearInput() {
  document.getElementById("numberInput").value = "";
  document.getElementById("customMode").value = "";
  document.getElementById("customModeContainer").style.display = "none";
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

window.getNumbers = () => savedNumbers;
window.getCurrentMode = () => ({
  mode: currentMode,
  display: currentModeDisplay,
});
window.clearStorage = () => {
  localStorage.clear();
  location.reload();
};

setInterval(() => {
  if (savedNumbers.length > 0) {
    saveToLocalStorage();
    console.log("Автосохранение выполнено");
  }
}, 300000);

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
      number: input.value, // Берем только строку с номером
      original_mode: input.mode,
    };

    navigator.clipboard
      .writeText(JSON.stringify(archiveInfo, null, 2))
      .then(() => {
        showMessage(
          `✅ JSON виртуального архива "${input.value}" скопирован в буфер`,
          "success"
        );
        console.log(archiveInfo);
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

// движение блоков

// Функции для переключения контейнеров
function showContainer(containerNumber) {
  // Скрыть все контейнеры
  document.querySelectorAll(".container").forEach((container) => {
    container.classList.remove("active");
  });

  // Показать выбранный контейнер
  document
    .getElementById(`container${containerNumber}`)
    .classList.add("active");

  // Обновить индикаторы
  document.querySelectorAll(".indicator").forEach((indicator) => {
    indicator.classList.remove("active");
  });
  document
    .querySelector(`.indicator[data-container="${containerNumber}"]`)
    .classList.add("active");
}

// Обработчики для индикаторов
document.querySelectorAll(".indicator").forEach((indicator) => {
  indicator.addEventListener("click", function () {
    const containerNumber = parseInt(this.dataset.container);
    showContainer(containerNumber);
  });
});

// Инициализация - показать первый контейнер
document.addEventListener("DOMContentLoaded", function () {
  showContainer(1);
});

// Навигация клавишами
document.addEventListener("keydown", function (e) {
  if (e.key === "ArrowLeft") {
    showContainer(1);
  } else if (e.key === "ArrowRight") {
    showContainer(2);
  }
});

// Show alictovs
// Function by Ruslan Knyazkov

function showAlictotContent() {
  // Thinck how create table
  const container = document.getElementById("right-panel2");

  // Создаем основной контейнер
  const alicvotsContainer = document.createElement("div");
  alicvotsContainer.className = "alicvots-container";
  alicvotsContainer.id = "alicvotsContent";

  // Создаем HTML структуру
  alicvotsContainer.innerHTML = `
        <div class="alicvots-header">
            <h2><i class="fas fa-table"></i>Введите данные для аликвот</h2>
        </div>
        
        <div class="alicvots-content">
            <!-- Форма ввода -->
            <div class="input-section">
                <div class="input-group">
                    <label for="alicvotsName">
                        <i class="fas fa-tag"></i>
                        Название:
                    </label>
                    <div class="input-with-icon">
                        <i class="fas fa-font"></i>
                        <input type="text" 
                               id="alicvotsName" 
                               placeholder="Введите название"
                               maxlength="50">
                    </div>
                </div>
                
                <div class="input-group">
                    <label for="alicvotsValue">
                        <i class="fas fa-hashtag"></i>
                        Лот:
                    </label>
                    <div class="input-with-icon">
                        <i class="fas fa-calculator"></i>
                        <input type="number" 
                               id="alicvotsValue" 
                               placeholder="0"
                               step="0.01">
                    </div>
                </div>

                <div class="input-group">
                    <label for="alicvotsCount">
                        <i class="fas fa-hashtag"></i>
                        Колличество экземпляров:
                    </label>
                    <div class="input-with-icon">
                        <i class="fas fa-calculator"></i>
                        <input type="number" 
                               id="alicvotsCount" 
                               placeholder="0"
                               step="1">
                    </div>
                </div>

                <div class="input-group">
                    <label for="alicvotsVolume">
                        <i class="fas fa-hashtag"></i>
                        Обьём в [мкл , мл]:
                    </label>
                    <div class="input-with-icon">
                        <i class="fas fa-calculator"></i>
                        <input type="number" 
                               id="alicvotsVolume" 
                               placeholder="0 мкл"
                               >
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

  // Добавляем контейнер в DOM
  checkContainer(container, alicvotsContainer);
}

function checkContainer(parent, child) {
  if (parent.hasChildNodes()) {
    for (let i = 0; i < parent.children.length; i++) {
      console.log(`Удален ${parent.children[i]}`);
      parent.removeChild(parent.children[i]);
    }
  }
  parent.appendChild(child);
}

function addAlicvotsItem() {
  const name = document.getElementById("alicvotsName");
  const lot = document.getElementById("alicvotsValue");
  const count = document.getElementById("alicvotsCount");
  const volume = document.getElementById("alicvotsVolume");

  if (count.value > 10) {
    showMessage(
      "Слишком большое колличество наклеек. Нельзя распечатать больше 10 наклеек",
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
          `Успешая передача на печать ${count.value} этикеток`,
          "success"
        );
      })
      .catch((error) => {
        showMessage(`Ошибка ${error}`);
      });
  }
}
