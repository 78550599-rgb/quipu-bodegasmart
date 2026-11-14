@echo off
chcp 65001 >nul
title Publicar cambios de Quipu en la web fija
cd /d "C:\Users\HP VICTUS\.gemini\antigravity\scratch\bodegasmart-quipu"

echo ========================================================
echo   SUBIENDO CAMBIOS DE QUIPU A LA WEB PERMANENTE...
echo ========================================================
echo.

git add -A
git commit -m "Actualizacion desde PC (%date% %time%)"
git push origin main

echo.
echo ========================================================
echo   ¡LISTO! En ~1 minuto tu link fijo tendra los cambios.
echo ========================================================
pause
