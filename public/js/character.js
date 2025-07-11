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
            width: Config.GAME.PLAYER.SIZE_RATIO * (Game.mapDimensions.width / Config.GAME.MAP.MAX_WIDTH),
            height: Config.GAME.PLAYER.SIZE_RATIO * (Game.mapDimensions.width / Config.GAME.MAP.MAX_WIDTH)
        };
        
        this.mapImage = new Image();
        this.mapImage.src = miniImage;
        this.mapImage.onerror = () => {
            ErrorHandler.logError(new Error(`No se pudo cargar la imagen: ${miniImage}`), 'Character Constructor');
        };
        
        this.initializePosition();
    }
    
    initializePosition() {
        this.position.x = this.getRandomPosition(0, Game.mapDimensions.width - this.size.width);
        this.position.y = this.getRandomPosition(0, Game.mapDimensions.height - this.size.height);
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
    
    move() {
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        
        // Mantener dentro de los límites del mapa
        this.position.x = Math.max(0, Math.min(this.position.x, Game.mapDimensions.width - this.size.width));
        this.position.y = Math.max(0, Math.min(this.position.y, Game.mapDimensions.height - this.size.height));
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