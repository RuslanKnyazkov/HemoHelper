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
  glpMode: "Alinity",
};

const LabelSetting = {
  barcode: true,
  number: true,
  mode: true,
  date: true,
  validate: true,
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

// ===== УПРАВЛЕНИЕ ПРИНТЕРАМИ (С ПОДДЕРЖКОЙ DJANGO API) =====
const PrinterManager = {
  availablePrinters: [],
  selectedPrinter: null,
  useElectronAPI: false,

  async loadFromServer() {
    const select = document.getElementById("printer-select");
    if (!select) return;

    select.innerHTML = '<option value="">🔍 Поиск принтеров...</option>';

    try {
      this.useElectronAPI = !!window.electronAPI?.getPrinters;

      let printers = [];
      let defaultPrinter = null;

      if (this.useElectronAPI) {
        printers = await window.electronAPI.getPrinters();
      } else {
        const response = await fetch("/get-printers/", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": BarcodeUtils.getCSRFToken(),
          },
        });

        const result = await response.json();
        printers = result.printers || [];
        defaultPrinter = result.default; // ← ключ "default" из вашего API
      }

      this.availablePrinters = printers.map((p) =>
        typeof p === "object" ? p.name : p,
      );
      this.renderSelect();

      // Приоритет выбора: default с сервера > localStorage > первый в списке
      this.selectedPrinter =
        defaultPrinter && this.availablePrinters.includes(defaultPrinter)
          ? defaultPrinter
          : localStorage.getItem("selectedPrinter") &&
              this.availablePrinters.includes(
                localStorage.getItem("selectedPrinter"),
              )
            ? localStorage.getItem("selectedPrinter")
            : this.availablePrinters[0] || null;

      if (this.selectedPrinter) {
        localStorage.setItem("selectedPrinter", this.selectedPrinter);
        this.updatePrinterInfo();
        if (select.querySelector(`option[value="${this.selectedPrinter}"]`)) {
          select.value = this.selectedPrinter;
        }
        showBarcodeNotification(
          `🖨️ Принтер: ${this.selectedPrinter}`,
          "success",
        );
      }

      if (this.availablePrinters.length === 0) {
        select.innerHTML = '<option value="">⚠️ Принтеры не найдены</option>';
      }
    } catch (err) {
      select.innerHTML = '<option value="">❌ Ошибка загрузки</option>';
      showBarcodeNotification(`Ошибка: ${err.message}`, "error");
      this.showRetryButton(select);
    }
  },

  showRetryButton(selectElement) {
    const existingBtn = selectElement.parentNode.querySelector(".retry-btn");
    if (existingBtn) existingBtn.remove();

    const retryBtn = document.createElement("button");
    retryBtn.className = "printer-refresh retry-btn";
    retryBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Повторить попытку';
    retryBtn.onclick = () => {
      retryBtn.disabled = true;
      retryBtn.innerHTML =
        '<i class="fas fa-spinner fa-pulse"></i> Загрузка...';
      this.loadFromServer().finally(() => {
        retryBtn.remove();
      });
    };
    selectElement.parentNode.appendChild(retryBtn);
  },

  renderSelect() {
    const select = document.getElementById("printer-select");
    if (!select) return;

    select.innerHTML = '<option value="">📋 Выберите принтер...</option>';

    this.availablePrinters.forEach((printer) => {
      const option = document.createElement("option");
      const printerName = typeof printer === "string" ? printer : printer.name;
      option.value = printerName;
      option.textContent = `🖨️ ${printerName}`;
      if (printerName === this.selectedPrinter) option.selected = true;
      select.appendChild(option);
    });
  },

  restoreSelection() {
    const saved = localStorage.getItem("selectedPrinter");
    if (saved && this.availablePrinters.includes(saved)) {
      this.selectedPrinter = saved;
    } else if (this.availablePrinters.length > 0) {
      this.selectedPrinter = this.availablePrinters[0];
      localStorage.setItem("selectedPrinter", this.selectedPrinter);
    }
  },

  updatePrinterInfo() {
    const infoBlock = document.getElementById("current-printer-info");
    const nameSpan = document.getElementById("current-printer-name");

    if (infoBlock && nameSpan) {
      if (this.selectedPrinter) {
        nameSpan.textContent = this.selectedPrinter;
        infoBlock.style.display = "flex";
      } else {
        infoBlock.style.display = "none";
      }
    }
  },

  selectPrinter(name) {
    if (!name) return;

    this.selectedPrinter = name;
    localStorage.setItem("selectedPrinter", name);
    this.updatePrinterInfo();
    this.savePrinterToServer(name);

    showBarcodeNotification(`🖨️ Принтер выбран: ${name}`, "success");
  },

  async savePrinterToServer(printerName) {
    try {
      const response = await fetch("/set-default-printer/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": BarcodeUtils.getCSRFToken(),
        },
        body: JSON.stringify({ printer: printerName }),
      });

      if (!response.ok) {
        console.warn("Не удалось сохранить выбор принтера на сервере");
      }
    } catch (error) {
      console.warn("Ошибка при сохранении принтера на сервере:", error);
    }
  },

  async refreshPrinters() {
    const btn = document.querySelector(".printer-refresh");
    if (btn) {
      btn.classList.add("loading");
      btn.disabled = true;
    }

    await this.loadFromServer();

    if (btn) {
      btn.classList.remove("loading");
      btn.disabled = false;
    }
  },

  async testPrint() {
    if (!this.selectedPrinter) {
      showBarcodeNotification("Сначала выберите принтер", "warning");
      return;
    }

    const isReady = await this.checkPrinterBeforePrint();
    if (!isReady) return;

    showBarcodeNotification("🖨️ Выполняется тестовая печать...", "info");

    try {
      const testData = {
        type: "text",
        text: "Тестовая печать",
        size: "m",
        anchor: "c",
        printer: this.selectedPrinter,
      };

      const response = await fetch("/test-print/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": BarcodeUtils.getCSRFToken(),
        },
        body: JSON.stringify(testData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        showBarcodeNotification(
          "✅ Тестовая печать выполнена успешно",
          "success",
        );
      } else {
        throw new Error(result.error || "Неизвестная ошибка");
      }
    } catch (error) {
      console.error("Ошибка тестовой печати:", error);
      showBarcodeNotification(`❌ Ошибка печати: ${error.message}`, "error");
    }
  },

  async getPrinterStatus(printerName) {
    try {
      const response = await fetch("/printer-status/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": BarcodeUtils.getCSRFToken(),
        },
        body: JSON.stringify({ printer: printerName }),
      });

      if (response.ok) {
        const status = await response.json();
        return status;
      }
    } catch (error) {
      console.warn("Не удалось получить статус принтера:", error);
    }
    return null;
  },

  async checkPrinterBeforePrint() {
    if (!this.selectedPrinter) return false;

    const status = await this.getPrinterStatus(this.selectedPrinter);
    if (status && !status.online) {
      showBarcodeNotification(
        `Принтер ${this.selectedPrinter} не в сети!`,
        "error",
      );
      return false;
    }
    if (status && status.paper_low) {
      showBarcodeNotification("Внимание: заканчивается бумага!", "warning");
    }
    return true;
  },
};

// ===== АВТООПРЕДЕЛЕНИЕ ФОРМАТА =====
const AutoFormatDetector = {
  detectFormat(barcode) {
    if (!barcode) return BarcodeState.selectCodeFormat;

    if (/^\d+$/.test(barcode)) {
      return "2of5";
    }

    if (/[A-Za-z]/.test(barcode)) {
      return "128";
    }

    if (/[^0-9A-Za-z]/.test(barcode)) {
      return "128";
    }

    return BarcodeState.selectCodeFormat;
  },

  async autoSelectAndPrint(barcode) {
    const detectedFormat = this.detectFormat(barcode);
    const currentFormat =
      BarcodeState.selectCodeFormat === "BCN" ? "128" : "2of5";

    if (detectedFormat !== currentFormat) {
      const newFormat = detectedFormat === "128" ? "128" : "2of5";
      if (typeof selectCode === "function") {
        selectCode(newFormat);
      }

      showBarcodeNotification(
        `🔍 Автоопределение: выбран ${detectedFormat === "128" ? "буквенно-числовой" : "цифровой"} формат`,
        "info",
      );
    }

    return detectedFormat;
  },
};

