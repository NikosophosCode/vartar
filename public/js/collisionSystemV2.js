/**
 * CollisionSystemV2 - Sistema de colisiones bilateral mejorado
 * Optimizado para multijugador en tiempo real con validación precisa
 */
class CollisionSystemV2 {
    constructor(game) {
        this.game = game;
        this.playerId = game.playerId;
        
        // Estados de colisión mejorados
        this.state = 'idle'; // 'idle', 'detecting', 'requesting', 'confirming', 'in_combat'
        this.collisionTarget = null;
        this.collisionRequestTime = null;
        this.lastCollisionPositions = null;
        
        // Sistema de debouncing por enemigo
        this.enemyDebounceMap = new Map();
        this.collisionCache = new Map();
        
        // Métricas y optimizaciones
        this.metrics = {
            checksPerformed: 0,
            successfulDetections: 0,
            confirmedCollisions: 0,
            lastMetricsReset: Date.now()
        };
        
        // Configuración optimizada
        this.config = {
            detectionRadius: 85,        // Radio de detección más preciso
            confirmationRadius: 75,     // Radio para confirmar colisión (más estricto)
            debounceTime: 300,         // Reducido para mayor responsividad
            requestTimeout: 2500,      // Timeout para confirmación bilateral
            positionTolerance: 5,      // Tolerancia de posición entre cliente/servidor
            maxRetries: 2              // Máximo de reintentos
        };
        
        console.log('🚀 CollisionSystemV2 inicializado');
    }
    
    /**
     * Método principal optimizado para verificar colisiones
     */
    checkCollisions(enemies) {
        if (!this.canPerformCollisionCheck()) {
            return;
        }
        
        this.metrics.checksPerformed++;
        
        // Filtrar y optimizar enemigos válidos
        const validEnemies = this.getValidEnemiesForCollision(enemies);
        if (validEnemies.length === 0) {
            return;
        }
        
        // Verificar colisión con el enemigo más cercano prioritario
        const closestEnemy = this.findClosestValidEnemy(validEnemies);
        if (closestEnemy && this.detectPreciseCollision(closestEnemy)) {
            this.initiateCollisionProcess(closestEnemy);
        }
        
        // Limpiar cache y debounce antiguos
        this.cleanupOldData();
    }
    
    /**
     * Verifica si se puede realizar una verificación de colisión
     */
    canPerformCollisionCheck() {
        return this.state === 'idle' && 
               this.game.playerCharacter && 
               this.game.gameState === 'map' &&
               this.game.combatState === 'free';
    }
    
    /**
     * Obtiene enemigos válidos para colisión con filtros optimizados
     */
    getValidEnemiesForCollision(enemies) {
        const now = Date.now();
        const playerPos = this.game.playerCharacter.position;
        
        return enemies.filter(enemy => {
            // Filtros básicos de validez
            if (!enemy.id || !enemy.position || 
                enemy.estadoCombate !== 'libre' ||
                enemy.estadoCombate === 'en_combate') {
                return false;
            }
            
            // Aplicar debouncing por enemigo
            const debounceKey = enemy.id;
            const lastCheck = this.enemyDebounceMap.get(debounceKey);
            if (lastCheck && (now - lastCheck) < this.config.debounceTime) {
                return false;
            }
            
            // Verificación rápida de distancia para optimizar
            const quickDistance = this.getQuickDistance(playerPos, enemy.position);
            if (quickDistance > this.config.detectionRadius * 1.5) {
                return false; // Demasiado lejos, no vale la pena verificar
            }
            
            // Actualizar timestamp de verificación
            this.enemyDebounceMap.set(debounceKey, now);
            return true;
        });
    }
    
    /**
     * Encuentra el enemigo válido más cercano usando algoritmo optimizado
     */
    findClosestValidEnemy(enemies) {
        if (enemies.length === 0) return null;
        if (enemies.length === 1) return enemies[0];
        
        const playerPos = this.game.playerCharacter.position;
        let closest = null;
        let closestDistance = Infinity;
        
        enemies.forEach(enemy => {
            const distance = this.getPreciseDistance(playerPos, enemy.position);
            if (distance < closestDistance) {
                closestDistance = distance;
                closest = enemy;
            }
        });
        
        return closest;
    }
    
    /**
     * Detección precisa de colisión usando múltiples algoritmos
     */
    detectPreciseCollision(enemy) {
        const player = this.game.playerCharacter;
        
        // 1. Verificación rápida de distancia euclidiana
        const centerDistance = this.getPreciseDistance(player.position, enemy.position);
        if (centerDistance > this.config.detectionRadius) {
            return false;
        }
        
        // 2. Verificación AABB (Axis-Aligned Bounding Box) mejorada
        const playerBounds = this.getOptimizedBounds(player);
        const enemyBounds = this.getOptimizedBounds(enemy);
        
        const aabbCollision = this.checkAABBCollision(playerBounds, enemyBounds);
        if (!aabbCollision) {
            return false;
        }
        
        // 3. Verificación adicional de solapamiento mínimo
        const overlapArea = this.calculateOverlapArea(playerBounds, enemyBounds);
        const minOverlapThreshold = 400; // píxeles cuadrados mínimos
        
        if (overlapArea < minOverlapThreshold) {
            return false;
        }
        
        // Cache el resultado para evitar re-cálculos
        this.cacheCollisionResult(enemy.id, true, centerDistance);
        this.metrics.successfulDetections++;
        
        console.log(`🎯 Colisión precisa detectada con ${enemy.name || enemy.id}, distancia: ${centerDistance.toFixed(1)}px, overlap: ${overlapArea}px²`);
        return true;
    }
    
