@echo off
chcp 65001 >nul
title DETENER - IMAGIS Consultorio de Imagenología Médica
color 0C

echo ===============================================================================
echo        DETENIENDO SERVICIOS DE IMAGIS IMAGENOLOGÍA MÉDICA
echo ===============================================================================
echo.

echo Buscando procesos en puerto 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo Terminando proceso PID: %%a ...
    taskkill /F /PID %%a >nul 2>nul
)

echo.
echo [OK] El servidor de IMAGIS ha sido detenido con éxito y el puerto 3000 ha quedado liberado.
echo.
timeout /t 3
