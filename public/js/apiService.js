class APIService {
    static requestQueue = new Map(); // Cola para evitar peticiones duplicadas
    static connectionStatus = 'online'; // Estado de conexión
    static retryTimeouts = new Map(); // Timeouts para reintentos
    
    static async request(endpoint, options = {}) {
        const url = `${Config.SERVER.BASE_URL}${endpoint}`;
        const requestKey = `${options.method || 'GET'}-${endpoint}`;
        
        // Evitar peticiones duplicadas en cola
        if (this.requestQueue.has(requestKey)) {
            return this.requestQueue.get(requestKey);
        }
        
        console.log('🌐 API: Realizando petición a:', url);
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 5000 // Timeout de 5 segundos
        };
        
        const mergedOptions = { ...defaultOptions, ...options };
        
        // Crear la promesa de la petición con retry automático
        const requestPromise = this.makeRequestWithRetry(url, mergedOptions, endpoint);
        
        // Añadir a la cola
        this.requestQueue.set(requestKey, requestPromise);
        
        try {
            const result = await requestPromise;
            return result;
        } finally {
            // Limpiar de la cola después de completar
            this.requestQueue.delete(requestKey);
        }
    }
    
    static async makeRequestWithRetry(url, options, endpoint, attempt = 1) {
        try {
            // Crear AbortController para timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), options.timeout);
            
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            console.log('📡 API: Respuesta recibida:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status} - ${response.statusText} para URL: ${url}`);
            }
            
            // Marcar conexión como online si la petición fue exitosa
            this.connectionStatus = 'online';
            
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
            console.error(`❌ API: Error en petición (intento ${attempt}):`, error.message);
            
            // Determinar si es un error de red
            const isNetworkError = error.name === 'AbortError' || 
                                 error.message.includes('Failed to fetch') ||
                                 error.message.includes('Network request failed');
            
            if (isNetworkError) {
                this.connectionStatus = 'offline';
            }
            
            // Reintentar si es un error temporal y no hemos superado los intentos máximos
            if (attempt < Config.SERVER.RETRY_ATTEMPTS && (isNetworkError || error.status >= 500)) {
                const delay = this.getRetryDelay(attempt);
                console.log(`🔄 API: Reintentando en ${delay}ms (intento ${attempt + 1}/${Config.SERVER.RETRY_ATTEMPTS})`);
                
                await this.delay(delay);
                return this.makeRequestWithRetry(url, options, endpoint, attempt + 1);
            }
            
            ErrorHandler.logError(error, `API Request: ${endpoint} (intento ${attempt})`);
            throw error;
        }
    }
    
    static getRetryDelay(attempt) {
        // Backoff exponencial con jitter
        const baseDelay = Config.SERVER.RETRY_DELAY;
        const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 1000; // Añadir hasta 1s de jitter
        return Math.min(exponentialDelay + jitter, 10000); // Máximo 10s
    }
    
    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    static getConnectionStatus() {
        return this.connectionStatus;
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
        // Optimización: solo enviar si hay cambios significativos o cada cierto tiempo
        const now = Date.now();
        const key = `position-${playerId}`;
        
        if (!this.lastPositionSent) this.lastPositionSent = new Map();
        const lastSent = this.lastPositionSent.get(key);
        
        // Enviar si es la primera vez, ha pasado suficiente tiempo, o la posición cambió significativamente
        if (!lastSent || 
            now - lastSent.time > 100 || // Máximo cada 100ms
            Math.abs(x - lastSent.x) > 2 || 
            Math.abs(y - lastSent.y) > 2) {
            
            this.lastPositionSent.set(key, { x, y, time: now });
            
            return ErrorHandler.handleAsyncError(
                this.request(`${Config.SERVER.ENDPOINTS.VARTAR}/${playerId}${Config.SERVER.ENDPOINTS.POSITIONS}`, {
                    method: 'POST',
                    body: JSON.stringify({ x: Math.round(x), y: Math.round(y) })
                }),
                'Enviar posición'
            );
        }
        
        // Retornar la última respuesta conocida si no enviamos nueva petición
        return this.lastPositionResponse || { enemigos: [] };
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