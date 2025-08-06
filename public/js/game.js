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
        
        // Nuevo: Sistema de colisiones mejorado
        this.collisionManager = null;
        this.combatState = 'free'; // Estados: 'free', 'collision_detected', 'in_combat'

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
            // Validación de parámetros
            if (!enemy) {
                console.error('❌ Game: enemy es null en displayEnemyCharacter');
                return;
            }
            
            // Limpiar cualquier imagen previa del enemigo
            this.elements.enemyCharacterSpan.innerHTML = '';

            const img = document.createElement('img');
            img.id = 'enemy-character-image';
            img.className = 'selected-character';
            
            // Si el enemigo no tiene imagen (viene del servidor), construir la ruta
            let imageSrc = enemy.image;
            if (!imageSrc && enemy.personaje) {
                const characterName = enemy.personaje.nombre || enemy.personaje;
                imageSrc = `./assets/${characterName}.jpg`;
            }
            
            // Usar imagen por defecto si no se puede determinar
            img.src = imageSrc || './assets/default.jpg';
            img.alt = enemy.name || enemy.personaje?.nombre || enemy.personaje || enemy.id || 'Enemigo';
            
            this.elements.enemyCharacterSpan.appendChild(img);
            
            console.log('🖼️ Game: Imagen de enemigo configurada:', img.src);

        } catch (error) {
            ErrorHandler.logError(error, 'Game.displayEnemyCharacter');
            console.error('❌ Game: Error al mostrar personaje enemigo:', enemy);
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
        this.combatState = 'free';
        this.playerCharacter = this.selectedCharacter; // Asignar referencia del personaje
        
        // Inicializar el sistema de colisiones
        this.collisionManager = new CollisionManager(this);
        
        this.elements.mapSection.style.display = 'flex';
        this.elements.characterSection.style.display = 'none';
        this.elements.divButtonCharacter.style.display = 'none';
        
        this.initializeMapState();
        this.gameInterval = setInterval(() => this.updateGame(), Config.UI.UPDATE_INTERVAL);
        
        // Intervalo adicional para verificar estado del servidor (especialmente cuando el jugador está quieto)
        this.stateCheckInterval = setInterval(() => this.checkServerState(), 1000); // Cada segundo
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
        
        // Dibujar información de debug de colisiones
        if (this.collisionManager && Config.DEBUG?.SHOW_COLLISION_BOUNDS) {
            // Dibujar indicador de estado de colisión
            const ctx = this.ctx;
            ctx.save();
            
            const statusColors = {
                'free': '#00FF00',
                'detecting': '#FFAA00', 
                'confirmed': '#FF6600',
                'in_combat': '#FF0000'
            };
            
            const state = this.collisionManager.getCollisionState().state;
            const color = statusColors[state] || '#FFFFFF';
            const x = 10;
            const y = 30;
            
            // Fondo del indicador
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(x - 5, y - 15, 120, 20);
            
            // Texto del estado
            ctx.fillStyle = color;
            ctx.font = '12px Arial';
            ctx.fillText(`Estado: ${state}`, x, y);
            
            // Indicador circular
            ctx.beginPath();
            ctx.arc(x + 130, y - 5, 5, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
            
            ctx.restore();
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
                APIService.lastPositionResponse = response;
                this.updateEnemies(response.enemigos);
                
                // Verificar cambios de estado desde el servidor
                this.handleServerStateChanges(response);
            }
        } catch (error) {
            // Solo logear errores críticos, no errores de red temporales
            if (error.message.includes('HTTP Error: 5') || 
                !error.message.includes('Failed to fetch')) {
                ErrorHandler.logError(error, 'Game.updatePlayerPosition');
            }
            
            // Mostrar indicador de conexión si es apropiado
            if (APIService.getConnectionStatus() === 'offline') {
                this.showConnectionStatus(false);
            }
        }
    }
    
    /**
     * Maneja cambios de estado recibidos del servidor
     */
    handleServerStateChanges(response) {
        const serverState = response.estadoPropio;
        
        if (!serverState) return;
        
        console.log(`🔄 Verificando estado: Local=${this.combatState}, Servidor=${serverState}`);
        
        // Caso 1: El servidor dice que estamos en colisión pero localmente estamos libres
        // Esto significa que OTRO jugador inició la colisión con nosotros
        if (serverState === 'colisionando' && this.combatState === 'free') {
            console.log('🚨 Game: Colisión iniciada por otro jugador, procesando...');
            this.handleRemoteCollisionInitiated(response);
            return;
        }
        
        // Caso 2: El servidor dice que estamos libres pero localmente en combate, resetear
        if (serverState === 'libre' && this.combatState !== 'free') {
            console.log('🔄 Game: Servidor indica que estamos libres, reseteando estado local');
            this.recoverFromCollisionError();
            return;
        }
        
        // Actualizar estado local si hay discrepancias menores
        if (serverState !== this.combatState) {
            console.log(`🔄 Estado actualizado desde servidor: ${this.combatState} -> ${serverState}`);
            this.syncStateWithServer(serverState, response);
        }
    }
    
    /**
     * Maneja cuando otro jugador inició una colisión con nosotros
     */
    async handleRemoteCollisionInitiated(response) {
        try {
            // Encontrar qué jugador está en colisión con nosotros
            const collidingEnemy = response.enemigos?.find(enemy => 
                enemy.estadoCombate === 'colisionando' && 
                enemy.enemigoCombate === this.playerId
            );
            
            if (!collidingEnemy) {
                console.log('⚠️ Game: No se encontró enemigo en colisión');
                return;
            }
            
            console.log('👥 Game: Colisión remota detectada con:', collidingEnemy.id);
            
            // Actualizar nuestro estado
            this.combatState = 'collision_detected';
            
            // Si tenemos collision manager, sincronizar su estado
            if (this.collisionManager) {
                this.collisionManager.collisionState = 'confirmed';
                this.collisionManager.currentTarget = collidingEnemy;
            }
            
            // Confirmar entrada a combate en el servidor
            await APIService.confirmCombat(this.playerId);
            
            // Proceder al combate
            this.handleConfirmedCollision(collidingEnemy, {
                success: true,
                mensaje: "Colisión remota confirmada"
            });
            
        } catch (error) {
            console.error('❌ Game: Error manejando colisión remota:', error);
            ErrorHandler.logError(error, 'Game.handleRemoteCollisionInitiated');
            this.recoverFromCollisionError();
        }
    }
    
    /**
     * Sincroniza el estado local con el del servidor
     */
    syncStateWithServer(serverState, response) {
        const stateMapping = {
            'libre': 'free',
            'colisionando': 'collision_detected', 
            'en_combate': 'in_combat'
        };
        
        this.combatState = stateMapping[serverState] || 'free';
        
        // Sincronizar collision manager si existe
        if (this.collisionManager) {
            const cmStateMapping = {
                'libre': 'free',
                'colisionando': 'confirmed',
                'en_combate': 'in_combat'
            };
            
            this.collisionManager.collisionState = cmStateMapping[serverState] || 'free';
        }
    }
    
    /**
     * Verifica el estado del servidor independientemente del movimiento
     */
    async checkServerState() {
        // Solo verificar si estamos en el mapa y libres (para detectar colisiones remotas)
        if (this.gameState !== 'map' || this.combatState !== 'free') {
            return;
        }
        
        try {
            if (!this.playerCharacter) return;
            
            // Enviar posición actual para obtener estado del servidor
            const { x, y } = this.playerCharacter.position;
            const response = await APIService.sendPosition(this.playerId, x, y);
            
            if (response) {
                this.handleServerStateChanges(response);
            }
            
        } catch (error) {
            // Solo logear errores críticos
            if (error.message.includes('HTTP Error: 5')) {
                ErrorHandler.logError(error, 'Game.checkServerState');
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
                    // Actualizar estado de combate desde el servidor
                    existingEnemy.estadoCombate = enemyData.estadoCombate || 'libre';
                    existingEnemy.enemigoCombate = enemyData.enemigoCombate;
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
                        character.estadoCombate = enemyData.estadoCombate || 'libre';
                        character.enemigoCombate = enemyData.enemigoCombate;
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
            
            // Usar el nuevo sistema de colisiones solo si estamos libres
            if (this.collisionManager && this.collisionManager.isAvailableForCollision()) {
                // El CollisionManager maneja toda la lógica de colisión
                // en su método checkCollisions que se llama desde updateGame
            }
        });
        
        // Verificar colisiones usando el sistema mejorado
        if (this.collisionManager && this.combatState === 'free') {
            this.collisionManager.checkCollisions(this.enemies);
        }
    }

    // Método legacy mantenido para compatibilidad - usar CollisionManager en su lugar
    checkCollision(enemy) {
        // Este método ahora es manejado por CollisionManager
        // Mantenido solo para compatibilidad con código existente
        return false;
    }

    /**
     * Nuevo método para manejar colisiones confirmadas por el CollisionManager
     * Reemplaza el anterior handleCollision con mejor control de estado
     */
    handleConfirmedCollision(enemy, collisionData) {
        try {
            // Validación de parámetros
            if (!enemy) {
                console.error('❌ Game: enemy es null en handleConfirmedCollision');
                this.recoverFromCollisionError();
                return;
            }
            
            if (!enemy.id) {
                console.error('❌ Game: enemy.id es null en handleConfirmedCollision', enemy);
                this.recoverFromCollisionError();
                return;
            }
            
            console.log('✅ Game: Manejando colisión confirmada con:', enemy.name || enemy.id);
            
            // Actualizar estado de combate
            this.combatState = 'in_combat';
            this.enemyId = enemy.id;
            
            // Preparar UI para combate
            this.renderPlayerPowers();
            this.displayEnemyCharacter(enemy);
            this.stopMovement();
            clearInterval(this.gameInterval);

            // Actualizar interfaz
            this.elements.mapSection.style.display = 'none';
            this.elements.gameEndSection.style.display = 'flex';
            this.elements.sectionPowers.style.display = 'grid';
            this.elements.sectionCharacter.style.display = 'flex';
            this.elements.selectedTitle.style.display = 'block';

            this.setupPowerEventListeners();
            
            console.log('⚔️ Game: Combate iniciado exitosamente');
            
        } catch (error) {
            ErrorHandler.logError(error, 'Game.handleConfirmedCollision');
            ErrorHandler.showUserError('Error al iniciar combate');
            
            // Recuperación de error
            this.recoverFromCollisionError();
        }
    }
    
    /**
     * Recuperación de errores en colisiones
     */
    recoverFromCollisionError() {
        try {
            this.combatState = 'free';
            this.enemyId = null;
            
            if (this.collisionManager) {
                this.collisionManager.resetCollisionState();
            }
            
            // Restaurar el game loop si se detuvo
            if (!this.gameInterval && this.gameState === 'map') {
                this.gameInterval = setInterval(() => this.updateGame(), Config.UI.UPDATE_INTERVAL);
            }
            
            console.log('🔄 Game: Estado de colisión restablecido');
            
        } catch (error) {
            ErrorHandler.logError(error, 'Game.recoverFromCollisionError');
        }
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
        
        // Finalizar combate usando el nuevo sistema
        this.finalizeCombat();
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
    
    /**
     * Método para finalizar combate usando el sistema mejorado
     */
    async finalizeCombat() {
        try {
            console.log('🏁 Game: Finalizando combate...');
            
            if (this.collisionManager) {
                await this.collisionManager.finalizeCombat();
            }
            
            // Resetear estado local
            this.combatState = 'free';
            this.enemyId = null;
            this.combatProcessed = false;
            
            console.log('✅ Game: Combate finalizado exitosamente');
            
        } catch (error) {
            ErrorHandler.logError(error, 'Game.finalizeCombat');
            console.log('⚠️ Game: Error al finalizar combate, reseteando estado local');
            
            // Resetear estado local en caso de error
            this.combatState = 'free';
            this.enemyId = null;
            this.combatProcessed = false;
        }
    }

    restartGame() {
        try {
            // Limpiar recursos del collision manager
            if (this.collisionManager) {
                this.collisionManager.cleanup();
            }
            
            // Limpiar intervalos
            if (this.gameInterval) {
                clearInterval(this.gameInterval);
            }
            
            if (this.stateCheckInterval) {
                clearInterval(this.stateCheckInterval);
            }
            
            if (this.powerInterval) {
                clearInterval(this.powerInterval);
            }
            
            location.reload();
        } catch (error) {
            ErrorHandler.logError(error, 'Game.restartGame');
        }
    }
}