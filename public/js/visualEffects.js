/**
 * VisualEffects - Sistema de efectos visuales para Vartar
 * Partículas, animaciones, transiciones y efectos modernos
 */
class VisualEffects {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        this.particles = [];
        this.effects = [];
        this.screenShakeAmount = 0;
        this.screenShakeDecay = 0.95;
        
        this.isEnabled = Config.GRAPHICS?.EFFECTS || true;
        this.lastFrameTime = 0;
        
        this.initializeEffectTypes();
    }
    
    initializeEffectTypes() {
        this.effectTypes = {
            explosion: {
                particleCount: 15,
                colors: ['#ff6b35', '#f7931e', '#ffd23f'],
                speed: { min: 2, max: 8 },
                life: 60,
                size: { min: 3, max: 8 }
            },
            powerup: {
                particleCount: 10,
                colors: ['#6366f1', '#8b5cf6', '#06d6a0'],
                speed: { min: 1, max: 4 },
                life: 90,
                size: { min: 2, max: 6 }
            },
            collision: {
                particleCount: 12,
                colors: ['#ef4444', '#f97316', '#eab308'],
                speed: { min: 3, max: 6 },
                life: 45,
                size: { min: 4, max: 10 }
            },
            healing: {
                particleCount: 8,
                colors: ['#22c55e', '#10b981', '#06d6a0'],
                speed: { min: 1, max: 3 },
                life: 75,
                size: { min: 2, max: 5 }
            },
            movement: {
                particleCount: 3,
                colors: ['rgba(99, 102, 241, 0.6)', 'rgba(139, 92, 246, 0.6)'],
                speed: { min: 0.5, max: 2 },
                life: 30,
                size: { min: 1, max: 3 }
            }
        };
    }
    
    /**
     * Crear efecto de explosión en una posición
     */
    createExplosion(x, y, type = 'explosion') {
        if (!this.isEnabled) return;
        
        const config = this.effectTypes[type];
        if (!config) return;
        
        for (let i = 0; i < config.particleCount; i++) {
            this.particles.push(new Particle({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * (config.speed.max - config.speed.min) + config.speed.min,
                vy: (Math.random() - 0.5) * (config.speed.max - config.speed.min) + config.speed.min,
                life: config.life,
                maxLife: config.life,
                size: Math.random() * (config.size.max - config.size.min) + config.size.min,
                color: config.colors[Math.floor(Math.random() * config.colors.length)],
                gravity: type === 'explosion' ? 0.1 : 0.05,
                friction: 0.98
            }));
        }
        
        // Agregar screen shake para efectos impactantes
        if (type === 'explosion' || type === 'collision') {
            this.addScreenShake(3);
        }
    }
    
    /**
     * Crear efecto de trail de movimiento
     */
    createMovementTrail(x, y, direction) {
        if (!this.isEnabled || !Config.GRAPHICS.EFFECTS.PARTICLES) return;
        
        const config = this.effectTypes.movement;
        
        // Solo crear partícula ocasionalmente para optimización
        if (Math.random() > 0.7) {
            this.particles.push(new Particle({
                x: x + (Math.random() - 0.5) * 10,
                y: y + (Math.random() - 0.5) * 10,
                vx: -direction.x * 0.5 + (Math.random() - 0.5) * 2,
                vy: -direction.y * 0.5 + (Math.random() - 0.5) * 2,
                life: config.life,
                maxLife: config.life,
                size: Math.random() * (config.size.max - config.size.min) + config.size.min,
                color: config.colors[Math.floor(Math.random() * config.colors.length)],
                gravity: 0,
                friction: 0.95
            }));
        }
    }
    
    /**
     * Crear efecto de glow/resplandor alrededor de un objeto
     */
    createGlowEffect(x, y, radius, color, intensity = 1) {
        if (!this.isEnabled || !Config.GRAPHICS.EFFECTS.GLOW) return;
        
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'screen';
        this.ctx.globalAlpha = 0.3 * intensity;
        
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
        
        this.ctx.restore();
    }
    
    /**
     * Crear efecto de texto flotante (damage numbers, etc.)
     */
    createFloatingText(x, y, text, options = {}) {
        const defaults = {
            color: '#ffffff',
            fontSize: 24,
            fontFamily: 'Orbitron, monospace',
            duration: 60,
            velocity: { x: 0, y: -2 },
            fade: true,
            shadow: true
        };
        
        const config = { ...defaults, ...options };
        
        this.effects.push(new FloatingText({
            x, y, text,
            ...config,
            life: config.duration,
            maxLife: config.duration
        }));
    }
    
    /**
     * Agregar efecto de screen shake
     */
    addScreenShake(amount) {
        if (!Config.GRAPHICS.EFFECTS.SCREEN_SHAKE) return;
        this.screenShakeAmount = Math.max(this.screenShakeAmount, amount);
    }
    
    /**
     * Crear efecto de transición suave entre estados
     */
    createTransitionEffect(type, options = {}) {
        switch (type) {
            case 'fadeOut':
                this.effects.push(new TransitionEffect('fadeOut', options));
                break;
            case 'fadeIn':
                this.effects.push(new TransitionEffect('fadeIn', options));
                break;
            case 'slide':
                this.effects.push(new TransitionEffect('slide', options));
                break;
        }
    }
    
    /**
     * Actualizar todos los efectos
     */
    update(deltaTime) {
        if (!this.isEnabled) return;
        
        // Actualizar partículas
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update(deltaTime);
            
            if (particle.isDead()) {
                this.particles.splice(i, 1);
            }
        }
        
        // Actualizar efectos especiales
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            effect.update(deltaTime);
            
            if (effect.isFinished()) {
                this.effects.splice(i, 1);
            }
        }
        
        // Actualizar screen shake
        this.updateScreenShake();
    }
    
    updateScreenShake() {
        if (this.screenShakeAmount > 0.1) {
            this.screenShakeAmount *= this.screenShakeDecay;
        } else {
            this.screenShakeAmount = 0;
        }
    }
    
    /**
     * Renderizar todos los efectos
     */
    render() {
        if (!this.isEnabled) return;
        
        this.ctx.save();
        
        // Aplicar screen shake
        if (this.screenShakeAmount > 0) {
            const shakeX = (Math.random() - 0.5) * this.screenShakeAmount;
            const shakeY = (Math.random() - 0.5) * this.screenShakeAmount;
            this.ctx.translate(shakeX, shakeY);
        }
        
        // Renderizar partículas
        this.particles.forEach(particle => particle.render(this.ctx));
        
        // Renderizar efectos especiales
        this.effects.forEach(effect => effect.render(this.ctx));
        
        this.ctx.restore();
    }
    
    /**
     * Limpiar todos los efectos
     */
    clear() {
        this.particles = [];
        this.effects = [];
        this.screenShakeAmount = 0;
    }
    
    /**
     * Optimización: limpiar efectos viejos
     */
    cleanup() {
        const maxParticles = 100;
        if (this.particles.length > maxParticles) {
            this.particles = this.particles.slice(-maxParticles);
        }
    }
    
    /**
     * Configuración dinámica
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        if (!enabled) {
            this.clear();
        }
    }
}

/**
 * Clase Particle para efectos de partículas
 */
