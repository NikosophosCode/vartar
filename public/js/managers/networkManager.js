/**
 * NetworkManager
 * Comunicación con el servidor y sincronización de estado.
 */
class NetworkManager {
    constructor(game) {
        this.game = game;
        this.lastNetworkUpdate = 0;
    }

    async joinServer() {
        try {
            this.game.playerId = await APIService.joinServer();
            console.log('Conectado al servidor con ID:', this.game.playerId);
        } catch (e) {
            ErrorHandler.showUserError('No se pudo conectar al servidor');
        }
    }

    async sendCharacter(name) {
        try {
            await APIService.sendCharacter(this.game.playerId, name);
        } catch (e) { ErrorHandler.logError(e, 'NetworkManager.sendCharacter'); }
    }

    async updatePlayerPosition() {
        try {
            const pc = this.game.characterManager.playerCharacter;
            if (!pc) return;
            const { x, y } = pc.position;
            const res = await APIService.sendPosition(this.game.playerId, x, y);
            if (res?.enemigos) this.game.characterManager.updateEnemies(res.enemigos);
            this.handleServerState(res);
        } catch (e) {
            if (!e.message.includes('Failed to fetch')) ErrorHandler.logError(e, 'NetworkManager.updatePlayerPosition');
        }
    }

    async periodicUpdate() {
        const now = Date.now();
        if (now - this.lastNetworkUpdate > Config.UI.NETWORK_UPDATE_INTERVAL) {
            this.lastNetworkUpdate = now;
            await this.updatePlayerPosition();
        }
    }

    async checkServerState() {
        if (this.game.stateManager.gameState !== 'map' || this.game.stateManager.combatState !== 'free') return;
        await this.updatePlayerPosition();
    }

    handleServerState(response) {
        const srvState = response?.estadoPropio;
        if (!srvState) return;
        const mapping = { 'libre': 'free', 'colisionando': 'collision_detected', 'en_combate': 'in_combat' };
        const local = this.game.stateManager.combatState;
        if (srvState === 'colisionando' && local === 'free') {
            this.handleRemoteCollision(response);
            return;
        }
        if (srvState === 'libre' && local !== 'free') {
            this.game.recoverFromCollisionError();
            return;
        }
        if (mapping[srvState] && mapping[srvState] !== local) {
            this.game.stateManager.setCombatState(mapping[srvState]);
        }
    }

    async handleRemoteCollision(response) {
        try {
            const enemy = response.enemigos?.find(e => e.estadoCombate === 'colisionando' && e.enemigoCombate === this.game.playerId);
            if (!enemy) return;
            this.game.stateManager.setCombatState('collision_detected');
            if (this.game.collisionSystemV2) {
                this.game.collisionSystemV2.state = 'requesting';
                this.game.collisionSystemV2.collisionTarget = enemy;
            }
            await APIService.confirmCombat(this.game.playerId);
            this.game.handleConfirmedCollision(enemy, { success: true });
        } catch (e) {
            ErrorHandler.logError(e, 'NetworkManager.handleRemoteCollision');
            this.game.recoverFromCollisionError();
        }
    }
}
