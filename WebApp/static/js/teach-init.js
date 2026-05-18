// teach-init.js - инициализация всех модулей

document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Инициализация teach-страницы...");

  // Анализатор проб
  if (document.getElementById("openRandomPopupBtn")) {
    if (typeof generateThirtySamples === "function") {
      currentSamples = generateThirtySamples();
    }
    window.refreshThirtySamples = refreshThirtySamples;
    window.setFilter = setFilter;
    document
      .getElementById("openRandomPopupBtn")
      ?.addEventListener("click", () => {
        if (typeof renderAnalysisTable === "function") renderAnalysisTable();
        document.getElementById("analysisPopup").classList.add("active");
      });
    document
      .getElementById("closePopupBtn")
      ?.addEventListener("click", () =>
        document.getElementById("analysisPopup").classList.remove("active"),
      );
    document.getElementById("analysisPopup")?.addEventListener("click", (e) => {
      if (e.target === e.currentTarget)
        e.currentTarget.classList.remove("active");
    });
    document.querySelectorAll(".filter-btn").forEach((btn) =>
      btn.addEventListener("click", () => {
        if (typeof setFilter === "function")
          setFilter(btn.getAttribute("data-filter"));
      }),
    );
    document
      .getElementById("refreshAnalysesBtn")
      ?.addEventListener("click", () => {
        if (typeof refreshThirtySamples === "function") refreshThirtySamples();
      });
  }

  // Справочник тестов
  document.querySelectorAll(".start-test-btn[data-guide]").forEach((btn) =>
    btn.addEventListener("click", () => {
      if (typeof showGuideModule === "function") showGuideModule("immuno");
    }),
  );

  // Roche анализатор
  if (typeof loadAnalyzersSelect === "function") {
    await loadAnalyzersSelect();
  }
  document
    .getElementById("analyzer-select")
    ?.addEventListener("change", async (e) => {
      if (e.target.value && typeof switchAnalyzer === "function")
        await switchAnalyzer(parseInt(e.target.value));
    });

  // CRUD реагентов
  if (typeof ReagentCRUD !== "undefined") {
    window.reagentCRUD = new ReagentCRUD();
  }
  if (typeof initRocheAnalyzer === "function") {
    initRocheAnalyzer();
  }

  console.log("✅ Инициализация teach завершена!");
});
