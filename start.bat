@echo off
echo ========================================
echo   ToolVerse - Quick Start
echo ========================================
echo.
echo Starting backend server...
start "Backend" cmd /k "node simple-backend.cjs"

timeout /t 3 /nobreak >nul

echo Starting frontend server...
start "Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo   Servers Starting!
echo ========================================
echo Backend: http://localhost:3001
echo Frontend: http://localhost:8080
echo.
echo Both servers will open in separate windows.
pause
