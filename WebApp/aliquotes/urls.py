from django.urls import path
from . import views

app_name = 'aliquots'

urlpatterns = [
    # Шаблоны
    path('', views.aliquot_list, name='list'),
    path('template/create/', views.template_create, name='template_create'),
    path('template/edit/<int:pk>/', views.template_edit, name='template_edit'),
    path('template/delete/<int:pk>/',
         views.template_delete, name='template_delete'),
    path('template/get/<int:pk>/', views.template_get, name='template_get'),
    path('template/list/', views.template_list, name='template_list'),

    # Уровни аликвот
    path('level/create/', views.level_create, name='level_create'),
    path('level/edit/<int:pk>/', views.level_edit, name='level_edit'),
    path('level/delete/<int:pk>/', views.level_delete, name='level_delete'),
    path('level/get/<int:pk>/', views.level_get, name='level_get'),
    path('level/list/', views.level_list, name='level_list'),

    # Печать и история
    path('print/', views.aliquot_print, name='print'),
    path('history/', views.history_list, name='history'),
]
