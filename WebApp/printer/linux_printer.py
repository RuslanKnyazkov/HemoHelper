# printer/linux_printer.py
import subprocess
import tempfile
import os
import json
from utility.logging import logger
from .base import BasePrinter


class LinuxPrinter(BasePrinter):
    """Реализация для Linux через CUPS (lp command)"""

    def __init__(self):
        self._check_cups()

    def _check_cups(self):
        """Проверка наличия CUPS"""
        try:
            result = subprocess.run(
                ['which', 'lp'], capture_output=True, text=True)
            if result.returncode != 0:
                logger.warning(
                    "⚠️ Команда 'lp' не найдена. Установите CUPS: sudo apt install cups")
        except Exception:
            pass

    def get_default_printer(self) -> str:
        """Получение принтера по умолчанию"""
        # Из конфига
        config_printer = self._get_printer_from_config()
        if config_printer:
            return config_printer

        # Из системы через lpstat
        try:
            result = subprocess.run(
                ['lpstat', '-d'],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0 and result.stdout:
                # Парсим строку типа: "system default destination: PrinterName"
                for line in result.stdout.split('\n'):
                    if 'system default destination:' in line:
                        printer = line.split(':')[-1].strip()
                        if printer:
                            return printer
        except Exception as e:
            logger.error(f"Ошибка получения принтера по умолчанию: {e}")

        return None

    def _get_printer_from_config(self) -> str:
        """Чтение конфига принтера"""
        config_paths = [
            "printer_config.json",
            os.path.join(os.path.dirname(__file__),
                         "..", "printer_config.json"),
            "/etc/lab/printer_config.json"
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

        logger.info(f"🖨️ Печать на Linux принтере: {current_printer}")

        for attempt in range(retry):
            try:
                # Создаём временный файл с ZPL
                with tempfile.NamedTemporaryFile(mode='w', suffix='.zpl', delete=False) as tmp:
                    tmp.write(zpl.strip())
                    tmp_path = tmp.name

                # Отправляем на печать через lp с raw-режимом
                result = subprocess.run(
                    ['lp', '-d', current_printer, '-o', 'raw', tmp_path],
                    capture_output=True,
                    text=True,
                    timeout=30
                )

                # Удаляем временный файл
                os.unlink(tmp_path)

                if result.returncode == 0:
                    logger.info(f"✅ Печать успешна (попытка {attempt + 1})")
                    return True
                else:
                    logger.error(f"❌ Ошибка lp: {result.stderr}")

            except subprocess.TimeoutExpired:
                logger.error(f"❌ Таймаут печати (попытка {attempt + 1})")
            except Exception as e:
                logger.error(f"❌ Ошибка печати (попытка {attempt + 1}): {e}")

            if attempt == retry - 1:
                return False

        return False
