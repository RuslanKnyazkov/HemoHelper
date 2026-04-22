# urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TeachView, get_guide_info, laboratory_test_create,
    RocheAnalyzerViewSet, RocheModuleViewSet,
    ReagentViewSet, ModuleReagentViewSet  # Убедитесь, что импортирован
)

router = DefaultRouter()
router.register(r'analyzer', RocheAnalyzerViewSet, basename='roche-analyzer')
router.register(r'modules', RocheModuleViewSet, basename='roche-modules')
router.register(r'reagents', ReagentViewSet, basename='roche-reagents')
router.register(r'module-reagents', ModuleReagentViewSet,
                basename='module-reagents')  # ЭТА СТРОКА ДОЛЖНА БЫТЬ

urlpatterns = [
    path('', TeachView.as_view(), name='teach-home'),
    path('guide/<str:type_test>', get_guide_info, name='guide'),
    path('create/', laboratory_test_create, name='create-test'),
    path('api/roche/', include(router.urls)),
]
