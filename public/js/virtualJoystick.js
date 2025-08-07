/**
 * VirtualJoystick - Control de movimiento táctil avanzado
 * Diseñado para Vartar con feedback visual y háptico
 */
class VirtualJoystick {
    constructor(canvasElement, character, options = {}) {
        this.canvas = canvasElement;
        this.character = character;
        
        // Configuración por defecto
        this.config = {
            size: options.size || 120,
            deadZone: options.deadZone || 0.2,
            maxDistance: options.maxDistance || 50,
            alpha: options.alpha || 0.8,
            colors: {
                base: 'rgba(255, 255, 255, 0.3)',
                stick: 'rgba(99, 102, 241, 0.8)',
                active: 'rgba(139, 92, 246, 0.9)'
            },
            hapticFeedback: options.hapticFeedback !== false,
            smoothing: options.smoothing || 0.8,
            autoHide: options.autoHide !== false,
            hideDelay: options.hideDelay || 2000
        };
        
        this.isActive = false;
        this.isVisible = false;
        this.centerX = 0;
        this.centerY = 0;
        this.stickX = 0;
        this.stickY = 0;
        this.currentForce = { x: 0, y: 0 };
        this.smoothedForce = { x: 0, y: 0 };
        this.hideTimeout = null;
        
        this.bindEvents();
        this.setupVisibilityToggle();
    }
    
    bindEvents() {
        // Touch events para móviles
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        
        // Mouse events para desarrollo en desktop
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    }
    
    setupVisibilityToggle() {
        // Mostrar joystick al tocar la pantalla
        this.canvas.addEventListener('touchstart', () => {
            this.showJoystick();
        }, { passive: true });
        
        // Auto-ocultar después de inactividad
        if (this.config.autoHide) {
            this.canvas.addEventListener('touchend', () => {
                this.scheduleHide();
            });
        }
    }
    
    handleTouchStart(event) {
        event.preventDefault();
        const touch = event.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        
        this.centerX = touch.clientX - rect.left;
        this.centerY = touch.clientY - rect.top;
        this.stickX = this.centerX;
        this.stickY = this.centerY;
        
        this.isActive = true;
        this.showJoystick();
        this.triggerHapticFeedback('light');
    }
    
    handleTouchMove(event) {
        if (!this.isActive) return;
        
        event.preventDefault();
        const touch = event.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;
        
        this.updateStickPosition(touchX, touchY);
        this.updateCharacterMovement();
    }
    
    handleTouchEnd(event) {
        event.preventDefault();
        this.resetJoystick();
    }
    
    // Mouse events para desarrollo
    handleMouseDown(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.centerX = event.clientX - rect.left;
        this.centerY = event.clientY - rect.top;
        this.stickX = this.centerX;
        this.stickY = this.centerY;
        
        this.isActive = true;
        this.showJoystick();
    }
    
    handleMouseMove(event) {
        if (!this.isActive) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        this.updateStickPosition(mouseX, mouseY);
        this.updateCharacterMovement();
    }
    
    handleMouseUp(event) {
        this.resetJoystick();
    }
    
    updateStickPosition(inputX, inputY) {
        const deltaX = inputX - this.centerX;
        const deltaY = inputY - this.centerY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance > this.config.maxDistance) {
            const angle = Math.atan2(deltaY, deltaX);
            this.stickX = this.centerX + Math.cos(angle) * this.config.maxDistance;
            this.stickY = this.centerY + Math.sin(angle) * this.config.maxDistance;
        } else {
            this.stickX = inputX;
            this.stickY = inputY;
        }
        
        // Calcular fuerza normalizada
        const normalizedDistance = Math.min(distance / this.config.maxDistance, 1);
        
