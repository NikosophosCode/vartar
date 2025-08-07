@echo off
REM Script de instalación y configuración moderna para Vartar (Windows)
echo 🎮 Configurando Vartar con herramientas modernas...

REM Verificar Node.js
node --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js no está instalado. Por favor, instala Node.js 18+ primero.
    pause
    exit /b 1
)

echo ✅ Node.js detectado
node --version

REM Instalar dependencias principales
echo 📦 Instalando dependencias principales...
npm install

REM Instalar dependencias de desarrollo
echo 🛠️ Instalando herramientas de desarrollo...
npm install --save-dev

REM Crear directorios necesarios
echo 📁 Creando estructura de directorios...
mkdir public\assets\optimized 2>nul
mkdir public\CSS\scss\components 2>nul
mkdir public\js\components 2>nul

echo ✨ ¡Configuración completada!
echo.
echo 🚀 Comandos disponibles:
echo   npm run dev          - Desarrollo completo (servidor + cliente)
echo   npm run dev:client   - Solo cliente con Vite
echo   npm run dev:server   - Solo servidor con nodemon
echo   npm run build        - Build de producción
echo   npm run lint         - Linter de código
echo   npm run format       - Formatear código
echo.
echo 🎯 Para iniciar el desarrollo, ejecuta: npm run dev
pause
