from django.http import JsonResponse
import json
from .utilite import PrintMonitor
from django.views.decorators.csrf import csrf_exempt
from utility.controller import PcController
from .models import CustomLabel
from django.views.generic import CreateView
from .forms import LabelCreateForm
from django.urls import reverse_lazy
from django.shortcuts import render
import win32print


def enum_local_printers():
    """Получает список локальных принтеров через win32print"""
    try:
        # Получаем все принтеры
        printers = win32print.EnumPrinters(
            win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS
        )
        # Извлекаем имена
        printer_names = [printer[2]
                         for printer in printers]  # [2] — это имя принтера
        return sorted(printer_names)  # Сортируем по алфавиту
    except Exception as e:
        print(f"❌ Ошибка при получении принтеров: {e}")
        return []


def get_printers(request):
    """API: возвращает список доступных принтеров (реальные из Windows)"""

    return JsonResponse({
        'success': True,
        'printers': enum_local_printers(),
        'default': win32print.GetDefaultPrinter(),
    })


@csrf_exempt
def save_barcode(request):
    """Обработка сохранения баркода и печати"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)

            # ← Вот здесь мы получаем выбранный принтер!
            printer_name = data.get('printer_name')  # Это ключевой момент

            # Передаём в PrintMonitor
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
    success_url = reverse_lazy('home')

    def form_valid(self, form):
        form.save()
        return super().form_valid(form)
