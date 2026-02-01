from django.shortcuts import redirect, render
from django.views.generic import TemplateView
from django.http import JsonResponse

from .forms import LaboratoryTestForm
from .models import LaboratoryTest
from django.views.decorators.csrf import csrf_exempt
from django.core import serializers
# Create your views here.


class TeachView(TemplateView):
    template_name = 'teach.html'

    # def get(self, request, *args, **kwargs):
    #     context = super().get(request, *args, **kwargs)
    #     context['forms'] = LaboratoryTestForm()

    #     return context


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
