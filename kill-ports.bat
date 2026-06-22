@echo off
echo ========================================
echo Freeing Ports 3000, 3001, 3002
echo ========================================
echo.

echo Checking port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo   Found process %%a on port 3000, killing...
    taskkill /PID %%a /F >nul 2>&1
)

echo Checking port 3001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
    echo   Found process %%a on port 3001, killing...
    taskkill /PID %%a /F >nul 2>&1
)

echo Checking port 3002...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3002 ^| findstr LISTENING') do (
    echo   Found process %%a on port 3002, killing...
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo ========================================
echo Ports have been freed!
echo ========================================
echo.

echo Verifying ports are free...
netstat -ano | findstr :3000 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠ Port 3000 still in use
) else (
    echo ✓ Port 3000 is free
)

netstat -ano | findstr :3001 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠ Port 3001 still in use
) else (
    echo ✓ Port 3001 is free
)

netstat -ano | findstr :3002 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠ Port 3002 still in use
) else (
    echo ✓ Port 3002 is free
)

echo.
echo You can now run start-all.bat to start the application.
echo.

pause
