@echo off
echo ========================================
echo Starting Full Application
echo ========================================
echo.
echo This will open TWO terminal windows:
echo   1. Backend Server (Port 3001)
echo   2. Frontend Dev Server (Port 3000)
echo.
echo Press any key to continue...
pause > nul

echo Starting Backend...
start "Backend Server" cmd /k "cd backend && node server.js"

timeout /t 3 /nobreak > nul

echo Starting Frontend...
start "Frontend Dev Server" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo Both servers are starting!
echo ========================================
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Check the opened terminal windows for logs.
echo Press any key to exit this window...
pause > nul
