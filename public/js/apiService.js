class APIService {
    static async request(endpoint, options = {}) {
        const url = `${Config.SERVER.BASE_URL}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        const mergedOptions = { ...defaultOptions, ...options };
        
        try {
            const response = await fetch(url, mergedOptions);
            
            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                return await response.text();
            }
        } catch (error) {
            ErrorHandler.logError(error, `API Request: ${endpoint}`);
            throw error;
        }
    }
    
    static async joinServer() {
        return ErrorHandler.handleAsyncError(
            this.request(Config.SERVER.ENDPOINTS.USERS),
            'Unirse al servidor'
        );
    }
    
    static async sendCharacter(playerId, character) {
        return ErrorHandler.handleAsyncError(
            this.request(`${Config.SERVER.ENDPOINTS.VARTAR}/${playerId}`, {
                method: 'POST',
                body: JSON.stringify({ personaje: character })
            }),
            'Enviar personaje'
        );
    }
    
    static async sendPosition(playerId, x, y) {
        return ErrorHandler.handleAsyncError(
            this.request(`${Config.SERVER.ENDPOINTS.VARTAR}/${playerId}${Config.SERVER.ENDPOINTS.POSITIONS}`, {
                method: 'POST',
                body: JSON.stringify({ x, y })
            }),
            'Enviar posición'
        );
    }
    
    static async sendPowers(playerId, powers) {
        return ErrorHandler.handleAsyncError(
            this.request(`${Config.SERVER.ENDPOINTS.VARTAR}/${playerId}${Config.SERVER.ENDPOINTS.POWERS}`, {
                method: 'POST',
                body: JSON.stringify({ ataques: powers })
            }),
            'Enviar poderes'
        );
    }
    
    static async getEnemyPowers(enemyId) {
        return ErrorHandler.handleAsyncError(
            this.request(`${Config.SERVER.ENDPOINTS.VARTAR}/${enemyId}${Config.SERVER.ENDPOINTS.POWERS}`),
            'Obtener poderes del enemigo'
        );
    }
}