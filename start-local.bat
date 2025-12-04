@echo off
echo ==========================================
echo   E-Library Local Development Setup
echo ==========================================
echo.

echo Step 1: Starting Backend Server...
echo.
start cmd /k "cd /d E:\Projects\E-bugema\backend && echo Activating virtual environment... && (venv\Scripts\activate || .venv\Scripts\activate || env\Scripts\activate || (echo Creating new virtual environment... && python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt)) && echo Starting Django server... && python manage.py runserver"

timeout /t 5

echo.
echo Step 2: Starting Frontend Server...
echo.
start cmd /k "cd /d E:\Projects\E-bugema\frontend && echo Starting Vite dev server... && npm run dev"

echo.
echo ==========================================
echo   Servers Starting!
echo ==========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Wait 10-15 seconds, then open http://localhost:5173 in your browser
echo.
echo Press any key to close this window...
pause >nul
