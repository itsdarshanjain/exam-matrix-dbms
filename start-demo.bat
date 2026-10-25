@echo off
title ExamMatrix ERP - University Examination Management System Launcher
echo =====================================================================
echo  ExamMatrix ERP - University Examination & Seating Management System
echo  Relational Database Management System (3NF Normalized PostgreSQL Engine)
echo =====================================================================
echo.
echo [1/3] Starting Backend API Server on Port 5001...
start "ExamMatrix Backend API" cmd /k "cd /d %~dp0backend && node server.js"

echo [2/3] Initializing Relational Engine...
timeout /t 2 /nobreak >nul

echo [3/3] Starting Frontend Client on Port 3000...
start "ExamMatrix Frontend Client" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo [SUCCESS] System services launched successfully!
echo Opening http://localhost:3000 in your web browser...
timeout /t 2 /nobreak >nul
start http://localhost:3000

echo.
echo =====================================================================
echo  Ready for Faculty Evaluation & Demonstration!
echo  Press any key to exit this launcher window (servers stay active).
echo =====================================================================
pause
