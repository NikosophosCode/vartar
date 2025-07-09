const Config = {
    SERVER: {
        BASE_URL: 'http://localhost:3000',
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
        
        MAP: {
            MAX_WIDTH: 900,
            ASPECT_RATIO: 3/4,
            MARGIN: 20
        },
        
        PLAYER: {
            SPEED: 5,
            SIZE_RATIO: 100
        }
    },
    
    UI: {
        UPDATE_INTERVAL: 50,
        COLLISION_MARGIN: 25
    }
};