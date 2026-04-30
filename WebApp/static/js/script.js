// ===== Конфигурация и состояние =====
const CONFIG = {
  ANIMATION: {
    NOTIFICATION_DURATION: 5000,
    CAROUSEL_SPEED: { slow: 2000, normal: 4000, fast: 6000 },
    FLOATING_SPEED: { slow: 20, normal: 15, fast: 10 },
  },
  STORAGE: {
    MAX_BARCODE_HISTORY: 100,
    MAX_NOTIFICATIONS: 5,
  },
};

const state = {
  currentModule: "home",
  // Убраны barcodeMode, barcodeHistory, retry, selectCodeFormat
  selectedReagent: null,
  reagentData: {},
  rocheMode: "routine",
  aliquotHistory: [],
  isContainerOpen: false,
};

const carousels = [];

// ===== Утилиты =====
const Utils = {
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

  async copyToClipboard(text) {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
    } catch (error) {
      console.error("Ошибка копирования:", error);
    }
  },

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
};

// ===== Уведомления =====
const NotificationManager = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.id = "notification-container";
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
      this.injectStyles();
    }
  },

  injectStyles() {
    if (document.querySelector("#notification-animations")) return;

    const style = document.createElement("style");
    style.id = "notification-animations";
    style.textContent = `
      @keyframes slideInRight {
        from { opacity: 0; transform: translateX(100%); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes slideOutRight {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(100%); }
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
  },

  show(message, type = "info") {
    this.init();

    const config = {
      success: { icon: "fa-check-circle", color: "#10b981" },
      error: { icon: "fa-exclamation-circle", color: "#ef4444" },
      warning: { icon: "fa-exclamation-triangle", color: "#f59e0b" },
      info: { icon: "fa-info-circle", color: "#667eea" },
    }[type];

    const bgColor = `rgba(${parseInt(config.color.slice(1, 3), 16)}, ${parseInt(config.color.slice(3, 5), 16)}, ${parseInt(config.color.slice(5, 7), 16)}, 0.1)`;
    const borderColor = config.color + "4D";

    const notification = document.createElement("div");
    notification.className = "notification-item";
    notification.style.cssText = `
      background: var(--bg-card);
      backdrop-filter: blur(10px);
      border: 1px solid ${borderColor};
      border-left: 4px solid ${config.color};
      border-radius: var(--radius-lg);
      padding: 20px;
      animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: flex-start;
      gap: 16px;
      box-shadow: var(--shadow-md);
      transition: all 0.3s ease;
    `;

    notification.innerHTML = `
      <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: ${bgColor}; border-radius: var(--radius-lg); z-index: -1; opacity: 0.3;"></div>
      <div style="width: 40px; height: 40px; min-width: 40px; background: ${bgColor}; border: 1px solid ${borderColor}; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 20px; color: ${config.color};">
        <i class="fas ${config.icon}"></i>
      </div>
      <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
        <div style="font-weight: 600; color: var(--text-primary); font-size: 16px; line-height: 1.4;">${message}</div>
        <div style="font-size: 12px; color: var(--text-secondary); display: flex; align-items: center; gap: 8px;">
          <i class="far fa-clock"></i>
          <span>${new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
        </div>
      </div>
      <button class="close-notification" style="background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); border-radius: var(--radius-sm); color: var(--text-secondary); cursor: pointer; padding: 8px; display: flex; align-items: center; justify-content: center; transition: all var(--transition-fast); margin-left: auto; align-self: flex-start; min-width: 36px; min-height: 36px;">
        <i class="fas fa-times"></i>
      </button>
    `;

    const closeBtn = notification.querySelector(".close-notification");
    closeBtn.addEventListener("mouseenter", () => {
      closeBtn.style.background = "rgba(239, 68, 68, 0.1)";
      closeBtn.style.borderColor = "#ef4444";
      closeBtn.querySelector("i").style.color = "#ef4444";
    });
    closeBtn.addEventListener("mouseleave", () => {
      closeBtn.style.background = "rgba(255, 255, 255, 0.05)";
      closeBtn.style.borderColor = "var(--border-color)";
      closeBtn.querySelector("i").style.color = "var(--text-secondary)";
    });

    const removeNotification = () => {
      clearTimeout(autoRemove);
      notification.style.animation =
        "slideOutRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
      notification.style.opacity = "0";
      notification.style.transform = "translateX(100%)";
      setTimeout(() => notification.remove(), 300);
    };

    closeBtn.addEventListener("click", removeNotification);

    notification.addEventListener("mouseenter", () => {
      notification.style.transform = "translateX(-4px)";
      notification.style.boxShadow = "var(--shadow-lg)";
    });
    notification.addEventListener("mouseleave", () => {
      notification.style.transform = "";
      notification.style.boxShadow = "var(--shadow-md)";
    });

    this.container.insertBefore(notification, this.container.firstChild);

    const autoRemove = setTimeout(
      removeNotification,
      CONFIG.ANIMATION.NOTIFICATION_DURATION,
    );

    const notifications = this.container.querySelectorAll(".notification-item");
    if (notifications.length > CONFIG.STORAGE.MAX_NOTIFICATIONS) {
      Array.from(notifications)
        .slice(CONFIG.STORAGE.MAX_NOTIFICATIONS)
        .forEach((n) => n.remove());
    }
  },
};

const showNotification = (msg, type) => NotificationManager.show(msg, type);

// ===== API =====
const API = {
  async turnStateMouse() {
    console.log("Режим мыши");
    const element = document.querySelector(".doombass-block");
    let state = false;

    if (!element) {
      alert("Элемент .doombass-block не найден!");
      console.log(
        "Доступные классы:",
        document.querySelectorAll("[class*='doombass']"),
      );
      return;
    }

    if (!element.classList.contains("active")) {
      element.classList.add("active");
      state = true;
    } else {
      element.classList.remove("active");
      state = false;
    }

    const data = { state: state };

    try {
      const response = await fetch("/turn-mouse/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": Utils.getCSRFToken(),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Ответ сервера:", result);
      return result;
    } catch (error) {
      console.error("Ошибка отправки на сервер:", error);
      showNotification("Ошибка при отправке состояния мыши", "error");
    }
  },

  async sendToDjango(data) {
    console.log(`📤 Отправка данных:`, data);

    try {
      const response = await fetch("/save-barcode/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": Utils.getCSRFToken(),
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

// ===== Модуль навигации =====
const Navigation = {
  slideModules: [
    "barcode",
    "reagent",
    "roche",
    "calculations",
    "aliquots",
    "alicvote-container",
    "test-module",
  ],

  showModule(moduleId) {
    if (moduleId === "home") {
      this.closeAllContainers();
      document.getElementById("home-module")?.classList.add("active");
      state.currentModule = "home";
      state.isContainerOpen = false;
      this.updateNavigation(moduleId);
      return;
    }

    if (this.slideModules.includes(moduleId)) {
      this.openSlideContainer(moduleId);
    } else {
      this.closeAllContainers();
      document.getElementById(`${moduleId}-module`)?.classList.add("active");
      state.currentModule = moduleId;
      state.isContainerOpen = false;
    }

    this.updateNavigation(moduleId);

    const moduleHandlers = {
      // Убрана ссылка на updateBarcodeDisplay
      roche: () => RocheModule.init(),
    };
    moduleHandlers[moduleId]?.();
  },

  openSlideContainer(moduleId) {
    document.getElementById("home-module")?.classList.remove("active");
    document
      .querySelectorAll(".container-modern.active")
      .forEach((c) => c.classList.remove("active"));

    const target =
      document.getElementById(`${moduleId}-module`) ||
      document.getElementById(moduleId);
    if (target) {
      target.classList.add("active");
      document.body.classList.add("container-open");
      state.currentModule = moduleId;
      state.isContainerOpen = true;

      setTimeout(
        () => target.querySelector("input, button, select, textarea")?.focus(),
        150,
      );
    }
  },

  closeAllContainers() {
    document
      .querySelectorAll(".container-modern.active")
      .forEach((c) => c.classList.remove("active"));
    document.body.classList.remove("container-open");
    document.getElementById("home-module")?.classList.add("active");
    state.currentModule = "home";
    state.isContainerOpen = false;
    this.updateNavigation("home");
  },

  updateNavigation(moduleId) {
    document
      .querySelectorAll(".nav-btn")
      .forEach((btn) => btn.classList.remove("active"));
    const activeBtn = document.querySelector(
      `.nav-btn[onclick="showModule('${moduleId}')"]`,
    );
    activeBtn?.classList.add("active");
  },

  toggleMobileMenu() {
    const mobileMenu = document.getElementById("mobile-menu");
    const hamburger = document.querySelector(".hamburger");

    if (mobileMenu && hamburger) {
      mobileMenu.classList.toggle("active");
      hamburger.classList.toggle("active");
      document.body.style.overflow = mobileMenu.classList.contains("active")
        ? "hidden"
        : "";
    }
  },

  handleResize() {
    if (window.innerWidth >= 1024) {
      const mobileMenu = document.getElementById("mobile-menu");
      const hamburger = document.querySelector(".hamburger");
      mobileMenu?.classList.remove("active");
      hamburger?.classList.remove("active");
      document.body.style.overflow = "";
    }
  },
};

// ===== Модуль реагентов =====
const ReagentModule = {
  racks: ["D1", "D2", "D3", "R1", "R2", "R3", "R4", "R5", "R6"],

  reagents: {
    f_diluent: {
      display: "Factor Diluent",
      short: "FD",
      allowed: ["D1", "D2"],
    },
    pc_dil: { display: "PC Diluent", short: "PD", allowed: ["D1", "D2"] },
    aptt_reagent: {
      display: "APTT reagent",
      short: "AR",
      allowed: ["D3", "R1", "R2"],
    },
    aptt_cacl2: {
      display: "APTT CaCl2",
      short: "AC",
      allowed: ["R3", "R4", "R5", "R6"],
    },
    recombiplastin: {
      display: "Recombiplastin",
      short: "RP",
      allowed: ["R3", "R4", "R5", "R6"],
    },
    trombintime: {
      display: "Trombin Time",
      short: "TT",
      allowed: ["R3", "R4", "R5", "R6"],
    },
    fibrinogen: {
      display: "O.F.A Fibrinogen",
      short: "FG",
      allowed: ["R3", "R4", "R5", "R6"],
    },
  },

  init() {
    this.racks.forEach((rack) => {
      if (!state.reagentData[rack])
        state.reagentData[rack] = Array(6).fill(null);
    });
    this.generateRacks();
  },

  selectReagent(reagent) {
    state.selectedReagent = reagent;
    document
      .querySelectorAll(".reagent-btn")
      .forEach((btn) => btn.classList.remove("active"));
    const activeBtn = Array.from(
      document.querySelectorAll(".reagent-btn"),
    ).find((btn) => btn.textContent.includes(this.reagents[reagent].display));
    activeBtn?.classList.add("active");
    document.getElementById("selected-reagent").textContent =
      this.reagents[reagent].display;
    showNotification(
      `Выбран реагент: ${this.reagents[reagent].display}`,
      "info",
    );
  },

  generateRacks() {
    const container = document.querySelector(".rack-container");
    if (!container) return;

    container.innerHTML = this.racks
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
            <div class="hole" data-rack="${rack}" data-hole="${i + 1}" onclick="ReagentModule.fillHole('${rack}', ${i + 1})">
              ${state.reagentData[rack]?.[i] ? this.reagents[state.reagentData[rack][i]].short : ""}
            </div>
          `,
          ).join("")}
        </div>
      </div>
    `,
      )
      .join("");
  },

  fillHole(rack, hole) {
    if (!state.selectedReagent) {
      showNotification("Сначала выберите реагент!", "error");
      return;
    }

    const holeIndex = hole - 1;
    const reagent = this.reagents[state.selectedReagent];

    if (!reagent.allowed.includes(rack)) {
      showNotification(`Этот реагент нельзя разместить в ${rack}!`, "error");
      return;
    }

    if (state.reagentData[rack][holeIndex] === state.selectedReagent) {
      state.reagentData[rack][holeIndex] = null;
      showNotification(`Лунка ${hole} в ${rack} очищена`, "info");
    } else {
      state.reagentData[rack][holeIndex] = state.selectedReagent;
      showNotification(
        `${reagent.display} установлен в ${rack} лунка ${hole}`,
        "success",
      );
    }

    this.updateHole(rack, hole);
  },

  updateHole(rack, hole) {
    const holeEl = document.querySelector(
      `.hole[data-rack="${rack}"][data-hole="${hole}"]`,
    );
    if (holeEl) {
      const reagent = state.reagentData[rack][hole - 1];
      holeEl.textContent = reagent ? this.reagents[reagent].short : "";
      holeEl.classList.toggle("filled", !!reagent);
    }
  },

  clearSelection() {
    state.selectedReagent = null;
    document
      .querySelectorAll(".reagent-btn")
      .forEach((btn) => btn.classList.remove("active"));
    document.getElementById("selected-reagent").textContent =
      "Реагент не выбран";
    showNotification("Выбор реагента снят", "info");
  },

  clearAllRacks() {
    if (!confirm("Очистить все реки?")) return;
    this.racks.forEach(
      (rack) => (state.reagentData[rack] = Array(6).fill(null)),
    );
    this.generateRacks();
    showNotification("Все реки очищены", "success");
  },
};

// ===== Модуль Roche =====
const RocheModule = {
  modes: {
    routine: {
      name: "Routine-AUE",
      lines: ["line-e1", "line-e2", "line-c1", "line-cc", "line-ce"],
      tests: [],
    },
    mode1: {
      name: "CEE+EEEE1+CC",
      lines: ["line-e1", "line-ce", "line-cc"],
      tests: ["Zinc", "Lpa", "Cu", "CHE", "LIP", "CK-Total"],
    },
    mode2: {
      name: "EEEE2+CCC",
      lines: ["line-e2", "line-c1"],
      tests: [
        "C-peptid",
        "AFP",
        "A-CCP",
        "IGF",
        "PAAP-P",
        "GH",
        "TP1NP",
        "Cyfra",
      ],
    },
  },

  init() {
    this.setMode("routine");
    this.startAnimation();
    this.startStatusUpdates();
  },

  setMode(mode, buttonElement) {
    state.rocheMode = mode;
    const config = this.modes[mode];

    document
      .querySelectorAll(".roche-mode-btn")
      .forEach((btn) => btn.classList.remove("active"));
    buttonElement?.classList.add("active");

    const allLines = ["line-e1", "line-e2", "line-ce", "line-c1", "line-cc"];
    allLines.forEach((lineId) => {
      const line = document.getElementById(lineId);
      if (!line) return;

      const isActive = config.lines.includes(lineId);
      line.classList.toggle("active-line", isActive);

      const statusEl = line.querySelector(".analyze-status");
      if (statusEl) {
        statusEl.textContent = isActive ? "Active" : "Standby";
        statusEl.className = `analyze-status ${isActive ? "active" : "standby"}`;
      }

      line
        .querySelectorAll(".segment")
        .forEach((seg) =>
          seg.classList.toggle("active", isActive && Math.random() > 0.5),
        );

      const sampleCount = line.querySelector(".sample-count");
      const testCount = line.querySelector(".test-count");
      if (sampleCount && testCount) {
        if (isActive) {
          const samples = Math.floor(Math.random() * 30) + 10;
          sampleCount.textContent = `Пробы: ${samples}`;
          testCount.textContent = `Тесты: ${Math.floor(samples / 3)}`;
        } else {
          sampleCount.textContent = "Пробы: 0";
          testCount.textContent = "Тесты: 0";
        }
      }
    });

    this.updateSorters(mode);

    const activeLinesEl = document.getElementById("active-lines");
    if (activeLinesEl) activeLinesEl.textContent = config.lines.length;

    const descriptionEl = document.getElementById("roche-description");
    if (descriptionEl) {
      descriptionEl.innerHTML = `
        <h4><i class="fas fa-info-circle"></i> Режим: ${config.name}</h4>
        <p><strong>Активные линии:</strong> ${config.lines.map((l) => l.replace("line-", "")).join(", ")}</p>
        <p><strong>Аналиты сортирующиеся в зону Roche:</strong></p>
        <div class="test-list">
          ${config.tests.map((test) => `<button class="test-button" onclick="RocheModule.selectTest('${test}')">${test}</button>`).join("")}
        </div>
        <p><strong>Всего активных элементов:</strong> ${config.lines.length} из ${allLines.length}</p>
      `;
    }

    showNotification(`Режим Roche установлен: ${config.name}`, "success");
  },

  updateSorters(mode) {
    ["sorter-s2", "sorter-s3"].forEach((sorterId) => {
      const sorter = document.getElementById(sorterId);
      if (!sorter) return;

      const rocheContainer = sorter.querySelector(".roche-container");
      if (rocheContainer) {
        rocheContainer.innerHTML = "";
        for (let i = 0; i < 8; i++) {
          const row = document.createElement("div");
          row.className = "row";
          for (let j = 0; j < 5; j++) {
            const circle = document.createElement("div");
            circle.className = "circle";
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

      ["input", "aliquot"].forEach((zone) => {
        const zoneEl = sorter.querySelector(`.${zone}-zone .zone-content`);
        if (zoneEl) {
          zoneEl.innerHTML = "";
          const count = Math.floor(Math.random() * 5) + 1;
          for (let i = 0; i < count; i++) {
            const sample = document.createElement("div");
            sample.style.cssText = `
              width: 12px; height: 12px; background: ${zone === "input" ? "#667eea" : "#10b981"};
              border-radius: 2px; margin: 2px; display: inline-block;
            `;
            zoneEl.appendChild(sample);
          }
        }
      });
    });
  },

  selectTest(testName) {
    showNotification(`Выбран тест: ${testName}`, "info");
    document.querySelectorAll(".test-button").forEach((btn) => {
      if (btn.textContent === testName) {
        btn.style.animation = "pulse 0.5s";
        setTimeout(() => (btn.style.animation = ""), 500);
      }
    });
  },

  startAnimation() {
    setInterval(() => {
      document.querySelectorAll(".circle").forEach((circle) => {
        if (Math.random() > 0.8) circle.classList.toggle("active");
      });
    }, 1000);

    setInterval(() => {
      document.querySelectorAll(".active-line .segment").forEach((segment) => {
        if (Math.random() > 0.7) segment.classList.toggle("active");
      });
    }, 2000);
  },

  startStatusUpdates() {
    setInterval(() => {
      const samplesEl = document.getElementById("samples-hour");
      if (samplesEl) {
        const current = parseInt(samplesEl.textContent) || 120;
        samplesEl.textContent = Math.max(
          80,
          Math.min(200, current + Math.floor(Math.random() * 20) - 10),
        );
      }

      const loadEl = document.getElementById("system-load");
      if (loadEl) {
        const current = parseInt(loadEl.textContent) || 78;
        loadEl.textContent = `${Math.max(60, Math.min(95, current + Math.floor(Math.random() * 10) - 5))}%`;
      }
    }, 5000);
  },
};

// ===== Карусель =====
class Carousel {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Carousel container #${containerId} not found`);
      return;
    }

    this.options = {
      autoplay: true,
      autoplaySpeed: 5000,
      slidesToShow: 3,
      infinite: true,
      dots: true,
      arrows: true,
      ...options,
    };

    this.track = this.container.querySelector(".carousel-track");
    this.slides = this.track ? Array.from(this.track.children) : [];
    this.prevBtn = this.container.querySelector(".carousel-btn.prev");
    this.nextBtn = this.container.querySelector(".carousel-btn.next");
    this.dotsContainer = this.container.querySelector(".carousel-indicators");

    this.currentIndex = 0;
    this.slideCount = this.slides.length;
    this.slidesPerView = this.getSlidesPerView();
    this.isTransitioning = false;
    this.isInfinite =
      this.options.infinite && this.slideCount > this.slidesPerView;

    if (this.slideCount > 0) this.init();
  }

  getSlidesPerView() {
    if (!this.container || this.slideCount === 0) return 1;
    const width = this.container.offsetWidth;
    if (width <= 768) return 1;
    if (width <= 1200) return 2;
    return Math.min(this.options.slidesToShow, this.slideCount);
  }

  init() {
    this.setupSlides();
    if (this.isInfinite) this.setupInfinite();
    this.setupArrows();
    this.createDots();
    this.setupEventListeners();
    this.updateCarousel();
    if (this.options.autoplay) this.startAutoSlide();
  }

  setupSlides() {
    const slideWidth = 100 / this.slidesPerView;
    this.slides.forEach((slide) => (slide.style.flex = `0 0 ${slideWidth}%`));
  }

  setupInfinite() {
    const firstClones = [],
      lastClones = [];

    for (
      let i = this.slideCount - this.slidesPerView;
      i < this.slideCount;
      i++
    ) {
      const clone = this.slides[i].cloneNode(true);
      clone.classList.add("clone");
      firstClones.push(clone);
    }

    for (let i = 0; i < this.slidesPerView; i++) {
      const clone = this.slides[i].cloneNode(true);
      clone.classList.add("clone");
      lastClones.push(clone);
    }

    firstClones.forEach((clone) =>
      this.track.insertBefore(clone, this.slides[0]),
    );
    lastClones.forEach((clone) => this.track.appendChild(clone));

    this.slides = Array.from(this.track.children);
    this.currentIndex = this.slidesPerView;
  }

  createDots() {
    if (!this.dotsContainer || !this.options.dots) return;

    this.dotsContainer.innerHTML = "";
    this.dots = [];

    for (let i = 0; i < this.slideCount; i++) {
      const dot = document.createElement("button");
      dot.className = "carousel-indicator";
      dot.setAttribute("data-index", i);
      dot.addEventListener(
        "click",
        () => !this.isTransitioning && this.goToSlide(i),
      );
      this.dotsContainer.appendChild(dot);
      this.dots.push(dot);
    }
  }

  setupArrows() {
    this.prevBtn?.addEventListener(
      "click",
      () => !this.isTransitioning && this.prevSlide(),
    );
    this.nextBtn?.addEventListener(
      "click",
      () => !this.isTransitioning && this.nextSlide(),
    );
  }

  setupEventListeners() {
    window.addEventListener("resize", () => this.handleResize());

    this.container?.addEventListener("mouseenter", () => this.pauseAutoSlide());
    this.container?.addEventListener("mouseleave", () =>
      this.resumeAutoSlide(),
    );

    document.addEventListener("keydown", (e) => {
      if (
        document.activeElement?.closest(".carousel-container") ===
        this.container
      ) {
        if (e.key === "ArrowLeft") this.prevSlide();
        if (e.key === "ArrowRight") this.nextSlide();
      }
    });
  }

  updateCarousel() {
    if (!this.track) return;

    this.isTransitioning = true;
    const translateX = -this.currentIndex * (100 / this.slidesPerView);
    this.track.style.transform = `translateX(${translateX}%)`;
    this.track.style.transition = "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)";

    this.updateDots();
    this.updateArrows();

    setTimeout(() => {
      this.isTransitioning = false;
      if (this.isInfinite) this.handleInfiniteBoundary();
    }, 500);
  }

  handleInfiniteBoundary() {
    if (this.currentIndex < this.slidesPerView) {
      const jumpTo = this.slideCount + this.currentIndex - this.slidesPerView;
      this.jumpToSlide(jumpTo);
    } else if (this.currentIndex >= this.slideCount + this.slidesPerView) {
      const jumpTo = this.currentIndex - this.slideCount;
      this.jumpToSlide(jumpTo);
    }
  }

  jumpToSlide(index) {
    this.track.style.transition = "none";
    this.currentIndex = index;
    const translateX = -this.currentIndex * (100 / this.slidesPerView);
    this.track.style.transform = `translateX(${translateX}%)`;
    setTimeout(() => {
      this.track.style.transition =
        "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)";
    }, 50);
  }

  updateDots() {
    if (!this.dots?.length) return;

    const originalIndex = this.isInfinite
      ? (this.currentIndex - this.slidesPerView + this.slideCount) %
        this.slideCount
      : Math.min(this.currentIndex, this.slideCount - 1);

    this.dots.forEach((dot, i) => {
      dot.classList.toggle("active", i === originalIndex);
      dot.setAttribute("aria-current", i === originalIndex);
    });
  }

  updateArrows() {
    if (!this.options.arrows || this.isInfinite) {
      [this.prevBtn, this.nextBtn].forEach((btn) => {
        if (btn) {
          btn.disabled = false;
          btn.style.opacity = "1";
          btn.style.cursor = "pointer";
        }
      });
      return;
    }

    if (this.prevBtn) {
      const disabled = this.currentIndex === 0;
      this.prevBtn.disabled = disabled;
      this.prevBtn.style.opacity = disabled ? "0.3" : "1";
      this.prevBtn.style.cursor = disabled ? "not-allowed" : "pointer";
    }

    if (this.nextBtn) {
      const maxSlide = Math.max(0, this.slideCount - this.slidesPerView);
      const disabled = this.currentIndex >= maxSlide;
      this.nextBtn.disabled = disabled;
      this.nextBtn.style.opacity = disabled ? "0.3" : "1";
      this.nextBtn.style.cursor = disabled ? "not-allowed" : "pointer";
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
    this.currentIndex = this.isInfinite
      ? slideIndex + this.slidesPerView
      : Math.max(0, Math.min(slideIndex, this.slideCount - this.slidesPerView));
    this.updateCarousel();
    this.resetAutoSlide();
  }

  startAutoSlide() {
    if (this.interval) clearInterval(this.interval);
    this.interval = setInterval(() => {
      if (this.isAutoPlaying && !this.isTransitioning) this.nextSlide();
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
    clearInterval(this.interval);
    if (this.isInfinite)
      this.track?.querySelectorAll(".clone").forEach((c) => c.remove());
    this.track.style.transform = "";
    this.slides.forEach((s) => (s.style.flex = ""));
  }
}

// ===== Аликвоты =====
const AliquotModule = {
  generateContainer(name) {
    Navigation.showModule("alicvote-container");
    const placeContent = document.getElementById("container-aliquote");
    if (!placeContent) return;

    placeContent.innerHTML = `
      <div class="aliquot-content">
        <h2><i class="fas fa-flask"></i> Создание аликвот для: ${name || "Образец"}</h2>
        <div class="aliquot-form">
          <div class="input-group">
            <label class="input-label"><i class="fas fa-tag"></i> Аликвот 1</label>
            <input type="text" class="input-field" id="aliquot-name-1" value="${name || ""} 1" placeholder="Название аликвота 1">
          </div>
          <div class="input-group">
            <label class="input-label"><i class="fas fa-tag"></i> Аликвот 2</label>
            <input type="text" class="input-field" id="aliquot-name-2" value="${name || ""} 2" placeholder="Название аликвота 2">
          </div>
          <div class="input-group">
            <label class="input-label"><i class="fas fa-hashtag"></i> Номер лота</label>
            <input type="text" class="input-field" id="aliquot-lot" placeholder="Введите номер лота">
          </div>
          <div class="input-group">
            <label class="input-label"><i class="fas fa-weight"></i> Объем (мкл)</label>
            <input type="number" class="input-field" id="aliquot-volume" placeholder="Укажите объем" min="1" max="10000">
          </div>
          <div class="input-group">
            <label class="input-label"><i class="fas fa-weight"></i> Кол-во этикеток</label>
            <input type="number" class="input-field" id="aliquot-count" placeholder="Укажите кол-во" min="1" max="10" value="1">
          </div>
        </div>
        <div class="aliquot-actions" style="display: flex; gap: 12px;">
          <button class="btn btn-primary" onclick="AliquotModule.print()">
            <i class="fas fa-print"></i> Печать этикеток
          </button>
        </div>
      </div>
    `;
  },

  async print() {
    const data = {
      type: "aliquote",
      text: [
        document.getElementById("aliquot-name-1")?.value,
        document.getElementById("aliquot-name-2")?.value,
      ],
      lot: document.getElementById("aliquot-lot")?.value,
      volume: document.getElementById("aliquot-volume")?.value,
      count: document.getElementById("aliquot-count")?.value || 1,
      size: "s",
      anchor: "h",
    };

    if (!data.text[0] || !data.lot || !data.volume) {
      showNotification("Заполните все необходимые поля", "error");
      return;
    }
    if (+data.count > 10) {
      showNotification("Слишком много наклеек. Максимум 10", "error");
      return;
    }

    try {
      await API.sendToDjango(data);
      showNotification("Аликвота отправлена на печать", "success");
    } catch {
      showNotification("Ошибка печати аликвот", "error");
    }
  },
};

// ===== Расчеты =====
const Calculations = {
  calculateNaOH() {
    const water = parseFloat(document.getElementById("water-volume")?.value);
    const molarity = parseFloat(document.getElementById("molarity")?.value);

    if (!water || !molarity || water < 1 || water > 1000) {
      showNotification("Введите корректные значения!", "error");
      return;
    }

    const result = molarity * 40 * (water / 1000);
    const resultEl = document.getElementById("calculation-result");
    resultEl.innerHTML = `
      <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: var(--radius-lg); padding: 20px;">
        <h4 style="margin-bottom: 16px; color: #10b981;"><i class="fas fa-check-circle"></i> Результаты расчета</h4>
        <div style="margin-bottom: 12px;"><div style="color: var(--text-secondary);">Объем воды:</div><div style="font-size: 18px; font-weight: 600;">${water} мл</div></div>
        <div style="margin-bottom: 12px;"><div style="color: var(--text-secondary);">Молярность:</div><div style="font-size: 18px; font-weight: 600;">${molarity} M</div></div>
        <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border-color);">
          <div style="color: var(--text-secondary);">Необходимое количество NaOH:</div>
          <div style="font-size: 24px; font-weight: 700; color: #10b981; margin-top: 8px;">${result.toFixed(2)} г</div>
        </div>
      </div>
    `;
    resultEl.style.display = "block";
    showNotification("Расчет выполнен успешно", "success");
  },
};

// ===== Управление данными =====
const DataManager = {
  exportData() {
    const exportData = {
      // Убраны barcodeHistory
      aliquotHistory: state.aliquotHistory,
      reagentData: state.reagentData,
      exportDate: new Date().toISOString(),
      version: "1.0.0",
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lab-assistant-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification("Данные экспортированы", "success");
  },

  importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (confirm("Импортировать данные? Текущие данные будут заменены.")) {
          // Убрана barcodeHistory
          if (imported.aliquotHistory)
            state.aliquotHistory = imported.aliquotHistory;
          if (imported.reagentData)
            Object.assign(state.reagentData, imported.reagentData);
          ReagentModule.generateRacks();
          showNotification("Данные импортированы", "success");
        }
      } catch (error) {
        showNotification("Ошибка импорта данных", "error");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  },

  resetApp() {
    if (confirm("Вы уверены? Все данные текущей сессии будут удалены.")) {
      Object.assign(state, {
        // Убраны barcodeHistory, barcodeMode, retry, selectCodeFormat
        aliquotHistory: [],
        reagentData: {},
        currentModule: "home",
        selectedReagent: null,
        rocheMode: "routine",
      });
      ReagentModule.init();
      Navigation.closeAllContainers();
      showNotification("Данные сброшены", "info");
    }
  },
};

// ===== Глобальные функции для обратной совместимости =====
window.showModule = (id) => Navigation.showModule(id);
// Убраны функции баркодов (selectMode, selectRetry, selectCode, saveBarcode, clearBarcodeInput, simulateScan, specialLabel, reuseBarcode, deleteBarcode)
window.selectReagent = (reagent) => ReagentModule.selectReagent(reagent);
window.fillHole = (rack, hole) => ReagentModule.fillHole(rack, hole);
window.clearSelection = () => ReagentModule.clearSelection();
window.clearAllRacks = () => ReagentModule.clearAllRacks();
window.setRocheMode = (mode, btn) => RocheModule.setMode(mode, btn);
window.selectTest = (test) => RocheModule.selectTest(test);
window.calculateNaOH = () => Calculations.calculateNaOH();
window.exportData = () => DataManager.exportData();
window.importData = (e) => DataManager.importData(e);
window.resetApp = () => DataManager.resetApp();
window.toggleMobileMenu = () => Navigation.toggleMobileMenu();
window.closeAllContainers = () => Navigation.closeAllContainers();
window.generateAlictoveContainer = (name) =>
  AliquotModule.generateContainer(name);
window.PrintAliquotsForm = () => AliquotModule.print();

// ===== Инициализация =====
document.addEventListener("DOMContentLoaded", () => {
  // Инициализация состояния
  ReagentModule.init();

  // Обработчики событий
  // Убран обработчик для barcode-input

  document
    .querySelector(".mobile-menu-btn")
    ?.addEventListener("click", Navigation.toggleMobileMenu);
  window.addEventListener("resize", Navigation.handleResize);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && state.isContainerOpen)
      Navigation.closeAllContainers();
  });

  document.addEventListener("click", (e) => {
    if (e.target.classList?.contains("modal-backdrop"))
      Navigation.closeAllContainers();
  });

  // Горячие клавиши
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey) {
      const actions = {
        // Убраны b и a
        r: "reagent",
        h: "home",
        R: () => {
          if (e.shiftKey) DataManager.resetApp();
        },
      };
      if (actions[e.key]) {
        e.preventDefault();
        typeof actions[e.key] === "function"
          ? actions[e.key]()
          : Navigation.showModule(actions[e.key]);
      }
    }
  });

  // Убрано обновление отображения BarcodeModule

  // Карусели
  setTimeout(() => {
    ["carousel2"].forEach((id, i) => {
      carousels.push(
        new Carousel(id, {
          autoplay: true,
          autoplaySpeed: [2000, 4000][i],
          slidesToShow: [5, 5][i],
          infinite: true,
          dots: true,
          arrows: true,
        }),
      );
    });
  });
});
