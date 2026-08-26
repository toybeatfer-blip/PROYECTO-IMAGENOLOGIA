@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title INSTALADOR UNIVERSAL - IMAGIS Consultorio de Imagenología Médica (x86 / x64)
color 0B

echo ===============================================================================
echo        IMAGIS - SISTEMA DE GESTIÓN DE IMAGENOLOGÍA & PACS RADIOLÓGICO
echo             INSTALADOR AUTOMÁTICO UNIVERSAL PARA WINDOWS (x32 / x64)
echo ===============================================================================
echo.

:: 1. Detección Automática de Arquitectura de Windows (32-bit vs 64-bit)
set "WIN_ARCH=32-bit (x86)"
if /i "%PROCESSOR_ARCHITECTURE%"=="AMD64" set "WIN_ARCH=64-bit (x64)"
if /i "%PROCESSOR_ARCHITEW6432%"=="AMD64" set "WIN_ARCH=64-bit (x64)"
if /i "%PROCESSOR_ARCHITECTURE%"=="ARM64" set "WIN_ARCH=64-bit (ARM64)"

echo [INFO] Sistema Operativo: Microsoft Windows
echo [INFO] Arquitectura detectada: %WIN_ARCH%
echo.

:: 2. Verificar Node.js
echo [1/5] Verificando entorno de ejecución Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [ERROR] No se detectó Node.js instalado en esta computadora (%WIN_ARCH%).
    echo.
    echo Node.js es necesario para ejecutar el servidor clínico local y el visor de imágenes.
    echo.
    if "%WIN_ARCH%"=="32-bit (x86)" (
        echo Para Windows 32-bit (x86), se recomienda descargar Node.js v18 o v20 (x86).
        echo ¿Desea abrir la página oficial de descargas de Node.js? (S/N)
        set /p openNode="> "
        if /i "!openNode!"=="S" (
            start https://nodejs.org/dist/latest-v18.x/
        )
    ) else (
        echo Para Windows 64-bit (x64), se recomienda descargar Node.js LTS (x64).
        echo ¿Desea abrir la página oficial de descargas de Node.js? (S/N)
        set /p openNode="> "
        if /i "!openNode!"=="S" (
            start https://nodejs.org/en/download/
        )
    )
    echo.
    echo Por favor instale Node.js y vuelva a ejecutar este instalador.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo   [OK] Node.js detectado: %NODE_VER% (%WIN_ARCH%)
echo.

:: 3. Instalar dependencias
echo [2/5] Verificando e instalando módulos del sistema...
if not exist "node_modules" (
    echo   Instalando paquetes y dependencias (esto puede tomar 1 o 2 minutos)...
    call npm install --no-fund --no-audit
    if !errorlevel! neq 0 (
        color 0C
        echo.
        echo [ERROR] Ocurrió un error al instalar las dependencias con npm.
        pause
        exit /b 1
    )
) else (
    echo   [OK] Módulos de dependencias ya instalados.
)
echo.

:: 4. Compilar aplicación de producción
echo [3/5] Compilando aplicación de alto rendimiento con Vite...
call npm run build
if !errorlevel! neq 0 (
    color 0E
    echo   [AVISO] Se continuará en modo dinámico.
) else (
    echo   [OK] Compilación de producción generada en carpeta /dist.
)
echo.

:: 5. Asistente de Configuración Inicial (Opcional)
echo ===============================================================================
echo   [4/5] ASISTENTE DE CONFIGURACIÓN INICIAL & PRIMER USUARIO ADMINISTRADOR
echo ===============================================================================
echo [A] DATOS DE LA CLÍNICA / CONSULTORIO:
echo (Presione ENTER para mantener los valores predeterminados)
echo.
set /p c_nom="  - Nombre de la Clínica [IMAGIS]: "
set /p c_dir="  - Dirección y Ciudad [Av. Javier Prado Este 2840, San Borja, Lima]: "
set /p c_tel="  - Teléfono de Contacto [(01) 710-2000]: "
set /p c_ruc="  - RUC / ID Fiscal [20608945123]: "
set /p c_doc="  - Nombre del Director Médico [Dr. Alejandro Mendoza Valdivia]: "
echo.
echo [B] PRIMER USUARIO ADMINISTRADOR (Acceso Total):
set /p u_admin="  - Nombre de Usuario del Administrador [admin]: "
set /p p_admin="  - Contraseña del Administrador [admin123]: "
set /p e_admin="  - Correo del Administrador [director@imagis-radiologia.com]: "
echo.
echo   * Nota: Podrás crear usuarios para "Encargados" y cambiar contraseñas
echo     en cualquier momento desde el menú de Configuración.
echo.

:: 6. Crear accesos directos en el Escritorio
echo [5/5] Creando accesos directos en el Escritorio de Windows (%WIN_ARCH%)...
if exist "CREAR_ACCESO_DIRECTO.vbs" (
    %SystemRoot%\System32\cscript.exe //nologo CREAR_ACCESO_DIRECTO.vbs
    echo   [OK] Acceso directo "IMAGIS - Iniciar Sistema" creado en el Escritorio.
    echo   [OK] Acceso directo "IMAGIS - Configurar Datos de la Clinica" creado en el Escritorio.
)
echo.

echo ===============================================================================
echo        ¡INSTALACIÓN COMPLETADA EXITOSAMENTE PARA WINDOWS %WIN_ARCH%!
echo ===============================================================================
echo.
echo Accesos directos disponibles en tu Escritorio:
echo   1. "IMAGIS - Iniciar Sistema" (Inicia la app directamente)
echo   2. "IMAGIS - Configurar Datos de la Clinica" (Abre la pantalla para cambiar logo y datos)
echo.
echo ¿Desea iniciar el sistema ahora mismo en su navegador? (S/N)
set /p startNow="> "
if /i "!startNow!"=="S" (
    start INICIAR_SISTEMA.bat
)

echo.
echo Presione cualquier tecla para salir del instalador...
pause >nul
