# printer/network_printer.py
import socket
import json
import os
from utility.logging import logger
from .base import BasePrinter


class NetworkPrinter(BasePrinter):
    """Универсальная сетевая печать через TCP сокет (работает везде)"""

    def __init__(self, default_ip: str = None, default_port: int = 9100):
        self.default_ip = default_ip
        self.default_port = default_port

    def get_default_printer(self) -> str:
        """Для сетевого принтера возвращает IP:PORT"""
        config_printer = self._get_printer_from_config()

        if config_printer:
            # Конфиг может содержать IP или имя
            if ':' in config_printer:
                return config_printer
            elif '.' in config_printer:  # похоже на IP
                return f"{config_printer}:{self.default_port}"
            else:
                return config_printer

        if self.default_ip:
            return f"{self.default_ip}:{self.default_port}"

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
                        return printer.get('printer-ip') or printer.get('printer-name')
            except (FileNotFoundError, json.JSONDecodeError, KeyError):
                continue

        return None

    def print_zpl(self, zpl: str, printer_name: str = None, retry: int = 1) -> bool:
        if isinstance(retry, str):
            retry = int(retry)

        current_printer = printer_name or self.get_default_printer()

        if not current_printer:
            logger.error("❌ Принтер не выбран (укажите IP или имя в конфиге)")
            return False

        # Парсим IP и порт
        if ':' in current_printer:
            ip, port = current_printer.split(':')
            port = int(port)
        else:
            ip = current_printer
            port = 9100  # стандартный порт для Zebra RAW печати

        logger.info(f"🖨️ Сетевая печать на {ip}:{port}")

        for attempt in range(retry):
            try:
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                    sock.settimeout(15)
                    sock.connect((ip, port))
                    sock.sendall(zpl.strip().encode('utf-8'))

                logger.info(
                    f"✅ Сетевая печать успешна (попытка {attempt + 1})")
                return True

            except socket.timeout:
                logger.error(
                    f"❌ Таймаут подключения к {ip}:{port} (попытка {attempt + 1})")
            except ConnectionRefusedError:
                logger.error(
                    f"❌ Соединение отклонено {ip}:{port} (попытка {attempt + 1})")
            except Exception as e:
                logger.error(
                    f"❌ Ошибка сетевой печати (попытка {attempt + 1}): {e}")

            if attempt == retry - 1:
                return False

        return False
