// teach-guide.js - справочник тестов из Django API
// Использует глобальные: Utils.escapeHtml, showNotification, Utils.getCSRFToken

async function loadGuideFromAPI(typeTest = "immuno") {
  try {
    let testTypeParam =
      typeTest === "immuno" || typeTest === "immunochemistry"
        ? "immuno"
        : "biochemistry";
    const url = `/teach/guide/${testTypeParam}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-CSRFToken": Utils.getCSRFToken(),
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    if (data.list && Array.isArray(data.list)) {
      return data.list.map((item) => ({
        code: item.code,
        name: item.name,
        sample_type: item.sample_type || "Сыворотка",
        lines: item.lines || [],
      }));
    }
    return [];
  } catch (error) {
    console.error("Ошибка загрузки справочника:", error);
    showNotification("Ошибка загрузки данных справочника", "info");
    return [];
  }
}

window.showGuideModule = async function (direction) {
  const informerDiv = document.getElementById("testInformer");
  if (!informerDiv) return;

  informerDiv.innerHTML = `<div class="informer-card"><div class="informer-header"><h2><i class="fas fa-spinner fa-pulse"></i> Загрузка справочника...</h2><button class="close-informer" onclick="window.closeGuide()">Закрыть</button></div><div class="loading-state"><i class="fas fa-spinner fa-pulse"></i><p>Загрузка данных...</p></div></div>`;
  informerDiv.classList.add("active");

  let tests = await loadGuideFromAPI(direction);
  if (!tests || tests.length === 0) {
    showNotification("Нет данных справочника", "info");
    informerDiv.classList.remove("active");
    return;
  }

  const typeName =
    direction === "immuno" || direction === "immunochemistry"
      ? "Иммунохимия"
      : "Биохимия";
  const typeIcon =
    direction === "immuno" || direction === "immunochemistry" ? "🧬" : "⚗️";

  const rows = tests
    .map((test, index) => {
      const linesHtml = (test.lines || [])
        .map(
          (line) =>
            `<span class="line-badge"><i class="fas fa-microchip"></i> ${line.code || line}</span>`,
        )
        .join("");
      return `<tr style="animation-delay: ${index * 0.02}s"><td><span class="test-code">${Utils.escapeHtml(test.code || test.id)}</span></td><td class="test-name">${Utils.escapeHtml(test.name)}</span></td><td><span class="sample-type-badge"><i class="fas fa-tint"></i> ${Utils.escapeHtml(test.sample_type || "Сыворотка")}</span></td><td><div class="lines-container">${linesHtml || '<span style="color: #94a3b8;">—</span>'}</div></td></tr>`;
    })
    .join("");

  informerDiv.innerHTML = `
    <div class="informer-card">
      <div class="informer-header">
        <h2><i class="fas fa-table-list"></i> Справочник тестов ${typeIcon} ${Utils.escapeHtml(typeName)}<span style="font-size: 14px; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 20px;">${tests.length} тестов</span></h2>
        <button class="close-informer" onclick="window.closeGuide()"><i class="fas fa-times"></i> Закрыть</button>
      </div>
      <div class="search-wrapper"><div class="search-container"><i class="fas fa-search"></i><input type="text" id="guideSearch" placeholder="Поиск по названию, коду или типу материала..."></div></div>
      <div class="table-wrapper"><table class="guide-table"><thead><tr><th style="width: 20%">Код теста</th><th style="width: 40%">Название</th><th style="width: 20%">Материал</th><th style="width: 20%">Линии анализаторов</th></tr></thead><tbody id="guideTbody">${rows}</tbody></table></div>
      <div class="info-footer"><span><i class="fas fa-database"></i> Лабораторная информационная система</span><span><i class="fas fa-microchip"></i> Поддерживаемые линии: EEEE1, EEEE2, CEEE</span><span><i class="fas fa-chart-simple"></i> Актуальные данные</span></div>
    </div>`;

  const searchInput = document.getElementById("guideSearch");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase().trim();
      const filtered = tests.filter(
        (test) =>
          (test.name && test.name.toLowerCase().includes(term)) ||
          (test.code && test.code.toLowerCase().includes(term)) ||
          (test.sample_type && test.sample_type.toLowerCase().includes(term)),
      );
      const filteredRows = filtered
        .map((test, index) => {
          const linesHtml = (test.lines || [])
            .map(
              (line) =>
                `<span class="line-badge"><i class="fas fa-microchip"></i> ${line.code || line}</span>`,
            )
            .join("");
          return `<tr style="animation-delay: ${index * 0.02}s"><td><span class="test-code">${Utils.escapeHtml(test.code || test.id)}</span></td><td class="test-name">${Utils.escapeHtml(test.name)}</span></td><td><span class="sample-type-badge"><i class="fas fa-tint"></i> ${Utils.escapeHtml(test.sample_type || "Сыворотка")}</span></td><td><div class="lines-container">${linesHtml || '<span style="color: #94a3b8;">—</span>'}</div></td></tr>`;
        })
        .join("");
      const tbody = document.getElementById("guideTbody");
      if (filtered.length > 0) tbody.innerHTML = filteredRows;
      else
        tbody.innerHTML = `<tr><td colspan="4" class="empty-state"><i class="fas fa-search"></i><p>Ничего не найдено</p><small>Попробуйте изменить поисковый запрос</small></td></tr>`;
    });
  }
};

window.closeGuide = function () {
  const informer = document.getElementById("testInformer");
  if (informer) informer.classList.remove("active");
};
