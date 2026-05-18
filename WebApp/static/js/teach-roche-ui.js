// teach-roche-ui.js - UI компоненты для Roche анализатора

let currentAnalyzer = null;
let allAnalyzers = [];

async function loadAnalyzersSelect() {
  allAnalyzers = await RocheAPI.getAllAnalyzers();
  const select = document.getElementById("analyzer-select");
  if (!select) return;
  if (allAnalyzers.length === 0) {
    select.innerHTML = '<option value="">Нет доступных анализаторов</option>';
    return;
  }
  select.innerHTML = allAnalyzers
    .map(
      (analyzer) =>
        `<option value="${analyzer.id}">${analyzer.name} (${analyzer.code})</option>`,
    )
    .join("");
  if (allAnalyzers[0]) await switchAnalyzer(allAnalyzers[0].id);
  return allAnalyzers;
}

async function switchAnalyzer(analyzerId) {
  const analyzer = await RocheAPI.getAnalyzerById(analyzerId);
  if (!analyzer) return null;
  currentAnalyzer = analyzer;

  const analyzerNameEl = document.getElementById("analyzer-name");
  const analyzerDescEl = document.getElementById("analyzer-description");
  const modulesCountEl = document.getElementById("modules-count");

  if (analyzerNameEl) analyzerNameEl.textContent = analyzer.name;
  if (analyzerDescEl)
    analyzerDescEl.textContent =
      analyzer.description || "Модульная аналитическая система";

  await renderRocheModules();

  if (modulesCountEl && currentAnalyzer.modules) {
    modulesCountEl.innerHTML = `<i class="fas fa-microchip"></i> ${currentAnalyzer.modules.length} модулей`;
  }

  const select = document.getElementById("module-select");
  if (select)
    select.innerHTML = '<option value="">Загрузка модулей...</option>';
  console.log(`Переключено на анализатор: ${analyzer.name}`);
  return analyzer;
}

function getModuleIcon(moduleType) {
  const icons = {
    e801: "fa-microchip",
    e601: "fa-microchip",
    c702: "fa-flask",
  };
  return icons[moduleType] || "fa-cube";
}

function updateChannelIndicators(moduleId, reagents) {
  const card = document.querySelector(
    `.module-card[data-module-id="${moduleId}"]`,
  );
  if (!card) return;
  const hasCH1 = reagents.some(
    (r) => r.channel === "CH1" || r.channel === "BOTH",
  );
  const hasCH2 = reagents.some(
    (r) => r.channel === "CH2" || r.channel === "BOTH",
  );
  const ch1Led = card.querySelector(".channel-status:first-child .channel-led");
  const ch2Led = card.querySelector(".channel-status:last-child .channel-led");
  if (ch1Led) ch1Led.className = `channel-led ${hasCH1 ? "green" : "gray"}`;
  if (ch2Led) ch2Led.className = `channel-led ${hasCH2 ? "green" : "gray"}`;
}

async function loadModuleReagents(moduleId, hasChannels) {
  try {
    const reagents = await RocheAPI.getModuleReagents(moduleId);
    const tbody = document.getElementById(`module-reagents-${moduleId}`);
    const countSpan = document.getElementById(`reagent-count-${moduleId}`);
    if (!tbody) return;
    if (reagents.length === 0) {
      tbody.innerHTML =
        '</tr><td colspan="3" style="text-align:center; color:#94a3b8;">Нет реагентов</td></tr>';
      if (countSpan)
        countSpan.innerHTML = `<i class="fas fa-vial"></i> 0 реагентов`;
      return;
    }
    const rows = reagents
      .map((reagent) => {
        const isOnCH1 = reagent.channel === "CH1" || reagent.channel === "BOTH";
        const isOnCH2 = reagent.channel === "CH2" || reagent.channel === "BOTH";
        const isBoth = reagent.channel === "BOTH";
        const channelHtml = hasChannels
          ? `<td class="channel-cell"><div style="display: flex; gap: 8px; justify-content: center;"><span class="channel-dot ${isOnCH1 ? "active" : "inactive"}" style="${isBoth ? "background: #10b981;" : ""}"></span><span class="channel-dot ${isOnCH2 ? "active" : "inactive"}" style="${isBoth ? "background: #10b981;" : ""}"></span></div></td>`
          : "";
        const bothIcon = isBoth
          ? '<span class="both-icon" title="Работает на обоих каналах">⚡</span>'
          : "";
        return `<tr><td class="reagent-name">${Utils.escapeHtml(reagent.reagent.name)} ${bothIcon}</td><td class="reagent-code">${Utils.escapeHtml(reagent.reagent.code)}</td>${channelHtml}</tr>`;
      })
      .join("");
    tbody.innerHTML = rows;
    updateChannelIndicators(moduleId, reagents);
    if (countSpan)
      countSpan.innerHTML = `<i class="fas fa-vial"></i> ${reagents.length} реагентов`;
  } catch (error) {
    console.error("Ошибка загрузки реагентов:", error);
    const tbody = document.getElementById(`module-reagents-${moduleId}`);
    if (tbody)
      tbody.innerHTML =
        '<tr><td colspan="3" style="text-align:center; color:#ef4444;">Ошибка загрузки</td></tr>';
  }
}