// ===== ГОРЯЧИЕ КЛАВИШИ =====
const KeyboardShortcuts = {
  shortcuts: {
    "ctrl+enter": () => saveBarcode(),
    "ctrl+l": (e) => {
      e.preventDefault();
      clearBarcodeInput();
    },
    "ctrl+k": (e) => {
      e.preventDefault();
      document.getElementById("barcode-input")?.focus();
    },
    f5: (e) => {
      e.preventDefault();
      PrinterManager.refreshPrinters();
    },
    escape: () => {
      if (BarcodeState.barcodeHistory.length > 0) {
        if (confirm("Очистить всю историю?")) {
          BarcodeModule.clearAllHistory();
        }
      }
    },
    "ctrl+h": () => HistorySearch.toggleSearch(),
    "ctrl+t": () => TemplatesManager.showTemplatesModal(),
    "ctrl+z": () => BarcodeModule.undoLastAction(),
    "ctrl+y": () => BarcodeModule.redoLastAction(),
    f1: (e) => {
      e.preventDefault();
      KeyboardShortcuts.showShortcutsHelp();
    },
  },

  init() {
    document.addEventListener("keydown", (e) => {
      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      let combo = "";
      if (ctrl) combo += "ctrl+";
      if (shift) combo += "shift+";
      combo += key;

      if (this.shortcuts[combo]) {
        e.preventDefault();
        this.shortcuts[combo](e);
      }

      if (!ctrl && !shift && this.shortcuts[key]) {
        this.shortcuts[key](e);
      }
    });

    setTimeout(() => {
      showBarcodeNotification(
        "💡 Горячие клавиши: Ctrl+Enter (печать), Ctrl+L (очистить), F5 (обновить), Ctrl+H (поиск), Ctrl+T (шаблоны), F1 (справка)",
        "info",
      );
    }, 2000);
  },

  showShortcutsHelp() {
    const modal = document.createElement("div");
    modal.className = "shortcuts-modal";
    modal.innerHTML = `
      <div class="shortcuts-modal-content">
        <h3><i class="fas fa-keyboard"></i> Горячие клавиши</h3>
        <div class="shortcuts-grid">
          <div class="shortcut-item"><kbd>Ctrl+Enter</kbd> - Печать</div>
          <div class="shortcut-item"><kbd>Ctrl+L</kbd> - Очистить поле</div>
          <div class="shortcut-item"><kbd>Ctrl+K</kbd> - Фокус на поле</div>
          <div class="shortcut-item"><kbd>F5</kbd> - Обновить принтеры</div>
          <div class="shortcut-item"><kbd>Esc</kbd> - Очистить историю</div>
          <div class="shortcut-item"><kbd>Ctrl+H</kbd> - Поиск</div>
          <div class="shortcut-item"><kbd>Ctrl+T</kbd> - Шаблоны</div>
          <div class="shortcut-item"><kbd>Ctrl+Z</kbd> - Отменить</div>
          <div class="shortcut-item"><kbd>Ctrl+Y</kbd> - Повторить</div>
        </div>
        <button onclick="this.closest('.shortcuts-modal').remove()">Закрыть</button>
      </div>
    `;
    document.body.appendChild(modal);
    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };
  },
};

// ===== ПОИСК И ФИЛЬТРАЦИЯ ИСТОРИИ =====
const HistorySearch = {
  filters: {
    query: "",
    mode: "all",
  },

  searchInput: null,
  searchContainer: null,
  isSearchVisible: false,

  init() {
    this.createSearchUI();
  },

  createSearchUI() {
    const barcodeMain = document.querySelector(".barcode-main");
    if (!barcodeMain) return;

    const historyList = document.getElementById("barcode-history");
    if (!historyList) return;

    this.searchContainer = document.createElement("div");
    this.searchContainer.className = "search-container";
    this.searchContainer.style.display = "none";
    this.searchContainer.innerHTML = `
      <div class="search-wrapper">
        <i class="fas fa-search"></i>
        <input type="text" id="search-input" placeholder="Поиск по номеру пробы или режиму..." />
        <button class="search-clear" style="display: none;">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="filter-buttons">
        <button class="filter-btn active" data-mode="all">Все</button>
        <button class="filter-btn" data-mode="testosterone">Testosterone</button>
        <button class="filter-btn" data-mode="default">Default</button>
        <button class="filter-btn" data-mode="a-tpo">A-TPO</button>
        <button class="filter-btn" data-mode="prog">Progesterone</button>
        <button class="filter-btn" data-mode="Alinity">Alinity</button>
        <button class="filter-btn" data-mode="HbA1c">HbA1c</button>
      </div>
    `;

    barcodeMain.insertBefore(this.searchContainer, historyList);

    this.searchInput = this.searchContainer.querySelector("#search-input");
    const clearBtn = this.searchContainer.querySelector(".search-clear");

    const debouncedSearch = debounce(() => this.search(), 300);
    this.searchInput.addEventListener("input", () => {
      clearBtn.style.display = this.searchInput.value ? "flex" : "none";
      debouncedSearch();
    });

    clearBtn.addEventListener("click", () => {
      this.searchInput.value = "";
      clearBtn.style.display = "none";
      this.search();
    });

    this.searchContainer.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.searchContainer
          .querySelectorAll(".filter-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.filters.mode = btn.dataset.mode;
        this.search();
      });
    });
  },

  toggleSearch() {
    if (this.searchContainer) {
      const isVisible = this.searchContainer.style.display !== "none";
      this.searchContainer.style.display = isVisible ? "none" : "block";
      if (!isVisible) {
        setTimeout(() => this.searchInput?.focus(), 100);
      } else {
        this.clearSearch();
      }
    }
  },

  search() {
    this.filters.query = this.searchInput?.value.toLowerCase() || "";
    this.applyFilters();
  },

  applyFilters() {
    let filtered = [...BarcodeState.barcodeHistory];

    if (this.filters.query) {
      filtered = filtered.filter(
        (item) =>
          (item.number || item.barcode || "")
            .toLowerCase()
            .includes(this.filters.query) ||
          (BarcodeModule.getModeDisplayName(item.mode) || "")
            .toLowerCase()
            .includes(this.filters.query),
      );
    }

    if (this.filters.mode !== "all") {
      filtered = filtered.filter((item) => item.mode === this.filters.mode);
    }

    if (typeof BarcodeModule.updateDisplayWithFilter === "function") {
      BarcodeModule.updateDisplayWithFilter(filtered);
    } else {
      BarcodeModule.updateDisplay();
    }

    const resultCount = filtered.length;
    if (this.filters.query || this.filters.mode !== "all") {
      showBarcodeNotification(
        `Найдено ${resultCount} ${BarcodeUtils.getRussianPlural(resultCount, "проба", "пробы", "проб")}`,
        "info",
      );
    }
  },

  clearSearch() {
    if (this.searchInput) {
      this.searchInput.value = "";
      this.filters.query = "";
      this.filters.mode = "all";

      if (this.searchContainer) {
        this.searchContainer.querySelectorAll(".filter-btn").forEach((btn) => {
          btn.classList.toggle("active", btn.dataset.mode === "all");
        });
      }

      this.applyFilters();
    }
  },
};

