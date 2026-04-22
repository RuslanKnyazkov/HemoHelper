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


class RocheAnalyzer(models.Model):
    """Главная модель анализатора Roche"""
    MODULE_TYPES = [
        ('e801', 'E801'),
        ('e601', 'E601'),
        ('c702', 'C702'),
    ]

    name = models.CharField(
        max_length=200, default="Roche Cobas 8000", verbose_name="Название")
    code = models.CharField(
        max_length=50, default="ROCHE_C8000", unique=True, verbose_name="Код")
    is_active = models.BooleanField(default=True, verbose_name="Активен")

    class Meta:
        verbose_name = "Анализатор Roche"
        verbose_name_plural = "Анализаторы Roche"

    def __str__(self):
        return self.name


class RocheModule(models.Model):
    """Модуль анализатора Roche"""
    MODULE_TYPES = [
        ('e801', 'E801 - Иммунохимический модуль'),
        ('e601', 'E601 - Иммунохимический модуль'),
        ('c702', 'C702 - Биохимический модуль'),
    ]

    analyzer = models.ForeignKey(
        RocheAnalyzer, on_delete=models.CASCADE, related_name='modules', verbose_name="Анализатор")
    module_type = models.CharField(
        max_length=10, choices=MODULE_TYPES, verbose_name="Тип модуля")
    module_number = models.PositiveSmallIntegerField(
        verbose_name="Номер модуля")
    name = models.CharField(max_length=100, verbose_name="Название модуля")
    position = models.PositiveSmallIntegerField(
        default=0, verbose_name="Позиция")

    class Meta:
        verbose_name = "Модуль Roche"
        verbose_name_plural = "Модули Roche"
        ordering = ['position', 'module_number']
        unique_together = ['analyzer', 'module_number']

    def __str__(self):
        return f"{self.get_module_type_display()} - Модуль {self.module_number}: {self.name}"

    @property
    def has_channels(self):
        """Есть ли каналы у модуля (только у e801 и e601)"""
        return self.module_type in ['e801', 'e601']


class Reagent(models.Model):
    """Реагент для Roche анализатора"""
    CATEGORIES = [
        ('hormones', 'Гормоны'),
        ('oncomarkers', 'Онкомаркеры'),
        ('autoimmune', 'Аутоиммунные'),
        ('vitamins', 'Витамины'),
        ('special', 'Специальные'),
        ('biochemistry', 'Биохимия'),
    ]

    name = models.CharField(max_length=200, verbose_name="Название реагента")
    code = models.CharField(max_length=50, unique=True,
                            verbose_name="Код реагента")
    short_name = models.CharField(
        max_length=50, verbose_name="Краткое название")
    category = models.CharField(
        max_length=50, choices=CATEGORIES, verbose_name="Категория")
    description = models.TextField(blank=True, verbose_name="Описание")

    class Meta:
        verbose_name = "Реагент"
        verbose_name_plural = "Реагенты"
        ordering = ['category', 'name']

    def __str__(self):
        return f"{self.name} ({self.code})"


class ModuleReagent(models.Model):
    """Реагент в модуле с указанием канала"""
    CHANNELS = [
        ('CH1', 'Канал 1'),
        ('CH2', 'Канал 2'),
        ('BOTH', 'Оба канала'),  # ДОБАВЛЕНО!
    ]

    module = models.ForeignKey(
        RocheModule, on_delete=models.CASCADE, related_name='reagents', verbose_name="Модуль")
    reagent = models.ForeignKey(Reagent, on_delete=models.CASCADE,
                                related_name='module_assignments', verbose_name="Реагент")
    channel = models.CharField(
        max_length=4, choices=CHANNELS, null=True, blank=True, verbose_name="Канал")
    is_active = models.BooleanField(default=True, verbose_name="Активен")

    class Meta:
        verbose_name = "Реагент в модуле"
        verbose_name_plural = "Реагенты в модулях"
        unique_together = ['module', 'reagent']  # Остается без изменений!

    def __str__(self):
        channel_display = ''
        if self.channel == 'CH1':
            channel_display = ' (CH1)'
        elif self.channel == 'CH2':
            channel_display = ' (CH2)'
        elif self.channel == 'BOTH':
            channel_display = ' (CH1+CH2)'
        return f"{self.module.name} - {self.reagent.name}{channel_display}"

    @property
    def is_on_ch1(self):
        """Реагент активен на CH1"""
        return self.channel in ['CH1', 'BOTH']

    @property
    def is_on_ch2(self):
        """Реагент активен на CH2"""
        return self.channel in ['CH2', 'BOTH']
