/**
 * CombatManager
 * Lógica de selección y resolución de combate.
 */
class CombatManager {
    constructor(game) {
        this.game = game;
        this.playerPowers = [];
        this.enemyPowers = [];
        this.playerVictories = 0;
        this.enemyVictories = 0;
        this.enemyId = null;
        this.combatProcessed = false;
        this.powerInterval = null;
    }

    reset() {
        this.playerPowers = [];
        this.enemyPowers = [];
        this.playerVictories = 0;
        this.enemyVictories = 0;
        this.enemyId = null;
        this.combatProcessed = false;
        if (this.powerInterval) clearInterval(this.powerInterval);
    }

    renderPlayerPowers() {
        try {
            const container = this.game.elements?.powerButtons;
            container.innerHTML = '';
            const char = this.game.characterManager.playerCharacter;
            if (!char) return;
            char.powers.forEach(p => {
                const btn = document.createElement('button');
                btn.id = p.id;
                btn.className = 'boton-de-poderes botonPoderes';
                btn.textContent = p.name;
                btn.addEventListener('click', () => this.selectPower(btn));
                container.appendChild(btn);
            });
        } catch (e) {
            ErrorHandler.logError(e, 'CombatManager.renderPlayerPowers');
        }
    }

    selectPower(btn) {
        if (btn.disabled || this.playerPowers.length >= 6) return;
        this.playerPowers.push(btn.textContent);
        btn.disabled = true;
        btn.style.background = '#0000007d';
        btn.style.color = '#2a2323';
        if (this.playerPowers.length === 6) this.sendPlayerPowers();
    }

    async sendPlayerPowers() {
        try {
            await APIService.sendPowers(this.game.playerId, this.playerPowers);
            this.powerInterval = setInterval(() => this.getEnemyPowers(), Config.UI.UPDATE_INTERVAL);
        } catch (e) {
            ErrorHandler.logError(e, 'CombatManager.sendPlayerPowers');
        }
    }

    async getEnemyPowers() {
        try {
            if (!this.enemyId) return;
            const res = await APIService.getEnemyPowers(this.enemyId);
            if (res.ataques && res.ataques.length === 6) {
                this.enemyPowers = res.ataques;
                clearInterval(this.powerInterval);
                this.processCombat();
            }
        } catch (e) {
            ErrorHandler.logError(e, 'CombatManager.getEnemyPowers');
        }
    }

    handleConfirmedCollision(enemy) {
        this.enemyId = enemy.id;
        this.game.stateManager.setCombatState('in_combat');
        this.renderPlayerPowers();
        this.game.characterManager.displayEnemyCharacter(enemy);
        // Mostrar secciones UI de combate
        const g = this.game.elements;
        g.mapSection.style.display = 'none';
        g.gameEndSection.style.display = 'flex';
        g.sectionPowers.style.display = 'grid';
        g.sectionCharacter.style.display = 'block';
        g.selectedTitle.style.display = 'block';
    }

    processCombat() {
        if (this.combatProcessed) return;
        this.combatProcessed = true;
        this.playerVictories = 0; this.enemyVictories = 0;
        const g = this.game.elements;
        g.playerPowerSpan.innerHTML = '';
        g.enemyPowerSpan.innerHTML = '';
        for (let i = 0; i < this.playerPowers.length; i++) {
            const p = this.playerPowers[i];
            const e = this.enemyPowers[i];
            if (p !== e) {
                if (this.isPlayerWinning(p, e)) this.playerVictories++; else this.enemyVictories++;
            }
            this.displayRound(p, e);
        }
        this.updateScore();
        this.showResult();
    }

    isPlayerWinning(p, e) {
        return Config.GAME.POWER_COMBINATIONS.WINNING.some(([w, l]) => p === w && e === l);
    }

    displayRound(p, e) {
        const pEl = document.createElement('p');
        const eEl = document.createElement('p');
        pEl.textContent = p; eEl.textContent = e;
        this.game.elements.playerPowerSpan.appendChild(pEl);
        this.game.elements.enemyPowerSpan.appendChild(eEl);
    }

    updateScore() {
        this.game.elements.playerLivesSpan.textContent = this.playerVictories;
        this.game.elements.enemyLivesSpan.textContent = this.enemyVictories;
    }

    showResult() {
        let msg, type, id;
        if (this.playerVictories > this.enemyVictories) { msg='¡ENHORABUENA HAS GANADO!🎉'; type='victory'; id='victory-message'; }
        else if (this.playerVictories < this.enemyVictories) { msg='OH, LO SENTIMOS, HAS PERDIDO 😢'; type='defeat'; id='defeat-message'; }
        else { msg='HAS EMPATADO XD'; type='draw'; id='draw-message'; }
        this.displayFinalMessage(msg, type, id);
        this.finalizeCombat();
    }

    displayFinalMessage(message, type, id) {
        if (document.getElementById(id)) return;
        const section = this.game.elements.messageSection;
        section.style.display = 'flex';
        const el = document.createElement('h2');
        el.id = id; el.className = `game-result-message game-result-message--${type}`; el.textContent = message;
        section.appendChild(el);
        document.querySelectorAll('.botonPoderes').forEach(b => b.disabled = true);
    }

    async finalizeCombat() {
        try {
            if (this.game.collisionSystemV2) await this.game.collisionSystemV2.finalizeCombat();
        } catch (e) {
            ErrorHandler.logError(e, 'CombatManager.finalizeCombat');
        } finally {
            this.game.stateManager.setCombatState('free');
            this.game.enemyId = null;
            this.combatProcessed = false;
        }
    }
}
