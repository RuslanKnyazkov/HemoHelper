# run.py
import os
import sys
import django
from django.core.management import call_command, execute_from_command_line


def main():
    # Определяем путь к данным (важно для PyInstaller)
    if hasattr(sys, '_MEIPASS'):
        base_path = sys._MEIPASS
    else:
        base_path = os.path.dirname(__file__)

    # Настройки Django
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "WebApp.settings")

    # Инициализация
    django.setup()

    # Применяем миграции при первом запуске
    call_command("migrate", interactive=False)

    # Запускаем сервер
    execute_from_command_line(
        [sys.argv[0], "runserver", "--noreload", "127.0.0.1:8000"])


if __name__ == "__main__":
    main()
