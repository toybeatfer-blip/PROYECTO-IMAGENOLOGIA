@echo off
chcp 65001 >nul
title IMAGIS - Consultorio de Imagenología Médica (Servidor Activo)
color 0A

echo ===============================================================================
echo        IMAGIS - SISTEMA DE GESTIÓN DE IMAGENOLOGÍA & PACS RADIOLÓGICO
echo ===============================================================================
echo.
echo  Iniciando servidor clínico en http://localhost:3000 ...
echo  Abriendo navegador web automáticamente...
echo.

:: Verificar si node_modules existe, si no, instalar
if not exist "node_modules" (
    echo [INFO] Primera ejecución detectada. Instalando componentes necesarios...
    call npm install --no-fund --no-audit
)

:: Abrir navegador en 2 segundos
start "" "cmd /c timeout /t 2 /nobreak >nul & start http://localhost:3000"

:: Iniciar el servidor local
echo ===============================================================================
echo  El sistema está OPERATIVO y LISTO para uso clínico.
echo  Para detener el servidor en cualquier momento, presione CTRL + C o ejecute DETENER_SISTEMA.bat
echo ===============================================================================
echo.

call npm run dev
pause