    /**
     * Calcula bounds optimizados con márgenes ajustados
     */
    getOptimizedBounds(character) {
        const margin = 8; // Margen optimizado
        const size = character.size || { width: 80, height: 80 };
        
        return {
            left: character.position.x + margin,
            right: character.position.x + size.width - margin,
            top: character.position.y + margin,
            bottom: character.position.y + size.height - margin,
            width: size.width - (margin * 2),
            height: size.height - (margin * 2),
            centerX: character.position.x + size.width / 2,
            centerY: character.position.y + size.height / 2
        };
    }
    
    /**
     * Verifica colisión AABB optimizada
     */
    checkAABBCollision(bounds1, bounds2) {
        return !(bounds1.right < bounds2.left || 
                 bounds1.left > bounds2.right || 
                 bounds1.bottom < bounds2.top || 
                 bounds1.top > bounds2.bottom);
    }
    
    /**
     * Calcula el área de solapamiento entre dos bounds
     */
    calculateOverlapArea(bounds1, bounds2) {
        const overlapWidth = Math.max(0, Math.min(bounds1.right, bounds2.right) - Math.max(bounds1.left, bounds2.left));
        const overlapHeight = Math.max(0, Math.min(bounds1.bottom, bounds2.bottom) - Math.max(bounds1.top, bounds2.top));
        return overlapWidth * overlapHeight;
    }
    
