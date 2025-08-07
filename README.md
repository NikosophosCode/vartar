# Vartar - Juego Multijugador en Tiempo Real

¡Bienvenido a Vartar! Un juego multijugador donde los jugadores se enfrentan en combates tácticos usando diferentes elementos y poderes.

## 🚀 Características Principales

- **Multijugador en tiempo real** - Hasta múltiples jugadores simultáneos
- **Sistema de colisiones bilateral V2** - Detección precisa y sincronizada
- **8 personajes únicos** con diferentes poderes elementales
- **Combate estratégico** basado en elementos (Fuego, Agua, Tierra, Aire)
- **Interfaz responsive** - Compatible con móvil y escritorio
- **Controles táctiles** optimizados para dispositivos móviles

## 🎮 Cómo Jugar

1. **Selecciona tu personaje** - Elige entre 8 personajes únicos
2. **Muévete por el mapa** - Usa las teclas de dirección o controles táctiles  
3. **Encuentra oponentes** - Acércate a otros jugadores para iniciar combate
4. **¡Combate!** - Elige 6 poderes y enfrenta a tu oponente
5. **Gana la batalla** - El que gane más rondas es el vencedor

## 🎮 Personajes y Poderes

### Personajes Disponibles
- **Sinji** - Especialista en Tierra 🌎
- **Kiira** - Maestra del Agua 💧  
- **Kimo** - Controlador de Fuego 🔥
- **Vera** - Dominadora del Aire ☁
- **Narobi** - Guerrera de Fuego 🔥
- **Nutso** - Guardian de la Tierra 🌎
- **Limbre** - Espíritu del Aire ☁
- **Iroki** - Sage del Agua 💧

### Sistema de Combate
Cada personaje tiene 6 poderes: 3 de su elemento principal + 1 de cada otro elemento.

**Ventajas elementales:**

- 🔥 **Fuego** vence a 🌍 **Tierra**
- 💧 **Agua** vence a 🔥 **Fuego**  
- 🌍 **Tierra** vence a 💨 **Aire**
- 💨 **Aire** vence a 💧 **Agua**

## 🔧 Tecnologías Utilizadas

### Frontend
- **HTML5/CSS3** - Interfaz de usuario responsiva
- **JavaScript (ES6+)** - Lógica del juego y comunicación
- **Canvas API** - Renderizado del mapa y personajes
- **Fetch API** - Comunicación con el servidor

### Backend  
- **Node.js** - Servidor de juego
- **Express.js** - Framework web
- **CORS** - Soporte para múltiples orígenes

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

- **Sistema de Colisiones V2** - Detección bilateral precisa
- **Interpolación de movimiento** - Movimiento suave de enemigos
- **Cache inteligente** - Optimización de rendimiento
- **Manejo robusto de errores** - Recuperación automática

## 📦 Instalación y Configuración

### Prerrequisitos
- Node.js (versión 14 o superior)
- npm o yarn

### Instalación
```bash
# Clonar el repositorio
git clone https://github.com/NikosophosCode/vartar.git
cd vartar

# Instalar dependencias
npm install

# Iniciar el servidor
npm start
```

El juego estará disponible en:
- **Local**: http://localhost:8080
- **Red**: http://[tu-ip]:8080

### Configuración Opcional
Puedes modificar las configuraciones en `/public/js/config.js`:

```javascript
COLLISION: {
    DETECTION_DISTANCE: 85,    // Radio de detección de colisiones
    DEBOUNCE_TIME: 300,        // Tiempo entre verificaciones
    POSITION_TOLERANCE: 8      // Tolerancia de sincronización
}
```

## 🎯 Sistema de Colisiones V2 (Nuevo)

El juego incluye un sistema de colisiones bilateral completamente rediseñado:

### Características Avanzadas
- ✅ **Detección bilateral**: Ambos jugadores ven la colisión simultáneamente
- ✅ **Múltiples algoritmos**: Distancia euclidiana + AABB + área de solapamiento  
- ✅ **Validación del servidor**: Autoridad centralizada para evitar trampas
- ✅ **Optimización inteligente**: Cache, debouncing y filtrado de distancias
- ✅ **Recuperación automática**: Manejo robusto de errores y timeouts

### Flujo de Colisión
1. Detección local precisa (cliente)
2. Verificación de consistencia de posiciones
3. Solicitud bilateral al servidor
4. Confirmación atómica para ambos jugadores
5. Inicio de combate sincronizado

Ver documentación completa: [SISTEMA_COLISIONES_V2.md](./SISTEMA_COLISIONES_V2.md)


## 🛠️ Desarrollo y Testing

### Scripts de Testing
Para desarrolladores, el juego incluye herramientas de testing:

```javascript
// En la consola del navegador
testCollisionSystemV2()        // Verificar sistema de colisiones
simularColision(0)             // Simular colisión con enemigo
mostrarMetricasServidor()      // Ver métricas del servidor
```

### Métricas del Servidor
Accede a métricas en tiempo real: http://localhost:8080/vartar/metricas

### Debug Visual
Activa el modo debug en `config.js`:
```javascript
DEBUG: {
    SHOW_COLLISION_SYSTEM_V2: true,
    VERBOSE_COLLISION_LOGGING: true
}
```

## 🚀 Características Técnicas

### Rendimiento
- **60 FPS** de renderizado suave
- **100ms** de actualizaciones de red optimizadas
- **Cache inteligente** para enemigos y colisiones
- **Limpieza automática** de recursos

### Compatibilidad
- ✅ Chrome, Firefox, Safari, Edge (versiones modernas)
- ✅ Dispositivos móviles (Android/iOS)
- ✅ Controles táctiles y de teclado
- ✅ Pantallas de diferentes tamaños

### Seguridad
- Validación del servidor para todas las acciones
- Timeouts automáticos para evitar estados bloqueados
- Limpieza de jugadores inactivos
- Detección de trampas y posiciones inválidas

## 🤝 Contribuciones

Las contribuciones son bienvenidas! Por favor:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -m 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

## 👤 Autor

**NikosophosCode**
- Website: [https://nikosophoscode.github.io/](https://nikosophoscode.github.io/)
- Email: nikosophoscode@gmail.com
- GitHub: [@NikosophosCode](https://github.com/NikosophosCode)

## 🎉 Agradecimientos

- Comunidad de desarrolladores web por las herramientas increíbles
- Inspiración en juegos clásicos de batalla multijugador
- Feedback de testers beta

¡Gracias por probar Vartar! Este es mi primer juego multijugador y una excelente práctica para mejorar mis habilidades de programación.

---

*¡Que comience la batalla en Vartar!* ⚔️🎮 
