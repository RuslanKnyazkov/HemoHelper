from django.http import JsonResponse
import json
from .utilite import PrintMonitor


def save_barcode(request):
    """Принимает штрихкод с фронтенда"""
    if request.method == 'POST':
        try:
            print(f"📨 Получен запрос на /save-barcode/")
            print(f"📦 Content-Type: {request.content_type}")
            print(f"📊 Тело запроса (сырое): {request.body}")

            # Парсим JSON данные правильно
            if request.content_type == 'application/json':
                data = json.loads(request.body)
            else:
                # Пробуем получить из POST данных
                data = request.POST.dict()
                if not data:
                    # Пробуем прочитать как raw text
                    try:
                        data = json.loads(request.body.decode('utf-8'))
                    except:
                        data = {}

            print(f"📝 Данные после парсинга: {data}")

            if not data:
                return JsonResponse({
                    'success': False,
                    'error': 'Нет данных в запросе'
                }, status=400)

            # Создаем экземпляр PrintMonitor и обрабатываем данные
            test = PrintMonitor()
            result = test.process_json_data(data)

            # Если process_json_data возвращает JsonResponse
            if isinstance(result, JsonResponse):
                return result

            # Иначе возвращаем успех
            return JsonResponse({
                'success': True,
                'message': 'Штрихкод обработан',
                'data': data
            })

        except json.JSONDecodeError as e:
            print(f"❌ Ошибка JSON: {e}")
            return JsonResponse({
                'success': False,
                'error': f'Неверный формат JSON: {str(e)}'
            }, status=400)
        except Exception as e:
            print(f"❌ Общая ошибка: {e}")
            import traceback
            traceback.print_exc()
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)

    return JsonResponse({
        'success': False,
        'error': 'Только POST запросы'
    }, status=405)
