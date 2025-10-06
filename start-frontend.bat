@echo off
echo ========================================
echo   ToolVerse Frontend Server
echo ========================================
echo.
echo Backend is running on: http://localhost:3001
echo Frontend will start on: http://localhost:8080
echo.
echo Make sure you've created the database tables first!
echo See QUICK_START.md for instructions.
echo.
pause

echo Starting frontend development server...
npm run dev
