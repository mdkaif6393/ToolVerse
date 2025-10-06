@echo off
echo ========================================
echo   ToolVerse Database Migration
echo ========================================
echo.
echo This will set up your new Supabase database
echo with all required tables and schema.
echo.
pause

echo Running database migration...
node scripts/migrate-new-database.js

echo.
echo Migration completed!
pause
