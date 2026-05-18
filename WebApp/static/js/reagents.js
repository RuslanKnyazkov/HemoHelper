// reagents.js — ACL Top 700, 6 лунок вертикально, R1-R6 и D1-D3
(function () {
  let selectedReagent = null;
  // Структура хранения: racks[rackName] = массив из 6 элементов (null или название реагента)
  let racks = {};

  // Функция уведомления (используем глобальную showNotification)
  function notify(message, type = "info") {
    if (typeof window.showNotification === "function") {
      window.showNotification(message, type);
    } else {
      alert(message);
    }
  }

  // Создание всех стоек (R1-R6, D1-D3)
  function createAllRacks() {
    const rContainer = document.getElementById("racks-r");
    const dContainer = document.getElementById("racks-d");
    if (!rContainer || !dContainer) {
      console.error("Контейнеры для стоек не найдены");
      return;
    }
    rContainer.innerHTML = "";
    dContainer.innerHTML = "";

    // Создаём R1..R6
    for (let i = 1; i <= 6; i++) {
      const rackName = `R${i}`;
      const rack = createRackElement(rackName);
      rContainer.appendChild(rack);
      racks[rackName] = Array(6).fill(null);
    }
    // Создаём D1, D2, D3
    for (let i = 1; i <= 3; i++) {
      const rackName = `D${i}`;
      const rack = createRackElement(rackName);
      dContainer.appendChild(rack);
      racks[rackName] = Array(6).fill(null);
    }
  }

  // Вспомогательная: создаёт DOM-элемент стойки с 6 лунками
  function createRackElement(rackName) {
    const rackDiv = document.createElement("div");
    rackDiv.className = "rack";
    rackDiv.id = `rack-${rackName}`;
    rackDiv.innerHTML = `<div class="rack-header">${rackName}</div><div class="rack-body" id="rack-body-${rackName}"></div>`;
    const body = rackDiv.querySelector(".rack-body");
    for (let i = 1; i <= 6; i++) {
      const slot = document.createElement("div");
      slot.className = "reagent-slot";
      slot.id = `slot-${rackName}-${i}`;
      slot.innerHTML = `<span class="slot-number">${i}</span>`;
      slot.addEventListener(
        "click",
        (function (r, s) {
          return function () {
            handleSlotClick(r, s, this);
          };
        })(rackName, i),
      );
      body.appendChild(slot);
    }
    return rackDiv;
  }

  // Обработка клика по лунке
  function handleSlotClick(rackName, slotNumber, element) {
    if (!selectedReagent) {
      notify("Сначала выберите реагент", "info");
      return;
    }

    const allowed = getAllowedRacksForReagent(selectedReagent);
    if (!allowed.includes(rackName)) {
      notify(
        `Реагент ${getReagentDisplayName(selectedReagent)} нельзя ставить в стойку ${rackName}`,
        "error",
      );
      return;
    }

    const slotIndex = slotNumber - 1;
    const current = racks[rackName][slotIndex];

    if (current === selectedReagent) {
      // Удалить реагент из лунки
      racks[rackName][slotIndex] = null;
      element.classList.remove("filled");
      element.classList.forEach((cls) => {
        if (cls.startsWith("reagent-")) element.classList.remove(cls);
      });
      element.innerHTML = `<span class="slot-number">${slotNumber}</span>`;
    } else {
      // Установить реагент (заменяем, если там что-то было)
      // Сначала очищаем классы
      element.classList.remove("filled");
      element.classList.forEach((cls) => {
        if (cls.startsWith("reagent-")) element.classList.remove(cls);
      });
      racks[rackName][slotIndex] = selectedReagent;
      element.classList.add("filled", `reagent-${selectedReagent}`);
      element.innerHTML = `
                <span class="slot-number">${slotNumber}</span>
                <div class="reagent-content">
                    <div class="reagent-type">${getReagentDisplayName(selectedReagent)}</div>
                    <div class="reagent-indicator"></div>
                </div>
            `;
    }
    updateStats();
  }

  // Разрешённые стойки для каждого реагента (новые правила, включая Clean B)
  function getAllowedRacksForReagent(reagentType) {
    const map = {
      f_diluent: ["D1", "D2"],
      pc_dil: ["D1", "D2"],
      aptt_reagent: ["D3", "R1", "R2"],
      aptt_cacl2: ["R3", "R4", "R5", "R6"],
      recombiplastin: ["R3", "R4", "R5", "R6"],
      trombintime: ["R3", "R4", "R5", "R6"],
      fibrinogen: ["R3", "R4", "R5", "R6"],
      clean_b: ["D1", "D2", "D3", "R1", "R5", "R6"],
      clean_b_diluted: ["D1", "D2", "D3", "R1", "R5", "R6"],
    };
    return map[reagentType] || [];
  }

  // Отображаемое имя реагента
  function getReagentDisplayName(reagentType) {
    const names = {
      f_diluent: "Factor Diluent",
      pc_dil: "PC Diluent",
      aptt_reagent: "APTT reagent",
      aptt_cacl2: "APTT CaCl2",
      recombiplastin: "Recombiplastin",
      trombintime: "Trombin Time",
      fibrinogen: "O.F.A Fibrinogen",
      clean_b: "Clean B",
      clean_b_diluted: "Clean B diluted",
    };
    return names[reagentType] || reagentType;
  }

  // Обновление статистики (заполненные слоты, количество уникальных реагентов)
  function updateStats() {
    let filled = 0;
    const usedSet = new Set();
    for (let rackName in racks) {
      racks[rackName].forEach((r) => {
        if (r) {
          filled++;
          usedSet.add(r);
        }
      });
    }
    const filledSpan = document.getElementById("filled-slots");
    if (filledSpan) filledSpan.textContent = filled;
    const usedSpan = document.getElementById("used-reagents");
    if (usedSpan) usedSpan.textContent = usedSet.size;
  }

  // Глобальные функции, вызываемые из HTML
  window.selectReagent = function (reagentType) {
    // Снять выделение со всех кнопок
    document.querySelectorAll(".reagent-btn").forEach((btn) => {
      btn.classList.remove("selected");
    });
    const btn = Array.from(document.querySelectorAll(".reagent-btn")).find(
      (b) =>
        b.getAttribute("onclick") &&
        b.getAttribute("onclick").includes(reagentType),
    );
    if (btn) btn.classList.add("selected");
    selectedReagent = reagentType;
    const statsSpan = document.getElementById("selected-reagent");
    if (statsSpan)
      statsSpan.textContent = `Выбран: ${getReagentDisplayName(reagentType)}`;
    notify(`Выбран реагент: ${getReagentDisplayName(reagentType)}`, "success");
  };

  window.clearSelection = function () {
    selectedReagent = null;
    document
      .querySelectorAll(".reagent-btn")
      .forEach((btn) => btn.classList.remove("selected"));
    const statsSpan = document.getElementById("selected-reagent");
    if (statsSpan) statsSpan.textContent = "Реагент не выбран";
    notify("Выделение снято", "info");
  };

  window.clearAllRacks = function () {
    if (!confirm("Вы уверены, что хотите очистить все стойки?")) return;
    // Очищаем данные
    for (let rackName in racks) {
      for (let i = 0; i < racks[rackName].length; i++) {
        racks[rackName][i] = null;
        const slot = document.getElementById(`slot-${rackName}-${i + 1}`);
        if (slot) {
          slot.classList.remove("filled");
          slot.classList.forEach((cls) => {
            if (cls.startsWith("reagent-")) slot.classList.remove(cls);
          });
          slot.innerHTML = `<span class="slot-number">${i + 1}</span>`;
        }
      }
    }
    window.clearSelection();
    updateStats();
    notify("Все стойки очищены", "success");
  };

  // Инициализация при загрузке страницы
  document.addEventListener("DOMContentLoaded", () => {
    createAllRacks();
    updateStats();
  });
})();
