# run.py (лежит в WebApp/)
import os
import sys
import django
from django.core.management import call_command, execute_from_command_line


def main():
    if hasattr(sys, '_MEIPASS'):
        base_path = sys._MEIPASS
    else:
        base_path = os.path.dirname(__file__)

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "WebApp.settings")

    django.setup()
    call_command("migrate", interactive=False)

    execute_from_command_line(
        [sys.argv[0], "runserver", "--noreload", "127.0.0.1:8000"])


if __name__ == "__main__":
    main()
