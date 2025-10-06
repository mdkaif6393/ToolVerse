@echo off
echo.
echo ========================================
echo   Real-time Dashboard System Startup
echo ========================================
echo.

echo [1/4] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    pause
    exit /b 1
)
echo ✓ Node.js is installed

echo.
echo [2/4] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo ✓ Dependencies installed

echo.
echo [3/4] Initializing dashboard database...
node scripts/init-dashboard.js
if %errorlevel% neq 0 (
    echo ERROR: Failed to initialize database
    echo Please check your DATABASE_URL in .env file
    pause
    exit /b 1
)
echo ✓ Database initialized with sample data

echo.
echo [4/4] Starting servers...
echo.
echo Starting backend server (Port 5000) and WebSocket server (Port 8080)...
echo Frontend will be available at: http://localhost:5173
echo.
echo Press Ctrl+C to stop all servers
echo.

start "Backend Server" cmd /k "cd backend && npm start"
timeout /t 3 /nobreak >nul
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ========================================
echo   Dashboard System Started Successfully!
echo ========================================
echo.
echo Backend API: http://localhost:5000
echo WebSocket: ws://localhost:8080  
echo Frontend: http://localhost:5173
echo.
echo Check DASHBOARD_SETUP.md for detailed usage instructions
echo.
pause
