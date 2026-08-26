@echo off
chcp 65001 >nul
title EMPAQUETADOR PARA LA NUBE - IMAGIS
color 0E

echo ===============================================================================
echo        CREADOR DE PAQUETE PORTÁTIL PARA LA NUBE (ZIP) - IMAGIS
echo ===============================================================================
echo.
echo Este script creará un archivo comprimido "IMAGIS_Sistema_Imagenologia_Windows.zip"
echo con el instalador de 1 solo clic incluido, listo para subir a Google Drive, OneDrive, etc.
echo.

set OUTPUT_ZIP=IMAGIS_Sistema_Imagenologia_Windows.zip

if exist "%OUTPUT_ZIP%" (
    echo Eliminando archivo ZIP anterior...
    del /f /q "%OUTPUT_ZIP%"
)

echo.
echo Comprimiendo archivos del sistema con instalador de 1 solo clic...
powershell -NoProfile -Command "Get-ChildItem -Path . -Exclude 'node_modules', '.git', '*.zip' | Compress-Archive -DestinationPath '%OUTPUT_ZIP%' -Force"

if %errorlevel% equ 0 (
    color 0A
    echo.
    echo ===============================================================================
    echo   ¡PAQUETE CREADO CON ÉXITO: %OUTPUT_ZIP%!
    echo ===============================================================================
    echo.
    echo El archivo ZIP contiene el instalador de 1 solo clic:
    echo   -> INSTALAR_Y_ABRIR_1_CLIC.bat
    echo.
    echo Pasos siguientes para subirlo a la nube:
    echo  1. Sube el archivo "%OUTPUT_ZIP%" a Google Drive, OneDrive o Dropbox.
    echo  2. En cualquier computadora con Windows, descarga y descomprime el ZIP.
    echo  3. Haz doble clic en "INSTALAR_Y_ABRIR_1_CLIC.bat" y listo.
    echo.
) else (
    color 0C
    echo.
    echo [ERROR] No se pudo generar el archivo ZIP.
)

pause
