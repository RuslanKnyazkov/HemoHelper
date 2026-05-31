# printer/base.py
from abc import ABC, abstractmethod
from utility.logging import logger


class BasePrinter(ABC):
    """Абстрактный класс для всех типов принтеров"""

    @abstractmethod
    def print_zpl(self, zpl: str, printer_name: str = None, retry: int = 1) -> bool:
        """Печать ZPL кода"""
        pass

    @abstractmethod
    def get_default_printer(self) -> str:
        """Получение принтера по умолчанию"""
        pass


class PrinterFactory:
    """Фабрика для создания принтера в зависимости от ОС"""

    @staticmethod
    def create_printer():
        import platform

        system = platform.system()

        if system == 'Windows':
            from .windows_printer import WindowsPrinter
            return WindowsPrinter()
        elif system == 'Linux':
            from .linux_printer import LinuxPrinter
            return LinuxPrinter()
        elif system == 'Darwin':  # macOS
            from .macos_printer import MacOSPrinter
            return MacOSPrinter()
        else:
            # Fallback - сетевая печать через сокет
            from .network_printer import NetworkPrinter
            logger.warning(
                f"Неизвестная ОС: {system}, использую NetworkPrinter")
            return NetworkPrinter()
