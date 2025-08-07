const Config = {
    SERVER: {
        // Detectar automáticamente la URL base según el host
        BASE_URL: (() => {
            const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                ? 'http://localhost:8080' 
                : `http://${window.location.hostname}:8080`;
            console.log('🔗 Config: URL base detectada:', baseUrl);
            console.log('🌐 Config: Hostname actual:', window.location.hostname);
            return baseUrl;
        })(),
        ENDPOINTS: {
            USERS: '/users',
            VARTAR: '/vartar',
            POSITIONS: '/posicion',
            POWERS: '/poderes'
        },
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000
    },
    
    GAME: {
        POWERS: {
            FUEGO: { name: "FUEGO 🔥", id: "FUEGO" },
            AGUA: { name: "AGUA 💧", id: "AGUA" },
            TIERRA: { name: "TIERRA 🌎", id: "TIERRA" },
            AIRE: { name: "AIRE ☁", id: "AIRE" }
        },
        
        POWER_COMBINATIONS: {
            WINNING: [
                ['FUEGO 🔥', 'TIERRA 🌎'],
                ['AGUA 💧', 'FUEGO 🔥'],
                ['TIERRA 🌎', 'AIRE ☁'],
                ['AIRE ☁', 'AGUA 💧'],
                ['AIRE ☁', 'FUEGO 🔥'],
                ['TIERRA 🌎', 'AGUA 💧']
            ]
        },
        
        PLAYER: {
            SPEED: 5,
            SIZE: 80, // Tamaño fijo en píxeles
            INTERPOLATION_SPEED: 0.15 // Velocidad de interpolación para enemigos
        },
        MOVEMENT_SPEED: 5 // Velocidad de movimiento en píxeles
    },
    
    UI: {
        UPDATE_INTERVAL: 16, // ~60fps para renderizado suave
        NETWORK_UPDATE_INTERVAL: 100, // Actualizaciones de red cada 100ms
        COLLISION_MARGIN: 10
    },
    
    COLLISION: {
        // Sistema V2 - Configuración optimizada y precisa
        DETECTION_DISTANCE: 85,      // Radio de detección inicial (más preciso)
        CONFIRMATION_DISTANCE: 75,    // Radio para confirmar colisión (más estricto)
        MIN_OVERLAP_AREA: 400,       // Área mínima de solapamiento en píxeles cuadrados
        DEBOUNCE_TIME: 300,          // Tiempo mínimo entre detecciones por enemigo (0.3s)
        REQUEST_TIMEOUT: 2500,       // Timeout para confirmación bilateral (2.5s)
        POSITION_TOLERANCE: 8,       // Tolerancia de posición entre cliente/servidor
        MAX_RETRY_ATTEMPTS: 2,       // Intentos máximos para establecer colisión
        
        // Optimizaciones de rendimiento
        CACHE_CLEANUP_INTERVAL: 5000, // Limpiar cache cada 5s
        MAX_CACHE_SIZE: 20,           // Máximo de entradas en cache
        DISTANCE_CHECK_OPTIMIZATION: true, // Usar verificación rápida de distancia
        
        // Configuración de bounds
        COLLISION_MARGIN: 8,          // Margen interno para bounds más precisos
        BOUNDS_OPTIMIZATION: true     // Usar bounds optimizados
    },
    
    DEBUG: {
        SHOW_TOUCH_GUIDES: false,        // Ver guías táctiles en desarrollo
        SHOW_COLLISION_BOUNDS: false,     // Mostrar áreas de colisión
        SHOW_COLLISION_SYSTEM_V2: false,  // Mostrar información del sistema V2
        COLLISION_OPTIMIZATION_METRICS: false, // Mostrar métricas de optimización
        VERBOSE_COLLISION_LOGGING: false  // Logging detallado de colisiones
    },
    
    // Nuevas configuraciones modernas
    MOBILE: {
        JOYSTICK: {
            SIZE: 120,
            DEAD_ZONE: 0.2,
            MAX_DISTANCE: 50,
            ALPHA: 0.8,
            HAPTIC_FEEDBACK: true,
            SMOOTHING: 0.8,
            AUTO_HIDE: true,
            HIDE_DELAY: 2000
        },
        TOUCH: {
            SWIPE_THRESHOLD: 50,
            DOUBLE_TAP_DELAY: 300,
            LONG_PRESS_DELAY: 500,
            GESTURE_RECOGNITION: true
        },
        ORIENTATION: {
            LOCK_LANDSCAPE: false,
            ADAPT_UI: true,
            SHOW_ROTATION_HINT: true
        }
    },
    
    UI_MODERN: {
        THEME: {
            DEFAULT: 'gaming',
            ANIMATIONS: true,
            TRANSITIONS: true,
            PARTICLE_EFFECTS: true,
            GLASS_EFFECTS: true
        },
        NOTIFICATIONS: {
            DURATION: 3000,
            MAX_VISIBLE: 3,
            POSITION: 'top-right',
            HAPTIC_FEEDBACK: true
        },
        PERFORMANCE: {
            REDUCE_MOTION: false,
            LOW_POWER_MODE: false,
            ADAPTIVE_QUALITY: true,
            FPS_TARGET: 60
        }
    },
    
    AUDIO: {
        ENABLED: true,
        MASTER_VOLUME: 0.7,
        EFFECTS: {
            UI_SOUNDS: true,
            MOVEMENT: true,
            COMBAT: true,
            AMBIENT: true
        },
        FORMATS: ['webm', 'ogg', 'mp3'],
        PRELOAD: true
    },
    
    GRAPHICS: {
        CANVAS: {
            ALPHA: true,
            ANTIALIAS: true,
            PRESERVE_DRAWING_BUFFER: false,
            POWER_PREFERENCE: 'high-performance'
        },
        EFFECTS: {
            SHADOWS: true,
            GLOW: true,
            PARTICLES: true,
            SCREEN_SHAKE: true
        },
        QUALITY: {
            AUTO_ADJUST: true,
            MIN_FPS: 30,
            TARGET_FPS: 60
        }
    },
    
    NETWORK: {
        REALTIME: false, // Socket.IO cuando esté implementado
        HEARTBEAT_INTERVAL: 30000,
        RECONNECT_ATTEMPTS: 5,
        RECONNECT_DELAY: 1000,
        COMPRESSION: true
    }
};