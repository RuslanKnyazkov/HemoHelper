@echo off
chcp 65001 >nul
echo ========================================
echo     ЗАПУСК DJANGO ПРОЕКТА
echo ========================================

cmd

echo [1] Активация виртуального окружения...
call .\venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo ❌ Ошибка активации виртуального окружения
    pause
    exit /b 1
)
echo ✅ Виртуальное окружение активировано

echo [2] Переход в папку проекта...
cd  WebApp
if %errorlevel% neq 0 (
    echo ❌ Ошибка перехода в папку WebApp
    pause
    exit /b 1
)
echo ✅ Успешно перешли в WebApp

echo [3] Запуск сервера Django...
echo ========================================
echo Сервер запускается на http://127.0.0.1:8000
echo Для остановки нажмите CTRL+C
echo ========================================
python manage.py runserver

pause
