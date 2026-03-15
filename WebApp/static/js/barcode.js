// ===== КОНФИГУРАЦИЯ И СОСТОЯНИЕ БАРКОДОВ =====
const BarcodeConfig = {
  STORAGE: {
    MAX_BARCODE_HISTORY: 100,
  },
  ANIMATION: {
    NOTIFICATION_DURATION: 5000,
  },
};

const BarcodeState = {
  barcodeMode: "default",
  barcodeHistory: [],
  retry: 1,
  selectCodeFormat: "B2N",
};

// ===== УТИЛИТЫ ДЛЯ БАРКОДОВ =====
const BarcodeUtils = {
  getCSRFToken() {
    return (
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("csrftoken="))
        ?.split("=")[1] || ""
    );
  },

  getRussianPlural(number, one, two, five) {
    let n = Math.abs(number) % 100;
    if (n >= 5 && n <= 20) return five;
    n %= 10;
    if (n === 1) return one;
    if (n >= 2 && n <= 4) return two;
    return five;
  },
};

// ===== УВЕДОМЛЕНИЯ =====
const BarcodeNotificationManager = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.id = "barcode-notification-container";
      this.container.style.cssText = `
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
      document.body.appendChild(this.container);
    }
  },

  show(message, type = "info") {
    this.init();

    const config = {
      success: { icon: "fa-check-circle", color: "#10b981" },
      error: { icon: "fa-exclamation-circle", color: "#ef4444" },
      warning: { icon: "fa-exclamation-triangle", color: "#f59e0b" },
      info: { icon: "fa-info-circle", color: "#667eea" },
    }[type];

    const notification = document.createElement("div");
    notification.className = "barcode-notification";
    notification.style.cssText = `
      background: var(--bg-card);
      border-left: 4px solid ${config.color};
      border-radius: var(--radius-lg);
      padding: 16px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: var(--shadow-md);
      animation: slideInRight 0.3s ease;
    `;

    notification.innerHTML = `
      <div style="color: ${config.color}; font-size: 20px;">
        <i class="fas ${config.icon}"></i>
      </div>
      <div style="flex: 1;">${message}</div>
      <button class="close-notification" style="background: none; border: none; color: var(--text-secondary); cursor: pointer;">
        <i class="fas fa-times"></i>
      </button>
    `;

    const closeBtn = notification.querySelector(".close-notification");
    closeBtn.onclick = () => notification.remove();

    this.container.appendChild(notification);

    setTimeout(
      () => notification.remove(),
      BarcodeConfig.ANIMATION.NOTIFICATION_DURATION,
    );
  },
};

const showBarcodeNotification = (msg, type) =>
  BarcodeNotificationManager.show(msg, type);

// ===== API ДЛЯ БАРКОДОВ =====
const BarcodeAPI = {
  async sendToDjango(data) {
    console.log(`📤 Отправка баркода:`, data);

    try {
      const response = await fetch("/save-barcode/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": BarcodeUtils.getCSRFToken(),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ошибка сервера: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      if (!result.success)
        throw new Error(result.error || "Неизвестная ошибка");

      return result;
    } catch (error) {
      console.error("❌ Ошибка отправки на сервер:", error);
      throw error;
    }
  },
};

// ===== ОСНОВНОЙ МОДУЛЬ БАРКОДОВ =====
const BarcodeModule = {
  // Конфигурация режимов
  modes: {
    testosterone: {
      display: "Testosterone 1:10",
      searchText: "Testosterone 1:10",
      active: true,
    },
    default: {
      display: "Обычная наклейка",
      searchText: "Обычная наклейка",
      active: true,
    },
    "a-tpo": {
      display: "A-TPO 1:5",
      searchText: "A-TPO 1:5",
      active: true,
    },
    prog: {
      display: "Progesterone 1:10",
      searchText: "Progesterone 1:10",
      active: true,
    },
    "a-thsr": {
      display: "A-THSR 1:10",
      searchText: "A-THSR 1:10",
      active: true,
    },
    dhea: {
      display: "DHEA 1:10",
      searchText: "DHEA 1:10",
      active: true,
    },
    Alinity: {
      display: "Alinity",
      searchText: "Alinity",
      active: true,
    },
    HbA1c: {
      display: "Arhive Arhitect",
      searchText: "Arhive Arhitect",
      active: true,
    },
    PRL_Macro: {
      display: "Prolactin 1:1",
      searchText: "Prolactin 1:1",
      active: true,
    },
  },

  // Инициализация модуля
  init() {
    this.loadState();
    this.setupEventListeners();
    this.updateDisplay();
    this.activateDefaultMode();
  },

  // Загрузка состояния из localStorage
  loadState() {
    const saved = localStorage.getItem("barcodeState");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        BarcodeState.barcodeMode = parsed.barcodeMode || "default";
        BarcodeState.retry = parsed.retry || 1;
        BarcodeState.selectCodeFormat = parsed.selectCodeFormat || "B2N";
      } catch (e) {
        console.error("Ошибка загрузки состояния:", e);
      }
    }
  },

  // Сохранение состояния
  saveState() {
    localStorage.setItem(
      "barcodeState",
      JSON.stringify({
        barcodeMode: BarcodeState.barcodeMode,
        retry: BarcodeState.retry,
        selectCodeFormat: BarcodeState.selectCodeFormat,
      }),
    );
  },

  // Настройка обработчиков событий
  setupEventListeners() {
    const input = document.getElementById("barcode-input");
    if (input) {
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") this.saveBarcode();
      });
    }
  },

  // ===== ФУНКЦИИ ДЛЯ РАБОТЫ С КЛАССОМ ACTIVE =====

  // Активация режима по умолчанию при загрузке
  activateDefaultMode() {
    setTimeout(() => {
      this.selectMode(BarcodeState.barcodeMode);
      this.selectRetry(String(BarcodeState.retry));
      this.selectCode(BarcodeState.selectCodeFormat === "BCN" ? "128" : "2of5");
    }, 100);
  },

  // Выбор режима анализа (исправленная версия)
  selectMode(mode) {
    console.log("Выбран режим:", mode);
    BarcodeState.barcodeMode = mode;

    // Получаем все карточки режимов
    const modeCards = document.querySelectorAll(".mode-card");

    // Удаляем класс active у всех карточек
    modeCards.forEach((card) => {
      card.classList.remove("active");
    });

    // Находим и активируем нужную карточку
    const modeConfig = this.modes[mode];
    if (modeConfig) {
      // Ищем карточку по тексту в h4
      let found = false;
      modeCards.forEach((card) => {
        const h4 = card.querySelector("h4");
        if (
          h4 &&
          h4.textContent.includes(modeConfig.searchText || modeConfig.display)
        ) {
          card.classList.add("active");
          found = true;
          console.log("Класс active добавлен к карточке:", h4.textContent);
        }
      });

      // Если не нашли по тексту, пробуем найти по data-атрибуту
      if (!found) {
        const dataCard = document.querySelector(
          `.mode-card[data-mode="${mode}"]`,
        );
        if (dataCard) {
          dataCard.classList.add("active");
          console.log("Класс active добавлен по data-mode");
        }
      }
    }

    this.saveState();
    showBarcodeNotification(
      `Режим изменен: ${this.getModeDisplayName(mode)}`,
      "info",
    );
  },

  // Выбор количества наклеек (исправленная версия)
  selectRetry(count) {
    console.log("Выбрано количество:", count);
    BarcodeState.retry = parseInt(count);

    // Получаем все кнопки количества
    const retryBtns = document.querySelectorAll(".mode-card-btn");

    // Удаляем класс active у всех кнопок
    retryBtns.forEach((btn) => {
      btn.classList.remove("active");
    });

    // Добавляем класс active к выбранной кнопке
    retryBtns.forEach((btn, index) => {
      const btnNumber = index + 1;
      if (btnNumber === parseInt(count)) {
        btn.classList.add("active");
        console.log(`Класс active добавлен к кнопке ${btnNumber}`);
      }
    });

    this.saveState();
    showBarcodeNotification(`Количество наклеек: ${count}`, "info");
  },

  // Выбор формата кода (исправленная версия)
  selectCode(code) {
    console.log("Выбран формат:", code);

    // Удаляем active у всех кнопок формата
    ["128", "2of5"].forEach((id) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.classList.remove("active");
      }
    });

    // Добавляем active к выбранной кнопке
    const selectedBtn = document.getElementById(code);
    if (selectedBtn) {
      selectedBtn.classList.add("active");
      console.log(`Класс active добавлен к кнопке ${code}`);
    }

    BarcodeState.selectCodeFormat = code === "128" ? "BCN" : "B2N";
    this.saveState();

    showBarcodeNotification(
      `Установлен формат ${code === "128" ? "буквенно-числовой" : "циферный"}`,
      "success",
    );
  },

  // ===== ФУНКЦИИ ДЛЯ РАБОТЫ С БАРКОДАМИ =====

  // Сохранение баркода
  async saveBarcode() {
    const input = document.getElementById("barcode-input");
    if (!input) return;

    const barcode = input.value.trim();
    if (!barcode) {
      showBarcodeNotification("Введите номер пробы!", "error");
      input.focus();
      return;
    }

    if (barcode.length !== 10 && BarcodeState.selectCodeFormat === "B2N") {
      showBarcodeNotification(
        "Внимание: длина номера не равна 10 цифрам",
        "error",
      );
      return;
    }

    const isDuplicate = BarcodeState.barcodeHistory.some(
      (item) => item.number === barcode,
    );

    if (
      isDuplicate &&
      !confirm("Такой номер уже был добавлен. Добавить повторно?")
    ) {
      return;
    }

    const barcodeObject = {
      type: "barcode",
      barcode: barcode,
      number: barcode,
      mode: BarcodeState.barcodeMode,
      anchor: "h",
      size: "s",
      retry: BarcodeState.retry,
      code: BarcodeState.selectCodeFormat,
    };

    BarcodeState.barcodeHistory.unshift(barcodeObject);

    try {
      await BarcodeAPI.sendToDjango(barcodeObject);
      showBarcodeNotification(
        `✅ Проба "${barcode}" отправлена на печать!`,
        "success",
      );
    } catch (error) {
      showBarcodeNotification(`❌ Ошибка отправки: ${error.message}`, "error");
    }

    this.updateDisplay();
    input.value = "";
    input.focus();
  },

  // Обновление отображения истории
  updateDisplay() {
    const countEl = document.getElementById("barcode-count");
    const historyEl = document.getElementById("barcode-history");

    if (!countEl || !historyEl) return;

    const count = BarcodeState.barcodeHistory.length;
    countEl.textContent = `${count} ${BarcodeUtils.getRussianPlural(count, "проба", "пробы", "проб")} (текущая сессия)`;

    if (count === 0) {
      historyEl.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-inbox"></i>
          <h3>Нет сохраненных проб</h3>
          <p>Добавьте первую пробу через форму слева</p>
        </div>
      `;
      return;
    }

    historyEl.innerHTML = BarcodeState.barcodeHistory
      .map((item) => this.renderHistoryItem(item))
      .join("");
  },

  // Рендер элемента истории
  renderHistoryItem(item) {
    return `
<div class="history-item">
  <div class="history-item-header">
    <div class="history-item-title">
      <div class="title-icon">
        <i class="fas fa-barcode"></i>
      </div>
      <div class="title-content">
        <span class="title-label">Номер пробы</span>
        <span class="title-value">${item.number}</span>
      </div>
    </div>
    
    <div class="history-item-badges">
      <span class="badge badge-success">
        <i class="fas fa-copy"></i>
        <span class="badge-text">${item.retry} шт</span>
      </span>
      
      <span class="badge badge-primary">
        <i class="fas fa-${this.getModeIcon(item.mode)}"></i>
        <span class="badge-text">${this.getModeDisplayName(item.mode)}</span>
      </span>
    </div>
  </div>

  <div class="history-item-preview">
    <div class="preview-strip">
      <div class="strip-left"></div>
      <div class="strip-code">
        <i class="fas fa-qrcode"></i>
        <span>${item.number.substring(0, 10)}</span>
      </div>
      <div class="strip-right"></div>
    </div>
  </div>

  <div class="history-item-footer">
    <div class="footer-info">
      <i class="far fa-clock"></i>
      <span>${new Date().toLocaleTimeString()}</span>
    </div>
    
    <div class="history-item-actions">
      <button class="btn-action btn-reuse" onclick="BarcodeModule.reuseBarcode('${item.number}')">
        <i class="fas fa-redo-alt"></i>
        <span>Повтор</span>
      </button>
      
      <button class="btn-action btn-delete" onclick="BarcodeModule.deleteBarcode('${item.number}')">
        <i class="fas fa-trash-alt"></i>
        <span>Удалить</span>
      </button>
    </div>
  </div>
</div>
    `;
  },

  // Получение иконки для режима
  getModeIcon(mode) {
    const icons = {
      testosterone: "flask",
      default: "tag",
      "a-tpo": "vial",
      prog: "flask",
      "a-thsr": "vial",
      dhea: "flask",
      Alinity: "microscope",
      HbA1c: "microscope",
    };
    return icons[mode] || "barcode";
  },

  // Получение отображаемого имени режима
  getModeDisplayName(mode) {
    return this.modes[mode]?.display || mode;
  },

  // Повторное использование баркода
  async reuseBarcode(id) {
    const item = BarcodeState.barcodeHistory.find(
      (item) => item.number.toString() === id,
    );

    if (item) {
      try {
        await BarcodeAPI.sendToDjango({ ...item, type: "barcode" });
        showBarcodeNotification(
          `✅ Проба "${id}" отправлена повторно`,
          "success",
        );
      } catch (error) {
        showBarcodeNotification(`❌ Ошибка: ${error.message}`, "error");
      }
    }
  },

  // Удаление баркода из истории
  deleteBarcode(id) {
    BarcodeState.barcodeHistory = BarcodeState.barcodeHistory.filter(
      (item) => item.number.toString() !== id,
    );
    this.updateDisplay();
    showBarcodeNotification("Проба удалена из текущей сессии", "success");
  },

  // Специальные этикетки
  async specialLabel(type) {
    const templates = {
      saliva: { type: "text", text: "Sluna", anchor: "c", size: "l" },
      virtual: { type: "text", text: "LAMI", anchor: "c", size: "l" },
      duplicate: { type: "text", text: "DUBLI", anchor: "c", size: "l" },
      infinity: {
        type: "barcode",
        code: "BCN",
        text: "As123456",
        barcode: "As123456",
        anchor: "h",
        retry: 1,
      },
      sorted: {
        type: "barcode",
        code: "BCN",
        text: "Sorted",
        barcode: "Sorted",
        anchor: "h",
      },
    };

    const template = templates[type];
    if (!template) return;

    if (type === "virtual") {
      const input = document.getElementById("barcode-input");
      if (!input.value) {
        showBarcodeNotification("Сначала введите номер для штатива!", "error");
        return;
      }
      template.text = `LAMI\n${input.value}`;
      showBarcodeNotification(
        `Виртуальный штатив с номером ${input.value} отправлен`,
        "success",
      );
      input.value = "";
    }

    try {
      await BarcodeAPI.sendToDjango(template);
      showBarcodeNotification(
        `Специальная этикетка "${type}" отправлена`,
        "success",
      );
    } catch (error) {
      showBarcodeNotification(`Ошибка: ${error.message}`, "error");
    }
  },

  // Очистка поля ввода
  clearInput() {
    const input = document.getElementById("barcode-input");
    if (input) {
      input.value = "";
      input.focus();
    }
    showBarcodeNotification("Форма очищена", "info");
  },

  // Симуляция сканирования
  simulateScan() {
    const randomBarcode = Math.floor(
      100000000 + Math.random() * 900000000,
    ).toString();

    const input = document.getElementById("barcode-input");
    if (input) {
      input.value = randomBarcode;
      showBarcodeNotification(
        `Симуляция сканирования: ${randomBarcode}`,
        "info",
      );
    }
  },

  // Печать серийных наклеек
  async printSerialLabels() {
    const serial = document.getElementById("glp-serial");
    if (!serial) return;

    console.log(serial.value);

    if (!serial.value.includes("-")) {
      showBarcodeNotification(
        "Отсутствует знак '-' для определения последовательности",
        "error",
      );
      return;
    }

    let count_labels = serial.value.split("-");
    let result = Number(count_labels[1]) - Number(count_labels[0]);

    console.log(result);

    if (result > 20) {
      showBarcodeNotification(
        `Слишком много наклеек ${result}. Максимум 20 наклеек`,
        "error",
      );
      return;
    }

    let param = {
      type: "serial",
      text: BarcodeState.barcodeMode,
      retry: serial.value,
    };

    try {
      await BarcodeAPI.sendToDjango(param);
      showBarcodeNotification("Печать успешно отправлена на сервер", "success");
    } catch (error) {
      showBarcodeNotification("Ошибка: " + error.message, "error");
      console.error("Детали ошибки:", error);
    }
  },
};