// ===== УПРАВЛЕНИЕ ТЕМАМИ (ОБНОВЛЕННЫЙ) =====
const ThemeManager = {
  themes: {
    dark: {
      name: "Темная",
      icon: "fa-moon",
      colors: {
        "--bg-primary": "#0f172a",
        "--bg-card": "#1e293b",
        "--bg-sidebar": "rgba(15, 23, 42, 0.95)",
        "--bg-input": "rgba(15, 23, 42, 0.8)",
        "--text-primary": "#f1f5f9",
        "--text-secondary": "#94a3b8",
        "--text-muted": "#64748b",
        "--border-color": "rgba(51, 65, 85, 0.5)",
        "--shadow-md": "0 4px 6px -1px rgba(0, 0, 0, 0.3)",
        "--gradient-start": "#667eea",
        "--gradient-end": "#764ba2",
        "--hover-bg": "rgba(255, 255, 255, 0.05)",
        "--card-bg": "rgba(30, 41, 59, 0.7)",
      },
    },
    light: {
      name: "Светлая",
      icon: "fa-sun",
      colors: {
        "--bg-primary": "#f8f9fa",
        "--bg-card": "#ffffff",
        "--bg-sidebar": "rgba(248, 249, 250, 0.95)",
        "--bg-input": "#ffffff",
        "--text-primary": "#212529",
        "--text-secondary": "#6c757d",
        "--text-muted": "#adb5bd",
        "--border-color": "rgba(0, 0, 0, 0.1)",
        "--shadow-md": "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        "--gradient-start": "#f59e0b",
        "--gradient-end": "#eab308",
        "--hover-bg": "rgba(0, 0, 0, 0.03)",
        "--card-bg": "rgba(255, 255, 255, 0.9)",
      },
    },
    highContrast: {
      name: "Высокий контраст",
      icon: "fa-adjust",
      colors: {
        "--bg-primary": "#000000",
        "--bg-card": "#1a1a1a",
        "--bg-sidebar": "#000000",
        "--bg-input": "#1a1a1a",
        "--text-primary": "#ffffff",
        "--text-secondary": "#ffff00",
        "--text-muted": "#cccccc",
        "--border-color": "#ffffff",
        "--shadow-md": "0 4px 6px -1px rgba(255, 255, 255, 0.2)",
        "--gradient-start": "#ffff00",
        "--gradient-end": "#ffcc00",
        "--hover-bg": "rgba(255, 255, 255, 0.1)",
        "--card-bg": "#000000",
      },
    },
  },

  currentTheme: "dark",

  init() {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme && this.themes[savedTheme]) {
      this.currentTheme = savedTheme;
    }
    this.applyTheme(this.currentTheme);
    this.createThemeSwitcher();
    this.addThemeStyles();
  },

  applyTheme(themeName) {
    const theme = this.themes[themeName];
    if (!theme) return;

    Object.entries(theme.colors).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });

    localStorage.setItem("theme", themeName);
    this.currentTheme = themeName;
    this.updateSwitcherIcon();
    document.body.setAttribute("data-theme", themeName);
  },

  addThemeStyles() {
    const style = document.createElement("style");
    style.id = "theme-additional-styles";
    style.textContent = `
      /* ===== СВЕТЛАЯ ТЕМА ===== */
      body[data-theme="light"] {
        background: var(--bg-primary);
      }
      
      body[data-theme="light"] .header {
        background: var(--bg-card);
        border-bottom-color: var(--border-color);
      }
      
      body[data-theme="light"] .logo-text h1 {
        color: var(--text-primary);
        -webkit-text-fill-color: var(--text-primary);
        background: none;
      }
      
      body[data-theme="light"] .nav-btn {
        color: var(--text-secondary);
      }
      
      body[data-theme="light"] .nav-btn:hover {
        background: var(--hover-bg);
        color: var(--text-primary);
      }
      
      body[data-theme="light"] .nav-btn.active {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
      }
      
      body[data-theme="light"] .hero__content {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 249, 250, 0.95));
        border-color: var(--border-color);
      }
      
      body[data-theme="light"] .hero__title {
        color: var(--text-primary);
        -webkit-text-fill-color: var(--text-primary);
        background: none;
      }
      
      body[data-theme="light"] .hero__subtitle {
        color: var(--text-secondary);
      }
      
      body[data-theme="light"] .stat-card {
        background: var(--bg-card);
        border-color: var(--border-color);
      }
      
      body[data-theme="light"] .stat-card:hover {
        border-color: rgba(245, 158, 11, 0.3);
      }
      
      body[data-theme="light"] .stat-icon {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
      }
      
      body[data-theme="light"] .module-card {
        background: var(--bg-card);
        border-color: var(--border-color);
      }
      
      body[data-theme="light"] .module-card:hover {
        border-color: rgba(245, 158, 11, 0.3);
        box-shadow: var(--shadow-md);
      }
      
      body[data-theme="light"] .module-card__header {
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(234, 179, 8, 0.05));
      }
      
      body[data-theme="light"] .module-icon {
        background: linear-gradient(135deg, #f59e0b, #eab308);
      }
      
      body[data-theme="light"] .module-card__title {
        color: var(--text-primary);
      }
      
      body[data-theme="light"] .module-card__description {
        color: var(--text-secondary);
      }
      
      body[data-theme="light"] .feature-item i {
        color: #f59e0b;
      }
      
      body[data-theme="light"] .module-btn {
        background: linear-gradient(135deg, #f59e0b, #eab308);
      }
      
      body[data-theme="light"] .container-modern {
        background: var(--bg-card);
        border-left-color: var(--border-color);
      }
      
      body[data-theme="light"] .container-header {
        background: var(--bg-card);
        border-bottom-color: var(--border-color);
      }
      
      body[data-theme="light"] .container-title h2 {
        color: var(--text-primary);
        -webkit-text-fill-color: var(--text-primary);
        background: none;
      }
      
      body[data-theme="light"] .close-btn {
        background: var(--hover-bg);
        border-color: var(--border-color);
        color: var(--text-secondary);
      }
      
      body[data-theme="light"] .close-btn:hover {
        background: rgba(239, 68, 68, 0.1);
        border-color: #ef4444;
        color: #ef4444;
      }
      
      /* Баркод модуль в светлой теме */
      body[data-theme="light"] .barcode-sidebar {
        background: var(--bg-sidebar);
        border-right-color: var(--border-color);
      }
      
      body[data-theme="light"] .settings-section {
        background: var(--bg-card);
        border-color: var(--border-color);
      }
      
      body[data-theme="light"] .settings-section:hover {
        border-color: rgba(245, 158, 11, 0.3);
      }
      
      body[data-theme="light"] .section-header h3 {
        color: var(--text-primary);
      }
      
      body[data-theme="light"] .section-header h3 i {
        color: #f59e0b;
        background: rgba(245, 158, 11, 0.1);
      }
      
      body[data-theme="light"] .custom-select {
        background: var(--bg-input);
        border-color: var(--border-color);
        color: var(--text-primary);
      }
      
      body[data-theme="light"] .custom-select:hover {
        border-color: rgba(245, 158, 11, 0.5);
      }
      
      body[data-theme="light"] .custom-select:focus {
        border-color: #f59e0b;
        box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
      }
      
      body[data-theme="light"] .printer-refresh {
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05));
        border-color: rgba(245, 158, 11, 0.2);
        color: #f59e0b;
      }
      
      body[data-theme="light"] .printer-refresh:hover {
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.1));
        border-color: rgba(245, 158, 11, 0.4);
        color: #d97706;
      }
      
      body[data-theme="light"] .current-printer-info {
        background: rgba(245, 158, 11, 0.05);
        border-color: rgba(245, 158, 11, 0.1);
      }
      
      body[data-theme="light"] .current-printer-label {
        color: var(--text-secondary);
      }
      
      body[data-theme="light"] .current-printer-name {
        color: #f59e0b;
      }
      
      body[data-theme="light"] .input-field {
        background: var(--bg-input);
        border-color: var(--border-color);
        color: var(--text-primary);
      }
      
      body[data-theme="light"] .input-field:focus {
        border-color: #f59e0b;
        box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
      }
      
      body[data-theme="light"] .input-label {
        color: var(--text-primary);
      }
      
      body[data-theme="light"] .input-btn {
        background: var(--hover-bg);
        color: var(--text-secondary);
      }
      
      body[data-theme="light"] .input-btn:hover {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
      }
      
      body[data-theme="light"] .input-btn.active {
        border-color: #f59e0b;
        background: rgba(245, 158, 11, 0.15);
        color: #f59e0b;
      }
      
      body[data-theme="light"] .history-item {
        background: var(--bg-card);
        border-color: var(--border-color);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      }
      
      body[data-theme="light"] .history-item:hover {
        border-color: rgba(245, 158, 11, 0.3);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
      }
      
      body[data-theme="light"] .history-item::before {
        background: linear-gradient(90deg, #f59e0b, #eab308, #fbbf24);
      }
      
      body[data-theme="light"] .title-icon {
        background: linear-gradient(135deg, #f59e0b, #eab308);
      }
      
      body[data-theme="light"] .title-label {
        color: var(--text-muted);
      }
      
      body[data-theme="light"] .title-value {
        color: var(--text-primary);
        text-shadow: none;
      }
      
      body[data-theme="light"] .badge-success {
        background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05));
        border-color: rgba(34, 197, 94, 0.2);
        color: #16a34a;
      }
      
      body[data-theme="light"] .badge-primary {
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05));
        border-color: rgba(245, 158, 11, 0.2);
        color: #d97706;
      }
      
      body[data-theme="light"] .badge-primary i {
        color: #f59e0b;
      }
      
      body[data-theme="light"] .history-item-barcode-value {
        color: var(--text-secondary);
      }
      
      body[data-theme="light"] .footer-info {
        color: var(--text-muted);
      }
      
      body[data-theme="light"] .footer-info i {
        color: #f59e0b;
      }
      
      body[data-theme="light"] .btn-action {
        background: var(--hover-bg);
        border-color: var(--border-color);
        color: var(--text-secondary);
      }
      
      body[data-theme="light"] .btn-reuse {
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05));
        border-color: rgba(245, 158, 11, 0.2);
        color: #d97706;
      }
      
      body[data-theme="light"] .btn-reuse:hover {
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.1));
        border-color: rgba(245, 158, 11, 0.4);
      }
      
      body[data-theme="light"] .mode-card {
        background: var(--hover-bg);
        border-color: var(--border-color);
      }
      
      body[data-theme="light"] .mode-card:hover {
        border-color: rgba(245, 158, 11, 0.3);
      }
      
      body[data-theme="light"] .mode-card.active {
        background: rgba(245, 158, 11, 0.08);
        border-color: #f59e0b;
        border-left-color: #f59e0b;
      }
      
      body[data-theme="light"] .mode-card h4 {
        color: var(--text-primary);
      }
      
      body[data-theme="light"] .mode-card p {
        color: var(--text-secondary);
      }
      
      body[data-theme="light"] .mode-card-btn {
        background: var(--hover-bg);
        border-color: var(--border-color);
      }
      
      body[data-theme="light"] .mode-card-btn.active {
        background: rgba(245, 158, 11, 0.2);
        border-color: #f59e0b;
        box-shadow: 0 0 10px rgba(245, 158, 11, 0.2);
      }
      
      body[data-theme="light"] .mode-card-btn h4 {
        color: var(--text-primary);
      }
      
      body[data-theme="light"] .glp-section .btn {
        background: linear-gradient(135deg, #f59e0b, #eab308);
      }
      
      body[data-theme="light"] .quick-btn {
        background: var(--hover-bg);
        border-color: var(--border-color);
        color: var(--text-secondary);
      }
      
      body[data-theme="light"] .quick-btn:hover {
        background: rgba(245, 158, 11, 0.1);
        border-color: rgba(245, 158, 11, 0.3);
        color: #d97706;
      }
      
      body[data-theme="light"] .setting-block {
        background: rgba(255, 255, 255, 0.9);
        border-color: rgba(245, 158, 11, 0.2);
      }
      
      body[data-theme="light"] .mode-div {
        color: var(--text-secondary);
      }
      
      body[data-theme="light"] .mode-div:hover {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
      }
      
      body[data-theme="light"] .mode-div.active {
        background: rgba(245, 158, 11, 0.15);
        color: #d97706;
      }
      
      body[data-theme="light"] .button-elements button {
        background: linear-gradient(135deg, #10b981, #059669);
      }
      
      body[data-theme="light"] .empty-state {
        color: var(--text-secondary);
      }
      
      body[data-theme="light"] .empty-state h3 {
        color: var(--text-primary);
      }
      
      body[data-theme="light"] .theme-switcher .theme-btn {
        background: var(--hover-bg);
        border-color: var(--border-color);
        color: #f59e0b;
      }
      
      body[data-theme="light"] .theme-switcher .theme-btn:hover {
        background: rgba(245, 158, 11, 0.1);
      }
      
      body[data-theme="light"] .theme-dropdown {
        background: var(--bg-card);
        border-color: var(--border-color);
      }
      
      body[data-theme="light"] .theme-option {
        color: var(--text-primary);
      }
      
      body[data-theme="light"] .theme-option:hover {
        background: var(--hover-bg);
      }
      
      body[data-theme="light"] .theme-option.active {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
      }
      
      body[data-theme="light"] .search-container {
        background: var(--bg-card);
        border-color: var(--border-color);
      }
      
      body[data-theme="light"] .search-wrapper input {
        background: var(--bg-input);
        border-color: var(--border-color);
        color: var(--text-primary);
      }
      
      body[data-theme="light"] .filter-btn {
        background: var(--hover-bg);
        border-color: var(--border-color);
        color: var(--text-secondary);
      }
      
      body[data-theme="light"] .filter-btn:hover,
      body[data-theme="light"] .filter-btn.active {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
        border-color: rgba(245, 158, 11, 0.3);
      }
      
      body[data-theme="light"] .templates-modal-content {
        background: var(--bg-card);
      }
      
      body[data-theme="light"] .template-item {
        background: var(--hover-bg);
      }
      
      body[data-theme="light"] .template-item:hover {
        background: rgba(245, 158, 11, 0.05);
      }
      
      body[data-theme="light"] .btn-apply {
        background: linear-gradient(135deg, #f59e0b, #eab308);
      }
      
      body[data-theme="light"] .save-template-form input {
        background: var(--bg-input);
        border-color: var(--border-color);
        color: var(--text-primary);
      }
      
      body[data-theme="light"] .save-template-form button {
        background: linear-gradient(135deg, #10b981, #059669);
      }
      
      /* Стили для скроллбара в светлой теме */
      body[data-theme="light"] ::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.05);
      }
      
      body[data-theme="light"] ::-webkit-scrollbar-thumb {
        background: rgba(245, 158, 11, 0.3);
      }
      
      body[data-theme="light"] ::-webkit-scrollbar-thumb:hover {
        background: rgba(245, 158, 11, 0.5);
      }
      
      /* Анимации для светлой темы */
      @keyframes lightPulse {
        0%, 100% {
          box-shadow: 0 0 5px rgba(245, 158, 11, 0.2);
        }
        50% {
          box-shadow: 0 0 15px rgba(245, 158, 11, 0.4);
        }
      }
      
      body[data-theme="light"] .mode-card-btn.active {
        animation: lightPulse 2s infinite;
      }
      
      /* Дополнительные улучшения для светлой темы */
      body[data-theme="light"] .clear-history-btn {
        background: rgba(239, 68, 68, 0.08);
        border-color: rgba(239, 68, 68, 0.2);
        color: #dc2626;
      }
      
      body[data-theme="light"] .clear-history-btn:hover {
        background: rgba(239, 68, 68, 0.15);
        border-color: rgba(239, 68, 68, 0.4);
      }
      
      body[data-theme="light"] .poput {
        background: var(--bg-card);
        color: var(--text-primary);
        border: 1px solid var(--border-color);
      }
      
      body[data-theme="light"] .container-stats {
        color: var(--text-secondary);
      }
    `;

    // Удаляем старый стиль если есть
    const oldStyle = document.getElementById("theme-additional-styles");
    if (oldStyle) oldStyle.remove();

    style.id = "theme-additional-styles";
    document.head.appendChild(style);
  },

  createThemeSwitcher() {
    const existingSwitcher = document.getElementById("theme-switcher");
    if (existingSwitcher) return;

    const settingsSection = document.querySelector(".settings-section");
    if (!settingsSection) return;

    const switcher = document.createElement("div");
    switcher.id = "theme-switcher";
    switcher.className = "theme-switcher";
    switcher.innerHTML = `
      <button class="theme-btn" title="Сменить тему">
        <i class="fas ${this.themes[this.currentTheme].icon}"></i>
      </button>
      <div class="theme-dropdown">
        ${Object.entries(this.themes)
          .map(
            ([key, theme]) => `
          <div class="theme-option ${key === this.currentTheme ? "active" : ""}" data-theme="${key}">
            <i class="fas ${theme.icon}"></i>
            <span>${theme.name}</span>
            <div class="theme-preview ${key}"></div>
          </div>
        `,
          )
          .join("")}
      </div>
    `;

    const btn = switcher.querySelector(".theme-btn");
    const dropdown = switcher.querySelector(".theme-dropdown");

    btn.addEventListener("click", () => {
      dropdown.classList.toggle("show");
    });

    switcher.querySelectorAll(".theme-option").forEach((option) => {
      option.addEventListener("click", () => {
        const theme = option.dataset.theme;
        this.applyTheme(theme);
        dropdown.classList.remove("show");
        btn.innerHTML = `<i class="fas ${this.themes[theme].icon}"></i>`;

        let message = "";
        if (theme === "light") message = "☀️ Светлая тема активирована";
        else if (theme === "dark") message = "🌙 Темная тема активирована";
        else message = "🎨 Высококонтрастная тема активирована";

        showBarcodeNotification(message, "success");
      });
    });

    document.addEventListener("click", (e) => {
      if (!switcher.contains(e.target)) {
        dropdown.classList.remove("show");
      }
    });

    settingsSection.appendChild(switcher);
    document.body.setAttribute("data-theme", this.currentTheme);
  },

  updateSwitcherIcon() {
    const btn = document.querySelector("#theme-switcher .theme-btn i");
    if (btn) {
      btn.className = `fas ${this.themes[this.currentTheme].icon}`;
    }
  },
};

