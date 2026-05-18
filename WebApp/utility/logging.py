# logger.py
import logging
import os
from datetime import datetime
from logging.handlers import RotatingFileHandler


class AppLogger:
    """Универсальный логгер для всего приложения"""

    _instance = None  # Singleton pattern

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, name='AppLogger', log_dir='logs', level=logging.DEBUG):
        if hasattr(self, '_initialized'):
            return
        self._initialized = True

        self.name = name
        self.log_dir = log_dir
        self.level = level

        # Создаем директорию для логов
        if not os.path.exists(log_dir):
            os.makedirs(log_dir)

        # Создаем логгер
        self.logger = logging.getLogger(name)
        self.logger.setLevel(level)

        # Убираем дублирование handlers
        if self.logger.handlers:
            self.logger.handlers.clear()

        # Формат логов
        formatter = logging.Formatter(
            '%(asctime)s | %(levelname)-8s | %(name)s | %(filename)s:%(lineno)d | %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )

        # 1. Файл для всех логов (с ротацией)
        main_handler = RotatingFileHandler(
            os.path.join(log_dir, 'app.log'),
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5,
            encoding='utf-8'
        )
        main_handler.setLevel(logging.DEBUG)
        main_handler.setFormatter(formatter)
        self.logger.addHandler(main_handler)

        # 2. Файл только для ошибок
        error_handler = RotatingFileHandler(
            os.path.join(log_dir, 'errors.log'),
            maxBytes=5*1024*1024,  # 5MB
            backupCount=3,
            encoding='utf-8'
        )
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(formatter)
        self.logger.addHandler(error_handler)

        # 3. Файл для печати (отдельный)
        print_handler = RotatingFileHandler(
            os.path.join(log_dir, 'print.log'),
            maxBytes=5*1024*1024,
            backupCount=3,
            encoding='utf-8'
        )
        print_handler.setLevel(logging.INFO)
        print_handler.setFormatter(formatter)
        self.logger.addHandler(print_handler)

        # 4. Вывод в консоль (для отладки)
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        console_handler.setFormatter(formatter)
        self.logger.addHandler(console_handler)

    # Основные методы логирования
    def debug(self, message, *args, **kwargs):
        self.logger.debug(message, *args, **kwargs)

    def info(self, message, *args, **kwargs):
        self.logger.info(message, *args, **kwargs)

    def warning(self, message, *args, **kwargs):
        self.logger.warning(message, *args, **kwargs)

    def error(self, message, *args, **kwargs):
        self.logger.error(message, *args, **kwargs)

    def critical(self, message, *args, **kwargs):
        self.logger.critical(message, *args, **kwargs)

    # Специальные методы для печати
    def print_start(self, printer_name, data=None):
        self.logger.info(
            f"🖨️ НАЧАЛО ПЕЧАТИ | Принтер: {printer_name} | Данные: {data}")

    def print_success(self, printer_name, duration_ms=None):
        msg = f"✅ ПЕЧАТЬ УСПЕШНА | Принтер: {printer_name}"
        if duration_ms:
            msg += f" | Время: {duration_ms}ms"
        self.logger.info(msg)

    def print_error(self, printer_name, error, traceback=None):
        msg = f"❌ ОШИБКА ПЕЧАТИ | Принтер: {printer_name} | Ошибка: {error}"
        self.logger.error(msg)
        if traceback:
            self.logger.error(f"Traceback: {traceback}")

    # Для API запросов
    def api_request(self, endpoint, method, data=None, ip=None):
        msg = f"📡 API ЗАПРОС | {method} {endpoint} | IP: {ip} | Данные: {data}"
        self.logger.info(msg)

    def api_response(self, endpoint, status_code, duration_ms=None):
        msg = f"📡 API ОТВЕТ | {endpoint} | Статус: {status_code}"
        if duration_ms:
            msg += f" | Время: {duration_ms}ms"
        self.logger.info(msg)

    # Контекстный менеджер для замера времени
    def time_it(self, operation_name):
        return TimerContext(self, operation_name)

# Контекстный менеджер для замера времени выполнения


class TimerContext:
    def __init__(self, logger, operation_name):
        self.logger = logger
        self.operation_name = operation_name
        self.start_time = None

    def __enter__(self):
        self.start_time = datetime.now()
        self.logger.debug(f"⏱️ НАЧАЛО: {self.operation_name}")
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        duration = (datetime.now() - self.start_time).total_seconds() * 1000
        if exc_type:
            self.logger.error(
                f"❌ ОШИБКА в {self.operation_name}: {exc_val} | Время: {duration:.2f}ms")
        else:
            self.logger.debug(
                f"✅ ЗАВЕРШЕНО: {self.operation_name} | Время: {duration:.2f}ms")


# Создаем глобальный экземпляр
logger = AppLogger()
