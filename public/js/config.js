const Config = {
    SERVER: {
        BASE_URL: 'http://localhost:8080',
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
        }
    },
    
    UI: {
        UPDATE_INTERVAL: 50,
        COLLISION_MARGIN: 10
    }
};