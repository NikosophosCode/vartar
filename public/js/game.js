class Game {
    constructor() {
        this.playerId = null;
        this.enemyId = null;
        this.selectedCharacter = null;
        this.playerPowers = [];
        this.enemyPowers = [];
        this.playerVictories = 0;
        this.enemyVictories = 0;
        this.characters = [];
        this.enemies = [];
        this.gameInterval = null;
        this.powerInterval = null;
        this.backgroundMap = new Image();
        
        this.initializeElements();
        this.initializeMap();
        this.initializeCharacters();
        this.initializeEventListeners();
        this.joinServer();
    }
    
    initializeElements() {
        try {
            this.elements = {
                playerCharacterSpan: document.getElementById("personaje-jugador"),
                enemyCharacterSpan: document.getElementById("personaje-enemigo"),
                enemyPowerSpan: document.getElementById("poder-lanzado-enemigo"),
                playerPowerSpan: document.getElementById("poder-lanzado-jugador"),
                playerLivesSpan: document.getElementById("vidas-jugador"),
                sectionCharacter: document.getElementById("personajes-seleccionados"),
                sectionPowers: document.getElementById("poderes-vidas"),
                enemyLivesSpan: document.getElementById("vidas-enemigo"),
                mapSection: document.getElementById('ver-mapa'),
                map: document.getElementById('mapa'),
                characterSelectButton: document.getElementById("boton-personajeJ"),
                divButtonCharacter: document.getElementById("boton-seleccion-personaje"),
                restartButton: document.getElementById("reiniciar"),
                powerButtons: document.getElementById("apartado-botones-poderes"),
                characterSection: document.getElementById("seleccionar-personaje"),
                gameEndSection: document.getElementById("fin-juego"),
                resultSection: document.getElementById("resultado"),
                messageSection: document.getElementById("mensaje-final"),
                upButton: document.getElementById("arriba"),
                downButton: document.getElementById("abajo"),
                leftButton: document.getElementById("izquierda"),
                rightButton: document.getElementById("derecha")
            };
            
            // Verificar que todos los elementos existen
            Object.entries(this.elements).forEach(([key, element]) => {
                if (!element) {
                    throw new Error(`Elemento no encontrado: ${key}`);
                }
            });
            
            this.canvas = this.elements.map.getContext('2d');
            this.setupMapDimensions();
            this.hideInitialElements();
            
        } catch (error) {
            ErrorHandler.logError(error, 'Game.initializeElements');
            ErrorHandler.showUserError('Error al inicializar elementos del juego');
        }
    }
    
    setupMapDimensions() {
        // Obtener dimensiones del CSS computado
        const computedStyle = window.getComputedStyle(this.elements.map);
        const width = parseInt(computedStyle.width);
        const height = parseInt(computedStyle.height);
        
        // Establecer dimensiones del canvas
        this.elements.map.width = width;
        this.elements.map.height = height;
        
        // Guardar dimensiones para uso posterior
        this.mapDimensions = { width, height };
    }
    
    hideInitialElements() {
        const elementsToHide = [
            'waitingRoom', 'mapSection', 'gameEndSection', 
            'resultSection', 'messageSection', 'sectionCharacter',
            'sectionPowers'
        ];
        
        elementsToHide.forEach(elementKey => {
            if (this.elements[elementKey]) {
                this.elements[elementKey].style.display = "none";
            }
        });
    }
    
    initializeMap() {
        try {
            this.backgroundMap.src = "./assets/mapa.jpg";
            this.backgroundMap.onerror = () => {
                ErrorHandler.logError(new Error('No se pudo cargar la imagen del mapa'), 'Game.initializeMap');
            };
        } catch (error) {
            ErrorHandler.logError(error, 'Game.initializeMap');
        }
    }
    
    initializeCharacters() {
        try {
            const characterData = [
                { name: 'sinji', powers: ['TIERRA 🌎', 'TIERRA 🌎', 'TIERRA 🌎', 'FUEGO 🔥', 'AGUA 💧', 'AIRE ☁'] },
                { name: 'kiira', powers: ['AGUA 💧', 'AGUA 💧', 'AGUA 💧', 'TIERRA 🌎', 'FUEGO 🔥', 'AIRE ☁'] },
                { name: 'kimo', powers: ['FUEGO 🔥', 'FUEGO 🔥', 'FUEGO 🔥', 'TIERRA 🌎', 'AGUA 💧', 'AIRE ☁'] },
                { name: 'vera', powers: ['AIRE ☁', 'AIRE ☁', 'AIRE ☁', 'TIERRA 🌎', 'FUEGO 🔥', 'AGUA 💧'] },
                { name: 'narobi', powers: ['FUEGO 🔥', 'FUEGO 🔥', 'FUEGO 🔥', 'TIERRA 🌎', 'AGUA 💧', 'AIRE ☁'] },
                { name: 'nutso', powers: ['TIERRA 🌎', 'TIERRA 🌎', 'TIERRA 🌎', 'FUEGO 🔥', 'AGUA 💧', 'AIRE ☁'] },
                { name: 'limbre', powers: ['AIRE ☁', 'AIRE ☁', 'AIRE ☁', 'TIERRA 🌎', 'FUEGO 🔥', 'AGUA 💧'] },
                { name: 'iroki', powers: ['AGUA 💧', 'AGUA 💧', 'AGUA 💧', 'TIERRA 🌎', 'FUEGO 🔥', 'AIRE ☁'] }
            ];
            
            this.characters = characterData.map(data => {
                const character = Character.createFromData(data);
                if (character) {
                    character.addPowers(data.powers);
                }
                return character;
            }).filter(character => character !== null);
            
            this.renderCharacterSelection();
            
        } catch (error) {
            ErrorHandler.logError(error, 'Game.initializeCharacters');
        }
    }
    
    renderCharacterSelection() {
        try {
            this.characters.forEach(character => {
                const characterHTML = `
                    <input type="radio" name="personaje" id="${character.name}" />
                    <label class="tarjeta-personaje" for="${character.name}">
                        <img src="${character.image}" alt="${character.name}">
                    </label>
                `;
                this.elements.characterSection.innerHTML += characterHTML;
            });
        } catch (error) {
            ErrorHandler.logError(error, 'Game.renderCharacterSelection');
        }
    }
    
    initializeEventListeners() {
        try {
            // Botón seleccionar personaje
            this.elements.characterSelectButton.addEventListener('click', () => this.selectPlayerCharacter());
            
            // Botón reiniciar
            this.elements.restartButton.addEventListener('click', () => this.restartGame());
            
            // Eventos de teclado
            window.addEventListener('keydown', (event) => this.handleKeyDown(event));
            window.addEventListener('keyup', () => this.stopMovement());
            
            // Botones de dirección
            const directionButtons = [
                { element: this.elements.upButton, direction: 'up' },
                { element: this.elements.downButton, direction: 'down' },
                { element: this.elements.leftButton, direction: 'left' },
                { element: this.elements.rightButton, direction: 'right' }
            ];
            
            directionButtons.forEach(({ element, direction }) => {
                element.addEventListener('mousedown', (e) => this.moveCharacter(e, direction));
                element.addEventListener('mouseup', () => this.stopMovement());
                element.addEventListener('touchstart', (e) => this.moveCharacter(e, direction));
                element.addEventListener('touchend', () => this.stopMovement());
            });
            
        } catch (error) {
            ErrorHandler.logError(error, 'Game.initializeEventListeners');
        }
    }
    
    async joinServer() {
        try {
            this.playerId = await APIService.joinServer();
            console.log('Conectado al servidor con ID:', this.playerId);
        } catch (error) {
            ErrorHandler.showUserError('No se pudo conectar al servidor');
        }
    }
    
    async selectPlayerCharacter() {
        try {
            const selectedInput = document.querySelector('input[name="personaje"]:checked');
            
            if (!selectedInput) {
                ErrorHandler.showUserError('¡Selecciona un personaje!');
                return;
            }
            
            const characterName = selectedInput.id;
            this.selectedCharacter = this.characters.find(char => char.name === characterName);
            
            if (!this.selectedCharacter) {
                throw new Error(`Personaje no encontrado: ${characterName}`);
            }
            
            this.displaySelectedCharacter();
            
            await APIService.sendCharacter(this.playerId, characterName);
            this.startGame();
            
        } catch (error) {
            ErrorHandler.logError(error, 'Game.selectPlayerCharacter');
            ErrorHandler.showUserError('Error al seleccionar personaje');
        }
    }
    
    displaySelectedCharacter() {
        const img = document.createElement('img');
        img.width = 140;
        img.height = 120;
        img.style.borderRadius = '16px';
        img.src = this.selectedCharacter.image;
        img.alt = this.selectedCharacter.name;
        this.elements.playerCharacterSpan.appendChild(img);
    }
    
    renderPlayerPowers() {
        try {
            this.selectedCharacter.powers.forEach(power => {
                const powerButton = document.createElement('button');
                powerButton.id = power.id;
                powerButton.className = 'boton-de-poderes botonPoderes';
                powerButton.textContent = power.name;
                this.elements.powerButtons.appendChild(powerButton);
            });
            
            this.setupPowerEventListeners();
            
        } catch (error) {
            ErrorHandler.logError(error, 'Game.renderPlayerPowers');
        }
    }
    
    setupPowerEventListeners() {
        const powerButtons = document.querySelectorAll('.botonPoderes');
        
        powerButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.selectPower(e.target);
            });
        });
    }
    
    selectPower(button) {
        try {
            if (button.disabled || this.playerPowers.length >= 6) {
                return;
            }
            
            this.playerPowers.push(button.textContent);
            button.style.background = '#0000007d';
            button.style.color = '#2a2323';
            button.disabled = true;
            
            this.elements.resultSection.style.display = 'flex';
            
            if (this.playerPowers.length === 6) {
                this.sendPlayerPowers();
            }
            
        } catch (error) {
            ErrorHandler.logError(error, 'Game.selectPower');
        }
    }
    
    async sendPlayerPowers() {
        try {
            await APIService.sendPowers(this.playerId, this.playerPowers);
            this.powerInterval = setInterval(() => this.getEnemyPowers(), Config.UI.UPDATE_INTERVAL);
        } catch (error) {
            ErrorHandler.logError(error, 'Game.sendPlayerPowers');
        }
    }
    
    async getEnemyPowers() {
        try {
            const response = await APIService.getEnemyPowers(this.enemyId);
            
            if (response.ataques && response.ataques.length === 6) {
                this.enemyPowers = response.ataques;
                clearInterval(this.powerInterval);
                this.processCombat();
            }
        } catch (error) {
            ErrorHandler.logError(error, 'Game.getEnemyPowers');
        }
    }
    
    startGame() {
        this.elements.mapSection.style.display = 'flex';
        this.elements.characterSection.style.display = 'none';
        this.elements.divButtonCharacter.style.display = 'none';
        this.gameInterval = setInterval(() => this.updateGame(), Config.UI.UPDATE_INTERVAL);
    }
    
    updateGame() {
        try {
            this.clearCanvas();
            this.drawBackground();
            this.updatePlayerCharacter();
            this.drawEnemies();
        } catch (error) {
            ErrorHandler.logError(error, 'Game.updateGame');
        }
    }
    
    clearCanvas() {
        this.canvas.clearRect(0, 0, this.elements.map.width, this.elements.map.height);
    }
    
    drawBackground() {
        if (this.backgroundMap.complete) {
            this.canvas.drawImage(
                this.backgroundMap,
                0, 0,
                this.elements.map.width,
                this.elements.map.height
            );
        }
    }
    
    updatePlayerCharacter() {
        if (this.selectedCharacter) {
            this.selectedCharacter.move(this.mapDimensions);
            this.selectedCharacter.draw(this.canvas);
            this.updatePlayerPosition();
        }
    }
    
    async updatePlayerPosition() {
        try {
            const { x, y } = this.selectedCharacter.position;
            const response = await APIService.sendPosition(this.playerId, x, y);
            
            if (response.enemigos) {
                this.updateEnemies(response.enemigos);
            }
        } catch (error) {
            ErrorHandler.logError(error, 'Game.updatePlayerPosition');
        }
    }
    
    updateEnemies(enemiesData) {
        try {
            this.enemies = enemiesData
                .filter(enemy => enemy.personaje != null)
                .map(enemy => {
                    const character = Character.createFromData({
                        name: enemy.personaje.nombre || enemy.personaje,
                        id: enemy.id
                    });
                    
                    if (character) {
                        character.position.x = enemy.x;
                        character.position.y = enemy.y;
                    }
                    
                    return character;
                })
                .filter(enemy => enemy !== null);
        } catch (error) {
            ErrorHandler.logError(error, 'Game.updateEnemies');
        }
    }
    
    drawEnemies() {
        this.enemies.forEach(enemy => {
            enemy.draw(this.canvas);
            this.checkCollision(enemy);
        });
    }
    
    checkCollision(enemy) {
        try {
            if (!this.selectedCharacter) return;
            
            const playerBounds = this.selectedCharacter.getBounds();
            const enemyBounds = enemy.getBounds();
            
            const collision = !(
                playerBounds.bottom < enemyBounds.top ||
                playerBounds.top > enemyBounds.bottom ||
                playerBounds.right < enemyBounds.left ||
                playerBounds.left > enemyBounds.right
            );
            
            if (collision) {
                this.handleCollision(enemy);
            }
        } catch (error) {
            ErrorHandler.logError(error, 'Game.checkCollision');
        }
    }
    
    handleCollision(enemy) {
        this.renderPlayerPowers();
        this.stopMovement();
        clearInterval(this.gameInterval);
        this.enemyId = enemy.id;
        
        this.elements.mapSection.style.display = 'none';
        this.elements.gameEndSection.style.display = 'flex';
        this.elements.sectionPowers.style.display = 'grid';
        this.elements.sectionCharacter.style.display = 'flex';
        
        this.setupPowerEventListeners();
        console.log('Colisión detectada con:', enemy.name);
    }
    
    moveCharacter(event, direction) {
        event.preventDefault();
        
        if (!this.selectedCharacter) return;
        
        const speed = Config.GAME.PLAYER.SPEED;
        const movements = {
            up: [0, -speed],
            down: [0, speed],
            left: [-speed, 0],
            right: [speed, 0]
        };
        
        const [x, y] = movements[direction] || [0, 0];
        this.selectedCharacter.setVelocity(x, y);
    }
    
    handleKeyDown(event) {
        if (!this.selectedCharacter) return;
        
        const keyMappings = {
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right'
        };
        
        const direction = keyMappings[event.key];
        if (direction) {
            this.moveCharacter(event, direction);
        }
    }
    
    stopMovement() {
        if (this.selectedCharacter) {
            this.selectedCharacter.stop();
        }
    }
    
    processCombat() {
        try {
            this.playerVictories = 0;
            this.enemyVictories = 0;
            
            for (let i = 0; i < this.playerPowers.length; i++) {
                const playerPower = this.playerPowers[i];
                const enemyPower = this.enemyPowers[i];
                
                if (playerPower === enemyPower) {
                    // Empate
                } else if (this.isPlayerWinning(playerPower, enemyPower)) {
                    this.playerVictories++;
                } else {
                    this.enemyVictories++;
                }
                
                this.displayCombatRound(playerPower, enemyPower);
            }
            
            this.updateScoreDisplay();
            this.showFinalResult();
            
        } catch (error) {
            ErrorHandler.logError(error, 'Game.processCombat');
        }
    }
    
    isPlayerWinning(playerPower, enemyPower) {
        return Config.GAME.POWER_COMBINATIONS.WINNING.some(
            ([winner, loser]) => playerPower === winner && enemyPower === loser
        );
    }
    
    displayCombatRound(playerPower, enemyPower) {
        const playerP = document.createElement('p');
        const enemyP = document.createElement('p');
        
        playerP.textContent = playerPower;
        enemyP.textContent = enemyPower;
        
        this.elements.playerPowerSpan.appendChild(playerP);
        this.elements.enemyPowerSpan.appendChild(enemyP);
    }
    
    updateScoreDisplay() {
        this.elements.playerLivesSpan.textContent = this.playerVictories;
        this.elements.enemyLivesSpan.textContent = this.enemyVictories;
    }
    
    showFinalResult() {
        let message;
        
        if (this.playerVictories > this.enemyVictories) {
            message = '¡ENHORABUENA HAS GANADO!🎉';
        } else if (this.playerVictories < this.enemyVictories) {
            message = 'OH, LO SENTIMOS, HAS PERDIDO 😢';
        } else {
            message = 'HAS EMPATADO XD';
        }
        
        this.displayFinalMessage(message);
    }
    
    displayFinalMessage(message) {
        this.elements.messageSection.style.display = 'flex';
        
        const messageElement = document.createElement('h2');
        messageElement.textContent = message;
        this.elements.messageSection.appendChild(messageElement);
        
        this.disableAllPowerButtons();
    }
    
    disableAllPowerButtons() {
        const powerButtons = document.querySelectorAll('.botonPoderes');
        powerButtons.forEach(button => {
            button.disabled = true;
        });
    }
    
    restartGame() {
        try {
            location.reload();
        } catch (error) {
            ErrorHandler.logError(error, 'Game.restartGame');
        }
    }
}