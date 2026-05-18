from django.db import models


class AliquotLevel(models.Model):
    """Уровень аликвоты (например: Аликвот 1, Аликвот 2, ...)"""
    name = models.CharField(max_length=200, verbose_name="Название уровня")
    lot_number = models.CharField(max_length=50, verbose_name="Номер лота")
    volume = models.PositiveIntegerField(verbose_name="Объем (мкл)")
    order = models.PositiveIntegerField(default=0, verbose_name="Порядок")

    class Meta:
        ordering = ['order']
        verbose_name = "Уровень аликвоты"
        verbose_name_plural = "Уровни аликвот"

    def __str__(self):
        return f"{self.name} - {self.lot_number}"


class AliquotTemplate(models.Model):
    """Шаблон аликвоты (группа уровней)"""
    name = models.CharField(max_length=200, verbose_name="Название шаблона")
    description = models.TextField(blank=True, verbose_name="Описание")
    levels = models.ManyToManyField(
        AliquotLevel, through='TemplateLevel', verbose_name="Уровни")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Шаблон аликвоты"
        verbose_name_plural = "Шаблоны аликвот"
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class TemplateLevel(models.Model):
    """Связь шаблона с уровнем (с дополнительными параметрами)"""
    template = models.ForeignKey(AliquotTemplate, on_delete=models.CASCADE)
    level = models.ForeignKey(AliquotLevel, on_delete=models.CASCADE)
    count = models.PositiveIntegerField(
        default=1, verbose_name="Количество этикеток")

    class Meta:
        unique_together = ['template', 'level']


class AliquotHistory(models.Model):
    """История печати аликвот"""
    template = models.ForeignKey(
        AliquotTemplate, on_delete=models.SET_NULL, null=True, verbose_name="Шаблон")
    levels_data = models.JSONField(verbose_name="Данные уровней", default=dict)
    printed_at = models.DateTimeField(
        auto_now_add=True, verbose_name="Время печати")
    printed_by = models.CharField(
        max_length=100, blank=True, verbose_name="Кто печатал")

    class Meta:
        verbose_name = "История печати"
        verbose_name_plural = "История печати"
        ordering = ['-printed_at']

    def __str__(self):
        return f"Печать {self.template.name if self.template else 'шаблона'} - {self.printed_at}"
