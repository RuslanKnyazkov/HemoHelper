from django.db import models
from django.contrib.auth.models import User


class Task(models.Model):
    class TaskStatus(models.TextChoices):
        PENDING = 'pending', 'В ожидании'
        IN_PROGRESS = 'in_progress', 'В работе'
        COMPLETED = 'completed', 'Завершено'
        CANCELLED = 'cancelled', 'Отменено'

    # Основные поля
    title = models.CharField(
        verbose_name='Наименование задачи',
        max_length=100,
        unique=True
    )

    user = models.ForeignKey(
        User,
        verbose_name='Пользователь',
        related_name='tasks',
        on_delete=models.CASCADE
    )

    content = models.TextField(
        verbose_name='Описание задачи',
        blank=True,
        null=True
    )

    # Статус задачи
    status = models.CharField(
        verbose_name='Статус',
        max_length=20,
        choices=TaskStatus.choices,
        default=TaskStatus.PENDING
    )

    # Категория/приоритет
    priority = models.IntegerField(
        verbose_name='Приоритет',
        choices=[(1, 'Низкий'), (2, 'Средний'), (3, 'Высокий')],
        default=2
    )

    # Даты
    created_at = models.DateTimeField(
        verbose_name='Дата создания',
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        verbose_name='Дата обновления',
        auto_now=True
    )

    completed_at = models.DateTimeField(
        verbose_name='Дата завершения',
        blank=True,
        null=True
    )

    # Метки/теги
    tags = models.CharField(
        verbose_name='Метки',
        max_length=200,
        blank=True,
        null=True
    )

    class Meta:
        verbose_name = 'Задача'
        verbose_name_plural = 'Задачи'
        ordering = ['-priority', '-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['user', 'status']),

        ]

    def __str__(self):
        return f'{self.title}'
