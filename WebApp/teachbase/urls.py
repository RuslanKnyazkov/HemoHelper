from django.urls import path
from .views import TeachView

urlpatterns = [
    path('', TeachView.as_view(), name='teach-home')
]
