/**
 * CollisionManager - Sistema de detección y manejo de colisiones bilateral
 * Optimizado para multijugador en tiempo real con validación del servidor
 */
class CollisionManager {
    constructor(game) {
        this.game = game;
        this.playerId = game.playerId;
        this.collisionState = 'free'; // Estados: 'free', 'detecting', 'confirmed', 'in_combat'
        this.currentTarget = null;
        this.collisionStartTime = null;
        this.lastCollisionCheck = new Map(); // Debouncing por enemigo
        this.confirmationTimeouts = new Map(); // Timeouts de confirmación
        
        // Métricas de rendimiento
        this.collisionChecks = 0;
        this.successfulCollisions = 0;
        this.lastMetricsLog = Date.now();
    }
    
    /**
     * Método principal para verificar colisiones con todos los enemigos
     */
    checkCollisions(enemies) {
        // Solo verificar colisiones si estamos completamente libres
        if (this.collisionState !== 'free' || !this.game.playerCharacter) {
            return;
        }
        
        // No verificar colisiones locales si el juego está procesando una colisión remota
        if (this.game.combatState === 'collision_detected') {
            return;
        }
        
        this.collisionChecks++;
        
        // Verificar colisión con cada enemigo
        for (const enemy of enemies) {
            if (this.shouldCheckCollisionWith(enemy)) {
                const collision = this.detectCollision(this.game.playerCharacter, enemy);
                
                if (collision) {
                    this.initiateCollision(enemy);
                    break; // Solo una colisión a la vez
                }
            }
        }
        
        // Log de métricas periódicamente
        this.logMetricsIfNeeded();
    }
    
    /**
     * Verifica si se debe comprobar colisión con un enemigo específico
     */
    shouldCheckCollisionWith(enemy) {
        // No verificar colisión con enemigos en combate
        if (enemy.estadoCombate && enemy.estadoCombate !== 'libre') {
            return false;
        }
        
        // Aplicar debouncing para evitar spam de detecciones
        const enemyKey = enemy.id;
        const lastCheck = this.lastCollisionCheck.get(enemyKey);
        const now = Date.now();
        
        if (lastCheck && (now - lastCheck) < Config.COLLISION.DEBOUNCE_TIME) {
            return false;
        }
        
        this.lastCollisionCheck.set(enemyKey, now);
        return true;
    }
    
    /**
     * Detecta colisión usando algoritmo AABB (Axis-Aligned Bounding Box) optimizado
     */
    detectCollision(player, enemy) {
        const playerBounds = this.getOptimizedBounds(player);
        const enemyBounds = this.getOptimizedBounds(enemy);
        
        // Verificación rápida de distancia euclidiana primero
        const centerDistance = this.getCenterDistance(playerBounds, enemyBounds);
        if (centerDistance > Config.COLLISION.DETECTION_DISTANCE) {
            return false;
        }
        
        // Verificación AABB precisa
        const collision = !(
            playerBounds.bottom < enemyBounds.top ||
            playerBounds.top > enemyBounds.bottom ||
            playerBounds.right < enemyBounds.left ||
            playerBounds.left > enemyBounds.right
        );
        
        if (Config.DEBUG.SHOW_COLLISION_BOUNDS && collision) {
            this.drawCollisionDebug(playerBounds, enemyBounds);
        }
        
        return collision;
    }
    
    /**
     * Obtiene bounds optimizados con márgenes ajustados
     */
    getOptimizedBounds(character) {
        const margin = Config.UI.COLLISION_MARGIN;
        return {
            left: character.position.x + margin,
            right: character.position.x + character.size.width - margin,
            top: character.position.y + margin,
            bottom: character.position.y + character.size.height - margin,
            centerX: character.position.x + character.size.width / 2,
            centerY: character.position.y + character.size.height / 2
        };
    }
    
