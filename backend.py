#!/usr/bin/env python3
import time
import pyperclip
import json
import sys
from printer import PrintManager


class PrintMonitor:
    def __init__(self):
        self.print_manager = PrintManager()
        self.last_text = ""
        print(f"🎯 Принтер: {self.print_manager.get_default_printer()}")
        print("🔄 Мониторинг буфера обмена...")

    def process_json_data(self, data):
        """Обработка JSON данных"""
        try:
            if not isinstance(data, dict):
                print(f"⚠️ Получен не словарь: {type(data)}")
                return False

            # Проверяем наличие ключа 'material'
            if 'material' in data:
                material = data['material']

                if material in ["Слюна", "Дубли"]:
                    zpl = self.print_manager.create_text_zpl(text=material)
                    self.print_manager.print_barcode(zpl)
                    print(f"✅ Напечатана метка {material}")
                    return True

                elif material == "Архив" and 'number' in data:
                    archive_number = data['number']
                    zpl = self.print_manager.create_virtual_arhive(
                        archive_number)
                    self.print_manager.print_barcode(zpl)
                    print(f"✅ Напечатан архив: {archive_number}")
                    return True
                elif material == "Аликвоты":
                    zpl = self.print_manager.create_alicvot(name=data['name'],
                                                            lot=data['lot'],
                                                            volume=data['volume'])
                    self.print_manager.print_barcode(
                        zpl=zpl, retry=data['count'])

            # Обработка обычных номеров с режимами
            elif 'number' in data and len(data['number']) == 10:
                number = data.get('number')
                mode = data.get('mode', 'default')

                zpl = self.print_manager.create_barcode(number, mode)

                # Печатаем
                success = self.print_manager.print_barcode(zpl, mode)

                if success:
                    print(f"✅ Напечатано: {number} ({mode})")
                else:
                    print(f"❌ Ошибка печати: {number}")

                return success

            else:
                print(f"⚠️ Неизвестный формат JSON: {data}")
                return False

        except Exception as e:
            print(f"❌ Ошибка обработки JSON: {e}")
            return False

    def process_text_data(self, text):
        """Обработка текстовых данных"""
        if text == "Очистить очередь":
            self.print_manager.clear_print_queue()
            print("✅ Очередь очищена")
            return True
        elif text == "Статус":
            self.print_manager.check_printer_status()
            return True
        else:
            print(f"⚠️ Неизвестная текстовая команда: {text}")
            return False

    def run(self):
        """Основной цикл мониторинга"""
        try:
            while True:
                try:
                    current_text = pyperclip.paste().strip()

                    if current_text and current_text != self.last_text:
                        print(
                            f"\n📋 Получено из буфера: {current_text[:100]}...")

                        # Пробуем распарсить как JSON
                        try:
                            data = json.loads(current_text)
                            self.process_json_data(data)

                        except json.JSONDecodeError:
                            # Если не JSON, обрабатываем как текст
                            self.process_text_data(current_text)

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
