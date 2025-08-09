/**
 * InputManager
 * Entradas de teclado y botones.
 */
class InputManager {
    constructor(game) {
        this.game = game;
    }

    init() {
        const g = this.game;
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', () => this.stopMovement());
        // Botones direccionales
        const dirs = [
            { el: g.elements.upButton, d: 'up' },
            { el: g.elements.downButton, d: 'down' },
            { el: g.elements.leftButton, d: 'left' },
            { el: g.elements.rightButton, d: 'right' }
        ];
        dirs.forEach(({ el, d }) => {
            el.addEventListener('mousedown', (ev) => this.move(ev, d));
            el.addEventListener('mouseup', () => this.stopMovement());
            el.addEventListener('touchstart', (ev) => this.move(ev, d));
            el.addEventListener('touchend', () => this.stopMovement());
        });
    }

    move(event, direction) {
        event.preventDefault();
        const pc = this.game.characterManager.playerCharacter;
        if (!pc) return;
        const speed = Config.GAME.PLAYER.SPEED;
        const map = { up:[0,-speed], down:[0,speed], left:[-speed,0], right:[speed,0] };
        const [x,y] = map[direction] || [0,0];
        pc.setVelocity(x,y);
    }

    handleKeyDown(e) {
        const mapping = { ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right' };
        const dir = mapping[e.key];
        if (dir) this.move(e, dir);
    }

    stopMovement() {
        const pc = this.game.characterManager.playerCharacter;
        if (pc) pc.stop();
    }
}
