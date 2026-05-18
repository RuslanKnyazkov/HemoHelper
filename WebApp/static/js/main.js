// main.js - только для главной страницы
// Utils, showNotification, API — уже есть в core.js

const AliquotModule = {
  generateContainer(name) {
    const container = document.getElementById("alicvote-container");
    if (container) container.classList.add("active");
    const placeContent = document.getElementById("container-aliquote");
    if (!placeContent) return;
    placeContent.innerHTML = `
      <div class="aliquot-content" style="padding: 24px;">
        <h2><i class="fas fa-flask"></i> Создание аликвот для: ${Utils.escapeHtml(name) || "Образец"}</h2>
        <div class="aliquot-form">
          <div class="input-group"><label>Аликвот 1</label><input type="text" id="aliquot-name-1" class="input-field" value="${Utils.escapeHtml(name) || ""} 1"></div>
          <div class="input-group"><label>Аликвот 2</label><input type="text" id="aliquot-name-2" class="input-field" value="${Utils.escapeHtml(name) || ""} 2"></div>
          <div class="input-group"><label>Номер лота</label><input type="text" id="aliquot-lot" class="input-field"></div>
          <div class="input-group"><label>Объем (мкл)</label><input type="number" id="aliquot-volume" class="input-field"></div>
          <div class="input-group"><label>Кол-во этикеток</label><input type="number" id="aliquot-count" class="input-field" value="1" min="1" max="10"></div>
        </div>
        <button class="module-btn" onclick="AliquotModule.print()"><i class="fas fa-print"></i> Печать</button>
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
    };
    if (!data.text[0] || !data.lot || !data.volume)
      return showNotification("Заполните все поля", "error");
    if (+data.count > 10)
      return showNotification("Максимум 10 наклеек", "error");
    try {
      await API.sendToDjango(data);
      showNotification("Аликвота отправлена", "success");
    } catch {
      showNotification("Ошибка печати", "error");
    }
  },
};

function updateDashboardStats() {
  const savedState = JSON.parse(localStorage.getItem("barcodeState") || "{}");
  const barcodeCount = savedState.barcodeHistory?.length || 0;
  const statsBarcodes = document.getElementById("stats-barcodes");
  if (statsBarcodes) statsBarcodes.textContent = barcodeCount;
  const printer = localStorage.getItem("selectedPrinter") || "Не выбран";
  const printerShort =
    printer.length > 20 ? printer.substring(0, 17) + "..." : printer;
  const statsPrinter = document.getElementById("stats-printer");
  if (statsPrinter)
    statsPrinter.innerHTML = `<i class="fas fa-print"></i> ${printerShort}`;
}

function quickAliquot() {
  const sampleName = prompt(
    "Введите название образца для аликвотирования:",
    "Образец",
  );
  if (sampleName) AliquotModule.generateContainer(sampleName);
}

document.addEventListener("DOMContentLoaded", () => {
  updateDashboardStats();
  setInterval(updateDashboardStats, 30000);
});

window.AliquotModule = AliquotModule;
window.quickAliquot = quickAliquot;
window.updateDashboardStats = updateDashboardStats;
