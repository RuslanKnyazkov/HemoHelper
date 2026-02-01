document.addEventListener("DOMContentLoaded", function () {
  // Переключение между разделами
  const sectionTabs = document.querySelectorAll(".section-tab");
  const sectionContents = document.querySelectorAll(".section-content");

  sectionTabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      const sectionId = this.dataset.section + "-section";

      // Убираем активный класс у всех табов
      sectionTabs.forEach((t) => t.classList.remove("active"));
      // Добавляем активный класс текущему табу
      this.classList.add("active");

      // Скрываем все разделы
      sectionContents.forEach((content) => {
        content.classList.remove("active");
        content.style.display = "none";
      });

      // Показываем выбранный раздел
      const activeSection = document.getElementById(sectionId);
      if (activeSection) {
        activeSection.classList.add("active");
        activeSection.style.display = "block";
      }
    });
  });

  // Обработка кнопок начала тренировки
  const startTestButtons = document.querySelectorAll(".start-test-btn");
  startTestButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const testType = this.dataset.test;

      // Загружаем тестовую систему с выбранным типом теста
      loadTestSystem(testType);

      // Показываем уведомление
      showNotification(
        `Запускаем тренировку: ${this.closest(".test-card").querySelector("h3").textContent}`,
        "success",
      );
    });
  });

  // Загрузка тестовой системы
  function loadTestSystem(testType) {
    // Определяем фильтр в зависимости от типа теста
    let filter = "all";

    if (testType.includes("immuno")) {
      filter = "immunochemistry";
    } else if (testType.includes("bio")) {
      filter = "biochemistry";
    } else if (testType.includes("hemo")) {
      filter = "hemostasis";
    }

    // Если существует глобальная система тестов, обновляем фильтр
    if (window.quizSystem) {
      window.quizSystem.applyFilter(filter);

      // Прокручиваем к тестовой системе
      const testModule = document.getElementById("test-module");
      if (testModule) {
        testModule.scrollIntoView({ behavior: "smooth" });
      }
    }
  }

  // Показ уведомлений
  function showNotification(message, type = "info") {
    // Удаляем старое уведомление
    const oldNotification = document.querySelector(".custom-notification");
    if (oldNotification) oldNotification.remove();

    // Создаем новое уведомление
    const notification = document.createElement("div");
    notification.className = `custom-notification notification-${type}`;
    notification.innerHTML = `
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close"><i class="fas fa-times"></i></button>
        `;

    document.body.appendChild(notification);

    // Анимация появления
    setTimeout(() => {
      notification.classList.add("show");
    }, 10);

    // Закрытие по клику
    const closeBtn = notification.querySelector(".notification-close");
    closeBtn.addEventListener("click", () => {
      notification.classList.remove("show");
      setTimeout(() => notification.remove(), 300);
    });

    // Автоматическое закрытие через 5 секунд
    setTimeout(() => {
      if (notification.parentNode) {
        notification.classList.remove("show");
        setTimeout(() => notification.remove(), 300);
      }
    }, 5000);
  }
});

async function showGuideModule(direction) {
  const guideContent = document.querySelector(".test-informer");

  try {
    // Загружаем данные
    const response = await fetch(`./guide/${direction}`);
    const data = await response.json();

    console.log("Полученные данные:", data);

    // Проверяем наличие массива list
    if (!data.list || !Array.isArray(data.list)) {
      throw new Error("Данные должны содержать массив list");
    }

    const testsList = data.list;

    // Генерируем строки таблицы из данных
    const tableRows = testsList
      .map((test) => {
        // Проверяем наличие необходимых полей
        if (!test || typeof test !== "object") {
          console.warn("Некорректный элемент:", test);
          return "";
        }

        const lines = test.lines || [];

        // Формируем бейджи для линий
        const lineBadges = lines
          .map((line) => {
            if (line && typeof line === "object" && line.code) {
              const lineCode = line.code;
              return `<span class="line-badge ${lineCode.toLowerCase()}">${lineCode}</span>`;
            }
            return "";
          })
          .join("");

        return `
      <tr>
        <td>${test.code || ""}</td>
        <td>${test.name || ""}</td>
        <td>${test.sample_type || "Не указан"}</td>
        <td>
          ${lineBadges || "Не указаны"}
        </td>
      </tr>`;
      })
      .join("");

    // Если нет данных для отображения
    if (!tableRows) {
      guideContent.innerHTML = `
      <div class="empty-message">
        <h2><i class="fas fa-info-circle"></i> Нет данных</h2>
        <p>Нет тестов для отображения в категории "${direction}"</p>
      </div>`;
      guideContent.classList.add("active");
      return;
    }

    // Вставляем сгенерированный HTML
    guideContent.innerHTML = `

    <div class="tests-table-section">
      
      
      <div class="nav-informer">
        <h2><i class="fas fa-table"></i> Справочник тестов по ${direction}</h2>
        <button class="close-btn" onclick="closeGuideModule()">x</button>
        <input class='input-field' placeholder='Поиск теста'>
        <div class="options-nav">
        <a href="/teach/create/">Добавить тест</a>
        </div>
        
      </div>
      <div class="table-responsive">
        <table class="tests-table">
          <thead>
            <tr>
              <th>Код теста</th>
              <th>Название</th>
              <th>Материал</th>
              <th>Линии</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    </div>`;

    guideContent.classList.add("active");
  } catch (error) {
    console.error("Ошибка при загрузке данных:", error);

    guideContent.innerHTML = `
    <div class="error-message">
      <h2><i class="fas fa-exclamation-triangle"></i> Ошибка загрузки данных</h2>
      <p>Не удалось загрузить данные о тестах. Попробуйте позже.</p>
      <p><small>Ошибка: ${error.message}</small></p>
    </div>`;
    guideContent.classList.add("active");
  }
}

function closeGuideModule() {
  document.querySelector(".test-informer").classList.remove("active");
}
