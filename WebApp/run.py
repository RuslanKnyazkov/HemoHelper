# run.py
import os
import sys

def main():
    # Определяем путь к данным
    if getattr(sys, 'frozen', False):
        base_path = sys._MEIPASS
    else:
        base_path = os.path.dirname(__file__)

    # Добавляем пути для импорта Django
    sys.path.insert(0, base_path)
    
    # Настройки Django
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "WebApp.settings")
    
    # Импортируем Django только после настройки путей
    import django
    from django.core.management import call_command, execute_from_command_line
    
    django.setup()
    
    # Применяем миграции
    call_command("migrate", interactive=False)
    
    # Запускаем сервер
    execute_from_command_line(["run.py", "runserver", "--noreload", "127.0.0.1:8000"])

if __name__ == "__main__":
    main()