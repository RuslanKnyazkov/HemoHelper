from django import forms
from .models import CustomLabel


class LabelCreateForm(forms.ModelForm):
    class Meta:
        model = CustomLabel
        fields = ['name', 'description', 'type_labels']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'input-field'}),
            'description': forms.TextInput(attrs={'class': 'input-field'}),
            'type_labels': forms.Select(attrs={'class': 'input-field'}),
        }
        labels = {
            'name': 'Наименование и текст вывода',
            'description': 'Описание',
            'type_labels': 'Тип наклейки',
        }
