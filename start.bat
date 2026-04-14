@echo off
echo Creating virtual environment...
python -m venv venv

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing requirements from requirements.txt...
pip install --no-cache-dir -r requirements.txt

echo.
echo Changing to Webapp directory...
cd WebApp

echo Applying database migrations...
python manage.py migrate

echo Starting Django development server...
python manage.py runserver

echo.
echo Server stopped.