// ===== ГЛОБАЛЬНЫЕ ФУНКЦИИ ДЛЯ HTML =====
window.selectMode = (mode) => BarcodeModule.selectMode(mode);
window.selectRetry = (count) => BarcodeModule.selectRetry(count);
window.selectCode = (code) => BarcodeModule.selectCode(code);
window.saveBarcode = () => BarcodeModule.saveBarcode();
window.clearBarcodeInput = () => BarcodeModule.clearInput();
window.simulateScan = () => BarcodeModule.simulateScan();
window.specialLabel = (type) => BarcodeModule.specialLabel(type);
window.reuseBarcode = (id) => BarcodeModule.reuseBarcode(id);
window.deleteBarcode = (id) => BarcodeModule.deleteBarcode(id);
window.printSerialLabelsGLP = () => BarcodeModule.printSerialLabels();

// ===== ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ =====
document.addEventListener("DOMContentLoaded", () => {
  // Проверяем, существует ли BarcodeModule перед инициализацией
  if (typeof BarcodeModule !== "undefined") {
    BarcodeModule.init();
  } else {
    console.error("BarcodeModule не найден!");
  }

  createViewCustomLabels();
});

async function createViewCustomLabels() {
  try {
    const response = await fetch("/custom-labels/", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Используем BarcodeUtils вместо Utils
        "X-CSRFToken": BarcodeUtils?.getCSRFToken() || getCookie("csrftoken"),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Ответ от сервера:", result);

    const userElement = document.getElementById("user-labels");
    if (!userElement) {
      console.error("Элемент #user-labels не найден!");
      return;
    }

    // Берем массив из result.data
    const items = result.data || [];

    if (items.length > 0) {
      userElement.innerHTML = items
        .map((item) => {
          // Экранируем JSON для безопасной вставки
          const itemJson = JSON.stringify(item).replace(/'/g, "&apos;");
          return `
            <div class="mode-card" onclick='BarcodeAPI.sendToDjango(${itemJson})'>
              <h4>${escapeHtml(item.text || item.name || "Без названия")}</h4>
              <p>${escapeHtml(item.description || "")}</p>
            </div>
          `;
        })
        .join("");
    } else {
      userElement.innerHTML = '<p class="empty-labels">Нет доступных меток</p>';
    }
  } catch (error) {
    console.error("Ошибка загрузки меток:", error);
    const userElement = document.getElementById("user-labels");
    if (userElement) {
      userElement.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Ошибка загрузки меток</p>
          <button onclick="createViewCustomLabels()" class="retry-btn">
            Повторить
          </button>
        </div>
      `;
    }
  }
}

// Функция для экранирования HTML
function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Резервная функция для получения CSRF токена
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

// // Добавляем метод sendCustomLabel в BarcodeModule (если его еще нет)
// if (typeof BarcodeModule !== "undefined" && !BarcodeModule.sendCustomLabel) {
//   BarcodeModule.sendCustomLabel = async function (item) {
//     console.log("Отправка пользовательской метки:", item);

//     try {
//       const data = {
//         type: item.type || "custom",
//         text: item.text || item.name || "",
//         barcode: item.barcode || item.text || "",
//         mode: item.mode || BarcodeState?.barcodeMode || "default",
//         anchor: item.anchor || "h",
//         size: item.size || "s",
//         retry: item.retry || BarcodeState?.retry || 1,
//         code: item.code || BarcodeState?.selectCodeFormat || "B2N",
//         ...item,
//       };

//       await BarcodeAPI.sendToDjango(data);
//       showBarcodeNotification(`✅ Метка "${data.text}" отправлена!`, "success");
//     } catch (error) {
//       console.error("Ошибка отправки метки:", error);
//       showBarcodeNotification(`❌ Ошибка: ${error.message}`, "error");
//     }
//   };
// }
