# printer/__init__.py
from .base import BasePrinter, PrinterFactory
from .windows_printer import WindowsPrinter
from .linux_printer import LinuxPrinter
from .macos_printer import MacOSPrinter
from .network_printer import NetworkPrinter

# Создаём глобальный экземпляр принтера
_printer_instance = None


def get_printer() -> BasePrinter:
    """Получение экземпляра принтера (синглтон)"""
    global _printer_instance
    if _printer_instance is None:
        _printer_instance = PrinterFactory.create_printer()
    return _printer_instance


# Экспортируем основные классы
__all__ = [
    'BasePrinter',
    'PrinterFactory',
    'WindowsPrinter',
    'LinuxPrinter',
    'MacOSPrinter',
    'NetworkPrinter',
    'get_printer'
]
