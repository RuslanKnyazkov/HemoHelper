// ========== СОСТОЯНИЕ ==========
let quickMode = "default";
let quickRetry = 2;
let selectedPrinter = null;
let barcodeCount = 0;

// ========== УВЕДОМЛЕНИЯ ==========
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toast-message");
  const icon = toast.querySelector("i");

  toastMessage.textContent = message;
  if (type === "success") {
    icon.className = "fas fa-check-circle";
    icon.style.color = "#10b981";
  } else if (type === "error") {
    icon.className = "fas fa-exclamation-circle";
    icon.style.color = "#ef4444";
  } else {
    icon.className = "fas fa-info-circle";
    icon.style.color = "#667eea";
  }

  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// ========== ПРИНТЕРЫ ==========
async function loadPrinters() {
  const select = document.getElementById("printer-select");
  if (!select) return;

  select.innerHTML = '<option value="">🔍 Поиск принтеров...</option>';

  try {
    const response = await fetch("/get-printers/", {
      headers: { "X-CSRFToken": getCSRFToken() },
    });
    const result = await response.json();
    const printers = result.printers || [];

    select.innerHTML = '<option value="">📋 Выберите принтер...</option>';
    printers.forEach((printer) => {
      const name = typeof printer === "object" ? printer.name : printer;
      const option = document.createElement("option");
      option.value = name;
      option.textContent = `🖨️ ${name}`;
      select.appendChild(option);
    });

    const savedPrinter = localStorage.getItem("selectedPrinter");
    if (
      savedPrinter &&
      printers.some(
        (p) => (typeof p === "object" ? p.name : p) === savedPrinter,
      )
    ) {
      select.value = savedPrinter;
      selectedPrinter = savedPrinter;
      updatePrinterStatus(savedPrinter);
    }

    if (printers.length === 0) {
      select.innerHTML = '<option value="">⚠️ Принтеры не найдены</option>';
    }
  } catch (error) {
    select.innerHTML = '<option value="">❌ Ошибка загрузки</option>';
    showToast("Ошибка загрузки принтеров", "error");
  }
}

function updatePrinterStatus(printerName) {
  const statusDiv = document.getElementById("printer-status");
  const nameSpan = document.getElementById("printer-name");
  if (nameSpan) nameSpan.textContent = printerName || "Принтер не выбран";
  if (printerName) {
    statusDiv.style.background = "rgba(16, 185, 129, 0.1)";
  } else {
    statusDiv.style.background = "rgba(239, 68, 68, 0.1)";
  }
}

// ========== ГЕНЕРАЦИЯ ПАДАЮЩИХ ПРОБИРОК ==========
function createFallingVials() {
  const container = document.getElementById("hero-vials");
  if (!container) return;

  const vialTypes = ["", "blood", "blue", "green"];
  const sizes = ["", "small", "large"];

  for (let i = 0; i < 40; i++) {
    const vial = document.createElement("div");
    const type = vialTypes[Math.floor(Math.random() * vialTypes.length)];
    const size = sizes[Math.floor(Math.random() * sizes.length)];

    vial.className = `vial ${type} ${size}`;
    vial.style.left = `${Math.random() * 100}%`;
    vial.style.animationDuration = `${4 + Math.random() * 10}s`;
    vial.style.animationDelay = `${Math.random() * 20}s`;
    vial.style.transform = `rotate(${-15 + Math.random() * 30}deg)`;

    container.appendChild(vial);
  }
}

// ========== АНИМАЦИЯ АНАЛИЗОВ ==========
function startAnalysisAnimation() {
  const items = document.querySelectorAll(".analysis-item");
  let currentIndex = 0;

  setInterval(() => {
    const currentItem = items[currentIndex];
    if (currentItem) {
      currentItem.classList.add("analyzing");
      const badge = currentItem.querySelector(".analysis-badge");
      const oldText = badge.textContent;
      badge.textContent = "⚡ Анализируется...";
      badge.style.background = "rgba(102, 126, 234, 0.2)";
      badge.style.color = "#667eea";

      setTimeout(() => {
        currentItem.classList.remove("analyzing");
        badge.textContent = oldText;
        if (oldText === "В обработке") {
          badge.style.background = "rgba(245, 158, 11, 0.15)";
          badge.style.color = "#f59e0b";
        } else {
          badge.style.background = "rgba(16, 185, 129, 0.15)";
          badge.style.color = "#10b981";
          badge.textContent = "✅ Завершён";
        }
      }, 3000);
    }
    currentIndex = (currentIndex + 1) % items.length;
  }, 5000);
}

// ========== ПЕЧАТЬ БАРКОДА ==========
async function printBarcode() {
  const input = document.getElementById("barcode-input");
  const barcode = input?.value.trim();

  if (!barcode) {
    showToast("Введите номер пробы!", "error");
    return;
  }

  if (!selectedPrinter) {
    showToast("Сначала выберите принтер!", "error");
    return;
  }

  const data = {
    type: "barcode",
    anchor: "h",
    size: "s",
    retry: quickRetry,
    code: "BCN",
    date: true,
    number: barcode,
    barcode: barcode,
    mode: quickMode,
    printer: selectedPrinter,
  };

  try {
    const response = await fetch("/save-barcode/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCSRFToken(),
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();

    if (result.success) {
      barcodeCount++;
      showToast(`✅ Проба "${barcode}" отправлена на печать!`, "success");
      input.value = "";
      input.focus();
    } else {
      showToast(result.error || "Ошибка печати", "error");
    }
  } catch (error) {
    showToast("Ошибка отправки", "error");
  }
}

// ========== CSRF TOKEN ==========
function getCSRFToken() {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, 10) === "csrftoken=") {
        cookieValue = decodeURIComponent(cookie.substring(10));
        break;
      }
    }
  }
  return cookieValue;
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener("DOMContentLoaded", () => {
  createFallingVials();
  loadPrinters();
  startAnalysisAnimation();
  window.renderRocheModules();
  // Выбор режима
  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".mode-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      quickMode = btn.dataset.mode;
      showToast(`Режим: ${btn.textContent}`, "info");
    });
  });

  // Выбор количества копий
  document.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".copy-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      quickRetry = parseInt(btn.dataset.retry);
    });
  });

  // Выбор принтера
  const printerSelect = document.getElementById("printer-select");
  if (printerSelect) {
    printerSelect.addEventListener("change", (e) => {
      if (e.target.value) {
        selectedPrinter = e.target.value;
        localStorage.setItem("selectedPrinter", selectedPrinter);
        updatePrinterStatus(selectedPrinter);
        showToast(`Принтер выбран: ${selectedPrinter}`, "success");
      }
    });
  }

  // Обновление принтеров
  document.getElementById("refresh-printers")?.addEventListener("click", () => {
    loadPrinters();
    showToast("Поиск принтеров...", "info");
  });

  // Печать
  document
    .getElementById("print-barcode-btn")
    ?.addEventListener("click", printBarcode);

  // Enter на поле ввода
  const input = document.getElementById("barcode-input");
  if (input) {
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        printBarcode();
      }
    });
  }

  // Анимация клика по анализам
  document.querySelectorAll(".analysis-item").forEach((item) => {
    item.addEventListener("click", () => {
      const name = item.querySelector(".analysis-name")?.textContent;
      showToast(`Запуск анализа: ${name}`, "info");
      item.style.transform = "scale(0.98)";
      setTimeout(() => {
        item.style.transform = "";
      }, 200);
    });
  });
});
