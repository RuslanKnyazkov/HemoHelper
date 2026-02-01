from django import forms
from django.core.exceptions import ValidationError
from .models import LaboratoryTest, AnalyzerLine


class LaboratoryTestForm(forms.ModelForm):
    """Форма для создания/редактирования лабораторного теста"""

    # Для множественного выбора линий анализатора
    analyzer_lines = forms.ModelMultipleChoiceField(
        queryset=AnalyzerLine.objects.all(),
        widget=forms.CheckboxSelectMultiple(attrs={'class': 'analize-lines'}),
        required=False,
        label="Линии анализатора"
    )

    # Поля для быстрой валидации
    code = forms.CharField(
        max_length=20,
        label="Код теста",
    )

    name = forms.CharField(
        max_length=200,
        label="Название теста",
    )

    test_type = forms.ChoiceField(
        choices=[
            ('immuno', 'Иммунохимия'),
            ('clinical', 'Клиническая химия'),
            ('hematology', 'Гематология'),
            ('coagulation', 'Коагулология'),
            ('hormone', 'Гормоны'),
            ('tumor', 'Онкомаркеры'),
            ('infectious', 'Инфекции'),
        ],
        label="Тип теста",
        widget=forms.Select(attrs={'class': 'form-control'})
    )

    sample_type = forms.ChoiceField(
        choices=[
            ('Сыворотка', 'Сыворотка'),
            ('Плазма', 'Плазма'),
            ('Цельная кровь', 'Цельная кровь'),
            ('Моча', 'Моча'),
            ('Спинномозговая жидкость', 'Спинномозговая жидкость'),
            ('Другое', 'Другое'),
        ],
        label="Тип пробы",
        widget=forms.Select(attrs={'class': 'input-field'})
    )

    processing_time = forms.IntegerField(
        min_value=1,
        max_value=1440,  # 24 часа в минутах
        initial=18,
        label="Время выполнения (мин)",
    )

    description = forms.CharField(
        widget=forms.Textarea(attrs={
            'rows': 4,
            'placeholder': 'Дополнительная информация о тесте...'
        }),
        required=False,
        label="Описание"
    )

    class Meta:
        model = LaboratoryTest
        fields = [
            'code',
            'name',
            'test_type',
            'sample_type',
            'processing_time',
            'description',
            'is_active',
            'analyzer_lines',
        ]
        labels = {
            'is_active': 'Активен',
        }
        help_texts = {
            'code': 'Уникальный код должен содержать только буквы и цифры',
            'is_active': 'Отметьте, если тест доступен для заказа',
        }
        widgets = {
            'is_active': forms.CheckboxInput(attrs={'class': 'input-check'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Если редактируем существующий тест, устанавливаем выбранные линии
        if self.instance and self.instance.pk:
            self.fields['analyzer_lines'].initial = self.instance.analyzer_lines.all()

        # Добавляем CSS классы для стилизации
        for field_name, field in self.fields.items():
            if field_name not in ['analyzer_lines', 'is_active']:
                field.widget.attrs.update({'class': 'input-field'})

    def clean_code(self):
        """Валидация кода теста"""
        code = self.cleaned_data.get('code')

        # Проверяем, что код содержит только разрешенные символы
        if not code.replace('-', '').replace('_', '').isalnum():
            raise ValidationError(
                'Код теста может содержать только буквы, цифры, дефисы и подчеркивания'
            )

        # Проверяем уникальность (кроме текущего экземпляра при редактировании)
        qs = LaboratoryTest.objects.filter(code=code)
        if self.instance and self.instance.pk:
            qs = qs.exclude(pk=self.instance.pk)

        if qs.exists():
            raise ValidationError(f'Тест с кодом "{code}" уже существует')

        return code.upper()  # Приводим к верхнему регистру

    def clean_name(self):
        """Валидация названия теста"""
        name = self.cleaned_data.get('name')

        # Проверяем, что название не слишком короткое
        if len(name.strip()) < 3:
            raise ValidationError(
                'Название теста должно содержать минимум 3 символа')

        return name.strip()

    def clean(self):
        """Дополнительная валидация всей формы"""
        cleaned_data = super().clean()

        # Проверяем, что выбран хотя бы один тип пробы
        sample_type = cleaned_data.get('sample_type')
        if not sample_type:
            self.add_error('sample_type', 'Выберите тип пробы')

        return cleaned_data

    def save(self, commit=True):
        """Переопределяем сохранение для обработки ManyToMany поля"""
        test = super().save(commit=False)

        if commit:
            test.save()
            # Сохраняем связи ManyToMany
            self.save_m2m()

        return test
