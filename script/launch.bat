@echo off
echo Opening frontend.html
start frontend.html
echo Activating virtual environment
call venv\Scripts\activate.bat
echo Running virtual environment
python backend.py
