# models.py
from django.db import models


class AnalyzerLine(models.Model):
    """Линия анализатора (E1, E2, CE)"""
    code = models.CharField(max_length=10, unique=True,
                            verbose_name="Код линии")
    name = models.CharField(max_length=50, verbose_name="Название линии")
    description = models.TextField(blank=True, verbose_name="Описание")

    class Meta:
        ordering = ['code']
        verbose_name = "Линия анализатора"
        verbose_name_plural = "Линии анализатора"

    def __str__(self):
        return f"{self.code} - {self.name}"


class LaboratoryTest(models.Model):
    """Лабораторный тест"""

    # Основные поля
    code = models.CharField(max_length=20, unique=True,
                            verbose_name="Код теста")
    name = models.CharField(max_length=200, verbose_name="Название теста")
    test_type = models.CharField(
        max_length=20,
        verbose_name="Тип теста"
    )

    # Связь многие-ко-многим с линиями
    analyzer_lines = models.ManyToManyField(
        AnalyzerLine,
        related_name='tests',
        verbose_name="Линии анализатора",
        through='TestLineConfiguration'  # Промежуточная модель для доп. данных
    )

    # Дополнительная информация
    description = models.TextField(blank=True, verbose_name="Описание")
    sample_type = models.CharField(
        max_length=50,
        default="Сыворотка",
        verbose_name="Тип пробы"
    )
    processing_time = models.PositiveIntegerField(
        default=18,
        verbose_name="Время выполнения (мин)"
    )
    is_active = models.BooleanField(default=True, verbose_name="Активен")

    class Meta:
        ordering = ['code']
        verbose_name = "Лабораторный тест"
        verbose_name_plural = "Лабораторные тесты"
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['test_type']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.code} - {self.name}"

    @property
    def line_codes(self):
        """Возвращает список кодов линий (например: ['E1', 'E2', 'CE'])"""
        return list(self.analyzer_lines.values_list('code', flat=True))

    def can_run_on_line(self, line_code):
        """Можно ли запускать тест на указанной линии?"""
        return self.analyzer_lines.filter(code=line_code).exists()

    def get_primary_line(self):
        """Возвращает основную линию для теста"""
        config = self.line_configurations.filter(is_primary=True).first()
        return config.line if config else None


class TestLineConfiguration(models.Model):
    """
    Промежуточная модель для связи тест-линия.
    Позволяет хранить дополнительную информацию о конфигурации.
    """
    test = models.ForeignKey(
        LaboratoryTest,
        on_delete=models.CASCADE,
        related_name='line_configurations'
    )
    line = models.ForeignKey(
        AnalyzerLine,
        on_delete=models.CASCADE,
        related_name='test_configurations'
    )

    # Дополнительные параметры для конкретной линии
    is_primary = models.BooleanField(
        default=False,
        verbose_name="Основная линия"
    )
    priority = models.PositiveIntegerField(
        default=1,
        verbose_name="Приоритет (1-высший)"
    )
    max_daily_capacity = models.PositiveIntegerField(
        default=100,
        verbose_name="Макс. количество в день"
    )
    reagent_consumption = models.FloatField(
        default=1.0,
        verbose_name="Расход реагента (мл)"
    )

    class Meta:
        unique_together = [['test', 'line']]
        ordering = ['priority', 'line__code']
        verbose_name = "Конфигурация тест-линия"
        verbose_name_plural = "Конфигурации тест-линия"

    def __str__(self):
        return f"{self.test.code} → {self.line.code}"
