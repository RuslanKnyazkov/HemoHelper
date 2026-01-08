#!/usr/bin/env python3
import time
import pyperclip
import json
import sys
from printer import PrintManager, ZplGenerator


class PrintMonitor:
    def __init__(self):
        self.print_manager = PrintManager()
        self.last_text = ""
        print(f"🎯 Принтер: {self.print_manager.get_default_printer()}")
        print("🔄 Мониторинг буфера обмена...")

    def process_json_data(self, data):
        """Обработка JSON данных"""
        try:

            if data.pop("type"):
                self.print_manager.print_barcode(
                    ZplGenerator.create_simple_text_zpl(**data))
                return True

        except Exception as e:
            print(f"❌ Ошибка обработки JSON: {e}")
            return False

    def run(self):
        """Основной цикл мониторинга"""
        try:
            while True:
                try:
                    current_text = pyperclip.paste().strip()

                    if current_text and current_text != self.last_text:
                        print(
                            f"\n📋 Получено из буфера: {current_text}")

                        # Пробуем распарсить как JSON
                        try:
                            data = json.loads(current_text)
                            self.process_json_data(data)

                        except Exception as e:
                            print(f"❌ Ошибка парсинга: {e}")

                        self.last_text = current_text

                except KeyboardInterrupt:
                    raise
                except Exception as e:
                    print(f"⚠️ Ошибка в цикле: {e}")

                time.sleep(0.3)

        except KeyboardInterrupt:
            print("\n👋 Мониторинг остановлен")
            sys.exit(0)


if __name__ == "__main__":
    monitor = PrintMonitor()
    monitor.run()
