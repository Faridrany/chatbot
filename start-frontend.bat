@echo off
echo ========================================
echo Starting Frontend Dev Server (Port 3000)
echo ========================================
echo.

cd frontend

echo Checking if node_modules exists...
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

echo Starting Vite dev server...
call npm run dev

pause
