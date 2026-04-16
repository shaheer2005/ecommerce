@echo off
echo Starting E-commerce Application...

echo Starting Django Backend...
start cmd /k "cd /d d:\ecommerce && d:/ecommerce/.venv-1/Scripts/python.exe manage.py runserver"

timeout /t 5 /nobreak > nul

echo Starting React Frontend...
start cmd /k "cd /d d:\ecommerce\frontend && npm start"

echo Both servers are starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
pause