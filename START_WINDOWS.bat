@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Zapchast Pro
where node >nul 2>nul
if errorlevel 1 (
  echo XATO: Node.js topilmadi. Node.js LTS yoki Node.js 22+ o'rnating.
  pause
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo XATO: npm topilmadi. Node.js ni qayta o'rnating.
  pause
  exit /b 1
)
echo.
echo Kerakli kutubxonalar tekshirilmoqda (xlsx, React, Vite)...
call npm install
if errorlevel 1 (
  echo.
  echo XATO: Kutubxonalar o'rnatilmadi. Internet aloqasini tekshiring.
  pause
  exit /b 1
)
echo.
echo Zapchast Pro ishga tushmoqda...
call npm run dev -- --host 127.0.0.1
pause
