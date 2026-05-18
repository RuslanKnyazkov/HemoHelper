from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.paginator import Paginator
import json
from .models import AliquotTemplate, AliquotLevel, TemplateLevel, AliquotHistory
from .forms import AliquotTemplateForm, AliquotLevelForm, TemplateLevelForm


def aliquot_list(request):
    """Список шаблонов аликвот"""
    templates = AliquotTemplate.objects.all()
    levels = AliquotLevel.objects.all()

    context = {
        'templates': templates,
        'levels': levels,
    }
    return render(request, 'list.html', context)


# ========== УРОВНИ АЛИКВОТ ==========

def level_create(request):
    """Создание уровня аликвоты"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            level = AliquotLevel.objects.create(
                name=data['name'],
                lot_number=data['lot_number'],
                volume=data['volume'],
                order=data.get('order', 0)
            )
            return JsonResponse({'success': True, 'level': {
                'id': level.id,
                'name': level.name,
                'lot_number': level.lot_number,
                'volume': level.volume,
                'order': level.order,
            }})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)

    return JsonResponse({'success': False, 'error': 'Метод не разрешен'}, status=405)


def level_edit(request, pk):
    """Редактирование уровня аликвоты"""
    level = get_object_or_404(AliquotLevel, pk=pk)

    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            level.name = data.get('name', level.name)
            level.lot_number = data.get('lot_number', level.lot_number)
            level.volume = data.get('volume', level.volume)
            level.order = data.get('order', level.order)
            level.save()
            return JsonResponse({'success': True, 'level': {
                'id': level.id,
                'name': level.name,
                'lot_number': level.lot_number,
                'volume': level.volume,
                'order': level.order,
            }})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)

    return JsonResponse({'success': False, 'error': 'Метод не разрешен'}, status=405)


@require_http_methods(["DELETE"])
def level_delete(request, pk):
    """Удаление уровня аликвоты"""
    level = get_object_or_404(AliquotLevel, pk=pk)
    level.delete()
    return JsonResponse({'success': True})


def level_get(request, pk):
    """Получение уровня аликвоты"""
    level = get_object_or_404(AliquotLevel, pk=pk)
    return JsonResponse({
        'success': True,
        'level': {
            'id': level.id,
            'name': level.name,
            'lot_number': level.lot_number,
            'volume': level.volume,
            'order': level.order,
        }
    })


def level_list(request):
    """Список всех уровней"""
    levels = AliquotLevel.objects.all()
    return JsonResponse({
        'success': True,
        'levels': [{
            'id': l.id,
            'name': l.name,
            'lot_number': l.lot_number,
            'volume': l.volume,
            'order': l.order,
        } for l in levels]
    })


# ========== ШАБЛОНЫ АЛИКВОТ ==========

def template_create(request):
    """Создание шаблона аликвоты"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            template = AliquotTemplate.objects.create(
                name=data['name'],
                description=data.get('description', '')
            )
            # Добавляем уровни в шаблон
            for level_data in data.get('levels', []):
                level = AliquotLevel.objects.get(id=level_data['level_id'])
                TemplateLevel.objects.create(
                    template=template,
                    level=level,
                    count=level_data.get('count', 1)
                )
            return JsonResponse({'success': True, 'template_id': template.id})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)

    return JsonResponse({'success': False, 'error': 'Метод не разрешен'}, status=405)


def template_edit(request, pk):
    """Редактирование шаблона аликвоты"""
    template = get_object_or_404(AliquotTemplate, pk=pk)

    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            template.name = data.get('name', template.name)
            template.description = data.get(
                'description', template.description)
            template.save()

            # Обновляем уровни
            TemplateLevel.objects.filter(template=template).delete()
            for level_data in data.get('levels', []):
                level = AliquotLevel.objects.get(id=level_data['level_id'])
                TemplateLevel.objects.create(
                    template=template,
                    level=level,
                    count=level_data.get('count', 1)
                )
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)

    return JsonResponse({'success': False, 'error': 'Метод не разрешен'}, status=405)


def template_get(request, pk):
    """Получение шаблона аликвоты"""
    template = get_object_or_404(AliquotTemplate, pk=pk)
    levels = template.templatelevel_set.all().select_related('level')
    return JsonResponse({
        'success': True,
        'template': {
            'id': template.id,
            'name': template.name,
            'description': template.description,
            'levels': [{
                'level_id': tl.level.id,
                'level_name': tl.level.name,
                'lot_number': tl.level.lot_number,
                'volume': tl.level.volume,
                'count': tl.count,
            } for tl in levels]
        }
    })


@require_http_methods(["DELETE"])
def template_delete(request, pk):
    """Удаление шаблона аликвоты"""
    template = get_object_or_404(AliquotTemplate, pk=pk)
    template.delete()
    return JsonResponse({'success': True})


def template_list(request):
    """Список шаблонов аликвот"""
    templates = AliquotTemplate.objects.all()
    return JsonResponse({
        'success': True,
        'templates': [{
            'id': t.id,
            'name': t.name,
            'description': t.description,
            'created_at': t.created_at.strftime('%d.%m.%Y %H:%M'),
        } for t in templates]
    })


# ========== ПЕЧАТЬ АЛИКВОТ ==========

@csrf_exempt
def aliquot_print(request):
    """Печать аликвоты по шаблону"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            template_id = data.get('template_id')
            template = get_object_or_404(AliquotTemplate, pk=template_id)

            # Сохраняем историю
            history = AliquotHistory.objects.create(
                template=template,
                levels_data=data.get('levels', {}),
                printed_by=data.get('printed_by', '')
            )

            # Формируем данные для печати
            levels_for_print = []
            for tl in template.templatelevel_set.all().select_related('level'):
                for i in range(tl.count):
                    levels_for_print.append({
                        'text': f"{tl.level.name} {i+1}" if tl.count > 1 else tl.level.name,
                        'lot': tl.level.lot_number,
                        'volume': tl.level.volume,
                        'retry': tl.count,

                    })

            # Отправляем на печать через ваш PrintMonitor
            from barcode.utilite import PrintMonitor
            monitor = PrintMonitor()

            print_data = {
                'type': 'aliquote',
                'template_name': template.name,
                'levels': levels_for_print,
                'history_id': history.id,
            }

            result = monitor.process_json_data(print_data)

            return JsonResponse({
                'success': True,
                'message': f'Аликвоты по шаблону "{template.name}" отправлены на печать',
                'history_id': history.id
            })

        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)

    return JsonResponse({'success': False, 'error': 'Метод не разрешен'}, status=405)


def history_list(request):
    """История печати аликвот"""
    history = AliquotHistory.objects.all()
    paginator = Paginator(history, 20)
    page = request.GET.get('page', 1)
    page_obj = paginator.get_page(page)

    return JsonResponse({
        'success': True,
        'history': [{
            'id': h.id,
            'template_name': h.template.name if h.template else 'Удаленный шаблон',
            'printed_at': h.printed_at.strftime('%d.%m.%Y %H:%M:%S'),
            'printed_by': h.printed_by,
        } for h in page_obj],
        'has_next': page_obj.has_next(),
        'has_prev': page_obj.has_previous(),
        'page': page_obj.number,
        'total_pages': paginator.num_pages,
    })
