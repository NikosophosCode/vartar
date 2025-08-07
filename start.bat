@echo off
echo 🎮 Iniciando Vartar...
echo.

REM Verificar si existe node_modules
if not exist "node_modules" (
    echo 📦 Instalando dependencias...
    npm install
    echo.
)

echo 🚀 Iniciando servidor...
echo.
echo Abre tu navegador en: http://localhost:8080
echo Presiona Ctrl+C para detener el servidor
echo.

node index.js