// ===== УПРАВЛЕНИЕ ШАБЛОНАМИ =====
const TemplatesManager = {
  templates: [],

  init() {
    this.loadTemplates();
    this.createTemplatesUI();
  },

  loadTemplates() {
    const saved = localStorage.getItem("barcodeTemplates");
    if (saved) {
      try {
        this.templates = JSON.parse(saved);
      } catch (e) {
        console.error("Ошибка загрузки шаблонов:", e);
        this.templates = [];
      }
    }

    if (this.templates.length === 0) {
      this.templates = [
        {
          id: "default_testosterone",
          name: "Testosterone стандарт",
          mode: "testosterone",
          retry: 2,
          format: "128",
          settings: { barcode: true, number: true, mode: true, date: true },
        },
        {
          id: "default_archive",
          name: "Архив Alinity",
          mode: "Alinity",
          retry: 1,
          format: "2of5",
          settings: { barcode: true, number: true, mode: false, date: true },
        },
      ];
      this.saveTemplates();
    }
  },

  saveTemplates() {
    localStorage.setItem("barcodeTemplates", JSON.stringify(this.templates));
  },

  createTemplatesUI() {
    const existingBtn = document.getElementById("templates-btn");
    if (existingBtn) return;

    const printerSection = document.querySelector(".printer-select-wrapper");
    if (!printerSection) return;

    const templatesBtn = document.createElement("button");
    templatesBtn.id = "templates-btn";
    templatesBtn.className = "printer-refresh";
    templatesBtn.innerHTML = '<i class="fas fa-templates"></i> Шаблоны';
    templatesBtn.onclick = () => this.showTemplatesModal();

    printerSection.parentNode.appendChild(templatesBtn);
  },

  showTemplatesModal() {
    const modal = document.createElement("div");
    modal.className = "templates-modal";
    modal.innerHTML = `
      <div class="templates-modal-content">
        <div class="modal-header">
          <h3><i class="fas fa-templates"></i> Шаблоны настроек</h3>
          <button class="modal-close">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="templates-list">
            ${this.templates
              .map(
                (template) => `
              <div class="template-item" data-id="${template.id}">
                <div class="template-info">
                  <div class="template-name">
                    <i class="fas fa-palette"></i>
                    <strong>${this.escapeHtml(template.name)}</strong>
                  </div>
                  <div class="template-details">
                    <span class="badge">${BarcodeModule.getModeDisplayName(template.mode)}</span>
                    <span class="badge">${template.retry} шт</span>
                    <span class="badge">${template.format === "128" ? "CODE128" : "2of5"}</span>
                  </div>
                </div>
                <div class="template-actions">
                  <button class="btn-apply" onclick="TemplatesManager.applyTemplate('${template.id}')">
                    <i class="fas fa-check"></i> Применить
                  </button>
                  <button class="btn-delete-template" onclick="TemplatesManager.deleteTemplate('${template.id}')">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            `,
              )
              .join("")}
          </div>
          
          <div class="save-template-section">
            <h4>Сохранить текущие настройки как шаблон</h4>
            <div class="save-template-form">
              <input type="text" id="template-name" placeholder="Название шаблона" />
              <button onclick="TemplatesManager.saveCurrentAsTemplate()">
                <i class="fas fa-save"></i> Сохранить
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector(".modal-close").onclick = () => modal.remove();
    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };
  },

  saveCurrentAsTemplate() {
    const nameInput = document.getElementById("template-name");
    const name = nameInput?.value.trim();

    if (!name) {
      showBarcodeNotification("Введите название шаблона", "warning");
      return;
    }

    const template = {
      id: `template_${Date.now()}`,
      name: name,
      mode: BarcodeState.barcodeMode,
      retry: BarcodeState.retry,
      format: BarcodeState.selectCodeFormat === "BCN" ? "128" : "2of5",
      settings: { ...LabelSetting },
    };

    this.templates.push(template);
    this.saveTemplates();

    showBarcodeNotification(`Шаблон "${name}" сохранен`, "success");

    document.querySelector(".templates-modal")?.remove();
    this.showTemplatesModal();
  },

  applyTemplate(templateId) {
    const template = this.templates.find((t) => t.id === templateId);
    if (!template) return;

    if (typeof selectMode === "function") selectMode(template.mode);
    if (typeof selectRetry === "function") selectRetry(String(template.retry));
    if (typeof selectCode === "function") selectCode(template.format);

    if (template.settings) {
      Object.assign(LabelSetting, template.settings);
      document.querySelectorAll(".mode-div").forEach((el) => {
        const attr = el.dataset.attribute;
        if (attr && template.settings[attr] === false) {
          el.classList.remove("active");
        } else if (attr && template.settings[attr] === true) {
          el.classList.add("active");
        }
      });
    }

    showBarcodeNotification(`Применен шаблон: ${template.name}`, "success");
    document.querySelector(".templates-modal")?.remove();
  },

  deleteTemplate(templateId) {
    if (confirm("Удалить шаблон?")) {
      this.templates = this.templates.filter((t) => t.id !== templateId);
      this.saveTemplates();
      showBarcodeNotification("Шаблон удален", "success");
      document.querySelector(".templates-modal")?.remove();
      this.showTemplatesModal();
    }
  },

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  },
};

// ===== ОСНОВНОЙ МОДУЛЬ БАРКОДОВ =====
const BarcodeModule = {
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

  historyStack: [],
  historyIndex: -1,

  init() {
    this.loadState();
    this.setupEventListeners();
    this.updateDisplay();
    this.activateDefaultMode();
  },

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

  saveState() {
    localStorage.setItem(
      "barcodeState",
      JSON.stringify({
        barcodeMode: BarcodeState.barcodeMode,
        retry: BarcodeState.retry,
        selectCodeFormat: BarcodeState.selectCodeFormat,
      }),
    );
    this.saveToHistoryStack(BarcodeState);
  },

  saveToHistoryStack(state) {
    this.historyStack = this.historyStack.slice(0, this.historyIndex + 1);
    this.historyStack.push(JSON.parse(JSON.stringify(state)));
    this.historyIndex++;

    if (this.historyStack.length > 50) {
      this.historyStack.shift();
      this.historyIndex--;
    }
  },

  undoLastAction() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const previousState = this.historyStack[this.historyIndex];
      Object.assign(BarcodeState, previousState);
      this.updateDisplay();

      if (typeof selectMode === "function")
        selectMode(BarcodeState.barcodeMode);
      if (typeof selectRetry === "function")
        selectRetry(String(BarcodeState.retry));

      showBarcodeNotification("Отмена последнего действия", "info");
    } else {
      showBarcodeNotification("Нет действий для отмены", "warning");
    }
  },

  redoLastAction() {
    if (this.historyIndex < this.historyStack.length - 1) {
      this.historyIndex++;
      const nextState = this.historyStack[this.historyIndex];
      Object.assign(BarcodeState, nextState);
      this.updateDisplay();

      if (typeof selectMode === "function")
        selectMode(BarcodeState.barcodeMode);
      if (typeof selectRetry === "function")
        selectRetry(String(BarcodeState.retry));

      showBarcodeNotification("Повтор действия", "info");
    } else {
      showBarcodeNotification("Нет действий для повтора", "warning");
    }
  },

  setupEventListeners() {
    const input = document.getElementById("barcode-input");
    if (input) {
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") this.saveBarcode();
      });
    }

    const printerSelect = document.getElementById("printer-select");
    if (printerSelect) {
      printerSelect.addEventListener("change", (e) => {
        if (e.target.value) {
          PrinterManager.selectPrinter(e.target.value);
        }
      });
    }
  },

  activateDefaultMode() {
    setTimeout(() => {
      this.selectMode(BarcodeState.barcodeMode);
      this.selectRetry(String(BarcodeState.retry));
      this.selectCode(BarcodeState.selectCodeFormat === "BCN" ? "128" : "2of5");
    }, 100);
  },

  selectMode(mode) {
    console.log("Выбран режим:", mode);
    BarcodeState.barcodeMode = mode;

    const modeCards = document.querySelectorAll(".mode-card");
    modeCards.forEach((card) => card.classList.remove("active"));

    const modeConfig = this.modes[mode];
    if (modeConfig) {
      let found = false;
      modeCards.forEach((card) => {
        const h4 = card.querySelector("h4");
        if (
          h4 &&
          h4.textContent.includes(modeConfig.searchText || modeConfig.display)
        ) {
          card.classList.add("active");
          found = true;
        }
      });

      if (!found) {
        const dataCard = document.querySelector(
          `.mode-card[data-mode="${mode}"]`,
        );
        if (dataCard) dataCard.classList.add("active");
      }
    }

    this.saveState();
    showBarcodeNotification(
      `Режим изменен: ${this.getModeDisplayName(mode)}`,
      "info",
    );
  },

  selectRetry(count) {
    console.log("Выбрано количество:", count);
    BarcodeState.retry = parseInt(count);

    const retryBtns = document.querySelectorAll(".quantity-card");
    retryBtns.forEach((btn) => btn.classList.remove("active"));

    retryBtns.forEach((btn, index) => {
      const btnNumber = index + 1;
      if (btnNumber === parseInt(count)) {
        btn.classList.add("active");
      }
    });

    this.saveState();
    showBarcodeNotification(`Количество наклеек: ${count}`, "info");
  },

  selectCode(code) {
    console.log("Выбран формат:", code);

    ["128", "2of5"].forEach((id) => {
      const btn = document.getElementById(id);
      if (btn) btn.classList.remove("active");
    });

    const selectedBtn = document.getElementById(code);
    if (selectedBtn) selectedBtn.classList.add("active");

    BarcodeState.selectCodeFormat = code === "128" ? "BCN" : "B2N";
    this.saveState();

    showBarcodeNotification(
      `Установлен формат ${code === "128" ? "буквенно-числовой" : "циферный"}`,
      "success",
    );
  },

  async saveBarcode() {
    const input = document.getElementById("barcode-input");
    if (!input) return;

    const barcode = input.value.trim();
    if (!barcode) {
      showBarcodeNotification("Введите номер пробы!", "error");
      input.focus();
      return;
    }

    await AutoFormatDetector.autoSelectAndPrint(barcode);

    if (
      LabelSetting.validate &&
      barcode.length !== 10 &&
      BarcodeState.selectCodeFormat === "B2N"
    ) {
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
      anchor: "h",
      size: "s",
      retry: BarcodeState.retry,
      code: BarcodeState.selectCodeFormat,
      date: LabelSetting.date,
      printer: PrinterManager.selectedPrinter,
    };

    if (LabelSetting.number) {
      barcodeObject.number = barcode;
    }
    if (LabelSetting.barcode) {
      barcodeObject.barcode = barcode;
    }
    if (LabelSetting.mode) {
      barcodeObject.mode = BarcodeState.barcodeMode;
    }

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

    this.initHistoryBarcodes();
    this.saveToHistoryStack(BarcodeState);
  },

  updateDisplayWithFilter(filteredHistory) {
    const countEl = document.getElementById("barcode-count");
    const historyEl = document.getElementById("barcode-history");

    if (!countEl || !historyEl) return;

    const count = filteredHistory.length;
    countEl.textContent = `${count} ${BarcodeUtils.getRussianPlural(count, "проба", "пробы", "проб")} (${filteredHistory.length === BarcodeState.barcodeHistory.length ? "текущая сессия" : "результат поиска"})`;

    if (count === 0) {
      historyEl.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-inbox"></i>
          <h3>${filteredHistory !== BarcodeState.barcodeHistory ? "Ничего не найдено" : "Нет сохраненных проб"}</h3>
          <p>${filteredHistory !== BarcodeState.barcodeHistory ? "Попробуйте изменить параметры поиска" : "Добавьте первую пробу через форму слева"}</p>
        </div>
      `;
      return;
    }

    historyEl.innerHTML = filteredHistory
      .map((item) => this.renderHistoryItem(item))
      .join("");

    this.initHistoryBarcodes();
  },

  renderHistoryItem(item) {
    const barcodeValue = item.barcode || item.text || "";
    const id = item.barcode || Date.now();

    return `
<div class="history-item">
  <div class="history-item-header">
    <div class="history-item-title">
      <div class="title-icon">
        <i class="fas fa-barcode"></i>
      </div>
      <div class="title-content">
        <span class="title-label">Номер пробы</span>
        <span class="title-value">${barcodeValue}</span>
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

  <div class="history-item-barcode">
    <div id="history-barcode-${id}" class="history-item-barcode-container" style="text-align: center; margin: 10px 0;">
      <div class="history-item-barcode-preview" style="display: inline-block; background: white; padding: 8px; border-radius: 4px;">
      </div>
      <div class="history-item-barcode-value" style="margin-top: 8px; font-family: monospace; font-size: 12px; color: #8b93b0;">
        ${barcodeValue}
      </div>
    </div>
  </div>

  <div class="history-item-footer">
    <div class="footer-info">
      <i class="far fa-clock"></i>
      <span>${new Date().toLocaleTimeString()}</span>
    </div>
    
    <div class="history-item-actions">
      <button class="btn-action btn-reuse" onclick="reuseBarcode('${barcodeValue}')">
        <i class="fas fa-redo-alt"></i>
        <span>Повтор</span>
      </button>
      
      <button class="btn-action btn-delete" onclick="deleteBarcode('${barcodeValue}')">
        <i class="fas fa-trash-alt"></i>
        <span>Удалить</span>
      </button>
    </div>
  </div>
</div>
    `;
  },

  initHistoryBarcodes() {
    if (typeof JsBarcode === "undefined") return;

    setTimeout(() => {
      document
        .querySelectorAll(".history-item-barcode-preview")
        .forEach((container) => {
          const parent = container.closest(".history-item-barcode-container");
          if (!parent) return;

          const valueElement = parent.querySelector(
            ".history-item-barcode-value",
          );
          const barcodeValue = valueElement?.textContent.trim();
          if (!barcodeValue) return;

          container.innerHTML = "";
          const svg = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg",
          );
          container.appendChild(svg);

          JsBarcode(svg, barcodeValue, {
            format: "CODE128",
            displayValue: true,
            fontSize: 12,
            width: 1.5,
            height: 50,
            margin: 5,
          });
        });
    }, 100);
  },

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

  getModeDisplayName(mode) {
    return this.modes[mode]?.display || mode;
  },

  async reuseBarcode(number) {
    const item = BarcodeState.barcodeHistory.find(
      (item) => item.number === number || item.barcode === number,
    );

    if (item) {
      try {
        await BarcodeAPI.sendToDjango({ ...item, type: "barcode" });
        showBarcodeNotification(
          `✅ Проба "${number}" отправлена повторно`,
          "success",
        );
      } catch (error) {
        showBarcodeNotification(`❌ Ошибка: ${error.message}`, "error");
      }
    }
  },

  deleteBarcode(number) {
    BarcodeState.barcodeHistory = BarcodeState.barcodeHistory.filter(
      (item) => item.number !== number && item.barcode !== number,
    );
    this.updateDisplay();
    showBarcodeNotification("Проба удалена из текущей сессии", "success");
  },

  clearHistory() {
    if (BarcodeState.barcodeHistory.length === 0) return;

    if (
      confirm(
        `Очистить всю историю (${BarcodeState.barcodeHistory.length} проб)?`,
      )
    ) {
      BarcodeState.barcodeHistory = [];
      this.updateDisplay();
      showBarcodeNotification("История очищена", "success");
    }
  },

  clearAllHistory() {
    this.clearHistory();
  },

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
    template.date = true;
    if (!template) return;

    if (type === "virtual") {
      const input = document.getElementById("barcode-input");
      if (!input.value) {
        showBarcodeNotification("Сначала введите номер для штатива!", "error");
        return;
      }
      template.text = `LAMI\n ${input.value}`;
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

  clearInput() {
    const input = document.getElementById("barcode-input");
    if (input) {
      input.value = "";
      input.focus();
    }
    showBarcodeNotification("Форма очищена", "info");
  },

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

  async printSerialLabels() {
    const serialInput = document.getElementById("glp-serial");
    if (!serialInput) return;

    const serial = serialInput.value.trim();
    if (!serial) {
      showBarcodeNotification(
        "Введите серию наклеек (например: 1-10)",
        "warning",
      );
      return;
    }

    if (!serial.includes("-")) {
      showBarcodeNotification(
        "Отсутствует знак '-' для определения последовательности",
        "error",
      );
      return;
    }

    const parts = serial.split("-");
    const start = parseInt(parts[0]);
    const end = parseInt(parts[1]);

    if (isNaN(start) || isNaN(end)) {
      showBarcodeNotification(
        "Неверный формат серии. Используйте числа через дефис",
        "error",
      );
      return;
    }

    const count = end - start + 1;

    if (count > 20) {
      showBarcodeNotification(
        `Слишком много наклеек (${count}). Максимум 20 наклеек`,
        "error",
      );
      return;
    }

    const param = {
      type: "serial",
      text: BarcodeState.glpMode || "Alinity",
      retry: serial,
      date: true,
      printer: PrinterManager.selectedPrinter,
      glpMode: BarcodeState.glpMode || "Alinity",
    };

    try {
      await BarcodeAPI.sendToDjango(param);
      showBarcodeNotification(
        `✅ Печать серии GLP (${start}-${end}) отправлена`,
        "success",
      );
      serialInput.value = "";
    } catch (error) {
      console.error("Ошибка печати GLP:", error);
      showBarcodeNotification(`❌ Ошибка печати: ${error.message}`, "error");
    }
  },
};

