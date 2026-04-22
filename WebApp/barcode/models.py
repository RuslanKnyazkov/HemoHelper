from django.db import models


class CustomLabel(models.Model):
    BARCODE = 'barcode'
    TEXT = 'text'

    TYPE_CHOICES = [
        (BARCODE, 'Штрих-код'),
        (TEXT, 'Текст'),
    ]
    name = models.CharField(max_length=30, unique=True,
                            verbose_name='кастомная этикетка')
    description = models.CharField(
        max_length=50, unique=True, verbose_name='описание')
    type_labels = models.CharField(choices=TYPE_CHOICES, default='text')
    barcode = models.CharField(unique=True, verbose_name='Штрихкод')

    def __str__(self):
        return self.name

    def get_text_params_labels(self):
        options = {}
        if self.type_labels == 'barcode':
            options['barcode'] = self.barcode
            options['number'] = self.barcode
            options['code'] = '128'
        return {'type': self.type_labels, 'text': self.name, 'description': self.description, 'anchor': 'c', 'size': 'l', **options}