    /**
     * Calcula distancia rápida (sin sqrt para optimización inicial)
     */
    getQuickDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        return dx * dx + dy * dy; // Distancia al cuadrado
    }
    
    /**
     * Calcula distancia precisa con sqrt
     */
    getPreciseDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Inicia el proceso de colisión bilateral mejorado
     */
    async initiateCollisionProcess(enemy) {
        if (this.state !== 'idle') {
            console.log('⚠️ CollisionSystemV2: Intento de colisión ignorado, estado actual:', this.state);
            return;
        }
        
        console.log(`🚨 CollisionSystemV2: Iniciando colisión bilateral con ${enemy.name || enemy.id}`);
        
        // Cambiar estado y guardar información
        this.state = 'detecting';
        this.collisionTarget = enemy;
        this.collisionRequestTime = Date.now();
        this.lastCollisionPositions = {
            player: { ...this.game.playerCharacter.position },
            enemy: { ...enemy.position }
        };
        
        // Verificar consistencia de posición antes de solicitar
        if (await this.verifyPositionConsistency(enemy)) {
            await this.requestBilateralCollision(enemy);
        } else {
            console.log('⚠️ CollisionSystemV2: Posiciones inconsistentes, abortando colisión');
            this.resetCollisionState();
        }
    }
    
    /**
     * Verifica consistencia de posiciones entre cliente y servidor
     */
    async verifyPositionConsistency(enemy) {
        try {
            // Obtener posición actualizada del servidor
            const playerPos = this.game.playerCharacter.position;
            const response = await APIService.sendPosition(this.playerId, playerPos.x, playerPos.y);
            
            if (!response || !response.enemigos) {
                return false;
            }
            
            // Buscar el enemigo en la respuesta del servidor
            const serverEnemy = response.enemigos.find(e => e.id === enemy.id);
            if (!serverEnemy) {
                return false;
            }
            
            // Verificar tolerancia de posición
            const positionDifference = this.getPreciseDistance(
                enemy.position,
                { x: serverEnemy.x, y: serverEnemy.y }
            );
            
            const isConsistent = positionDifference <= this.config.positionTolerance;
            console.log(`🔍 Verificación de consistencia: diferencia=${positionDifference.toFixed(1)}px, consistente=${isConsistent}`);
            
            return isConsistent;
            
        } catch (error) {
            console.error('❌ Error verificando consistencia de posición:', error);
            return false;
        }
    }
    
    /**
     * Solicita colisión bilateral al servidor
     */
    async requestBilateralCollision(enemy) {
        this.state = 'requesting';
        
        try {
            const response = await APIService.requestCollision(
                this.playerId,
                enemy.id,
                this.lastCollisionPositions.player,
                this.lastCollisionPositions.enemy
            );
            
            console.log('📡 CollisionSystemV2: Respuesta del servidor:', response);
            
            if (response && response.success) {
                await this.confirmBilateralCollision(response);
            } else {
                console.log(`⚠️ CollisionSystemV2: Colisión rechazada - ${response?.mensaje || 'Error desconocido'}`);
                this.resetCollisionState();
            }
            
        } catch (error) {
            console.error('❌ CollisionSystemV2: Error solicitando colisión:', error);
            this.resetCollisionState();
        }
    }
    
    /**
     * Confirma colisión bilateral y procede al combate
     */
    async confirmBilateralCollision(collisionResponse) {
        console.log('✅ CollisionSystemV2: Confirmando colisión bilateral');
        
        this.state = 'confirming';
        
        try {
            // Confirmar entrada a combate en el servidor
            await APIService.confirmCombat(this.playerId);
            
            // Actualizar estado y métricas
            this.state = 'in_combat';
            this.metrics.confirmedCollisions++;
            
            // Proceder al combate
            this.game.handleConfirmedCollision(this.collisionTarget, collisionResponse);
            
            console.log('⚔️ CollisionSystemV2: Combate iniciado exitosamente');
            
        } catch (error) {
            console.error('❌ CollisionSystemV2: Error confirmando colisión:', error);
            this.resetCollisionState();
        }
    }
    
    /**
     * Finaliza el combate y restaura el sistema
     */
    async finalizeCombat() {
        if (this.state !== 'in_combat') {
            console.log('⚠️ CollisionSystemV2: Intento de finalizar combate en estado incorrecto:', this.state);
            return;
        }
        
        console.log('🏁 CollisionSystemV2: Finalizando combate');
        
        try {
            await APIService.finalizeCombat(this.playerId);
            this.resetCollisionState();
            console.log('✅ CollisionSystemV2: Combate finalizado correctamente');
            
        } catch (error) {
            console.error('❌ CollisionSystemV2: Error finalizando combate:', error);
            // Resetear estado local incluso si falla el servidor
            this.resetCollisionState();
        }
    }
    
    /**
     * Resetea el estado del sistema de colisiones
     */
    resetCollisionState() {
        const previousState = this.state;
        
        this.state = 'idle';
        this.collisionTarget = null;
        this.collisionRequestTime = null;
        this.lastCollisionPositions = null;
        
        console.log(`🔄 CollisionSystemV2: Estado reseteado de '${previousState}' a 'idle'`);
    }
    
    /**
     * Cache de resultados de colisión para optimización
     */
    cacheCollisionResult(enemyId, result, distance) {
        const cacheKey = `${enemyId}_${Date.now()}`;
        this.collisionCache.set(cacheKey, { result, distance, timestamp: Date.now() });
        
        // Limpiar cache antigua (mantener solo últimos 10 resultados)
        if (this.collisionCache.size > 10) {
            const oldestKey = this.collisionCache.keys().next().value;
            this.collisionCache.delete(oldestKey);
        }
    }
    
    /**
     * Limpia datos antiguos para optimización de memoria
     */
    cleanupOldData() {
        const now = Date.now();
        const maxAge = 5000; // 5 segundos
        
        // Limpiar debounce map
        for (const [key, timestamp] of this.enemyDebounceMap.entries()) {
            if (now - timestamp > maxAge) {
                this.enemyDebounceMap.delete(key);
            }
        }
        
        // Limpiar collision cache
        for (const [key, data] of this.collisionCache.entries()) {
            if (now - data.timestamp > maxAge) {
                this.collisionCache.delete(key);
            }
        }
    }
    
    /**
     * Obtiene información del estado actual
     */
    getSystemState() {
        return {
            state: this.state,
            target: this.collisionTarget?.id || null,
            requestTime: this.collisionRequestTime,
            metrics: { ...this.metrics },
            cacheSize: this.collisionCache.size,
            debounceMapSize: this.enemyDebounceMap.size
        };
    }
    
    /**
     * Dibuja información de debug mejorada
     */
    drawDebugInfo(ctx) {
        if (!Config.DEBUG?.SHOW_COLLISION_BOUNDS || !ctx) return;
        
        ctx.save();
        
        // Información del estado del sistema
        const stateInfo = this.getSystemState();
        const stateColors = {
            'idle': '#00FF00',
            'detecting': '#FFAA00',
            'requesting': '#FF8800', 
            'confirming': '#FF6600',
            'in_combat': '#FF0000'
        };
        
        const color = stateColors[stateInfo.state] || '#FFFFFF';
        
        // Panel de información
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(10, 10, 300, 100);
        
        // Información del estado
        ctx.fillStyle = color;
        ctx.font = '12px Arial';
        ctx.fillText(`Estado: ${stateInfo.state}`, 15, 25);
        
        if (stateInfo.target) {
            ctx.fillText(`Target: ${stateInfo.target}`, 15, 40);
        }
        
        // Métricas
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(`Checks: ${stateInfo.metrics.checksPerformed}`, 15, 55);
        ctx.fillText(`Detecciones: ${stateInfo.metrics.successfulDetections}`, 15, 70);
        ctx.fillText(`Confirmadas: ${stateInfo.metrics.confirmedCollisions}`, 15, 85);
        
        // Indicador visual de estado
        ctx.beginPath();
        ctx.arc(280, 55, 10, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        
        ctx.restore();
    }
    
    /**
     * Limpieza de recursos
     */
    cleanup() {
        this.resetCollisionState();
        this.enemyDebounceMap.clear();
        this.collisionCache.clear();
        console.log('🧹 CollisionSystemV2: Recursos limpiados');
    }
}
