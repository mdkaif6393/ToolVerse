@echo off
echo ========================================
echo   ToolVerse Complete Setup
echo ========================================
echo.

echo Step 1: Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo Failed to install backend dependencies
    pause
    exit /b 1
)

echo.
echo Step 2: Running database migration...
cd ..
node scripts/migrate-new-database.js
if %errorlevel% neq 0 (
    echo Database migration failed
    pause
    exit /b 1
)

echo.
echo Step 3: Starting backend server...
cd backend
start "Backend Server" cmd /k "npm start"

echo.
echo Step 4: Starting frontend development server...
cd ..
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo Backend: http://localhost:3001
echo Frontend: http://localhost:8080
echo.
echo Both servers are starting in separate windows.
echo.
echo OPTIONAL: For real-time dashboard updates, you can also run:
echo   start-websocket.bat
echo.
echo The dashboard works fine without WebSocket - it will auto-refresh every 30 seconds.
echo Close this window when both servers are running.
pause
