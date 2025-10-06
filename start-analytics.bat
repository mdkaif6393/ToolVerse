@echo off
echo 🚀 Starting Real Analytics System...
echo.

echo 📊 Step 1: Starting Python Analytics Service...
cd analytics-service
start "Python Analytics" cmd /k "python -m uvicorn app:app --host 0.0.0.0 --port 8001 --reload"
cd ..

echo ⏳ Waiting for analytics service to start...
timeout /t 5 /nobreak > nul

echo 🔧 Step 2: Starting Node.js Backend...
cd backend
start "Node Backend" cmd /k "npm run dev"
cd ..

echo ⏳ Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo 🌐 Step 3: Starting Frontend...
start "React Frontend" cmd /k "npm run dev"

echo.
echo ✅ All services started!
echo.
echo 📊 Analytics Service: http://localhost:8001
echo 🔧 Backend API: http://localhost:5000  
echo 🌐 Frontend: http://localhost:3000
echo.
echo 📝 Check the individual terminal windows for logs
echo 🔄 Analytics data is now REAL and live!
echo.
pause
