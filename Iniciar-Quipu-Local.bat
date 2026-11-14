@echo off
chcp 65001 >nul
title Servidor Local + Tunel Quipu
cd /d "C:\Users\HP VICTUS\.gemini\antigravity\scratch\bodegasmart-quipu"

echo Iniciando servidor local de Quipu en http://localhost:3000 ...
start "Servidor Quipu" /min cmd /c "node server.js"
timeout /t 2 >nul

echo.
echo Abriendo enlace HTTPS para celular (Cloudflare)...
echo Copia el enlace que termina en .trycloudflare.com:
echo.
"C:\Users\HP VICTUS\.gemini\antigravity\brain\fc3e61b1-d950-4c26-b8d1-5e0b647c2c6c\scratch\cloudflared.exe" tunnel --url http://localhost:3000
pause
