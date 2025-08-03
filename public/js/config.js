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
            SIZE: 80 // Tamaño fijo en píxeles
        },
        MOVEMENT_SPEED: 5 // Velocidad de movimiento en píxeles
    },
    
    UI: {
        UPDATE_INTERVAL: 50,
        COLLISION_MARGIN: 10
    },
    
    DEBUG: {
        SHOW_TOUCH_GUIDES: true // Cambiar a true para ver las guías y debug
    }
};