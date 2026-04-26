@echo off
title ESO Auditing System

echo Starting ESO Auditing System...
echo.

cd /d "%~dp0"

REM Build the frontend if dist folder doesn't exist
if not exist "client\dist" (
    echo Building frontend for the first time...
    cd client
    call npm install
    call npm run build
    cd ..
)

REM Start the server
cd server
call npm install
echo.
echo ============================================
echo  ESO Auditing System is running!
echo  Open your browser and go to:
echo.
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set IP=%%a
    goto :found
)
:found
set IP=%IP: =%
echo     http://%IP%:5000
echo.
echo  Share this link with students and staff.
echo  Keep this window open while the system is in use.
echo ============================================
echo.
call npm start
pause
