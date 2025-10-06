@echo off
echo ========================================
echo   ToolVerse WebSocket Server (Optional)
echo ========================================
echo.
echo This will start the WebSocket server for real-time updates.
echo The dashboard works fine without it, but you'll get live updates with it.
echo.
pause

echo Starting WebSocket server...
node -e "const WS = require('./backend/services/simpleWebSocket'); const server = new WS(); server.start(); process.on('SIGINT', () => { server.stop(); process.exit(); });"

pause
