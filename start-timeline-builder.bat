@echo off
title Timeline Builder (dev)
cd /d "%~dp0"

echo ============================================
echo   Timeline Builder
echo   Project Roadmap . Visual Editor
echo ============================================
echo.

:: Install / reconcile dependencies. Always runs npm install - it's fast
:: when up-to-date, and catches any additions to package.json automatically.
echo [setup] Syncing dependencies...
call npm install --silent
if errorlevel 1 (
    echo.
    echo [error] npm install failed. See output above.
    pause
    exit /b 1
)
echo [setup] Dependencies synced.
echo.

echo Starting dev server on port 3000...
echo.

:: Show local + LAN URLs
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        echo   Local:   http://localhost:3000
        echo   LAN:     http://%%b:3000
    )
)

echo.
echo Press Ctrl+C to stop the server.
echo ============================================
echo.

call npm run dev

echo.
echo Dev server stopped.
pause
