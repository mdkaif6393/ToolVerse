@echo off
echo ========================================
echo   ToolVerse Backend Server
echo ========================================
echo.

echo Checking database migration...
node scripts/migrate-new-database.js

echo.
echo Starting backend server...
cd backend
npm start

pause