        if (normalizedDistance > this.config.deadZone) {
            const adjustedDistance = (normalizedDistance - this.config.deadZone) / (1 - this.config.deadZone);
            const angle = Math.atan2(deltaY, deltaX);
            
            this.currentForce.x = Math.cos(angle) * adjustedDistance;
            this.currentForce.y = Math.sin(angle) * adjustedDistance;
        } else {
            this.currentForce.x = 0;
            this.currentForce.y = 0;
        }
    }
    
    updateCharacterMovement() {
        if (!this.character) return;
        
        // Suavizado del movimiento
        this.smoothedForce.x += (this.currentForce.x - this.smoothedForce.x) * this.config.smoothing;
        this.smoothedForce.y += (this.currentForce.y - this.smoothedForce.y) * this.config.smoothing;
        
        // Aplicar movimiento al personaje
        const speed = Config.GAME?.PLAYER_SPEED || 3;
        this.character.velocity.x = this.smoothedForce.x * speed;
        this.character.velocity.y = this.smoothedForce.y * speed;
        
        // Feedback háptico sutil durante movimiento
        if (Math.abs(this.smoothedForce.x) > 0.5 || Math.abs(this.smoothedForce.y) > 0.5) {
            this.triggerHapticFeedback('subtle');
        }
    }
    
    resetJoystick() {
        this.isActive = false;
        this.currentForce.x = 0;
        this.currentForce.y = 0;
        this.smoothedForce.x = 0;
        this.smoothedForce.y = 0;
        
        if (this.character) {
            this.character.velocity.x = 0;
            this.character.velocity.y = 0;
        }
        
        this.scheduleHide();
        this.triggerHapticFeedback('light');
    }
    
    showJoystick() {
        this.isVisible = true;
        this.clearHideTimeout();
    }
    
    scheduleHide() {
        if (!this.config.autoHide) return;
        
        this.clearHideTimeout();
        this.hideTimeout = setTimeout(() => {
            this.isVisible = false;
        }, this.config.hideDelay);
    }
    
    clearHideTimeout() {
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }
    }
    
    triggerHapticFeedback(intensity = 'light') {
        if (!this.config.hapticFeedback || !navigator.vibrate) return;
        
        const patterns = {
            subtle: [5],
            light: [10],
            medium: [15],
            strong: [25]
        };
        
        navigator.vibrate(patterns[intensity] || patterns.light);
    }
    
    draw(ctx) {
        if (!this.isVisible) return;
        
        ctx.save();
        ctx.globalAlpha = this.config.alpha;
        
        // Dibujar base del joystick
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, this.config.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = this.config.colors.base;
        ctx.fill();
        ctx.strokeStyle = this.isActive ? this.config.colors.active : this.config.colors.stick;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Dibujar stick
        const stickSize = this.config.size / 4;
        ctx.beginPath();
        ctx.arc(this.stickX, this.stickY, stickSize, 0, Math.PI * 2);
        ctx.fillStyle = this.isActive ? this.config.colors.active : this.config.colors.stick;
        ctx.fill();
        ctx.strokeStyle = this.config.colors.base;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Indicador de dirección
        if (this.isActive && (Math.abs(this.currentForce.x) > 0.1 || Math.abs(this.currentForce.y) > 0.1)) {
            ctx.beginPath();
            ctx.moveTo(this.centerX, this.centerY);
            ctx.lineTo(this.stickX, this.stickY);
            ctx.strokeStyle = this.config.colors.active;
            ctx.lineWidth = 3;
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    // Métodos de configuración dinámica
    updateColors(newColors) {
        this.config.colors = { ...this.config.colors, ...newColors };
    }
    
    setVisibility(visible) {
        this.isVisible = visible;
        this.clearHideTimeout();
    }
    
    resize() {
        // Reajustar posición en caso de cambio de orientación
        const rect = this.canvas.getBoundingClientRect();
        if (this.centerX > rect.width) {
            this.centerX = rect.width - this.config.size;
        }
        if (this.centerY > rect.height) {
            this.centerY = rect.height - this.config.size;
        }
    }
}
