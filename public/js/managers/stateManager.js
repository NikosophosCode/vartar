/**
 * GameStateManager
 * Encapsula estado global simple del juego y control de intervalos.
 */
class GameStateManager {
    constructor(game) {
        this.game = game;
        this.gameState = 'character-selection'; // character-selection | map | combat
        this.combatState = 'free'; // free | collision_detected | in_combat
        this.intervals = new Map();
    }

    setGameState(state) {
        if (this.gameState !== state) {
            this.gameState = state;
        }
    }

    setCombatState(state) {
        if (this.combatState !== state) {
            this.combatState = state;
        }
    }

    startInterval(key, fn, ms) {
        this.clearInterval(key);
        const id = setInterval(fn, ms);
        this.intervals.set(key, id);
        return id;
    }

    clearInterval(key) {
        const id = this.intervals.get(key);
        if (id) {
            clearInterval(id);
            this.intervals.delete(key);
        }
    }

    clearAll() {
        for (const id of this.intervals.values()) clearInterval(id);
        this.intervals.clear();
    }
}
