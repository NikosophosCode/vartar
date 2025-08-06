class Character {
    constructor(name, image, miniImage, attackCount, id = null) {
        this.id = id;
        this.name = name;
        this.image = image;
        this.attackCount = attackCount;
        this.powers = [];
        this.position = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 0 };
        this.size = {
            width: Config.GAME.PLAYER.SIZE,
            height: Config.GAME.PLAYER.SIZE
        };
        
        // Propiedades para interpolación suave
        this.targetPosition = { x: 0, y: 0 };
        this.interpolationSpeed = Config.GAME.PLAYER.INTERPOLATION_SPEED || 0.15; // Velocidad de interpolación (0-1)
        this.lastUpdateTime = Date.now();
        this.isInterpolating = false;
        
        this.mapImage = new Image();
        this.mapImage.src = miniImage;
        this.mapImage.onerror = () => {
            ErrorHandler.logError(new Error(`No se pudo cargar la imagen: ${miniImage}`), 'Character Constructor');
        };
        
        this.initializePosition();
        
        this.isMoving = false;
        this.movementDirection = null;
        this.movementSpeed = Config.GAME.MOVEMENT_SPEED || 3;
    }
    
    initializePosition() {
        // Posición inicial aleatoria pero válida
        this.position.x = Math.random() * 200; // Límite inicial pequeño
        this.position.y = Math.random() * 200;
    }
    
    getRandomPosition(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
    
    addPowers(powersList) {
        try {
            this.powers = powersList.map(power => {
                if (typeof power === 'string') {
                    const powerConfig = Object.values(Config.GAME.POWERS).find(p => p.name === power);
                    return powerConfig || { name: power, id: power };
                }
                return power;
            });
        } catch (error) {
            ErrorHandler.logError(error, `Agregar poderes a ${this.name}`);
        }
    }
    
    draw(context) {
        try {
            if (this.mapImage.complete) {
                context.drawImage(
                    this.mapImage,
                    this.position.x,
                    this.position.y,
                    this.size.width,
                    this.size.height
                );
            }
        } catch (error) {
            ErrorHandler.logError(error, `Dibujar personaje ${this.name}`);
        }
    }
    
    // Nuevo método para actualizar posición del servidor con interpolación
    updateServerPosition(newX, newY) {
        const distance = Math.sqrt(
            Math.pow(newX - this.position.x, 2) + 
            Math.pow(newY - this.position.y, 2)
        );
        
        // Si la distancia es muy grande, teletransportar (probablemente primera vez o desconexión)
        if (distance > 100) {
            this.position.x = newX;
            this.position.y = newY;
            this.targetPosition.x = newX;
            this.targetPosition.y = newY;
            this.isInterpolating = false;
        } else {
            // Configurar interpolación suave
            this.targetPosition.x = newX;
            this.targetPosition.y = newY;
            this.isInterpolating = true;
        }
        
        this.lastUpdateTime = Date.now();
    }
    
    // Método para actualizar interpolación
    updateInterpolation() {
        if (!this.isInterpolating) return;
        
        const deltaTime = Date.now() - this.lastUpdateTime;
        const maxInterpolationTime = 200; // 200ms máximo para interpolación
        
        // Si ha pasado mucho tiempo, completar interpolación inmediatamente
        if (deltaTime > maxInterpolationTime) {
            this.position.x = this.targetPosition.x;
            this.position.y = this.targetPosition.y;
            this.isInterpolating = false;
            return;
        }
        
        // Calcular factor de interpolación basado en tiempo
        const timeFactor = Math.min(deltaTime / Config.GAME.INTERPOLATION_TIME_MS, 1); // 100ms para interpolación completa
        const adjustedSpeed = this.interpolationSpeed * (1 + timeFactor);
        
        // Aplicar interpolación lerp
        this.position.x = this.lerp(this.position.x, this.targetPosition.x, adjustedSpeed);
        this.position.y = this.lerp(this.position.y, this.targetPosition.y, adjustedSpeed);
        
        // Verificar si hemos llegado al objetivo
        const distanceToTarget = Math.sqrt(
            Math.pow(this.targetPosition.x - this.position.x, 2) + 
            Math.pow(this.targetPosition.y - this.position.y, 2)
        );
        
        if (distanceToTarget < 1) {
            this.position.x = this.targetPosition.x;
            this.position.y = this.targetPosition.y;
            this.isInterpolating = false;
        }
    }
    
    // Función de interpolación lineal
    lerp(start, end, factor) {
        return start + (end - start) * factor;
    }
    
    move(mapDimensions) {
        if (!mapDimensions) return;
        
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        
        // Mantener dentro de los límites del mapa
        this.position.x = Math.max(0, Math.min(this.position.x, mapDimensions.width - this.size.width));
        this.position.y = Math.max(0, Math.min(this.position.y, mapDimensions.height - this.size.height));
    }
    
    setVelocity(x, y) {
        this.velocity.x = x;
        this.velocity.y = y;
    }
    
    stop() {
        this.velocity.x = 0;
        this.velocity.y = 0;
    }
    
    getBounds() {
        return {
            left: this.position.x + Config.UI.COLLISION_MARGIN,
            right: this.position.x + this.size.width - Config.UI.COLLISION_MARGIN,
            top: this.position.y + Config.UI.COLLISION_MARGIN,
            bottom: this.position.y + this.size.height - Config.UI.COLLISION_MARGIN
        };
    }
    
    startMovement(direction) {
        this.isMoving = true;
        this.movementDirection = direction;
    }

    stopMovement() {
        this.isMoving = false;
        this.movementDirection = null;
    }

    updatePosition() {
        if (!this.isMoving || !this.movementDirection) return;

        const oldX = this.position.x;
        const oldY = this.position.y;

        switch (this.movementDirection) {
            case 'arriba':
                this.position.y -= this.movementSpeed;
                break;
            case 'abajo':
                this.position.y += this.movementSpeed;
                break;
            case 'izquierda':
                this.position.x -= this.movementSpeed;
                break;
            case 'derecha':
                this.position.x += this.movementSpeed;
                break;
        }

        // Aplicar límites de movimiento
        this.applyBoundaries();

        // Si la posición cambió, guardar para la próxima actualización al servidor
        if (this.position.x !== oldX || this.position.y !== oldY) {
            this.positionChanged = true;
        }
    }

    applyBoundaries() {
        // Obtener dimensiones del juego desde la instancia global
        const mapDimensions = window.game ? window.game.mapDimensions : null;
        
        if (mapDimensions) {
            this.position.x = Math.max(0, Math.min(this.position.x, mapDimensions.width - this.size.width));
            this.position.y = Math.max(0, Math.min(this.position.y, mapDimensions.height - this.size.height));
        }
    }

    static createFromData(characterData) {
        const characterMap = {
            'sinji': ['./assets/sinji.jpg', './assets/sinjimini.webp'],
            'kiira': ['./assets/kiira.jpg', './assets/kiiramini.webp'],
            'kimo': ['./assets/kimo.jpg', './assets/kimomini.webp'],
            'vera': ['./assets/vera.jpg', './assets/veramini.webp'],
            'narobi': ['./assets/narobi.jpg', './assets/narobimini.webp'],
            'nutso': ['./assets/nutso.jpg', './assets/nutsomini.webp'],
            'limbre': ['./assets/limbre.jpg', './assets/limbremini.webp'],
            'iroki': ['./assets/iroki.jpg', './assets/irokimini.webp']
        };
        
        const [image, miniImage] = characterMap[characterData.name] || ['', ''];
        if (!image) {
            ErrorHandler.logError(new Error(`Personaje no encontrado: ${characterData.name}`), 'Character.createFromData');
            return null;
        }
        
        return new Character(characterData.name, image, miniImage, 6, characterData.id);
    }
}