// ===== УПРАВЛЕНИЕ GLP РЕЖИМАМИ =====
function selectGLPMode(mode) {
  console.log("🎯 Выбран GLP режим:", mode);

  BarcodeState.glpMode = mode;

  const glpCards = document.querySelectorAll(".glp-mode-selector .mode-card");
  glpCards.forEach((card) => {
    card.classList.remove("active");
  });

  let selectedCard = null;
  if (mode === "Alinity") {
    selectedCard = Array.from(glpCards).find((card) =>
      card.querySelector("h4")?.textContent.includes("Alinity"),
    );
  } else if (mode === "HbA1c") {
    selectedCard = Array.from(glpCards).find(
      (card) =>
        card.querySelector("h4")?.textContent.includes("Archive") ||
        card.querySelector("h4")?.textContent.includes("Arhive"),
    );
  }

  if (selectedCard) {
    selectedCard.classList.add("active");
  }

  const modeName =
    mode === "Alinity"
      ? "Alinity (Архив для сыворотки)"
      : "Archive Architect (Архив для ЭДТА)";
  showBarcodeNotification(`🎯 Выбран GLP режим: ${modeName}`, "success");
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
const debounce = (fn, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
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
window.clearHistory = () => BarcodeModule.clearHistory();
window.selectGLPMode = selectGLPMode;

// ===== ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ =====
document.addEventListener("DOMContentLoaded", () => {
  BarcodeModule.init();
  enableSettingPrint();
  createViewCustomLabels();
  PrinterManager.loadFromServer();
  setFocusOnInput();

  ThemeManager.init();
  KeyboardShortcuts.init();
  HistorySearch.init();
  TemplatesManager.init();

  const clearHistoryBtn = document.createElement("button");
  clearHistoryBtn.className = "clear-history-btn";
  clearHistoryBtn.innerHTML =
    '<i class="fas fa-trash-alt"></i> Очистить всю историю';
  clearHistoryBtn.onclick = () => BarcodeModule.clearHistory();
  clearHistoryBtn.style.cssText = `
    margin-bottom: 16px;
    padding: 10px 16px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 12px;
    color: #f87171;
    cursor: pointer;
    width: 100%;
    font-weight: 500;
    transition: all 0.2s;
  `;
  clearHistoryBtn.onmouseenter = () => {
    clearHistoryBtn.style.background = "rgba(239, 68, 68, 0.2)";
    clearHistoryBtn.style.transform = "translateY(-1px)";
  };
  clearHistoryBtn.onmouseleave = () => {
    clearHistoryBtn.style.background = "rgba(239, 68, 68, 0.1)";
    clearHistoryBtn.style.transform = "translateY(0)";
  };

  const barcodeMain = document.querySelector(".barcode-main");
  const historyList = document.getElementById("barcode-history");
  if (
    barcodeMain &&
    historyList &&
    !document.querySelector(".clear-history-btn")
  ) {
    barcodeMain.insertBefore(clearHistoryBtn, historyList);
  }

  setInterval(() => {
    if (document.visibilityState === "visible") {
      PrinterManager.refreshPrinters();
    }
  }, 30000);
});

// ===== ЗАГРУЗКА ПОЛЬЗОВАТЕЛЬСКИХ ЭТИКЕТОК =====
async function createViewCustomLabels() {
  try {
    const response = await fetch("/custom-labels/", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": BarcodeUtils?.getCSRFToken() || getCookie("csrftoken"),
      },
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    const userElement = document.getElementById("user-labels");
    if (!userElement) return;

    const items = result.data || [];
    if (items.length > 0) {
      userElement.innerHTML = items
        .map((item) => {
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
          <button onclick="createViewCustomLabels()" class="retry-btn">Повторить</button>
        </div>
      `;
    }
  }
}

function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

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

function enableSettingPrint() {
  document
    .querySelectorAll(".mode-div")
    .forEach((item) => item.classList.add("active"));
}

function disableSettingPrint(select) {
  const selectElem = document.getElementById(select);
  const codeElement = selectElem.dataset.attribute;
  if (selectElem.classList.contains("active")) {
    selectElem.classList.remove("active");
    LabelSetting[codeElement] = false;
  } else {
    selectElem.classList.add("active");
    LabelSetting[codeElement] = true;
  }
  console.log(LabelSetting[codeElement]);
}

function setDefaultUserPrintSetting() {
  selectMode("default");
  selectRetry("1");
  setFocusOnInput();
}

function setFocusOnInput() {
  const input = document.getElementById("barcode-input");
  if (input) input.focus();
}

// ===== ДОПОЛНИТЕЛЬНЫЕ СТИЛИ =====
const additionalStyles = `
  .theme-switcher {
    position: relative;
    margin-left: auto;
  }
  
  .theme-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(102, 126, 234, 0.15);
    border: 1px solid rgba(102, 126, 234, 0.3);
    color: #a5b4fc;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .theme-btn:hover {
    transform: rotate(15deg);
    background: rgba(102, 126, 234, 0.25);
  }
  
  .theme-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 8px;
    background: var(--bg-card);
    border-radius: 12px;
    box-shadow: var(--shadow-md);
    border: 1px solid var(--border-color);
    display: none;
    z-index: 1000;
    min-width: 150px;
  }
  
  .theme-dropdown.show {
    display: block;
    animation: fadeIn 0.2s ease;
  }
  
  .theme-option {
    padding: 10px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    transition: background 0.2s;
    color: var(--text-primary);
  }
  
  .theme-option:hover {
    background: rgba(102, 126, 234, 0.1);
  }
  
  .theme-option.active {
    background: rgba(102, 126, 234, 0.2);
    color: #667eea;
  }
  
  .search-container {
    margin-bottom: 20px;
    padding: 16px;
    background: var(--bg-card);
    border-radius: 16px;
    border: 1px solid var(--border-color);
  }
  
  .search-wrapper {
    position: relative;
    margin-bottom: 12px;
  }
  
  .search-wrapper i {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-secondary);
  }
  
  .search-wrapper input {
    width: 100%;
    padding: 12px 12px 12px 40px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    color: var(--text-primary);
    font-size: 14px;
  }
  
  .search-wrapper input:focus {
    outline: none;
    border-color: #667eea;
  }
  
  .search-clear {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    display: none;
  }
  
  .filter-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .filter-btn {
    padding: 6px 12px;
    background: rgba(102, 126, 234, 0.1);
    border: 1px solid rgba(102, 126, 234, 0.2);
    border-radius: 20px;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s;
    font-size: 12px;
  }
  
  .filter-btn:hover,
  .filter-btn.active {
    background: rgba(102, 126, 234, 0.3);
    color: #a5b4fc;
    border-color: rgba(102, 126, 234, 0.5);
  }
  
  .templates-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    backdrop-filter: blur(4px);
  }
  
  .templates-modal-content {
    background: var(--bg-card);
    border-radius: 24px;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    overflow: hidden;
    animation: slideInItem 0.3s ease;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid var(--border-color);
  }
  
  .modal-header h3 {
    margin: 0;
    color: var(--text-primary);
  }
  
  .modal-close {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: var(--text-secondary);
  }
  
  .modal-body {
    padding: 24px;
    overflow-y: auto;
    max-height: calc(80vh - 80px);
  }
  
  .templates-list {
    margin-bottom: 24px;
    max-height: 400px;
    overflow-y: auto;
  }
  
  .template-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: rgba(102, 126, 234, 0.05);
    border-radius: 12px;
    margin-bottom: 12px;
    transition: all 0.2s;
  }
  
  .template-item:hover {
    background: rgba(102, 126, 234, 0.1);
    transform: translateX(4px);
  }
  
  .template-info {
    flex: 1;
  }
  
  .template-name {
    margin-bottom: 8px;
  }
  
  .template-name i {
    color: #667eea;
    margin-right: 8px;
  }
  
  .template-details {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .template-details .badge {
    padding: 4px 8px;
    font-size: 11px;
  }
  
  .template-actions {
    display: flex;
    gap: 8px;
  }
  
  .btn-apply {
    padding: 8px 16px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border: none;
    border-radius: 8px;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .btn-apply:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
  
  .btn-delete-template {
    padding: 8px 12px;
    background: rgba(239, 68, 68, 0.2);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 8px;
    color: #f87171;
    cursor: pointer;
  }
  
  .save-template-section {
    padding-top: 20px;
    border-top: 1px solid var(--border-color);
  }
  
  .save-template-section h4 {
    margin-bottom: 12px;
    color: var(--text-primary);
  }
  
  .save-template-form {
    display: flex;
    gap: 12px;
  }
  
  .save-template-form input {
    flex: 1;
    padding: 10px 12px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    color: var(--text-primary);
  }
  
  .save-template-form button {
    padding: 10px 20px;
    background: linear-gradient(135deg, #10b981, #059669);
    border: none;
    border-radius: 8px;
    color: white;
    cursor: pointer;
  }
  
  .shortcuts-modal {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    animation: slideInItem 0.3s ease;
  }
  
  .shortcuts-modal-content {
    background: var(--bg-card);
    border-radius: 16px;
    padding: 20px;
    box-shadow: var(--shadow-md);
    border: 1px solid var(--border-color);
    min-width: 300px;
  }
  
  .shortcuts-modal-content h3 {
    margin-bottom: 16px;
    color: var(--text-primary);
  }
  
  .shortcuts-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin: 16px 0;
  }
  
  .shortcut-item kbd {
    display: inline-block;
    padding: 4px 8px;
    background: rgba(102, 126, 234, 0.2);
    border-radius: 6px;
    font-family: monospace;
    font-size: 12px;
    color: #a5b4fc;
  }
  
  .shortcuts-modal-content button {
    margin-top: 16px;
    padding: 8px 16px;
    background: #667eea;
    border: none;
    border-radius: 8px;
    color: white;
    cursor: pointer;
    width: 100%;
  }
  
  .clear-history-btn:hover {
    background: rgba(239, 68, 68, 0.2) !important;
    transform: translateY(-1px);
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @media (max-width: 768px) {
    .save-template-form {
      flex-direction: column;
    }
    
    .template-item {
      flex-direction: column;
      gap: 12px;
    }
    
    .template-actions {
      width: 100%;
    }
    
    .btn-apply {
      flex: 1;
    }
    
    .filter-buttons {
      overflow-x: auto;
      flex-wrap: nowrap;
      padding-bottom: 4px;
    }
    
    .shortcuts-modal {
      bottom: 10px;
      right: 10px;
      left: 10px;
    }
    
    .shortcuts-modal-content {
      width: 100%;
    }
    
    .shortcuts-grid {
      grid-template-columns: 1fr;
    }
  }
`;

const styleSheet = document.createElement("style");
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);
