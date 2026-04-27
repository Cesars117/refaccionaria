@echo off
:: 🛡️ Script de configuración de backup automático diario
:: Ejecutar como administrador para configurar tarea programada

echo 🛡️ CONFIGURANDO BACKUP AUTOMATICO DIARIO
echo ========================================
echo.

:: Verificar permisos de administrador
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Este script requiere permisos de administrador
    echo    Haga clic derecho y seleccione "Ejecutar como administrador"
    pause
    exit /b 1
)

echo ✅ Permisos de administrador confirmados
echo.

:: Configurar variables
set TASK_NAME=InventorySystem-DailyBackup
set SCRIPT_PATH=%~dp0scripts\backup.js
set WORKING_DIR=%~dp0
set LOG_PATH=%~dp0backups\scheduled-backup.log

echo 📁 Directorio del proyecto: %WORKING_DIR%
echo 📄 Script de backup: %SCRIPT_PATH%
echo 📝 Log de backups: %LOG_PATH%
echo.

:: Verificar que existe el script de backup
if not exist "%SCRIPT_PATH%" (
    echo ❌ ERROR: No se encuentra el script de backup
    echo    Ubicación esperada: %SCRIPT_PATH%
    pause
    exit /b 1
)

echo ✅ Script de backup encontrado
echo.

:: Crear directorio de backups si no existe
if not exist "%WORKING_DIR%backups" (
    mkdir "%WORKING_DIR%backups"
    echo 📁 Directorio backups creado
)

:: Crear la tarea programada
echo 🔧 Configurando tarea programada...
echo.

schtasks /delete /tn "%TASK_NAME%" /f >nul 2>&1

schtasks /create ^
  /tn "%TASK_NAME%" ^
  /tr "cmd /c \"cd /d \"%WORKING_DIR%\" && node scripts\backup.js >> \"%LOG_PATH%\" 2>&1\"" ^
  /sc daily ^
  /st 02:00 ^
  /ru SYSTEM ^
  /rl HIGHEST ^
  /f

if %errorlevel% equ 0 (
    echo ✅ Tarea programada creada exitosamente
    echo    Nombre: %TASK_NAME%
    echo    Horario: Diario a las 2:00 AM
    echo    Usuario: SYSTEM
) else (
    echo ❌ ERROR: No se pudo crear la tarea programada
    pause
    exit /b 1
)

echo.
echo 🧪 Probando backup manual...
echo.

:: Probar el backup manualmente
cd /d "%WORKING_DIR%"
node scripts\backup.js

if %errorlevel% equ 0 (
    echo.
    echo ✅ Prueba de backup exitosa
    echo.
    echo 🎉 CONFIGURACION COMPLETADA
    echo =============================
    echo ✅ Backup automático configurado
    echo ✅ Se ejecutará diariamente a las 2:00 AM  
    echo ✅ Los backups se guardan en: %WORKING_DIR%backups\
    echo ✅ Los logs se guardan en: %LOG_PATH%
    echo.
    echo 💡 Para ver la tarea: Abrir "Programador de tareas" y buscar "%TASK_NAME%"
    echo 💡 Para ejecutar manualmente: schtasks /run /tn "%TASK_NAME%"
    echo 💡 Para eliminar la tarea: schtasks /delete /tn "%TASK_NAME%" /f
) else (
    echo.
    echo ❌ ERROR: La prueba de backup falló
    echo    Revisar la configuración del proyecto
)

echo.
pause