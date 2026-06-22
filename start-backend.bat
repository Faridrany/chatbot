@echo off
echo ========================================
echo Starting Backend Server (Port 3001)
echo ========================================
echo.

cd backend

echo Checking if node_modules exists...
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

echo Starting Express server...
node server.js

pause