    /**
     * Calcula la distancia entre centros de dos bounds
     */
    getCenterDistance(bounds1, bounds2) {
        const dx = bounds1.centerX - bounds2.centerX;
        const dy = bounds1.centerY - bounds2.centerY;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Inicia el proceso de colisión bilateral
     */
    async initiateCollision(enemy) {
        if (this.collisionState !== 'free') {
            console.log('⚠️ CollisionManager: No se puede iniciar colisión, estado actual:', this.collisionState);
            return;
        }
        
        if (!enemy || !enemy.id) {
            console.error('❌ CollisionManager: Enemy inválido en initiateCollision:', enemy);
            return;
        }
        
        console.log('🚨 CollisionManager: Iniciando colisión con', enemy.name || enemy.id);
        
        this.collisionState = 'detecting';
        this.currentTarget = enemy;
        this.collisionStartTime = Date.now();
        
        console.log('📊 CollisionManager: Estado actualizado a detecting, target:', this.currentTarget?.id);
        
        try {
            // Solicitar colisión bilateral al servidor
            const response = await APIService.requestCollision(
                this.playerId,
                enemy.id,
                this.game.playerCharacter.position,
                enemy.position
            );
            
            console.log('📡 CollisionManager: Respuesta del servidor:', response);
            
            if (response && response.success) {
                console.log('✅ CollisionManager: Servidor confirmó colisión, procediendo...');
                await this.confirmCollision(response);
            } else {
                console.log('⚠️ CollisionManager: Colisión rechazada por servidor:', response?.mensaje);
                this.resetCollisionState();
            }
            
        } catch (error) {
            console.error('❌ CollisionManager: Error en initiateCollision:', error);
            ErrorHandler.logError(error, 'CollisionManager.initiateCollision');
            this.resetCollisionState();
        }
    }
    
    /**
     * Confirma la colisión y procede al combate
     */
    async confirmCollision(collisionResponse) {
        console.log('✅ CollisionManager: Colisión confirmada, entrando en combate');
        
        this.collisionState = 'confirmed';
        this.successfulCollisions++;
        
        // Guardar referencia al target antes de las operaciones asíncronas
        const targetEnemy = this.currentTarget;
        
        if (!targetEnemy) {
            console.error('❌ CollisionManager: currentTarget es null en confirmCollision');
            this.resetCollisionState();
            return;
        }
        
        try {
            // Confirmar entrada a combate en el servidor
            await APIService.confirmCombat(this.playerId);
            
            // Actualizar estado local
            this.collisionState = 'in_combat';
            
            // Proceder al combate en el juego usando la referencia guardada
            this.game.handleConfirmedCollision(targetEnemy, collisionResponse);
            
        } catch (error) {
            ErrorHandler.logError(error, 'CollisionManager.confirmCollision');
            this.resetCollisionState();
        }
    }
    
    /**
     * Finaliza el combate y restaura el estado libre
     */
    async finalizeCombat() {
        if (this.collisionState !== 'in_combat') {
            return;
        }
        
        console.log('🏁 CollisionManager: Finalizando combate');
        
        try {
            await APIService.finalizeCombat(this.playerId);
            this.resetCollisionState();
            console.log('✅ CollisionManager: Combate finalizado, estado restaurado');
            
        } catch (error) {
            ErrorHandler.logError(error, 'CollisionManager.finalizeCombat');
            // Resetear estado local incluso si falla la petición al servidor
            this.resetCollisionState();
        }
    }
    
    /**
     * Resetea el estado de colisión
     */
    resetCollisionState() {
        console.log('🔄 CollisionManager: Reseteando estado de colisión desde:', this.collisionState);
        
        this.collisionState = 'free';
        this.currentTarget = null;
        this.collisionStartTime = null;
        
        // Limpiar timeouts pendientes
        this.confirmationTimeouts.forEach(timeout => clearTimeout(timeout));
        this.confirmationTimeouts.clear();
        
        console.log('✅ CollisionManager: Estado reseteado a free');
    }
    
    /**
     * Verifica si el jugador está libre para nuevas colisiones
     */
    isAvailableForCollision() {
        return this.collisionState === 'free';
    }
    
    /**
     * Obtiene el estado actual de colisión
     */
    getCollisionState() {
        return {
            state: this.collisionState,
            target: this.currentTarget?.id || null,
            startTime: this.collisionStartTime
        };
    }
    
    /**
     * Dibuja información de debug para colisiones
     */
    drawCollisionDebug(playerBounds, enemyBounds) {
        if (!this.game.ctx) return;
        
        const ctx = this.game.ctx;
        
        // Guardar estado del contexto
        ctx.save();
        
        // Dibujar bounds del jugador (verde)
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            playerBounds.left,
            playerBounds.top,
            playerBounds.right - playerBounds.left,
            playerBounds.bottom - playerBounds.top
        );
        
        // Dibujar bounds del enemigo (rojo)
        ctx.strokeStyle = '#FF0000';
        ctx.strokeRect(
            enemyBounds.left,
            enemyBounds.top,
            enemyBounds.right - enemyBounds.left,
            enemyBounds.bottom - enemyBounds.top
        );
        
        // Dibujar línea de conexión
        ctx.strokeStyle = '#FFFF00';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(playerBounds.centerX, playerBounds.centerY);
        ctx.lineTo(enemyBounds.centerX, enemyBounds.centerY);
        ctx.stroke();
        
        // Dibujar indicador de estado de colisión
        this.drawCollisionStatusIndicator(ctx);
        
        // Restaurar estado del contexto
        ctx.restore();
    }
    
    /**
     * Dibuja un indicador visual del estado de colisión
     */
    drawCollisionStatusIndicator(ctx) {
        const statusColors = {
            'free': '#00FF00',
            'detecting': '#FFAA00', 
            'confirmed': '#FF6600',
            'in_combat': '#FF0000'
        };
        
        const color = statusColors[this.collisionState] || '#FFFFFF';
        const x = 10;
        const y = 30;
        
        // Fondo del indicador
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x - 5, y - 15, 120, 20);
        
        // Texto del estado
        ctx.fillStyle = color;
        ctx.font = '12px Arial';
        ctx.fillText(`Estado: ${this.collisionState}`, x, y);
        
        // Indicador circular
        ctx.beginPath();
        ctx.arc(x + 130, y - 5, 5, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
    }
    
    /**
     * Log de métricas de rendimiento
     */
    logMetricsIfNeeded() {
        const now = Date.now();
        if (now - this.lastMetricsLog > 10000) { // Cada 10 segundos
            const successRate = this.collisionChecks > 0 ? 
                (this.successfulCollisions / this.collisionChecks * 100).toFixed(1) : 0;
                
            console.log(`📊 CollisionManager Metrics: ${this.collisionChecks} checks, ${this.successfulCollisions} successful (${successRate}%)`);
            
            // Reset métricas
            this.collisionChecks = 0;
            this.successfulCollisions = 0;
            this.lastMetricsLog = now;
        }
    }
    
    /**
     * Limpia recursos y timeouts
     */
    cleanup() {
        this.resetCollisionState();
        this.lastCollisionCheck.clear();
    }
}
