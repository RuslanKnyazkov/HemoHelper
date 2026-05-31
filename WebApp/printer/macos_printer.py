# printer/macos_printer.py
import subprocess
import tempfile
import os
import json
from utility.logging import logger
from .base import BasePrinter


class MacOSPrinter(BasePrinter):
    """Реализация для macOS через lp (как в Linux)"""

    def get_default_printer(self) -> str:
        """Получение принтера по умолчанию"""
        config_printer = self._get_printer_from_config()
        if config_printer:
            return config_printer

        try:
            result = subprocess.run(
                ['lpstat', '-d'],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0 and result.stdout:
                for line in result.stdout.split('\n'):
                    if 'system default destination:' in line:
                        printer = line.split(':')[-1].strip()
                        if printer:
                            return printer
        except Exception as e:
            logger.error(f"Ошибка получения принтера: {e}")

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

        logger.info(f"🖨️ Печать на macOS принтере: {current_printer}")

        for attempt in range(retry):
            try:
                with tempfile.NamedTemporaryFile(mode='w', suffix='.zpl', delete=False) as tmp:
                    tmp.write(zpl.strip())
                    tmp_path = tmp.name

                result = subprocess.run(
                    ['lp', '-d', current_printer, '-o', 'raw', tmp_path],
                    capture_output=True,
                    text=True,
                    timeout=30
                )

                os.unlink(tmp_path)

                if result.returncode == 0:
                    logger.info(f"✅ Печать успешна (попытка {attempt + 1})")
                    return True
                else:
                    logger.error(f"❌ Ошибка lp: {result.stderr}")

            except Exception as e:
                logger.error(f"❌ Ошибка печати (попытка {attempt + 1}): {e}")

            if attempt == retry - 1:
                return False

        return False
