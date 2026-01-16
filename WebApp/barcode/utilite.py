from django.http import JsonResponse


class PrintMonitor:
    def __init__(self):
        from .printer import PrintManager, ZplGenerator
        self.print_manager = PrintManager()
        self.zpl_generator = ZplGenerator
        print(f"🎯 Принтер: {self.print_manager.get_default_printer()}")

    def process_json_data(self, data):
        """Обработка JSON данных"""
        print(f"🔄 Обработка данных: {data}")

        try:
            if 'type' not in data:
                return JsonResponse({
                    'success': False,
                    'error': 'Отсутствует поле "type" в данных'
                }, status=400)

            type_label = data.get('type')

            if type_label == 'text':
                text = data.get('text', '')
                if not text:
                    return JsonResponse({
                        'success': False,
                        'error': 'Отсутствует текст для печати'
                    }, status=400)

                zpl_code = self.zpl_generator.create_simple_text_zpl(**data)
                success = self.print_manager.print_barcode(zpl_code)

                if success:
                    return JsonResponse({
                        'success': True,
                        'message': 'Текст отправлен на печать'
                    })
                else:
                    return JsonResponse({
                        'success': False,
                        'error': 'Ошибка при печати текста'
                    }, status=500)

            elif type_label == 'barcode':
                # Обработка штрихкода
                barcode = data.get('barcode', '')
                if not barcode:
                    return JsonResponse({
                        'success': False,
                        'error': 'Отсутствует штрихкод'
                    }, status=400)

                # Получаем параметры
                mode = data.get('mode', 'standard')
                count_retries = data.get('retry', 1)

                print(f"🖨️ Печать штрихкода: {barcode}, режим: {mode}")

                # Генерируем ZPL код
                zpl_code = self.zpl_generator.create_simple_text_zpl(**data)

                # Печатаем
                success = self.print_manager.print_barcode(
                    zpl_code,
                    mode=mode,
                    retry=count_retries
                )

                if success:
                    return JsonResponse({
                        'success': True,
                        'message': f'Штрихкод "{barcode}" отправлен на печать',
                        'barcode': barcode,
                        'mode': mode
                    })
                else:
                    return JsonResponse({
                        'success': False,
                        'error': 'Ошибка при печати штрихкода'
                    }, status=500)
            elif type_label == "aliquote":
                names = data.pop("text")
                retry = data.pop("count")
                for name in names:
                    zpl_code = self.zpl_generator.create_simple_text_zpl(
                        text=name, **data)

                    self.print_manager.print_barcode(
                        zpl=zpl_code, retry=int(retry))

            else:
                return JsonResponse({
                    'success': False,
                    'error': f'Неизвестный тип: {type_label}'
                }, status=400)

        except Exception as e:
            print(f"❌ Ошибка в process_json_data: {e}")
            import traceback
            traceback.print_exc()
            return JsonResponse({
                'success': False,
                'error': f'Ошибка обработки: {str(e)}'
            }, status=500)
