#!/bin/bash

# Script de instalación y configuración moderna para Vartar
echo "🎮 Configurando Vartar con herramientas modernas..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor, instala Node.js 18+ primero."
    exit 1
fi

echo "✅ Node.js detectado: $(node --version)"

# Instalar dependencias principales
echo "📦 Instalando dependencias principales..."
npm install

# Instalar dependencias de desarrollo
echo "🛠️ Instalando herramientas de desarrollo..."
npm install --save-dev

# Crear directorios necesarios
echo "📁 Creando estructura de directorios..."
mkdir -p public/assets/optimized
mkdir -p public/CSS/scss/components
mkdir -p public/js/components

# Optimizar imágenes existentes (si imagemin está instalado)
if command -v imagemin &> /dev/null; then
    echo "🖼️ Optimizando imágenes..."
    npm run optimize:assets
fi

# Compilar Sass
echo "🎨 Compilando estilos SCSS..."
npm run sass:watch &

# Configurar Git hooks (opcional)
if [ -d ".git" ]; then
    echo "🔗 Configurando Git hooks..."
    echo "#!/bin/sh
npm run lint
npm run format" > .git/hooks/pre-commit
    chmod +x .git/hooks/pre-commit
fi

echo "✨ ¡Configuración completada!"
echo ""
echo "🚀 Comandos disponibles:"
echo "  npm run dev          - Desarrollo completo (servidor + cliente)"
echo "  npm run dev:client   - Solo cliente con Vite"
echo "  npm run dev:server   - Solo servidor con nodemon"
echo "  npm run build        - Build de producción"
echo "  npm run lint         - Linter de código"
echo "  npm run format       - Formatear código"
echo ""
echo "🎯 Para iniciar el desarrollo, ejecuta: npm run dev"
