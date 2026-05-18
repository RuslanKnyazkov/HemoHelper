// teach-crud.js - CRUD операции с реагентами

class ReagentCRUD {
  constructor() {
    this.init();
  }

  async init() {
    this.bindEvents();
    await this.loadReagentsList();
    await this.loadModulesForSelect();
    this.initTabs();
  }

  bindEvents() {
    const addForm = document.getElementById("add-reagent-form");
    if (addForm)
      addForm.addEventListener("submit", (e) => this.createReagent(e));
    const editForm = document.getElementById("edit-reagent-form");
    if (editForm)
      editForm.addEventListener("submit", (e) => this.updateReagent(e));
    const moduleForm = document.getElementById("add-to-module-form");
    if (moduleForm)
      moduleForm.addEventListener("submit", (e) => this.addReagentToModule(e));

    // Закрытие по кнопкам .close-modal и .btn-cancel
    document.querySelectorAll(".close-modal, .btn-cancel").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const modal = btn.closest(".modal");
        if (modal) modal.style.display = "none";
      });
    });

    // Закрытие по клику на фон (оверлей)
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.style.display = "none";
      });
    });

    const addReagentBtn = document.querySelector(".btn-add-reagent");
    if (addReagentBtn)
      addReagentBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.showAddReagentModal();
      });
  }

  initTabs() {
    const tabs = document.querySelectorAll(".tab-btn");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const tabName = tab.dataset.tab;
        document
          .querySelectorAll(".tab-content")
          .forEach((c) => c.classList.remove("active"));
        document
          .querySelectorAll(".tab-btn")
          .forEach((b) => b.classList.remove("active"));
        document.getElementById(`tab-${tabName}`).classList.add("active");
        tab.classList.add("active");
        if (tabName === "assignments") this.loadAssignments();
      });
    });
  }

  getCategoryName(category) {
    const names = {
      hormones: "Гормоны",
      oncomarkers: "Онкомаркеры",
      autoimmune: "Аутоиммунные",
      vitamins: "Витамины",
      special: "Специальные",
      biochemistry: "Биохимия",
      hepatitis: "Гепатиты",
    };
    return names[category] || category;
  }

  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = "flex";
  }
  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = "none";
  }
  showAddReagentModal() {
    document.getElementById("add-reagent-form")?.reset();
    this.showModal("add-reagent-modal");
  }

  async loadReagentsList() {
    try {
      const reagents = await RocheAPI.getAllReagents();
      this.renderAdminTable(reagents);
    } catch (error) {
      console.error("Ошибка загрузки:", error);
    }
  }

  renderAdminTable(reagents) {
    const container = document.getElementById("reagents-admin-table");
    if (!container) return;
    if (!reagents.length) {
      container.innerHTML = '<tr><td colspan="5">Нет реагентов</td></tr>';
      return;
    }
    container.innerHTML = reagents
      .map(
        (reagent) => `
      <tr>
        <td>${Utils.escapeHtml(reagent.code)}</td>
        <td>${Utils.escapeHtml(reagent.name)}</td>
        <td>${Utils.escapeHtml(reagent.short_name)}</td>
        <td>${this.getCategoryName(reagent.category)}</td>
        <td>
          <button onclick="reagentCRUD.editReagent(${reagent.id})" class="btn-edit"><i class="fas fa-edit"></i></button>
          <button onclick="reagentCRUD.deleteReagent(${reagent.id})" class="btn-delete"><i class="fas fa-trash"></i></button>
          <button onclick="reagentCRUD.showAddToModule(${reagent.id}, '${Utils.escapeHtml(reagent.code)}')" class="btn-add"><i class="fas fa-plus-circle"></i></button>
        </td>
      </tr>
    `,
      )
      .join("");
  }

  async loadModulesForSelect() {
    if (!currentAnalyzer) {
      const select = document.getElementById("module-select");
      if (select)
        select.innerHTML =
          '<option value="">Сначала выберите анализатор</option>';
      return;
    }
    const modules = await RocheAPI.getAnalyzerModules(currentAnalyzer.id);
    const select = document.getElementById("module-select");
    if (select) {
      if (!modules.length)
        select.innerHTML = '<option value="">Нет модулей</option>';
      else
        select.innerHTML =
          '<option value="">Выберите модуль</option>' +
          modules
            .map(
              (m) =>
                `<option value="${m.id}">Модуль ${m.module_number}: ${Utils.escapeHtml(m.name)} (${Utils.escapeHtml(m.module_type)})</option>`,
            )
            .join("");
    }
  }

  async createReagent(e) {
    e.preventDefault();
    const formData = {
      code: document.getElementById("reagent-code").value,
      name: document.getElementById("reagent-name").value,
      short_name: document.getElementById("reagent-short-name").value,
      category: document.getElementById("reagent-category").value,
      description: document.getElementById("reagent-description").value || "",
    };
    try {
      await RocheAPI.createReagent(formData);
      showNotification("Реагент успешно добавлен", "success");
      this.closeModal("add-reagent-modal");
      await this.loadReagentsList();
      document.getElementById("add-reagent-form").reset();
    } catch (error) {
      showNotification("Ошибка при добавлении реагента", "error");
    }
  }

  async editReagent(id) {
    try {
      const reagent = await RocheAPI.getReagentById(id);
      document.getElementById("edit-reagent-id").value = reagent.id;
      document.getElementById("edit-reagent-code").value = reagent.code;
      document.getElementById("edit-reagent-name").value = reagent.name;
      document.getElementById("edit-reagent-short-name").value =
        reagent.short_name;
      document.getElementById("edit-reagent-category").value = reagent.category;
      document.getElementById("edit-reagent-description").value =
        reagent.description || "";
      this.showModal("edit-reagent-modal");
    } catch (error) {
      showNotification("Ошибка загрузки данных", "error");
    }
  }

  async updateReagent(e) {
    e.preventDefault();
    const id = document.getElementById("edit-reagent-id").value;
    const formData = {
      code: document.getElementById("edit-reagent-code").value,
      name: document.getElementById("edit-reagent-name").value,
      short_name: document.getElementById("edit-reagent-short-name").value,
      category: document.getElementById("edit-reagent-category").value,
      description:
        document.getElementById("edit-reagent-description").value || "",
    };
    try {
      await RocheAPI.updateReagent(id, formData);
      showNotification("Реагент обновлен", "success");
      this.closeModal("edit-reagent-modal");
      await this.loadReagentsList();
    } catch (error) {
      showNotification("Ошибка при обновлении", "error");
    }
  }

  async deleteReagent(id) {
    if (!confirm("Вы уверены, что хотите удалить этот реагент?")) return;
    try {
      await RocheAPI.deleteReagent(id);
      showNotification("Реагент удален", "success");
      await this.loadReagentsList();
    } catch (error) {
      showNotification("Ошибка при удалении", "error");
    }
  }

  showAddToModule(reagentId, reagentCode) {
    document.getElementById("add-reagent-id").value = reagentId;
    document.getElementById("add-reagent-name").value = reagentCode;
    this.loadModulesForSelect();
    this.showModal("add-to-module-modal");
  }

  async addReagentToModule(e) {
    if (e) e.preventDefault();
    const reagentId = document.getElementById("add-reagent-id")?.value;
    const moduleId = document.getElementById("module-select")?.value;
    const channel = document.querySelector(
      'input[name="channel"]:checked',
    )?.value;
    if (!moduleId) {
      showNotification("Выберите модуль", "error");
      return;
    }
    if (!reagentId) {
      showNotification("ID реагента не найден", "error");
      return;
    }
    try {
      await RocheAPI.addReagentToModule(
        moduleId,
        reagentId,
        channel === "" ? null : channel,
      );
      showNotification("Реагент добавлен в модуль", "success");
      this.closeModal("add-to-module-modal");
      await renderRocheModules();
      if (
        document.querySelector(".tab-btn.active")?.dataset.tab === "assignments"
      )
        await this.loadAssignments();
    } catch (error) {
      showNotification(error.message || "Ошибка при добавлении", "error");
    }
  }

  async loadAssignments() {
    try {
      const assignments = await RocheAPI.getAllModuleReagents();
      this.renderAssignmentsTable(assignments);
    } catch (error) {
      console.error("Ошибка загрузки назначений:", error);
    }
  }

  renderAssignmentsTable(assignments) {
    const tbody = document.querySelector("#assignments-table tbody");
    if (!tbody) return;
    if (!assignments.length) {
      tbody.innerHTML = '<tr><td colspan="5">Нет назначений</td></tr>';
      return;
    }
    tbody.innerHTML = assignments
      .map(
        (assignment) => `
      <tr>
        <td>Модуль ${assignment.module?.module_number || "?"}: ${Utils.escapeHtml(assignment.module?.name || "?")}</td>
        <td>${Utils.escapeHtml(assignment.reagent?.name || "?")} (${Utils.escapeHtml(assignment.reagent?.code || "?")})</td>
        <td>${assignment.channel === "BOTH" ? "CH1+CH2" : assignment.channel || "—"}</td>
        <td>${assignment.is_active ? "✅ Активен" : "❌ Неактивен"}</td>
        <td><button onclick="reagentCRUD.deleteAssignment(${assignment.id})" class="btn-delete"><i class="fas fa-trash"></i></button></td>
      </tr>
    `,
      )
      .join("");
  }

  async deleteAssignment(id) {
    if (!confirm("Удалить реагент из модуля?")) return;
    try {
      await RocheAPI.deleteModuleReagent(id);
      showNotification("Реагент удален из модуля", "success");
      await this.loadAssignments();
      await renderRocheModules();
    } catch (error) {
      showNotification("Ошибка при удалении", "error");
    }
  }
}
