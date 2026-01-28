from django.shortcuts import render
from django.views.generic import TemplateView

# Create your views here.


class TeachView(TemplateView):
    template_name = 'teach.html'