function createModuleCard(module) {
  const card = document.createElement("div");
  card.className = "module-card";
  card.dataset.moduleId = module.id;
  card.dataset.moduleType = module.module_type;
  const moduleIcon = getModuleIcon(module.module_type);
  const hasChannels = module.has_channels;
  card.innerHTML = `
    <div class="module-header">
      <div class="module-number">${String(module.module_number).padStart(2, "0")}</div>
      <div class="module-title"><i class="fas ${moduleIcon}"></i><h3>${Utils.escapeHtml(module.name)}</h3><span class="module-type">${Utils.escapeHtml(module.module_type_display)}</span></div>
      ${hasChannels ? `<div class="module-channels"><div class="channel-status"><span class="channel-led gray"></span><span class="channel-label">CH1</span></div><div class="channel-status"><span class="channel-led gray"></span><span class="channel-label">CH2</span></div></div>` : ""}
    </div>
    <div class="module-body">
      <table class="module-table">
        <thead><tr><th>Реагент</th><th>Код</th>${hasChannels ? '<th width="100">Каналы</th>' : ""}</tr></thead>
        <tbody id="module-reagents-${module.id}"><tr><td colspan="3" style="text-align:center">Загрузка...</td></tr></tbody>
      </table>
    </div>
    <div class="module-footer"><span class="reagent-count" id="reagent-count-${module.id}"><i class="fas fa-vial"></i> 0 реагентов</span></div>`;
  loadModuleReagents(module.id, hasChannels);
  return card;
}

async function renderRocheModules() {
  const container = document.querySelector(".analyzer-modules");
  if (!container) return;
  if (!currentAnalyzer) {
    container.innerHTML =
      '<div style="grid-column:1/-1;text-align:center;padding:40px;">Выберите анализатор</div>';
    return;
  }
  container.innerHTML =
    '<div style="grid-column:1/-1;text-align:center;padding:40px;"><i class="fas fa-spinner fa-pulse"></i> Загрузка модулей...</div>';
  try {
    const modules = await RocheAPI.getAnalyzerModules(currentAnalyzer.id);
    if (!modules.length) {
      container.innerHTML =
        '<div style="grid-column:1/-1;text-align:center;padding:40px;">Нет модулей для этого анализатора</div>';
      return;
    }
    container.innerHTML = "";
    for (const module of modules) {
      const reagents = await RocheAPI.getModuleReagents(module.id);
      module.reagents_data = reagents;
      container.appendChild(createModuleCard(module));
    }
    const modulesCountEl = document.getElementById("modules-count");
    if (modulesCountEl)
      modulesCountEl.innerHTML = `<i class="fas fa-microchip"></i> ${modules.length} модулей`;
  } catch (error) {
    console.error("Ошибка:", error);
    container.innerHTML =
      '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#ef4444;">Ошибка загрузки модулей</div>';
  }
}

function initRocheAnalyzer() {
  console.log("Roche Cobas 8000 анализатор инициализирован");
  const dots = document.querySelectorAll(".channel-dot.active");
  dots.forEach((dot) => {
    dot.addEventListener("click", function (e) {
      e.stopPropagation();
      console.log("Канал кликнут");
    });
  });
  const rows = document.querySelectorAll(".module-table tbody tr");
  rows.forEach((row) => {
    const dots = row.querySelectorAll(".channel-dot");
    dots.forEach((dot) => {
      dot.addEventListener("mouseenter", () => {
        row.style.backgroundColor = "#f0fdf4";
      });
      dot.addEventListener("mouseleave", () => {
        row.style.backgroundColor = "";
      });
    });
  });
}
