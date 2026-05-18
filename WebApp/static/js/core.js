// ==================== CORE.JS ====================
// Глобальные утилиты, API, навигация, уведомления

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
  escapeHtml(str) {
    if (!str) return "";
    return str.replace(
      /[&<>]/g,
      (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[m] || m,
    );
  },
  debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },
};

// Уведомления
const NotificationManager = {
  container: null,
  init() {
    if (this.container) return;
    this.container = document.createElement("div");
    this.container.id = "notification-container";
    this.container.style.cssText =
      "position:fixed;top:90px;right:20px;width:400px;max-width:calc(100vw-40px);z-index:9999;display:flex;flex-direction:column;gap:12px;";
    document.body.appendChild(this.container);
  },
  show(message, type = "info") {
    this.init();
    const config = {
      success: { icon: "fa-check-circle", color: "#10b981" },
      error: { icon: "fa-exclamation-circle", color: "#ef4444" },
      warning: { icon: "fa-exclamation-triangle", color: "#f59e0b" },
      info: { icon: "fa-info-circle", color: "#667eea" },
    }[type];
    const bgColor = `rgba(${parseInt(config.color.slice(1, 3), 16)},${parseInt(config.color.slice(3, 5), 16)},${parseInt(config.color.slice(5, 7), 16)},0.1)`;
    const notification = document.createElement("div");
    notification.className = "notification-item";
    notification.style.cssText = `background:var(--bg-card);backdrop-filter:blur(10px);border:1px solid ${config.color}4D;border-left:4px solid ${config.color};border-radius:var(--radius-lg);padding:20px;animation:slideInRight 0.3s cubic-bezier(0.4,0,0.2,1);display:flex;align-items:flex-start;gap:16px;box-shadow:var(--shadow-md);`;
    notification.innerHTML = `
      <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:${bgColor};border-radius:var(--radius-lg);z-index:-1;opacity:0.3;"></div>
      <div style="width:40px;height:40px;min-width:40px;background:${bgColor};border:1px solid ${config.color}4D;border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;font-size:20px;color:${config.color};"><i class="fas ${config.icon}"></i></div>
      <div style="flex:1;display:flex;flex-direction:column;gap:8px;"><div style="font-weight:600;color:var(--text-primary);font-size:16px;">${message}</div><div style="font-size:12px;color:var(--text-secondary);"><i class="far fa-clock"></i> ${new Date().toLocaleTimeString()}</div></div>
      <button class="close-notification" style="background:rgba(255,255,255,0.05);border:1px solid var(--border-color);border-radius:var(--radius-sm);color:var(--text-secondary);cursor:pointer;padding:8px;display:flex;align-items:center;justify-content:center;"><i class="fas fa-times"></i></button>
    `;
    const closeBtn = notification.querySelector(".close-notification");
    const remove = () => {
      notification.style.animation = "slideOutRight 0.3s";
      setTimeout(() => notification.remove(), 300);
    };
    closeBtn.onclick = remove;
    setTimeout(remove, 5000);
    this.container.appendChild(notification);
  },
};
window.showNotification = (msg, type) => NotificationManager.show(msg, type);

// API
const API = {
  async sendToDjango(data) {
    const response = await fetch("/save-barcode/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": Utils.getCSRFToken(),
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    return result;
  },
  async turnStateMouse() {
    const element = document.querySelector(".doombass-block");
    const state = !element?.classList.contains("active");
    element?.classList.toggle("active");
    try {
      const response = await fetch("/turn-mouse/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": Utils.getCSRFToken(),
        },
        body: JSON.stringify({ state }),
      });
      return response.json();
    } catch (e) {
      console.error(e);
    }
  },
  async getPrinters() {
    const response = await fetch("/get-printers/", {
      headers: { "X-CSRFToken": Utils.getCSRFToken() },
    });
    return response.json();
  },
  async setDefaultPrinter(printerName) {
    const response = await fetch("/set-default-printer/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": Utils.getCSRFToken(),
      },
      body: JSON.stringify({ printer: printerName }),
    });
    return response.json();
  },
  async getCustomLabels() {
    const response = await fetch("/custom-labels/", {
      headers: { "X-CSRFToken": Utils.getCSRFToken() },
    });
    return response.json();
  },
};
window.turnStateMouse = () => API.turnStateMouse();

// Навигация
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
      return;
    }
    if (this.slideModules.includes(moduleId)) {
      this.openSlideContainer(moduleId);
    } else {
      this.closeAllContainers();
      document.getElementById(`${moduleId}-module`)?.classList.add("active");
    }
    this.updateNavigation(moduleId);
  },
  openSlideContainer(moduleId) {
    document
      .querySelectorAll(".container-modern.active")
      .forEach((c) => c.classList.remove("active"));
    const target =
      document.getElementById(`${moduleId}-module`) ||
      document.getElementById(moduleId);
    if (target) target.classList.add("active");
  },
  closeAllContainers() {
    document
      .querySelectorAll(".container-modern.active")
      .forEach((c) => c.classList.remove("active"));
    this.updateNavigation("home");
  },
  updateNavigation(moduleId) {
    document
      .querySelectorAll(".nav-btn")
      .forEach((btn) => btn.classList.remove("active"));
    const activeBtn = document.querySelector(
      `.nav-btn[onclick*="showModule('${moduleId}')"]`,
    );
    if (activeBtn) activeBtn.classList.add("active");
  },
  toggleMobileMenu() {
    const mobileMenu = document.getElementById("mobile-menu");
    if (mobileMenu) mobileMenu.classList.toggle("active");
  },
};
window.showModule = (id) => Navigation.showModule(id);
window.closeAllContainers = () => Navigation.closeAllContainers();
window.toggleMobileMenu = () => Navigation.toggleMobileMenu();
