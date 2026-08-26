@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title IMAGIS - Instalador y Lanzador en 1 Clic (Universal x32 / x64)
color 0B

echo ===============================================================================
echo        IMAGIS - SISTEMA DE GESTIÓN DE IMAGENOLOGÍA & PACS RADIOLÓGICO
echo             INSTALADOR & EJECUTOR EN 1 CLIC (WINDOWS x32 / x64)
echo ===============================================================================
echo.

:: Detectar Arquitectura
set "WIN_ARCH=32-bit (x86)"
if /i "%PROCESSOR_ARCHITECTURE%"=="AMD64" set "WIN_ARCH=64-bit (x64)"
if /i "%PROCESSOR_ARCHITEW6432%"=="AMD64" set "WIN_ARCH=64-bit (x64)"
if /i "%PROCESSOR_ARCHITECTURE%"=="ARM64" set "WIN_ARCH=64-bit (ARM64)"

echo [INFO] Arquitectura detectada: %WIN_ARCH%
echo.

:: 1. Verificar Node.js
echo [1/3] Verificando entorno de Windows...
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [AVISO] Node.js no está instalado en esta computadora (%WIN_ARCH%).
    echo Node.js es requerido para ejecutar el servidor clínico local y el visor PACS.
    echo.
    if "%WIN_ARCH%"=="32-bit (x86)" (
        echo Abriendo la página oficial de descarga para Windows 32-bit...
        start https://nodejs.org/dist/latest-v18.x/
    ) else (
        echo Abriendo la página oficial de descarga de Node.js LTS (64-bit)...
        start https://nodejs.org/en/download/
    )
    echo.
    echo Instale Node.js y vuelva a hacer doble clic en este archivo.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo   [OK] Node.js detectado: %NODE_VER% (%WIN_ARCH%)

:: 2. Instalar dependencias si no existen
echo.
echo [2/3] Verificando componentes del sistema...
if not exist "node_modules" (
    echo   Instalando módulos por primera vez (esto toma solo 1 minuto)...
    call npm install --no-fund --no-audit
) else (
    echo   [OK] Módulos de sistema listos.
)

:: 3. Crear accesos directos en el Escritorio
if exist "CREAR_ACCESO_DIRECTO.vbs" (
    %SystemRoot%\System32\cscript.exe //nologo CREAR_ACCESO_DIRECTO.vbs >nul 2>nul
    echo   [OK] Accesos directos creados en su Escritorio:
    echo        - "IMAGIS - Iniciar Sistema"
    echo        - "IMAGIS - Configurar Datos de la Clinica"
)

:: 4. Iniciar Servidor y Abrir Navegador
echo.
echo [3/3] Iniciando Sistema Clínico y abriendo navegador...
echo.
echo ===============================================================================
echo   ¡EL SISTEMA ESTÁ ACTIVO EN http://localhost:3000 !
echo   Para cerrar el sistema cuando termine su jornada, cierre esta ventana.
echo ===============================================================================
echo.

:: Abrir navegador en 2 segundos
start "" "cmd /c timeout /t 2 /nobreak >nul & start http://localhost:3000"

:: Iniciar servidor
call npm run dev
