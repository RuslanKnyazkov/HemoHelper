from django import forms
from .models import AliquotTemplate, AliquotLevel, TemplateLevel


class AliquotLevelForm(forms.ModelForm):
    class Meta:
        model = AliquotLevel
        fields = ['name', 'lot_number', 'volume', 'order']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'input-field', 'placeholder': 'Например: Аликвот 1'}),
            'lot_number': forms.TextInput(attrs={'class': 'input-field', 'placeholder': 'Уникальный номер лота'}),
            'volume': forms.NumberInput(attrs={'class': 'input-field', 'placeholder': 'Объем в мкл', 'min': 1}),
            'order': forms.NumberInput(attrs={'class': 'input-field', 'placeholder': 'Порядок отображения', 'min': 0}),
        }


class AliquotTemplateForm(forms.ModelForm):
    class Meta:
        model = AliquotTemplate
        fields = ['name', 'description']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'input-field', 'placeholder': 'Название шаблона'}),
            'description': forms.Textarea(attrs={'class': 'input-field', 'rows': 3, 'placeholder': 'Описание шаблона'}),
        }


class TemplateLevelForm(forms.ModelForm):
    class Meta:
        model = TemplateLevel
        fields = ['level', 'count']
        widgets = {
            'level': forms.Select(attrs={'class': 'input-field'}),
            'count': forms.NumberInput(attrs={'class': 'input-field', 'min': 1, 'max': 10}),
        }
