class TouchControls {
    constructor(canvas, character) {
        this.canvas = canvas;
        this.character = character;
        this.isPressed = false;
        this.currentDirection = null;
        this.touchIndicators = [];
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Eventos táctiles
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // Eventos de mouse (para desktop)
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));
    }

    getCanvasPosition(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    calculateDirection(canvasX, canvasY) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Crear zonas de movimiento más intuitivas
        const deadZone = 50; // Zona muerta en el centro
        const dx = canvasX - centerX;
        const dy = canvasY - centerY;
        
        // Si está en la zona muerta, no mover
        if (Math.abs(dx) < deadZone && Math.abs(dy) < deadZone) {
            return null;
        }

        // Determinar dirección principal
        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? 'derecha' : 'izquierda';
        } else {
            return dy > 0 ? 'abajo' : 'arriba';
        }
    }

    createTouchIndicator(x, y) {
        const indicator = document.createElement('div');
        indicator.className = 'canvas-touch-indicator';
        indicator.style.left = `${x - 15}px`;
        indicator.style.top = `${y - 15}px`;
        indicator.style.width = '30px';
        indicator.style.height = '30px';
        
        this.canvas.parentElement.style.position = 'relative';
        this.canvas.parentElement.appendChild(indicator);
        
        // Remover después de la animación
        setTimeout(() => {
            if (indicator.parentElement) {
                indicator.parentElement.removeChild(indicator);
            }
        }, 300);
    }

    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const canvasPos = this.getCanvasPosition(touch.clientX, touch.clientY);
        
        this.isPressed = true;
        this.processMovement(canvasPos.x, canvasPos.y);
        this.createTouchIndicator(touch.clientX, touch.clientY);
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (!this.isPressed) return;
        
        const touch = e.touches[0];
        const canvasPos = this.getCanvasPosition(touch.clientX, touch.clientY);
        this.processMovement(canvasPos.x, canvasPos.y);
    }

    handleTouchEnd(e) {
        this.isPressed = false;
        this.currentDirection = null;
        this.character.stopMovement();
    }

    handleMouseDown(e) {
        const canvasPos = this.getCanvasPosition(e.clientX, e.clientY);
        this.isPressed = true;
        this.processMovement(canvasPos.x, canvasPos.y);
        this.createTouchIndicator(e.clientX, e.clientY);
    }

    handleMouseMove(e) {
        if (!this.isPressed) return;
        
        const canvasPos = this.getCanvasPosition(e.clientX, e.clientY);
        this.processMovement(canvasPos.x, canvasPos.y);
    }

    handleMouseUp(e) {
        this.isPressed = false;
        this.currentDirection = null;
        this.character.stopMovement();
    }

    processMovement(canvasX, canvasY) {
        const direction = this.calculateDirection(canvasX, canvasY);
        
        if (direction && direction !== this.currentDirection) {
            this.currentDirection = direction;
            this.character.startMovement(direction);
        } else if (!direction) {
            this.currentDirection = null;
            this.character.stopMovement();
        }
    }

    // Método para dibujar guías visuales opcionales en el canvas
    drawTouchGuides(ctx) {
        if (!this.isPressed) return;
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Dibujar zona muerta
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(centerX - 50, centerY - 50, 100, 100);
        
        // Dibujar cruz direccional
        ctx.beginPath();
        ctx.moveTo(centerX - 25, centerY);
        ctx.lineTo(centerX + 25, centerY);
        ctx.moveTo(centerX, centerY - 25);
        ctx.lineTo(centerX, centerY + 25);
        ctx.stroke();
        ctx.restore();
    }
}