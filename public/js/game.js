// Game (Orquestador) – versión refactorizada que delega en managers
class Game {
    constructor() {
        // Identificadores y core
        this.playerId = null;
        this.enemyId = null;

        // Recursos visuales
        this.backgroundMap = new Image();
        this.visualEffects = null;
        this.virtualJoystick = null;
        this.touchControls = null;

        // Managers
        this.stateManager = new GameStateManager(this);
        this.characterManager = new CharacterManager(this);
        this.combatManager = new CombatManager(this);
        this.networkManager = new NetworkManager(this);
        this.inputManager = new InputManager(this);

        // UI y sistemas auxiliares
        this.gameUI = new GameUI();
        this.collisionSystemV2 = null;

        // Intervals
        this.gameLoopId = null;

        // Inicialización
        this.initializeElements();
        this.initializeMap();
        this.characterManager.initCharacters();
        this.initializeEventListeners();
        this.networkManager.joinServer();
    }

    // Getters de compatibilidad (para sistemas que aún consultan propiedades antiguas)
    get gameState() { return this.stateManager.gameState; }
    get combatState() { return this.stateManager.combatState; }
    get playerCharacter() { return this.characterManager.playerCharacter; }

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
            
            // Inicializar sistemas de efectos visuales
            this.visualEffects = new VisualEffects(this.canvas);

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

    // La creación/render de personajes se delega a CharacterManager

    initializeEventListeners() {
        try {
            this.elements.characterSelectButton.addEventListener('click', () => this.handleCharacterSelection());
            this.elements.restartButton.addEventListener('click', () => this.restartGame());
            // Input manager centraliza teclado y botones
            this.inputManager.init();
        } catch (e) {
            ErrorHandler.logError(e, 'Game.initializeEventListeners');
        }
    }

    // joinServer ahora se hace desde NetworkManager

    async handleCharacterSelection() {
        const name = this.characterManager.selectPlayerCharacter();
        if (!name) return;
        await this.networkManager.sendCharacter(name);
        this.startGame();
    }

    // displaySelectedCharacter delegado a CharacterManager

    // displayEnemyCharacter delegado a CharacterManager

    // renderPlayerPowers delegado a CombatManager

    // setupPowerEventListeners manejado internamente en CombatManager

    // selectPower delegado a CombatManager

    // sendPlayerPowers delegado a CombatManager

    // getEnemyPowers delegado a CombatManager

    startGame() {
        this.stateManager.setGameState('map');
        this.stateManager.setCombatState('free');
        // Inicializar sistema de colisiones
        this.collisionSystemV2 = new CollisionSystemV2(this);
        // Mostrar / ocultar UI
        this.elements.mapSection.style.display = 'flex';
        this.elements.characterSection.style.display = 'none';
        this.elements.divButtonCharacter.style.display = 'none';
        // Estado de mapa (joystick, HUD, etc.)
        this.initializeMapState();
        // Game loop
        this.gameLoopId = this.stateManager.startInterval('gameLoop', () => this.updateGame(), Config.UI.UPDATE_INTERVAL);
        // Verificación periódica de estado del servidor
        this.stateManager.startInterval('serverState', () => this.networkManager.checkServerState(), 1000);
    }

    initializeMapState() {
        // Inicializar joystick virtual para móviles
        if (this.canvas && this.playerCharacter) {
            this.virtualJoystick = new VirtualJoystick(this.canvas, this.playerCharacter, {
                size: Config.MOBILE.JOYSTICK.SIZE,
                deadZone: Config.MOBILE.JOYSTICK.DEAD_ZONE,
                hapticFeedback: Config.MOBILE.JOYSTICK.HAPTIC_FEEDBACK,
                autoHide: Config.MOBILE.JOYSTICK.AUTO_HIDE
            });
        }

        // Controles táctiles legacy como fallback
        if (this.canvas && this.playerCharacter) {
            this.touchControls = new TouchControls(this.canvas, this.playerCharacter);
        }

        // Ocultar botones físicos en dispositivos táctiles
        this.hidePhysicalButtonsOnTouch();
        
        // Inicializar HUD del jugador
        this.updatePlayerHUD();
    }

