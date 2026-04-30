from django.urls import path
from . import views
from django.views.generic import TemplateView

urlpatterns = [
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
    path('barcode/', TemplateView.as_view(template_name='barcode.html'), name='barcode'),
    path('save-barcode/', views.save_barcode, name='save_barcode'),
    path('turn-mouse/', views.turn_state_mouse, name='mouse'),
    path('custom-labels/', views.get_custom_labels, name='custom-labels'),
    path('create-labels/', views.CreateCustomLabels.as_view(), name='create-labels'),
    path('get-printers/', views.get_printers, name='get_printers'),
    path('set-default-printer/', views.set_default_printer,
         name='set_default_printer')

]
