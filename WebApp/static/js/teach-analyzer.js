// teach-analyzer.js - анализатор проб (пациенты + маркеры)

// Генерация списка пациентов (25 уникальных пациентов)
function generatePatients() {
  const surnames = [
    "Иванов", "Петров", "Сидоров", "Кузнецов", "Смирнов",
    "Васильев", "Попов", "Михайлов", "Фёдоров", "Морозов",
    "Волков", "Алексеев", "Лебедев", "Семёнов", "Егоров",
    "Павлов", "Козлов", "Степанов", "Николаев", "Дмитриев",
    "Андреев", "Макаров", "Соловьёв", "Зайцев", "Борисов"
  ];
  const names = ["Александр", "Дмитрий", "Максим", "Сергей", "Андрей", "Алексей", "Иван", "Евгений", "Владимир", "Павел"];
  const patronymics = ["Викторович", "Алексеевич", "Сергеевич", "Владимирович", "Иванович"];

  return surnames.slice(0, 25).map((surname, idx) => ({
    id: idx + 1,
    fullName: `${surname} ${names[idx % names.length]} ${patronymics[idx % 5]}`,
    initials: `${surname.charAt(0)}${names[idx % names.length].charAt(0)}`,
    barcode: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
  }));
}

const PATIENTS = generatePatients();
let currentSamples = [];
let activeFilter = "all";

// Локальные тесты для демо
const localTests = [
  { id: 1, name: "Тиреотропный гормон (ТТГ)", initials: "TSH", category: "immunochemistry", group: "Гормоны" },
  { id: 2, name: "Свободный тироксин (FT4)", initials: "FT4", category: "immunochemistry", group: "Гормоны" },
  { id: 3, name: "Кортизол", initials: "CORT", category: "immunochemistry", group: "Гормоны" },
  { id: 4, name: "Тестостерон", initials: "TEST", category: "immunochemistry", group: "Гормоны" },
  { id: 5, name: "CA-125", initials: "CA125", category: "immunochemistry", group: "Онкомаркеры" },
  { id: 6, name: "CA-19-9", initials: "CA199", category: "immunochemistry", group: "Онкомаркеры" },
  { id: 7, name: "Ревматоидный фактор", initials: "RF", category: "immunochemistry", group: "Аутоиммунные" },
  { id: 8, name: "Anti-TPO", initials: "TPOab", category: "immunochemistry", group: "Аутоиммунные" },
  { id: 9, name: "Анти-CCP", initials: "CCP", category: "immunochemistry", group: "Аутоиммунные" },
  { id: 10, name: "Ферритин", initials: "FERR", category: "immunochemistry", group: "Метаболизм" },
  { id: 11, name: "Витамин B12", initials: "B12", category: "immunochemistry", group: "Витамины" },
  { id: 12, name: "ПСА общий", initials: "PSA", category: "immunochemistry", group: "Онкомаркеры" },
  { id: 13, name: "Глюкоза", initials: "GLU", category: "biochemistry", group: "Углеводы" },
  { id: 14, name: "Общий белок", initials: "TP", category: "biochemistry", group: "Белки" },
  { id: 15, name: "АЛТ", initials: "ALT", category: "biochemistry", group: "Ферменты" },
  { id: 16, name: "АСТ", initials: "AST", category: "biochemistry", group: "Ферменты" },
  { id: 17, name: "Билирубин общий", initials: "TBIL", category: "biochemistry", group: "Пигменты" },
  { id: 18, name: "Креатинин", initials: "CREAT", category: "biochemistry", group: "Азотистый" },
  { id: 19, name: "Мочевина", initials: "UREA", category: "biochemistry", group: "Азотистый" },
  { id: 20, name: "Холестерин", initials: "CHOL", category: "biochemistry", group: "Липиды" },
  { id: 21, name: "ЛДГ", initials: "LDH", category: "biochemistry", group: "Ферменты" },
  { id: 22, name: "Железо", initials: "Fe", category: "biochemistry", group: "Микроэлементы" },
  { id: 23, name: "Калий", initials: "K", category: "biochemistry", group: "Электролиты" },
  { id: 24, name: "Натрий", initials: "Na", category: "biochemistry", group: "Электролиты" },
  { id: 25, name: "Кальций", initials: "Ca", category: "biochemistry", group: "Минералы" },
  { id: 26, name: "Магний", initials: "Mg", category: "biochemistry", group: "Минералы" },
  { id: 27, name: "Амилаза", initials: "AMY", category: "biochemistry", group: "Ферменты" },
  { id: 28, name: "Щелочная фосфатаза", initials: "ALP", category: "biochemistry", group: "Ферменты" },
  { id: 29, name: "ГГТ", initials: "GGT", category: "biochemistry", group: "Ферменты" },
  { id: 30, name: "Мочевая кислота", initials: "UA", category: "biochemistry", group: "Пурины" },
];

