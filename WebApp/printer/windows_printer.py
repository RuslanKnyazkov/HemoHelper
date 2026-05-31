# printer/windows_printer.py
import json
import os
from utility.logging import logger
from .base import BasePrinter


class WindowsPrinter(BasePrinter):
    """Реализация для Windows через win32print"""

    def __init__(self):
        self._init_win32()

    def _init_win32(self):
        """Ленивая инициализация win32print"""
        try:
            import win32print
            import win32api
            self.win32print = win32print
            self.win32api = win32api
            logger.info("✅ win32print инициализирован")
        except ImportError:
            logger.error(
                "❌ win32print не установлен. Установите: pip install pywin32")
            raise

    def get_default_printer(self) -> str:
        """Получение принтера по умолчанию из конфига или системы"""
        # Сначала пробуем из конфига
        config_printer = self._get_printer_from_config()
        if config_printer:
            return config_printer

        # Затем из системы
        try:
            return self.win32print.GetDefaultPrinter()
        except Exception as e:
            logger.error(f"Ошибка получения принтера по умолчанию: {e}")
            return None

    def _get_printer_from_config(self) -> str:
        """Чтение конфига принтера"""
        config_paths = [
            "printer_config.json",
            os.path.join(os.path.dirname(__file__),
                         "..", "printer_config.json")
        ]

        for config_path in config_paths:
            try:
                if os.path.exists(config_path):
                    with open(config_path, "r") as file:
                        printer = json.load(file)
                        return printer.get('printer-name')
            except (FileNotFoundError, json.JSONDecodeError, KeyError):
                continue

        return None

    def print_zpl(self, zpl: str, printer_name: str = None, retry: int = 1) -> bool:
        if isinstance(retry, str):
            retry = int(retry)

        current_printer = printer_name or self.get_default_printer()

        if not current_printer:
            logger.error("❌ Принтер не выбран")
            return False

        logger.info(
            f"🖨️ Печать на Windows принтере: {current_printer} || Выходные данные {zpl}")

        for attempt in range(retry):
            try:
                hPrinter = self.win32print.OpenPrinter(current_printer)
                try:
                    job_info = ("Barcode Print", None, "RAW")
                    self.win32print.StartDocPrinter(hPrinter, 1, job_info)
                    self.win32print.StartPagePrinter(hPrinter)
                    self.win32print.WritePrinter(
                        hPrinter, zpl.strip().encode('utf-8'))
                    self.win32print.EndPagePrinter(hPrinter)
                    self.win32print.EndDocPrinter(hPrinter)
                finally:
                    self.win32print.ClosePrinter(hPrinter)

                logger.info(f"✅ Печать успешна (попытка {attempt + 1})")
                return True

            except Exception as e:
                logger.error(f"❌ Ошибка печати (попытка {attempt + 1}): {e}")
                if attempt == retry - 1:
                    return False

        return False
