/**
 * CollisionSystemV2 (Simplificado)
 * Unificación de los dos sistemas previos en una implementación clara y mantenible.
 * Estados: idle -> requesting -> in_combat -> (finalize/reset) -> idle
 */
class CollisionSystemV2 {
    constructor(game) {
        this.game = game;
        this.playerId = game.playerId;

        // Estado básico
        this.state = 'idle'; // idle | requesting | in_combat | cooldown
        this.collisionTarget = null;
        this.collisionRequestTime = null;
        this.cooldownUntil = 0;

        // Métricas simples
        this.metrics = {
            framesChecked: 0,
            enemiesScanned: 0,
            collisionsDetected: 0,
            collisionsConfirmed: 0,
            lastReset: Date.now()
        };

        // Config derivada (usa Config.COLLISION si existe, con fallback)
        const C = Config?.COLLISION || {};
        this.cfg = {
            detectionRadius: C.DETECTION_DISTANCE || 85,
            minOverlap: C.MIN_OVERLAP_AREA || 400,
            debounceMs: C.DEBOUNCE_TIME || 300,
            requestTimeout: C.REQUEST_TIMEOUT || 2500,
            cooldownMs: 800
        };

        // Debounce por enemigo
        this.enemyAttemptAt = new Map();

        // Diagnóstico inicial
        this.runDiagnostics();
        console.log('🔧 CollisionSystemV2 simplificado listo');
    }

    // ------------------ API PÚBLICA PRINCIPAL ------------------
    checkCollisions(enemies) {
        if (!this._canCheck()) return;
        if (!Array.isArray(enemies) || enemies.length === 0) return;

        this.metrics.framesChecked++;
        const player = this.game.playerCharacter;
        const pPos = player.position;
        const radiusSq = this.cfg.detectionRadius ** 2;

        let candidate = null;
        let bestDistSq = Infinity;

        for (const enemy of enemies) {
            if (!enemy || enemy.id === this.playerId) continue;
            this.metrics.enemiesScanned++;
            const lastAttempt = this.enemyAttemptAt.get(enemy.id) || 0;
            if (Date.now() - lastAttempt < this.cfg.debounceMs) continue;

            const dx = pPos.x - enemy.position.x;
            const dy = pPos.y - enemy.position.y;
            const distSq = dx * dx + dy * dy;
            if (distSq > radiusSq) continue;

            // Bounds / AABB
            const pBounds = player.getBounds();
            const eBounds = enemy.getBounds ? enemy.getBounds() : this._fallbackBounds(enemy);
            if (!this._aabbOverlap(pBounds, eBounds)) continue;

            const overlapArea = this._overlapArea(pBounds, eBounds);
            if (overlapArea < this.cfg.minOverlap) continue;

            if (distSq < bestDistSq) {
                candidate = enemy;
                bestDistSq = distSq;
            }
        }

        if (candidate) {
            this.metrics.collisionsDetected++;
            this.enemyAttemptAt.set(candidate.id, Date.now());
            this._initiateCollision(candidate).catch(err => ErrorHandler.logError(err, 'CollisionSystemV2._initiateCollision'));
        }
    }

    async finalizeCombat() {
        if (this.state !== 'in_combat') return;
        try {
            await APIService.finalizeCombat(this.playerId);
        } catch (e) {
            ErrorHandler.logError(e, 'CollisionSystemV2.finalizeCombat');
        } finally {
            this.resetCollisionState();
        }
    }

    resetCollisionState() {
        this.state = 'idle';
        this.collisionTarget = null;
        this.collisionRequestTime = null;
        this.cooldownUntil = 0;
    }

    getSystemState() {
        return {
            state: this.state,
            target: this.collisionTarget?.id || null,
            requestTime: this.collisionRequestTime,
            metrics: { ...this.metrics }
        };
    }

    drawDebugInfo(ctx) {
        if (!ctx) return;
        const s = this.getSystemState();
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(8, 8, 240, 90);
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.fillText('CollisionSystem (simple)', 14, 24);
        ctx.fillText(`Estado: ${s.state}`, 14, 40);
        ctx.fillText(`Objetivo: ${s.target || '-'}`, 14, 56);
        ctx.fillText(`Det/Conf: ${s.metrics.collisionsDetected}/${s.metrics.collisionsConfirmed}`, 14, 72);
        ctx.restore();
    }

    cleanup() {
        this.resetCollisionState();
        this.enemyAttemptAt.clear();
    }

    // ------------------ IMPLEMENTACIÓN INTERNA ------------------
    _canCheck() {
        return this.state === 'idle' &&
            this.game.gameState === 'map' &&
            this.game.combatState === 'free' &&
            Date.now() > this.cooldownUntil &&
            this.game.playerCharacter;
    }

    _fallbackBounds(enemy) {
        const size = enemy.size || { width: 80, height: 80 };
        const m = Config.UI.COLLISION_MARGIN || 8;
        return {
            left: enemy.position.x + m,
            right: enemy.position.x + size.width - m,
            top: enemy.position.y + m,
            bottom: enemy.position.y + size.height - m
        };
    }

    _aabbOverlap(a, b) {
        return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
    }

    _overlapArea(a, b) {
        const w = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
        const h = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
        return w * h;
    }

    async _initiateCollision(enemy) {
        if (this.state !== 'idle') return; // doble guardia
        this.state = 'requesting';
        this.collisionTarget = enemy;
        this.collisionRequestTime = Date.now();
        console.log('🚨 CollisionSystemV2: solicitando colisión con', enemy.id);
        try {
            const response = await APIService.requestCollision(
                this.playerId,
                enemy.id,
                this.game.playerCharacter.position,
                enemy.position
            );
            if (!response || !response.success) {
                console.warn('⚠️ Respuesta de colisión no exitosa', response);
                return this._enterCooldown();
            }
            await APIService.confirmCombat(this.playerId);
            this.state = 'in_combat';
            this.metrics.collisionsConfirmed++;
            this.game.handleConfirmedCollision(enemy, response);
        } catch (e) {
            ErrorHandler.logError(e, 'CollisionSystemV2._initiateCollision');
            this._enterCooldown();
        }
    }

    _enterCooldown() {
        this.state = 'cooldown';
        this.cooldownUntil = Date.now() + this.cfg.cooldownMs;
        this.collisionTarget = null;
        setTimeout(() => {
            if (this.state === 'cooldown' && Date.now() >= this.cooldownUntil) {
                this.resetCollisionState();
            }
        }, this.cfg.cooldownMs + 20);
    }

    // ------------------ DIAGNÓSTICOS ------------------
    runDiagnostics() {
        try {
            const issues = [];
            if (!this.game) issues.push('Game instance inexistente');
            if (!Config) issues.push('Config global no definido');
            if (!APIService) issues.push('APIService no disponible');
            if (typeof ErrorHandler?.logError !== 'function') issues.push('ErrorHandler inválido');
            if (issues.length) {
                ErrorHandler.logError(new Error('Diagnósticos de colisiones: ' + issues.join(' | ')), 'CollisionSystemV2.runDiagnostics');
            }
        } catch (err) {
            // Última línea de defensa: no romper constructor.
            console.error('Error en runDiagnostics CollisionSystemV2', err);
        }
    }
}
