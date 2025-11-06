@echo off@echo off

echo ========================================REM JEE RL Tutor - Startup Script (Windows)

echo  RL Tutor - Startup ScriptREM Starts both backend and frontend servers

echo ========================================

echo.echo.

echo ================================================

:: Check if Python is installedecho    JEE RL Tutor - Starting Services

python --version >nul 2>&1echo ================================================

if %errorlevel% neq 0 (echo.

    echo ERROR: Python is not installed or not in PATH

    pauseREM Check if Python is installed

    exit /b 1where python >nul 2>nul

)if %ERRORLEVEL% NEQ 0 (

    echo [ERROR] Python not found. Please install Python 3.8+

:: Check if Node.js is installed    pause

node --version >nul 2>&1    exit /b 1

if %errorlevel% neq 0 ()

    echo ERROR: Node.js is not installed or not in PATH

    pauseREM Check if Node is installed

    exit /b 1where node >nul 2>nul

)if %ERRORLEVEL% NEQ 0 (

    echo [ERROR] Node.js not found. Please install Node.js

echo [1/4] Installing Python dependencies...    pause

cd backend    exit /b 1

if not exist venv ()

    echo Creating virtual environment...

    python -m venv venvecho.

)echo [1/3] Installing Backend Dependencies...

call venv\Scripts\activate.batcd backend

pip install -r requirements.txtif not exist "requirements.txt" (

cd ..    echo [WARNING] requirements.txt not found in backend folder

echo.) else (

    python -m pip install -q -r requirements.txt

echo [2/4] Installing Node.js dependencies...    if %ERRORLEVEL% NEQ 0 (

call npm install        echo [ERROR] Failed to install backend dependencies

echo.        pause

        exit /b 1

echo [3/4] Starting Backend Server (Port 8001)...    )

start "RL Tutor - Backend" cmd /k "cd /d %cd%\backend && venv\Scripts\activate.bat && python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload")

timeout /t 3 /nobreak >nulcd ..

echo.

echo [2/3] Installing Frontend Dependencies...

echo [4/4] Starting Frontend Server (Port 3000)...if not exist "node_modules" (

start "RL Tutor - Frontend" cmd /k "cd /d %cd% && npm run dev"    echo Installing npm packages (this may take a moment)...

echo.    call npm install

    if %ERRORLEVEL% NEQ 0 (

echo ========================================        echo [ERROR] Failed to install frontend dependencies

echo  Both servers are starting...        pause

echo ========================================        exit /b 1

echo  Backend:  http://localhost:8001    )

echo  Frontend: http://localhost:3000) else (

echo ========================================    echo npm packages already installed

echo.)

echo Press any key to exit this window (servers will keep running)

pause >nulecho [3/3] Starting Services...

echo.
echo Starting Backend (FastAPI on port 8002)...
cd backend
start "JEE RL Tutor - Backend" cmd /k "python -m uvicorn main:app --reload --port 8002"
cd ..
timeout /t 3 /nobreak >nul

echo Starting Frontend (Next.js on port 3000)...
start "JEE RL Tutor - Frontend" cmd /k "npm run dev"

echo.
echo ================================================
echo    Services Started Successfully!
echo ================================================
echo.
echo    Backend:  http://localhost:8002
echo    Frontend: http://localhost:3000
echo    API Docs: http://localhost:8002/docs
echo.
echo Press any key to exit this window...
echo (Services will continue running in separate windows)
pause >nul
echo ================================================
pause >nul

echo.
echo Stopping servers...
taskkill /F /IM python.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
echo Servers stopped.
