@echo off
chcp 65001 >nul
title CONFIGURAR DATOS DE LA CLÍNICA - IMAGIS
color 0E

echo ===============================================================================
echo        CONFIGURACIÓN DE DATOS DEL CLIENTE / CLÍNICA - IMAGIS
echo ===============================================================================
echo.
echo Abriendo el panel de Configuración Institucional en http://localhost:3000/?config=true ...
echo.
echo Aquí podrás modificar:
echo   - Nombre de la Clínica / Consultorio
echo   - Dirección física, Ciudad, Teléfonos y Correo
echo   - Logotipo (subir archivo PNG/JPG o elegir icono médico)
echo   - Nombre del Director Médico y registro profesional (C.M.P. / R.N.E.)
echo.

:: Abrir navegador en la pantalla de configuración en 2 segundos
start "" "cmd /c timeout /t 2 /nobreak >nul & start http://localhost:3000/?config=true"

:: Iniciar servidor
call npm run dev
