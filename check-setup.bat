@echo off
echo ========================================
echo Checking Application Setup
echo ========================================
echo.

echo [1/6] Checking Node.js installation...
where node >nul 2>nul
if %errorlevel% equ 0 (
    node --version
    echo ✓ Node.js is installed
) else (
    echo ✗ Node.js is NOT installed
    echo Please install Node.js from https://nodejs.org/
)
echo.

echo [2/6] Checking Python installation...
where python >nul 2>nul
if %errorlevel% equ 0 (
    python --version
    echo ✓ Python is installed
) else (
    echo ✗ Python is NOT installed
    echo Please install Python from https://www.python.org/
)
echo.

echo [3/6] Checking backend dependencies...
if exist "backend\node_modules" (
    echo ✓ Backend node_modules exists
) else (
    echo ✗ Backend node_modules NOT found
    echo Run: cd backend ^&^& npm install
)
echo.

echo [4/6] Checking frontend dependencies...
if exist "frontend\node_modules" (
    echo ✓ Frontend node_modules exists
) else (
    echo ✗ Frontend node_modules NOT found
    echo Run: cd frontend ^&^& npm install
)
echo.

echo [5/6] Checking data files...
set ALL_FILES_EXIST=1

if exist "data\hasil_training.json" (
    echo ✓ hasil_training.json exists
) else (
    echo ✗ hasil_training.json MISSING
    set ALL_FILES_EXIST=0
)

if exist "data\tfidf_terms.json" (
    echo ✓ tfidf_terms.json exists
) else (
    echo ✗ tfidf_terms.json MISSING
    set ALL_FILES_EXIST=0
)

if exist "data\processed\final_processed.json" (
    echo ✓ final_processed.json exists
) else (
    echo ✗ final_processed.json MISSING
    set ALL_FILES_EXIST=0
)

if exist "data\raw\dataset_berlabel.json" (
    echo ✓ dataset_berlabel.json exists
) else (
    echo ✗ dataset_berlabel.json MISSING
    set ALL_FILES_EXIST=0
)

if %ALL_FILES_EXIST% equ 0 (
    echo.
    echo Some data files are missing. Generate them by running:
    echo   cd backend ^&^& python main.py --train
)
echo.

echo [6/6] Checking if ports are available...
netstat -ano | findstr :3001 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠ Port 3001 is already in use (backend port)
    echo.
    echo To free the port:
    echo   1. Run: kill-ports.bat
    echo   2. Or manually: netstat -ano ^| findstr :3001
    echo      Then: taskkill /PID ^<PID^> /F
) else (
    echo ✓ Port 3001 is available
)

netstat -ano | findstr :3000 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠ Port 3000 is already in use (frontend port)
    echo   Vite will use alternative port (3003, 5173, etc)
) else (
    echo ✓ Port 3000 is available
)
echo.

echo ========================================
echo Setup Check Complete
echo ========================================
echo.
echo Next steps:
echo   1. If dependencies missing: npm install in backend and frontend folders
echo   2. If data files missing: cd backend ^&^& python main.py --train
echo   3. Start application: double-click start-all.bat
echo.

pause
