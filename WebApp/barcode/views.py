from django.http import JsonResponse
import json
from .printer import PrintManager
from .utilite import PrintMonitor
from django.views.decorators.csrf import csrf_exempt
from utility.controller import PcController
from .models import CustomLabel
from django.views.generic import CreateView
from .forms import LabelCreateForm
from django.urls import reverse_lazy
from django.shortcuts import render
import win32print
import logging

logger = logging.getLogger(__name__)


def enum_local_printers():
    """Получает список локальных принтеров через win32print"""

    # if PrintManager.get_default_printer():
    # return [PrintManager.get_default_printer()]
    # else:
    try:
        # Получаем все принтеры
        printers = win32print.EnumPrinters(
            win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS
        )
        # Извлекаем имена
        printer_names = [printer[2]
                         # [2] — это имя принтера
                         for printer in printers]
        return sorted(printer_names)  # Сортируем по алфавиту
    except Exception as e:
        logger.error(f"❌ Ошибка при получении принтеров: {e}")
        return []


def get_printers(request):
    """API: возвращает список доступных принтеров (реальные из Windows)"""

    return JsonResponse({
        'success': True,
        'printers': enum_local_printers(),
        'default': PrintManager.get_default_printer(),
    })


def set_default_printer(request):
    if request.method == 'POST':
        try:
            if request.content_type == 'application/json':
                data = json.loads(request.body)
                if 'printer' in data or 'printer_name' in data:
                    printer_name = data.get(
                        'printer') or data.get('printer_name')
                    printer_setting = {'printer-name': printer_name}

                    with open("printer_config.json", 'w', encoding='utf-8') as f:
                        json.dump(printer_setting, f,
                                  ensure_ascii=False, indent=2)

                    return JsonResponse({'success': True, 'printer': printer_name})
                else:
                    return JsonResponse({'success': False, 'error': 'Ключ "printer" не найден'}, status=400)
            else:
                return JsonResponse({'success': False, 'error': 'Неверный Content-Type'}, status=400)
        except json.JSONDecodeError as e:
            return JsonResponse({'success': False, 'error': f'Ошибка JSON: {str(e)}'}, status=400)
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)
    else:
        return JsonResponse({'success': False, 'error': 'Метод не разрешен'}, status=405)


@csrf_exempt
def save_barcode(request):
    """Обработка сохранения баркода и печати"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)

            from .utilite import PrintMonitor
            monitor = PrintMonitor()
            result = monitor.process_json_data(data)

            return result

        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)

    return JsonResponse({'success': False, 'error': 'Invalid method'}, status=405)


mouse_state = PcController()


@csrf_exempt
def turn_state_mouse(request):
    if request.method == "POST":
        try:

            if request.content_type == 'application/json':
                state = json.loads(request.body)

                mouse_state.state = state['state']

                mouse_state.prevent_sleep()
                return JsonResponse({'status': f"{state}"})
        except Exception as e:
            return JsonResponse({'e': e})


def get_custom_labels(request):
    if request.method == "GET":
        custom_labels = CustomLabel.objects.all()
        user_list = [i.get_text_params_labels() for i in custom_labels]
        return JsonResponse({'data': user_list})


class CreateCustomLabels(CreateView):
    model = CustomLabel
    form_class = LabelCreateForm
    template_name = 'labels-forms.html'
    success_url = reverse_lazy('barcode')

    def form_valid(self, form):
        form.save()
        return super().form_valid(form)
