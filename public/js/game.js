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
        this.combatProcessed = false; // Nuevo: evitar procesamiento múltiple de combate
        this.touchControls = null;
        this.gameState = 'character-selection'; // Estado inicial del juego
        this.playerCharacter = null; // Referencia al personaje del jugador
        this.lastEnemyUpdate = 0; // Para throttling de actualizaciones de enemigos
        this.lastNetworkUpdate = 0; // Para throttling de peticiones de red
        this.enemyPositionCache = new Map(); // Cache de posiciones de enemigos

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
                messageSection: document.getElementById("mensaje-final"),
                upButton: document.getElementById("arriba"),
                downButton: document.getElementById("abajo"),
                leftButton: document.getElementById("izquierda"),
                rightButton: document.getElementById("derecha"),
                selectedTitle: document.getElementById("subtituloTres")
            };

            // Verificar que todos los elementos existen
            Object.entries(this.elements).forEach(([key, element]) => {
                if (!element) {
                    throw new Error(`Elemento no encontrado: ${key}`);
                }
            });

            this.canvas = this.elements.map;
            this.ctx = this.elements.map.getContext('2d');
            
            // Verificar que el contexto se haya creado correctamente
            if (!this.ctx) {
                throw new Error('No se pudo obtener el contexto 2D del canvas');
            }
            
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
            'mapSection', 'gameEndSection',
            'messageSection', 'sectionCharacter',
            'sectionPowers', 'selectedTitle'
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
        img.id = 'selected-character-image';
        img.className = 'selected-character';
        img.src = this.selectedCharacter.image;
        img.alt = this.selectedCharacter.name;
        this.elements.playerCharacterSpan.appendChild(img);
    }

    displayEnemyCharacter(enemy) {
        try {
            // Limpiar cualquier imagen previa del enemigo
            this.elements.enemyCharacterSpan.innerHTML = '';

            const img = document.createElement('img');
            img.id = 'enemy-character-image';
            img.className = 'selected-character';
            img.src = enemy.image;
            img.alt = enemy.name;
            this.elements.enemyCharacterSpan.appendChild(img);

        } catch (error) {
            ErrorHandler.logError(error, 'Game.displayEnemyCharacter');
        }
    }

    renderPlayerPowers() {
        try {
            // Limpiar botones de poderes anteriores
            this.elements.powerButtons.innerHTML = '';

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
        this.gameState = 'map';
        this.playerCharacter = this.selectedCharacter; // Asignar referencia del personaje
        
        this.elements.mapSection.style.display = 'flex';
        this.elements.characterSection.style.display = 'none';
        this.elements.divButtonCharacter.style.display = 'none';
        
        this.initializeMapState();
        this.gameInterval = setInterval(() => this.updateGame(), Config.UI.UPDATE_INTERVAL);
    }

    initializeMapState() {
        // Inicializar controles táctiles
        if (this.canvas && this.playerCharacter) {
            this.touchControls = new TouchControls(this.canvas, this.playerCharacter);
        }

        // Ocultar botones físicos en dispositivos táctiles
        this.hidePhysicalButtonsOnTouch();
    }

    hidePhysicalButtonsOnTouch() {
        const movementControls = document.getElementById('botones-desplazamiento');

        // Detectar si es dispositivo táctil
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            movementControls.style.display = 'none';
        }
    }

    updateGame() {
        if (this.gameState !== 'map') return;

        this.clearCanvas();
        this.drawBackground();

        // Actualizar posición del personaje si se está moviendo
        if (this.playerCharacter) {
            this.playerCharacter.updatePosition();
            this.updatePlayerCharacter();
        }

        // Actualizar interpolación de enemigos (cada frame para suavidad)
        this.updateEnemyInterpolation();
        
        // Actualizar enemigos desde el servidor (throttled)
        const now = Date.now();
        if (now - this.lastNetworkUpdate > Config.UI.NETWORK_UPDATE_INTERVAL) {
            this.updatePlayerPosition();
            this.lastNetworkUpdate = now;
        }

        this.drawEnemies();

        // Dibujar guías táctiles opcionales (solo durante desarrollo)
        if (this.touchControls && Config.DEBUG?.SHOW_TOUCH_GUIDES) {
            this.touchControls.drawTouchGuides(this.ctx);
        }
    }
    
    updateEnemyInterpolation() {
        // Actualizar interpolación de todos los enemigos
        this.enemies.forEach(enemy => {
            if (enemy.updateInterpolation) {
                enemy.updateInterpolation();
            }
        });
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.elements.map.width, this.elements.map.height);
    }

    drawBackground() {
        if (this.backgroundMap.complete) {
            this.ctx.drawImage(
                this.backgroundMap,
                0, 0,
                this.elements.map.width,
                this.elements.map.height
            );
        } else {
            // Dibujar un fondo temporal mientras carga la imagen
            this.ctx.fillStyle = '#2d5016';
            this.ctx.fillRect(0, 0, this.elements.map.width, this.elements.map.height);
        }
    }

    updatePlayerCharacter() {
        if (this.playerCharacter) {
            this.playerCharacter.move(this.mapDimensions);
            this.playerCharacter.draw(this.ctx);
        }
    }

    async updatePlayerPosition() {
        try {
            if (!this.playerCharacter) return;
            
            const { x, y } = this.playerCharacter.position;
            const response = await APIService.sendPosition(this.playerId, x, y);

            // Guardar respuesta para uso futuro
            if (response && response.enemigos) {
                this.lastPositionResponse = response;
                this.updateEnemies(response.enemigos);
            }
        } catch (error) {
            // Solo logear errores críticos, no errores de red temporales
            if (/HTTP Error: 5\d\d/.test(error.message) || 
                !error.message.includes('Failed to fetch')) {
                ErrorHandler.logError(error, 'Game.updatePlayerPosition');
            }
            
            // Mostrar indicador de conexión si es apropiado
            if (APIService.getConnectionStatus() === 'offline') {
                this.showConnectionStatus(false);
            }
        }
    }
    
    showConnectionStatus(isOnline) {
        // Método para mostrar estado de conexión (opcional)
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            statusElement.textContent = isOnline ? '🟢 Conectado' : '🔴 Desconectado';
            statusElement.style.display = 'block';
            
            if (isOnline) {
                setTimeout(() => {
                    statusElement.style.display = 'none';
                }, 2000);
            }
        }
    }

    updateEnemies(enemiesData) {
        try {
            console.log('📡 Datos de enemigos recibidos:', enemiesData.length); // Reduced logging
            
            // Procesar datos de enemigos válidos
            const validEnemiesData = enemiesData.filter(enemy => {
                const hasCharacter = enemy.personaje != null;
                const hasPosition = typeof enemy.x === 'number' && typeof enemy.y === 'number';
                const isNotSelf = enemy.id !== this.playerId;
                return hasCharacter && hasPosition && isNotSelf;
            });

            // Actualizar enemigos existentes o crear nuevos
            const updatedEnemies = [];
            
            validEnemiesData.forEach(enemyData => {
                // Buscar enemigo existente
                let existingEnemy = this.enemies.find(e => e.id === enemyData.id);
                
                if (existingEnemy) {
                    // Actualizar posición con interpolación suave
                    existingEnemy.updateServerPosition(enemyData.x, enemyData.y);
                    updatedEnemies.push(existingEnemy);
                } else {
                    // Crear nuevo enemigo
                    const characterName = enemyData.personaje.nombre || enemyData.personaje;
                    const character = Character.createFromData({
                        name: characterName,
                        id: enemyData.id
                    });

                    if (character) {
                        // Establecer posición inicial sin interpolación
                        character.position.x = enemyData.x;
                        character.position.y = enemyData.y;
                        character.targetPosition.x = enemyData.x;
                        character.targetPosition.y = enemyData.y;
                        updatedEnemies.push(character);
                        console.log(`✅ Nuevo enemigo creado: ${character.name}`);
                    }
                }
            });
            
            this.enemies = updatedEnemies;
            console.log(`🎯 Total de enemigos activos: ${this.enemies.length}`);
            
        } catch (error) {
            ErrorHandler.logError(error, 'Game.updateEnemies');
        }
    }

    drawEnemies() {
        this.enemies.forEach((enemy, index) => {
            enemy.draw(this.ctx);
            this.checkCollision(enemy);
        });
    }

    checkCollision(enemy) {
        try {
            if (!this.playerCharacter) return;

            const playerBounds = this.playerCharacter.getBounds();
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
        // Evitar múltiples colisiones con el mismo enemigo
        if (this.enemyId === enemy.id) {
            return; // Ya estamos en combate con este enemigo
        }

        this.renderPlayerPowers();
        this.displayEnemyCharacter(enemy);
        this.stopMovement();
        clearInterval(this.gameInterval);
        this.enemyId = enemy.id;

        this.elements.mapSection.style.display = 'none';
        this.elements.gameEndSection.style.display = 'flex';
        this.elements.sectionPowers.style.display = 'grid';
        this.elements.sectionCharacter.style.display = 'flex';
        this.elements.selectedTitle.style.display = 'block';

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
            // Evitar procesamiento múltiple del combate
            if (this.combatProcessed) {
                return;
            }
            this.combatProcessed = true;

            this.playerVictories = 0;
            this.enemyVictories = 0;

            // Limpiar contenedores de poderes anteriores
            this.elements.playerPowerSpan.innerHTML = '';
            this.elements.enemyPowerSpan.innerHTML = '';

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
        let message, resultType, uniqueId;

        if (this.playerVictories > this.enemyVictories) {
            message = '¡ENHORABUENA HAS GANADO!🎉';
            resultType = 'victory';
            uniqueId = 'victory-message';
        } else if (this.playerVictories < this.enemyVictories) {
            message = 'OH, LO SENTIMOS, HAS PERDIDO 😢';
            resultType = 'defeat';
            uniqueId = 'defeat-message';
        } else {
            message = 'HAS EMPATADO XD';
            resultType = 'draw';
            uniqueId = 'draw-message';
        }

        this.displayFinalMessage(message, resultType, uniqueId);
    }

    displayFinalMessage(message, resultType, uniqueId) {
        // Verificar si ya existe un mensaje para evitar duplicados
        const existingMessage = document.getElementById(uniqueId);
        if (existingMessage) {
            return; // Ya existe el mensaje, no agregar otro
        }

        this.elements.messageSection.style.display = 'flex';

        const messageElement = document.createElement('h2');
        messageElement.id = uniqueId;
        messageElement.className = `game-result-message game-result-message--${resultType}`;
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