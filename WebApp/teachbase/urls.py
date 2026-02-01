from django.urls import path
from .views import TeachView, get_guide_info, laboratory_test_create

urlpatterns = [
    path('', TeachView.as_view(), name='teach-home'),
    path('guide/<str:type_test>', get_guide_info, name='guide'),
    path('create/', laboratory_test_create, name='create-test')
]