function generateThirtySamples() {
  let samples = [];
  for (let i = 0; i < 30; i++) {
    const patient = PATIENTS[i % PATIENTS.length];
    const analysis = localTests[i % localTests.length];
    samples.push({
      ...analysis,
      patientId: patient.id,
      patientFullName: patient.fullName,
      patientInitials: patient.initials,
      barcode: patient.barcode,
      uniqueKey: `${patient.id}_${analysis.id}_${Date.now()}_${Math.random()}_${i}`,
      markType: "clean",
      remarkText: "",
    });
  }
  for (let i = samples.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [samples[i], samples[j]] = [samples[j], samples[i]];
  }
  samples.forEach((s, idx) => { s.displayIndex = idx + 1; });
  return samples;
}

function getStatusInfo(markType) {
  switch (markType) {
    case "remark": return { class: "status-remark", text: "✏️ Отписана", icon: "fa-pencil-alt" };
    case "loss": return { class: "status-loss", text: "❌ Потеря", icon: "fa-times-circle" };
    case "repeat": return { class: "status-repeat", text: "🔄 Повтор", icon: "fa-sync-alt" };
    default: return { class: "status-clean", text: "✓ Без отметки", icon: "fa-check-circle" };
  }
}

function getRowBackground(markType) {
  if (markType === "remark") return "#ffe0e0";
  if (markType === "loss") return "#f3e8ff";
  if (markType === "repeat") return "#ffe4f0";
  return "#ffffff";
}

function renderAnalysisTable() {
  const container = document.getElementById("analysisTableContainer");
  const totalSpan = document.getElementById("totalCountSpan");
  if (!container) return;

  let filtered = [...currentSamples];
  if (activeFilter !== "all") filtered = filtered.filter(s => s.category === activeFilter);
  if (totalSpan) totalSpan.textContent = currentSamples.length;

  if (!filtered.length) {
    container.innerHTML = `<div class="empty-message" style="padding: 40px; text-align:center;">Нет проб в выбранной категории</div>`;
    return;
  }

  const html = `<table class="analysis-table"><thead><tr><th>#</th><th>Штрих-код (10 цифр)</th><th>Пациент</th><th>Инициалы</th><th>Анализ</th><th>Группа</th><th>Статус</th><th>Маркеры</th></tr></thead><tbody>${filtered.map(sample => {
    const status = getStatusInfo(sample.markType);
    const bgColor = getRowBackground(sample.markType);
    return `<tr style="background-color: ${bgColor};"><td><strong>${sample.displayIndex}</strong></td><td><code style="font-size:0.85rem;">${sample.barcode}</code></td><td>${sample.patientFullName}</td><td>${sample.patientInitials}</td><td>${sample.name}</td><td>${sample.group}</td><td><span class="status-badge ${status.class}"><i class="fas ${status.icon}"></i> ${status.text}</span></td><td class="action-group"><button class="mark-icon-btn clean" data-action="clean" data-unique="${sample.uniqueKey}" data-id="${sample.id}"><i class="fas fa-check-circle"></i> Чисто</button><button class="mark-icon-btn repeat" data-action="repeat" data-unique="${sample.uniqueKey}" data-id="${sample.id}"><i class="fas fa-sync-alt"></i> Повтор</button><button class="mark-icon-btn loss" data-action="loss" data-unique="${sample.uniqueKey}" data-id="${sample.id}"><i class="fas fa-times-circle"></i> Потеря</button><button class="mark-icon-btn remark" data-action="remark" data-unique="${sample.uniqueKey}" data-id="${sample.id}"><i class="fas fa-pencil-alt"></i> Отписана</button></td></tr>`;
  }).join("")}</tbody></table>`;
  container.innerHTML = html;

  document.querySelectorAll(".mark-icon-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const action = btn.getAttribute("data-action");
      const uniqueKey = btn.getAttribute("data-unique");
      const sampleId = parseInt(btn.getAttribute("data-id"));
      const targetSample = currentSamples.find(s => s.uniqueKey === uniqueKey && s.id === sampleId);
      if (targetSample) {
        let newType = "clean", msg = "";
        if (action === "remark") { newType = "remark"; msg = `Проба ${targetSample.patientInitials} (${targetSample.initials}) отмечена как "Отписана" ✏️`; }
        else if (action === "loss") { newType = "loss"; msg = `Проба ${targetSample.patientInitials} (${targetSample.initials}) отмечена как "Потеря" ❌`; }
        else if (action === "repeat") { newType = "repeat"; msg = `Проба ${targetSample.patientInitials} (${targetSample.initials}) отмечена как "Повтор" 🔄`; }
        else { newType = "clean"; msg = `С пробы ${targetSample.patientInitials} (${targetSample.initials}) сняты все отметки ✓`; }
        targetSample.markType = newType;
        renderAnalysisTable();
        if (typeof showNotification === 'function') showNotification(msg, "info");
        else alert(msg);
      }
    });
  });
}

function refreshThirtySamples() {
  currentSamples = generateThirtySamples();
  renderAnalysisTable();
  if (typeof showNotification === 'function') showNotification("Список из 30 проб обновлён, порядок перемешан", "success");
  else alert("Список проб обновлён");
}

function setFilter(filterValue) {
  activeFilter = filterValue;
  document.querySelectorAll(".filter-btn").forEach(btn => {
    if (btn.getAttribute("data-filter") === filterValue) btn.classList.add("active");
    else btn.classList.remove("active");
  });
  renderAnalysisTable();
}