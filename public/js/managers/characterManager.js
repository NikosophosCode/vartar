/**
 * CharacterManager
 * Maneja creación, selección y renderizado de personajes y enemigos.
 */
class CharacterManager {
    constructor(game) {
        this.game = game;
        this.characters = [];
        this.enemies = [];
        this.playerCharacter = null;
    }

    initCharacters() {
        try {
            const data = [
                { name: 'sinji', powers: ['TIERRA 🌎','TIERRA 🌎','TIERRA 🌎','FUEGO 🔥','AGUA 💧','AIRE ☁'] },
                { name: 'kiira', powers: ['AGUA 💧','AGUA 💧','AGUA 💧','TIERRA 🌎','FUEGO 🔥','AIRE ☁'] },
                { name: 'kimo', powers: ['FUEGO 🔥','FUEGO 🔥','FUEGO 🔥','TIERRA 🌎','AGUA 💧','AIRE ☁'] },
                { name: 'vera', powers: ['AIRE ☁','AIRE ☁','AIRE ☁','TIERRA 🌎','FUEGO 🔥','AGUA 💧'] },
                { name: 'narobi', powers: ['FUEGO 🔥','FUEGO 🔥','FUEGO 🔥','TIERRA 🌎','AGUA 💧','AIRE ☁'] },
                { name: 'nutso', powers: ['TIERRA 🌎','TIERRA 🌎','TIERRA 🌎','FUEGO 🔥','AGUA 💧','AIRE ☁'] },
                { name: 'limbre', powers: ['AIRE ☁','AIRE ☁','AIRE ☁','TIERRA 🌎','FUEGO 🔥','AGUA 💧'] },
                { name: 'iroki', powers: ['AGUA 💧','AGUA 💧','AGUA 💧','TIERRA 🌎','FUEGO 🔥','AIRE ☁'] }
            ];
            this.characters = data.map(d => {
                const c = Character.createFromData(d);
                if (c) c.addPowers(d.powers);
                return c;
            }).filter(Boolean);
            this.renderCharacterSelection();
        } catch (e) {
            ErrorHandler.logError(e, 'CharacterManager.initCharacters');
        }
    }

    renderCharacterSelection() {
        const container = this.game.elements?.characterSection;
        if (!container) return;
        container.innerHTML = '';
        this.characters.forEach(ch => {
            container.innerHTML += `
                <input type="radio" name="personaje" id="${ch.name}" />
                <label class="tarjeta-personaje" for="${ch.name}">
                    <img src="${ch.image}" alt="${ch.name}">
                </label>`;
        });
    }

    selectPlayerCharacter() {
        try {
            const selectedInput = document.querySelector('input[name="personaje"]:checked');
            if (!selectedInput) {
                ErrorHandler.showUserError('¡Selecciona un personaje!');
                return false;
            }
            const name = selectedInput.id;
            this.playerCharacter = this.characters.find(c => c.name === name) || null;
            if (!this.playerCharacter) throw new Error('Personaje no encontrado: ' + name);
            this.displaySelectedCharacter();
            this.game.stateManager.setGameState('map');
            return name;
        } catch (e) {
            ErrorHandler.logError(e, 'CharacterManager.selectPlayerCharacter');
            ErrorHandler.showUserError('Error al seleccionar personaje');
            return false;
        }
    }

    displaySelectedCharacter() {
        const span = this.game.elements?.playerCharacterSpan;
        if (!span || !this.playerCharacter) return;
        span.innerHTML = '';
        const img = document.createElement('img');
        img.className = 'selected-character';
        img.src = this.playerCharacter.image;
        img.alt = this.playerCharacter.name;
        span.appendChild(img);
    }

    displayEnemyCharacter(enemy) {
        try {
            const span = this.game.elements?.enemyCharacterSpan;
            if (!span) return;
            span.innerHTML = '';
            const img = document.createElement('img');
            img.id = 'enemy-character-image';
            img.className = 'selected-character';
            let src = enemy?.image;
            if (!src && enemy?.personaje) {
                const name = enemy.personaje.nombre || enemy.personaje;
                src = `./assets/${name}.jpg`;
            }
            img.src = src || './assets/default.jpg';
            img.alt = enemy?.name || enemy?.personaje?.nombre || 'Enemigo';
            span.appendChild(img);
        } catch (e) {
            ErrorHandler.logError(e, 'CharacterManager.displayEnemyCharacter');
        }
    }

    updatePlayerCharacter(ctx) {
        if (!this.playerCharacter) return;
        this.playerCharacter.move(this.game.mapDimensions);
        this.playerCharacter.draw(ctx);
    }

    updateEnemies(data) {
        try {
            const valid = data.filter(d => d.personaje && typeof d.x === 'number' && typeof d.y === 'number' && d.id !== this.game.playerId);
            const updated = [];
            valid.forEach(ed => {
                let enemy = this.enemies.find(e => e.id === ed.id);
                if (enemy) {
                    enemy.updateServerPosition(ed.x, ed.y);
                    enemy.estadoCombate = ed.estadoCombate || 'libre';
                    enemy.enemigoCombate = ed.enemigoCombate;
                    updated.push(enemy);
                } else {
                    const name = ed.personaje.nombre || ed.personaje;
                    const c = Character.createFromData({ name, id: ed.id });
                    if (c) {
                        c.position.x = ed.x; c.position.y = ed.y;
                        c.targetPosition.x = ed.x; c.targetPosition.y = ed.y;
                        c.estadoCombate = ed.estadoCombate || 'libre';
                        c.enemigoCombate = ed.enemigoCombate;
                        updated.push(c);
                    }
                }
            });
            this.enemies = updated;
        } catch (e) {
            ErrorHandler.logError(e, 'CharacterManager.updateEnemies');
        }
    }

    drawEnemies(ctx) {
        this.enemies.forEach(e => e.draw(ctx));
    }
}
