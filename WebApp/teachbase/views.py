# teachbase/views.py
from django.shortcuts import redirect, render, get_object_or_404
from django.views.generic import TemplateView
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core import serializers
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response

from .forms import LaboratoryTestForm
from .models import LaboratoryTest, RocheAnalyzer, RocheModule, Reagent, ModuleReagent
from .serializers import (
    RocheAnalyzerSerializer, RocheModuleSerializer,
    ReagentSerializer, ModuleReagentSerializer
)


class TeachView(TemplateView):
    template_name = 'teach.html'


@csrf_exempt
def get_guide_info(request, type_test):
    if request.method == "GET":
        guide_list = LaboratoryTest.objects.filter(
            test_type=type_test
        ).prefetch_related('analyzer_lines')

        tests_data = []
        for test in guide_list:
            test_data = {
                "id": test.id,
                "code": test.code,
                "name": test.name,
                "test_type": test.test_type,
                "sample_type": test.sample_type,
                "lines": [
                    {
                        "id": line.id,
                        "code": line.code,
                        "name": line.name
                    }
                    for line in test.analyzer_lines.all()
                ]
            }
            tests_data.append(test_data)

        return JsonResponse({"list": tests_data})


def laboratory_test_create(request):
    """Создание нового теста"""
    if request.method == 'POST':
        form = LaboratoryTestForm(request.POST)
        if form.is_valid():
            test = form.save()
            return render(request, template_name='teach.html')
    else:
        form = LaboratoryTestForm()

    return render(request, 'form.html', {'form': form})


# =============== API ДЛЯ ROCHE ANALYZER ===============

class RocheAnalyzerViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = RocheAnalyzer.objects.filter(is_active=True)
    serializer_class = RocheAnalyzerSerializer

    @action(detail=False, methods=['get'])
    def main(self, request):
        """Получить главный анализатор (по умолчанию)"""
        analyzer = get_object_or_404(
            RocheAnalyzer, code='ROCHE_C8000', is_active=True)
        serializer = self.get_serializer(analyzer)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def all_analyzers(self, request):
        """Получить список всех анализаторов"""
        analyzers = self.get_queryset()
        serializer = self.get_serializer(analyzers, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def modules(self, request, pk=None):
        analyzer = self.get_object()
        modules = analyzer.modules.all()
        serializer = RocheModuleSerializer(modules, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_code(self, request):
        """Получить анализатор по коду"""
        code = request.query_params.get('code')
        if not code:
            return Response({'error': 'code parameter required'}, status=400)
        analyzer = get_object_or_404(RocheAnalyzer, code=code, is_active=True)
        serializer = self.get_serializer(analyzer)
        return Response(serializer.data)


class RocheModuleViewSet(viewsets.ReadOnlyModelViewSet):
    """API для модулей Roche (только чтение)"""
    queryset = RocheModule.objects.all()
    serializer_class = RocheModuleSerializer

    @action(detail=True, methods=['get'])
    def reagents(self, request, pk=None):
        """Получить все реагенты модуля"""
        module = self.get_object()
        reagents = module.reagents.filter(is_active=True)
        serializer = ModuleReagentSerializer(reagents, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def reagents_by_channel(self, request, pk=None):
        """Получить реагенты по каналу"""
        module = self.get_object()
        channel = request.query_params.get('channel')
        if not channel:
            return Response({'error': 'channel parameter required'}, status=status.HTTP_400_BAD_REQUEST)

        reagents = module.reagents.filter(is_active=True, channel=channel)
        serializer = ModuleReagentSerializer(reagents, many=True)
        return Response(serializer.data)


class ReagentViewSet(viewsets.ModelViewSet):
    """API для реагентов (полный CRUD)"""
    queryset = Reagent.objects.all()
    serializer_class = ReagentSerializer

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Получить реагенты по категории"""
        category = request.query_params.get('category')
        if not category:
            return Response({'error': 'category parameter required'}, status=status.HTTP_400_BAD_REQUEST)

        reagents = self.queryset.filter(category=category)
        serializer = self.get_serializer(reagents, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_module_type(self, request):
        """Получить реагенты для определенного типа модуля"""
        module_type = request.query_params.get('module_type')
        if not module_type:
            return Response({'error': 'module_type parameter required'}, status=status.HTTP_400_BAD_REQUEST)

        module = RocheModule.objects.filter(module_type=module_type).first()
        if not module:
            return Response({'error': 'Module not found'}, status=status.HTTP_404_NOT_FOUND)

        reagents = module.reagents.filter(is_active=True)
        serializer = ModuleReagentSerializer(reagents, many=True)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """Удаление реагента"""
        try:
            reagent = self.get_object()
            # Проверяем, используется ли реагент в модулях
            if ModuleReagent.objects.filter(reagent=reagent).exists():
                return Response(
                    {'error': 'Реагент используется в модулях. Сначала удалите все связи.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            reagent.delete()
            return Response({'message': 'Реагент успешно удален'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ModuleReagentViewSet(viewsets.ModelViewSet):
    """API для связи реагентов с модулями"""
    queryset = ModuleReagent.objects.all()
    serializer_class = ModuleReagentSerializer

    def create(self, request, *args, **kwargs):
        """Создание связи реагента с модулем"""
        print("=== ПОЛУЧЕН ЗАПРОС НА СОЗДАНИЕ ===")
        print("Request data:", request.data)

        module_id = request.data.get('module')
        reagent_id = request.data.get('reagent')
        channel = request.data.get('channel')
        is_active = request.data.get('is_active', True)

        # Проверка обязательных полей
        if not module_id:
            return Response({'error': 'Поле module обязательно'}, status=status.HTTP_400_BAD_REQUEST)
        if not reagent_id:
            return Response({'error': 'Поле reagent обязательно'}, status=status.HTTP_400_BAD_REQUEST)

        # Проверка существования модуля
        try:
            module = RocheModule.objects.get(id=module_id)
        except RocheModule.DoesNotExist:
            return Response({'error': f'Модуль с id {module_id} не найден'}, status=status.HTTP_404_NOT_FOUND)

        # Проверка существования реагента
        try:
            reagent = Reagent.objects.get(id=reagent_id)
        except Reagent.DoesNotExist:
            return Response({'error': f'Реагент с id {reagent_id} не найден'}, status=status.HTTP_404_NOT_FOUND)

        # Для модуля C702 канал должен быть None
        if module.module_type == 'c702':
            channel = None

        # Проверка на дубликат
        existing = ModuleReagent.objects.filter(
            module=module,
            reagent=reagent,
            channel=channel
        ).first()

        if existing:
            return Response({
                'error': f'Реагент "{reagent.name}" уже добавлен в модуль {module.name}'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Создание связи
        try:
            module_reagent = ModuleReagent.objects.create(
                module=module,
                reagent=reagent,
                channel=channel,
                is_active=is_active
            )
            serializer = self.get_serializer(module_reagent)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            print(f"Ошибка при создании: {str(e)}")
            return Response({'error': f'Ошибка при создании связи: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
