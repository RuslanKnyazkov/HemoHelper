from django.urls import path
from . import views
from django.views.generic import TemplateView

urlpatterns = [
    path('', TemplateView.as_view(template_name='base.html'), name='home'),
    path('save-barcode/', views.save_barcode, name='save_barcode'),
    path('turn-mouse/', views.turn_state_mouse, name='mouse')

]
