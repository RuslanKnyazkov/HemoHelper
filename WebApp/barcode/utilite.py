# barcode/utilite.py
from django.http import JsonResponse
import logging

# Настраиваем логгер для модуля
logger = logging.getLogger(__name__)


class PrintMonitor:
    def __init__(self):
        from .printer import PrintManager, ZplGenerator
        self.print_manager = PrintManager()
        self.zpl_generator = ZplGenerator
        logger.info(f"🎯 Принтер по умолчанию: {self.print_manager.get_default_printer()}")

    def process_json_data(self, data):
        """Обработка JSON данных с поддержкой внешнего принтера"""
        logger.info(f"🔄 Получены данные: {data}")

        try:
            if 'type' not in data:
                return JsonResponse({
                    'success': False,
                    'error': 'Отсутствует поле "type"'
                }, status=400)

            printer_name = data.get('printer_name')
            type_label = data.get('type')

            # --- Тип: text ---
            if type_label == 'text':
                text = data.get('text', '')
                if not text:
                    return JsonResponse({'success': False, 'error': 'Нет текста'}, status=400)

                zpl_code = self.zpl_generator.create_simple_text_zpl(**data)
                success = self.print_manager.print_barcode(
                    zpl=zpl_code,
                    printer_name=printer_name
                )

                return JsonResponse({
                    'success': True,
                    'message': 'Текст напечатан',
                    'printer': printer_name or self.print_manager.get_default_printer()
                } if success else {
                    'success': False,
                    'error': 'Ошибка печати'
                })

            # --- Тип: barcode ---
            elif type_label == 'barcode':
                barcode = data.get('barcode', '')
                if not barcode:
                    return JsonResponse({'success': False, 'error': 'Нет штрих-кода'}, status=400)

                # ← используется при генерации ZPL
                mode = data.get('mode', False)
                retry = int(data.get('retry', 1))

                # Передаём mode в ZPL-генератор, а не в print_barcode
                zpl_code = self.zpl_generator.create_simple_text_zpl(**data)
                success = self.print_manager.print_barcode(
                    zpl=zpl_code,
                    printer_name=printer_name,
                    retry=retry  # ← только retry, без mode!
                )

                return JsonResponse({
                    'success': True,
                    'message': f'Штрихкод "{barcode}" отправлен на печать',
                    'printer': printer_name or self.print_manager.get_default_printer()
                } if success else {
                    'success': False,
                    'error': 'Ошибка печати штрих-кода'
                })

            # --- Тип: aliquote ---
            elif type_label == "aliquote":
                names = data.pop("text")
                retry = int(data.pop("count", 1))
                for name in names:
                    zpl_code = self.zpl_generator.create_simple_text_zpl(
                        text=name, **data)
                    self.print_manager.print_barcode(
                        zpl=zpl_code,
                        printer_name=printer_name,
                        retry=retry
                    )
                return JsonResponse({'success': True, 'message': 'Пакетная печать завершена'})

            # --- Тип: serial ---
            elif type_label == "serial":
                ranges = data.pop('retry')
                text = data.pop('text')
                if '-' in ranges:
                    try:
                        start, end = map(int, ranges.split('-'))
                        for i in range(start, end + 1):
                            zpl_code = self.zpl_generator.create_simple_text_zpl(
                                text=f'{text}\n{i}', **data)
                            self.print_manager.print_barcode(
                                zpl=zpl_code,
                                printer_name=printer_name
                            )
                    except Exception as e:
                        return JsonResponse({'success': False, 'error': str(e)}, status=400)
                return JsonResponse({'success': True, 'message': 'Серийная печать завершена'})

            else:
                return JsonResponse({'success': False, 'error': f'Неизвестный тип: {type_label}'}, status=400)

        except Exception as e:
            logger.exception("❌ Ошибка при обработке данных")
            return JsonResponse({'success': False, 'error': str(e)}, status=500)
