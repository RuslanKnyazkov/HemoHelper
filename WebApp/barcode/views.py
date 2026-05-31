# barcode/views.py
from django.http import JsonResponse
import json
from .utilite import PrintMonitor
from django.views.decorators.csrf import csrf_exempt
from utility.controller import PcController
from .models import CustomLabel
from django.views.generic import CreateView
from .forms import LabelCreateForm
from django.urls import reverse_lazy
from printer import get_printer  # ← ИСПРАВЛЕНО: импорт из printer
import logging

logger = logging.getLogger(__name__)


def enum_local_printers():
    """Получает список локальных принтеров"""
    from printer import get_printer

    printer_instance = get_printer()

    # Если это WindowsPrinter, используем win32print
    if hasattr(printer_instance, 'win32print'):
        try:
            printers = printer_instance.win32print.EnumPrinters(
                printer_instance.win32print.PRINTER_ENUM_LOCAL |
                printer_instance.win32print.PRINTER_ENUM_CONNECTIONS
            )
            printer_names = [printer[2] for printer in printers]
            return sorted(printer_names)
        except Exception as e:
            logger.error(f"❌ Ошибка при получении принтеров: {e}")
            return []

    # Для других ОС возвращаем принтер по умолчанию
    default = printer_instance.get_default_printer()
    return [default] if default else []


def get_printers(request):
    """API: возвращает список доступных принтеров"""
    from printer import get_printer

    printer_instance = get_printer()

    return JsonResponse({
        'success': True,
        'printers': enum_local_printers(),
        'default': printer_instance.get_default_printer(),
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
            return JsonResponse({'e': str(e)})


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