class Particle {
    constructor(options) {
        this.x = options.x;
        this.y = options.y;
        this.vx = options.vx;
        this.vy = options.vy;
        this.life = options.life;
        this.maxLife = options.maxLife;
        this.size = options.size;
        this.color = options.color;
        this.gravity = options.gravity || 0;
        this.friction = options.friction || 1;
        this.alpha = 1;
    }
    
    update(deltaTime) {
        // Actualizar posición
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        
        // Aplicar gravedad y fricción
        this.vy += this.gravity * deltaTime;
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        // Actualizar vida
        this.life -= deltaTime;
        this.alpha = Math.max(0, this.life / this.maxLife);
    }
    
    render(ctx) {
        if (this.alpha <= 0) return;
        
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * this.alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    
    isDead() {
        return this.life <= 0;
    }
}

/**
 * Clase FloatingText para texto flotante
 */
class FloatingText {
    constructor(options) {
        this.x = options.x;
        this.y = options.y;
        this.text = options.text;
        this.color = options.color;
        this.fontSize = options.fontSize;
        this.fontFamily = options.fontFamily;
        this.vx = options.velocity.x;
        this.vy = options.velocity.y;
        this.life = options.life;
        this.maxLife = options.maxLife;
        this.fade = options.fade;
        this.shadow = options.shadow;
        this.alpha = 1;
    }
    
    update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.life -= deltaTime;
        
        if (this.fade) {
            this.alpha = Math.max(0, this.life / this.maxLife);
        }
    }
    
    render(ctx) {
        if (this.alpha <= 0) return;
        
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.font = `${this.fontSize}px ${this.fontFamily}`;
        ctx.textAlign = 'center';
        
        if (this.shadow) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
        }
        
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, this.x, this.y);
        
        ctx.restore();
    }
    
    isFinished() {
        return this.life <= 0;
    }
}

/**
 * Clase TransitionEffect para transiciones suaves
 */
class TransitionEffect {
    constructor(type, options) {
        this.type = type;
        this.options = { duration: 30, ...options };
        this.progress = 0;
        this.maxProgress = this.options.duration;
    }
    
    update(deltaTime) {
        this.progress += deltaTime;
    }
    
    render(ctx) {
        const alpha = this.getAlpha();
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.options.color || 'black';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.restore();
    }
    
    getAlpha() {
        const normalized = this.progress / this.maxProgress;
        
        switch (this.type) {
            case 'fadeOut':
                return Math.min(1, normalized);
            case 'fadeIn':
                return Math.max(0, 1 - normalized);
            default:
                return 0;
        }
    }
    
    isFinished() {
        return this.progress >= this.maxProgress;
    }
}
