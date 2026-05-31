# barcode/utilite.py
from django.http import JsonResponse
from utility.logging import logger
from printer import get_printer  # ← ИСПРАВЛЕНО: импорт из printer, а не из .
from .zpl_generator import ZplGenerator  # нужно создать этот файл


class PrintMonitor:
    def __init__(self):
        # Получаем кроссплатформенный принтер
        self.printer = get_printer()
        self.zpl_generator = ZplGenerator
        logger.info(
            f"🎯 Принтер по умолчанию: {self.printer.get_default_printer()}")
        logger.info(f"🖥️ Платформа: {self._get_platform()}")

    def _get_platform(self):
        import platform
        return platform.system()

    def process_json_data(self, data):
        """Обработка JSON данных с поддержкой внешнего принтера"""
        logger.info(f"🔄 Получены данные: {data}")

        try:
            if 'type' not in data:
                return JsonResponse({
                    'success': False,
                    'error': 'Отсутствует поле "type"'
                }, status=400)

            printer_name = data.get('printer')
            type_label = data.get('type')

            # --- Тип: text ---
            if type_label == 'text':
                text = data.get('text', '')
                if not text:
                    return JsonResponse({'success': False, 'error': 'Нет текста'}, status=400)

                zpl_code = self.zpl_generator.create_simple_text_zpl(**data)
                success = self.printer.print_zpl(
                    zpl=zpl_code,
                    printer_name=printer_name
                )

                return JsonResponse({
                    'success': True,
                    'message': 'Текст напечатан',
                    'printer': printer_name or self.printer.get_default_printer()
                } if success else {
                    'success': False,
                    'error': 'Ошибка печати'
                })

            # --- Тип: barcode ---
            elif type_label == 'barcode':
                barcode = data.get('barcode', '')
                if not barcode:
                    return JsonResponse({'success': False, 'error': 'Нет штрих-кода'}, status=400)

                retry = int(data.get('retry', 1))
                zpl_code = self.zpl_generator.create_simple_text_zpl(**data)
                success = self.printer.print_zpl(
                    zpl=zpl_code,
                    printer_name=printer_name,
                    retry=retry
                )

                return JsonResponse({
                    'success': True,
                    'message': f'Штрихкод "{barcode}" отправлен на печать',
                    'printer': printer_name or self.printer.get_default_printer()
                } if success else {
                    'success': False,
                    'error': 'Ошибка печати штрих-кода'
                })

            # --- Тип: aliquote ---
            elif type_label == "aliquote":
                levels = data.get("levels", [])
                for level in levels:
                    zpl_code = self.zpl_generator.create_simple_text_zpl(
                        text=level.get('text', ''),
                        date=True,
                        lot=level.get('lot')
                    )
                    self.printer.print_zpl(
                        zpl=zpl_code,
                        printer_name=printer_name,
                        retry=level.get('retry', 1)
                    )
                return JsonResponse({'success': True, 'message': 'Пакетная печать завершена'})

            # --- Тип: serial ---
            elif type_label == "serial":
                ranges = data.get('retry')
                text = data.get('text', '')

                if ranges and '-' in str(ranges):
                    try:
                        start, end = map(int, ranges.split('-'))
                        for i in range(start, end + 1):
                            zpl_code = self.zpl_generator.create_simple_text_zpl(
                                text=f'{text}\n{i}',
                                **{k: v for k, v in data.items() if k not in ['type', 'retry', 'text']}
                            )
                            self.printer.print_zpl(
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
