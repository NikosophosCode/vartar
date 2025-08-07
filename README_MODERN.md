# 🎮 Vartar - Juego Multijugador Moderno

Un juego multijugador en tiempo real desarrollado con HTML5 Canvas, JavaScript vanilla y tecnologías web modernas. Los jugadores pueden elegir personajes con poderes elementales y batallar en un mapa interactivo.

## ✨ Características Principales

### 🎯 Gameplay
- **Multijugador en tiempo real** con sistema de colisiones avanzado
- **8 personajes únicos** con poderes elementales (Fuego, Agua, Tierra, Aire)
- **Sistema de combate** basado en ventajas elementales
- **Mapa interactivo** con movimiento fluido

### 📱 Mobile-First Design
- **Joystick virtual** con feedback háptico
- **Controles táctiles** optimizados para móviles
- **Interfaz responsiva** que se adapta a cualquier dispositivo
- **Detección de orientación** automática

### 🎨 Experiencia Visual Moderna
- **Sistema de partículas** para efectos visuales
- **Animaciones suaves** con CSS y Canvas
- **Temas personalizables** por elemento
- **Efectos de glow y sombras** dinámicos
- **Transiciones fluidas** entre estados

### 🚀 Tecnología Avanzada
- **Vite** para desarrollo rápido
- **Tailwind CSS** para diseño moderno
- **SCSS** para estilos organizados
- **ESLint + Prettier** para código limpio
- **Sistema de colisiones V2** optimizado

## 🛠️ Instalación y Configuración

### Prerrequisitos
- Node.js 18+ 
- npm o yarn

### Instalación Rápida

**Windows:**
```bash
./setup.bat
```

**Linux/Mac:**
```bash
chmod +x setup.sh && ./setup.sh
```

### Instalación Manual

1. **Clonar el repositorio**
```bash
git clone https://github.com/NikosophosCode/vartar.git
cd vartar
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar desarrollo**
```bash
npm run dev
```

## 🎯 Comandos Disponibles

```bash
# Desarrollo completo (servidor + cliente)
npm run dev

# Solo desarrollo del cliente
npm run dev:client

# Solo servidor
npm run dev:server

# Build de producción
npm run build

# Preview del build
npm run preview

# Linting y formato
npm run lint
npm run format

# Optimización de assets
npm run optimize:assets

# Compilar SCSS
npm run sass:watch
```

## 🏗️ Arquitectura del Proyecto

```
vartar/
├── public/
│   ├── index.html           # HTML principal
│   ├── CSS/
│   │   ├── styles.css       # Estilos base
│   │   ├── modern-styles.css # Estilos modernos con Tailwind
│   │   └── scss/            # Archivos SCSS
│   ├── js/
│   │   ├── main.js          # Punto de entrada
│   │   ├── game.js          # Lógica principal del juego
│   │   ├── character.js     # Sistema de personajes
│   │   ├── virtualJoystick.js # Controles móviles
│   │   ├── gameUI.js        # Interfaz moderna
│   │   ├── visualEffects.js # Sistema de efectos
│   │   └── config.js        # Configuración global
│   └── assets/              # Recursos multimedia
├── server files...          # Archivos del servidor
└── config files...          # Configuración del proyecto
```

## 🎮 Cómo Jugar

1. **Seleccionar Personaje**: Elige uno de los 8 personajes disponibles
2. **Elegir Poderes**: Selecciona 6 poderes de tu arsenal
3. **Navegar el Mapa**: Usa los controles táctiles o teclado para moverte
4. **Batallar**: Colisiona con otros jugadores para iniciar combate
5. **Ganar**: Derrota a tus oponentes usando ventajas elementales

### Ventajas Elementales
- 🔥 **Fuego** vence a 🌍 **Tierra**
- 💧 **Agua** vence a 🔥 **Fuego**  
- 🌍 **Tierra** vence a 💨 **Aire**
- 💨 **Aire** vence a 💧 **Agua**

## 🎨 Personalización

### Temas Visuales
El juego incluye temas basados en elementos:
- **Tierra**: Tonos marrones y dorados
- **Fuego**: Rojos y naranjas vibrantes
- **Agua**: Azules y cianes
- **Aire**: Grises y plateados

### Configuración
Modifica `config.js` para ajustar:
- Velocidad de movimiento
- Configuración de colisiones
- Efectos visuales
- Controles móviles

## 📱 Optimización Móvil

### Características Mobile-First
- **Joystick virtual** con zona muerta configurable
- **Gestos táctiles** para acciones especiales
- **Feedback háptico** en dispositivos compatibles
- **Interfaz adaptativa** para orientación landscape/portrait
- **Optimización de rendimiento** automática

### Controles Táctiles
- **Joystick**: Movimiento del personaje
- **Tap**: Seleccionar personaje/poder
- **Double-tap**: Acción especial (futuro)
- **Long-press**: Menú contextual (futuro)

## 🔧 Configuración Avanzada

### Variables de Entorno
```env
NODE_ENV=development
PORT=8080
VITE_DEV_PORT=3001
```

### Configuración del Canvas
```javascript
GRAPHICS: {
    CANVAS: {
        ALPHA: true,
        ANTIALIAS: true,
        POWER_PREFERENCE: 'high-performance'
    }
}
```

## 🐛 Debugging

### Flags de Debug Disponibles
```javascript
DEBUG: {
    SHOW_COLLISION_BOUNDS: true,     // Ver áreas de colisión
    SHOW_TOUCH_GUIDES: true,         // Mostrar guías táctiles
    VERBOSE_COLLISION_LOGGING: true, // Logs detallados
    COLLISION_OPTIMIZATION_METRICS: true // Métricas de rendimiento
}
```

## 🚀 Performance

### Optimizaciones Implementadas
- **Throttling de red** para reducir llamadas al servidor
- **Interpolación suave** de posiciones de enemigos  
- **Cache de posiciones** para mejor rendimiento
- **Limpieza automática** de partículas y efectos
- **Detección de colisiones optimizada** con sistema V2

### Métricas Objetivo
- **60 FPS** en dispositivos modernos
- **30 FPS mínimo** en dispositivos de gama baja
- **< 100ms** de latencia de red
- **< 16ms** por frame de renderizado

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -am 'Agrega nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

### Guías de Desarrollo
- Usa **ESLint** y **Prettier** para mantener consistencia
- Escribe **comentarios descriptivos** para lógica compleja
- Sigue el patrón **mobile-first** para nuevas características
- Prueba en **múltiples dispositivos** antes de hacer PR

## 📄 Licencia

Este proyecto está bajo la Licencia ISC. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

**NikosophosCode**
- Website: [https://nikosophoscode.github.io/](https://nikosophoscode.github.io/)
- Email: nikosophoscode@gmail.com
- GitHub: [@NikosophosCode](https://github.com/NikosophosCode)

## 🙏 Agradecimientos

- Comunidad de desarrolladores web por las herramientas increíbles
- Inspiración en juegos clásicos de batalla multijugador
- Feedback de testers beta

---

**¡Gracias por jugar Vartar! 🎮✨**