    hidePhysicalButtonsOnTouch() {
        const movementControls = document.getElementById('botones-desplazamiento');

        // Detectar si es dispositivo táctil
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            movementControls.style.display = 'none';
        }
    }

    updateGame() {
    if (this.stateManager.gameState !== 'map') return;

        this.clearCanvas();
        this.drawBackground();

        // Actualizar posición del personaje si se está moviendo
        if (this.characterManager.playerCharacter) {
            this.characterManager.playerCharacter.updatePosition();
            this.characterManager.updatePlayerCharacter(this.ctx);
        }

        // Actualizar interpolación de enemigos (cada frame para suavidad)
        this.updateEnemyInterpolation();
        
        // Actualizar efectos visuales
        if (this.visualEffects) {
            this.visualEffects.update(16); // Assumiendo ~60fps
        }
        
        // Actualizar enemigos desde el servidor (throttled)
    this.networkManager.periodicUpdate();
    this.drawEnemies();

        // Renderizar efectos visuales
        if (this.visualEffects) {
            this.visualEffects.render();
        }
        
        // Renderizar joystick virtual
        if (this.virtualJoystick) {
            this.virtualJoystick.draw(this.ctx);
        }

        // Dibujar guías táctiles opcionales (solo durante desarrollo)
        if (this.touchControls && Config.DEBUG?.SHOW_TOUCH_GUIDES) {
            this.touchControls.drawTouchGuides(this.ctx);
        }
        
        // Dibujar información de debug del sistema de colisiones V2
        if (this.collisionSystemV2 && Config.DEBUG?.SHOW_COLLISION_SYSTEM_V2) {
            this.collisionSystemV2.drawDebugInfo(this.ctx);
        }
    }
    
    updateEnemyInterpolation() {
        // Actualizar interpolación de todos los enemigos
    this.characterManager.enemies.forEach(enemy => enemy.updateInterpolation && enemy.updateInterpolation());
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

    // Gestión de enemigos delegada al CharacterManager / NetworkManager

    drawEnemies() {
        this.characterManager.drawEnemies(this.ctx);
        if (this.collisionSystemV2 && this.stateManager.combatState === 'free') {
            this.collisionSystemV2.checkCollisions(this.characterManager.enemies);
        }
    }

    // Método legacy mantenido para compatibilidad
    checkCollision(enemy) {
        // Este método ahora es manejado por CollisionSystemV2
        // Mantenido solo para compatibilidad con código existente
        return false;
    }

    /**
     * Método mejorado para manejar colisiones confirmadas por el CollisionSystemV2
     * Reemplaza el anterior handleConfirmedCollision con mejor control de estado
     */
    handleConfirmedCollision(enemy) {
        try {
            if (!enemy || !enemy.id) return this.recoverFromCollisionError();
            this.enemyId = enemy.id;
            this.combatManager.handleConfirmedCollision(enemy);
            // Detener loop del mapa mientras dura el combate (opcional se puede mantener)
            this.stateManager.clearInterval('gameLoop');
        } catch (e) {
            ErrorHandler.logError(e, 'Game.handleConfirmedCollision');
            this.recoverFromCollisionError();
        }
    }
    
    /**
     * Recuperación de errores en colisiones
     */
    recoverFromCollisionError() {
        try {
            this.stateManager.setCombatState('free');
            this.enemyId = null;
            if (this.collisionSystemV2) this.collisionSystemV2.resetCollisionState();
            if (!this.gameLoopId && this.stateManager.gameState === 'map') {
                this.gameLoopId = this.stateManager.startInterval('gameLoop', () => this.updateGame(), Config.UI.UPDATE_INTERVAL);
            }
        } catch (e) {
            ErrorHandler.logError(e, 'Game.recoverFromCollisionError');
        }
    }

    // Movimiento delegado en InputManager/CharacterManager

    // Teclado gestionado en InputManager

    stopMovement() {
        if (this.characterManager.playerCharacter) this.characterManager.playerCharacter.stop();
    }
    
    /**
     * Actualizar HUD del jugador con información moderna
     */
    updatePlayerHUD() {
        if (!this.gameUI || !this.characterManager.playerCharacter) return;
        
        const playerData = {
            name: this.characterManager.playerCharacter.name || 'Jugador',
            character: this.characterManager.playerCharacter.name,
            lives: this.characterManager.playerCharacter.lives || 100
        };
        
        this.gameUI.updatePlayerHUD(playerData);
    }
    
    /**
     * Manejar efectos visuales de colisión
     */
    handleCollisionEffects(enemy, position) {
        if (!this.visualEffects) return;
        
    const pc = this.characterManager.playerCharacter;
    const collisionX = (pc.position.x + enemy.x) / 2;
    const collisionY = (pc.position.y + enemy.y) / 2;
        
        // Efecto de explosión en el punto de colisión
        this.visualEffects.createExplosion(collisionX, collisionY, 'collision');
        
        // Texto flotante
        this.visualEffects.createFloatingText(collisionX, collisionY - 30, '¡COMBATE!', {
            color: '#ef4444',
            fontSize: 20,
            velocity: { x: 0, y: -1 }
        });
        
        // Notificación UI
        this.gameUI.showNotification(`¡Combate iniciado con ${enemy.name || enemy.id}!`, 'warning');
    }
    
    /**
     * Efectos de movimiento del jugador
     */
    handleMovementEffects() {
        if (!this.visualEffects || !this.playerCharacter) return;
        
    const pc = this.characterManager.playerCharacter;
    const { x, y } = pc.position;
    const { x: vx, y: vy } = pc.velocity;
        
        // Solo crear efectos si hay movimiento significativo
        if (Math.abs(vx) > 1 || Math.abs(vy) > 1) {
            this.visualEffects.createMovementTrail(x, y, { x: vx, y: vy });
        }
    }
    
    /**
     * Mostrar mensaje de victoria/derrota con efectos
     */
    showGameResult(result, message) {
        if (!this.visualEffects || !this.gameUI) return;
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        if (result === 'victory') {
            this.visualEffects.createExplosion(centerX, centerY, 'powerup');
            this.gameUI.showNotification('¡VICTORIA!', 'success', 5000);
        } else {
            this.visualEffects.createExplosion(centerX, centerY, 'explosion');
            this.gameUI.showNotification('Derrota...', 'error', 5000);
        }
        
        this.visualEffects.createFloatingText(centerX, centerY, message, {
            color: result === 'victory' ? '#22c55e' : '#ef4444',
            fontSize: 32,
            velocity: { x: 0, y: -0.5 },
            duration: 120
        });
    }

    // processCombat delegado a CombatManager

    // isPlayerWinning delegado a CombatManager

    // displayCombatRound delegado a CombatManager

    // updateScoreDisplay delegado a CombatManager

    // showFinalResult delegado a CombatManager

    // displayFinalMessage delegado a CombatManager

    // disableAllPowerButtons delegado a CombatManager
    
    /**
     * Método para finalizar combate usando el sistema mejorado V2
     */
    // finalizeCombat delegado a CombatManager

    restartGame() {
        try {
            if (this.collisionSystemV2) this.collisionSystemV2.cleanup();
            this.stateManager.clearAll();
            location.reload();
        } catch (e) { ErrorHandler.logError(e, 'Game.restartGame'); }
    }
}