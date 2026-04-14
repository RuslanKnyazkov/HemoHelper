@echo off

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo Changing to Webapp directory...
cd WebApp

echo Starting Django development server...
python manage.py runserver

echo.
echo Server stopped.