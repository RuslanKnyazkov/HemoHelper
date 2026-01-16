from django.urls import path
from . import views
from django.views.generic import TemplateView

urlpatterns = [
    path('', TemplateView.as_view(template_name='base.html')),
    path('save-barcode/', views.save_barcode, name='save_barcode'),
]
