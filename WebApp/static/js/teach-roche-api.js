// teach-roche-api.js - API для работы с Roche анализатором

const RocheAPI = {
  baseUrl: "/teach/api/roche/",

  getCsrfToken() {
    return Utils.getCSRFToken();
  },

  async getAllAnalyzers() {
    try {
      const response = await fetch(`${this.baseUrl}analyzer/all_analyzers/`, {
        headers: { "X-CSRFToken": this.getCsrfToken() },
      });
      if (!response.ok) throw new Error("Ошибка загрузки анализаторов");
      return await response.json();
    } catch (error) {
      console.error("API Error:", error);
      return [];
    }
  },

  async getAnalyzerById(id) {
    try {
      const response = await fetch(`${this.baseUrl}analyzer/${id}/`, {
        headers: { "X-CSRFToken": this.getCsrfToken() },
      });
      if (!response.ok) throw new Error(`Анализатор с ID ${id} не найден`);
      return await response.json();
    } catch (error) {
      console.error("API Error:", error);
      return null;
    }
  },

  async getAnalyzerModules(analyzerId) {
    try {
      const response = await fetch(
        `${this.baseUrl}analyzer/${analyzerId}/modules/`,
        { headers: { "X-CSRFToken": this.getCsrfToken() } },
      );
      if (!response.ok) throw new Error("Ошибка загрузки модулей");
      return await response.json();
    } catch (error) {
      console.error("API Error:", error);
      return [];
    }
  },

  async getModuleReagents(moduleId) {
    try {
      const response = await fetch(
        `${this.baseUrl}modules/${moduleId}/reagents/`,
        { headers: { "X-CSRFToken": this.getCsrfToken() } },
      );
      if (!response.ok) throw new Error("Ошибка загрузки реагентов");
      return await response.json();
    } catch (error) {
      console.error("API Error:", error);
      return [];
    }
  },

  async getAllReagents() {
    try {
      const response = await fetch(`${this.baseUrl}reagents/`, {
        headers: { "X-CSRFToken": this.getCsrfToken() },
      });
      if (!response.ok) throw new Error("Ошибка загрузки реагентов");
      return await response.json();
    } catch (error) {
      console.error("API Error:", error);
      return [];
    }
  },

  async createReagent(data) {
    const response = await fetch(`${this.baseUrl}reagents/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": this.getCsrfToken(),
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Ошибка создания реагента");
    return await response.json();
  },

  async updateReagent(id, data) {
    const response = await fetch(`${this.baseUrl}reagents/${id}/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": this.getCsrfToken(),
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Ошибка обновления реагента");
    return await response.json();
  },

  async deleteReagent(id) {
    const response = await fetch(`${this.baseUrl}reagents/${id}/`, {
      method: "DELETE",
      headers: { "X-CSRFToken": this.getCsrfToken() },
    });
    if (!response.ok) throw new Error("Ошибка удаления реагента");
    return await response.json();
  },

  async getAllModuleReagents() {
    try {
      const response = await fetch(`${this.baseUrl}module-reagents/`, {
        headers: { "X-CSRFToken": this.getCsrfToken() },
      });
      if (!response.ok) throw new Error("Ошибка загрузки связей");
      return await response.json();
    } catch (error) {
      console.error("API Error:", error);
      return [];
    }
  },

  async addReagentToModule(moduleId, reagentId, channel, isActive = true) {
    const response = await fetch(`${this.baseUrl}module-reagents/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": this.getCsrfToken(),
      },
      body: JSON.stringify({
        module: parseInt(moduleId),
        reagent: parseInt(reagentId),
        channel: channel === "BOTH" ? "BOTH" : channel || null,
        is_active: isActive,
      }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Ошибка добавления реагента");
    }
    return await response.json();
  },

  async deleteModuleReagent(connectionId) {
    const response = await fetch(
      `${this.baseUrl}module-reagents/${connectionId}/`,
      {
        method: "DELETE",
        headers: { "X-CSRFToken": this.getCsrfToken() },
      },
    );
    if (!response.ok) throw new Error("Ошибка удаления связи");
    return await response.json();
  },
};
