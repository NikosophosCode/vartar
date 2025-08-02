class APIService {
    static async request(endpoint, options = {}) {
        const url = `${Config.SERVER.BASE_URL}${endpoint}`;
        console.log('🌐 API: Realizando petición a:', url);
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        const mergedOptions = { ...defaultOptions, ...options };
        
        try {
            const response = await fetch(url, mergedOptions);
            console.log('📡 API: Respuesta recibida:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status} - ${response.statusText} para URL: ${url}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                console.log('✅ API: Datos JSON recibidos:', data);
                return data;
            } else {
                const text = await response.text();
                console.log('✅ API: Texto recibido:', text);
                return text;
            }
        } catch (error) {
            console.error('❌ API: Error en petición:', error.message);
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