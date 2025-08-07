/**
 * GameUI - Sistema de interfaz moderna para Vartar
 * Maneja notificaciones, overlays, y elementos UI responsivos
 */
class GameUI {
    constructor() {
        this.notifications = [];
        this.overlays = new Map();
        this.soundEnabled = true;
        this.vibrationEnabled = true;
        
        this.initializeUI();
        this.setupResponsiveHandlers();
    }
    
    initializeUI() {
        // Crear contenedores de UI dinámicos
        this.createNotificationContainer();
        this.createOverlayContainer();
        this.createHUDElements();
        this.setupThemeSelector();
    }
    
    createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'fixed top-4 right-4 z-50 space-y-2 max-w-sm';
        document.body.appendChild(container);
        
        this.notificationContainer = container;
    }
    
    createOverlayContainer() {
        const container = document.createElement('div');
        container.id = 'overlay-container';
        container.className = 'fixed inset-0 z-40 pointer-events-none';
        document.body.appendChild(container);
        
        this.overlayContainer = container;
    }
    
    createHUDElements() {
        // HUD de información del jugador
        const hudHTML = `
            <div id="player-hud" class="fixed top-4 left-4 z-30 bg-slate-800/90 backdrop-blur-md rounded-xl p-4 text-white border border-slate-600">
                <div class="flex items-center space-x-3">
                    <div id="player-avatar" class="w-12 h-12 rounded-full bg-gaming-primary overflow-hidden">
                        <!-- Avatar dinámico -->
                    </div>
                    <div>
                        <div id="player-name" class="font-gaming text-sm font-semibold">Jugador</div>
                        <div class="flex items-center space-x-2">
                            <div class="flex space-x-1">
                                <div id="life-bar" class="h-2 bg-red-600 rounded-full min-w-[60px]"></div>
                            </div>
                            <span id="life-count" class="text-xs text-slate-300">100</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', hudHTML);
    }
    
    setupThemeSelector() {
        // Selector de tema/elemento
        const themeSelectorHTML = `
            <div id="theme-selector" class="fixed bottom-20 right-4 z-30">
                <button id="theme-toggle" class="w-12 h-12 bg-slate-800/90 backdrop-blur-md rounded-full border border-slate-600 flex items-center justify-center text-white hover:bg-slate-700 transition-colors">
                    🌟
                </button>
                <div id="theme-options" class="hidden absolute bottom-14 right-0 bg-slate-800/95 backdrop-blur-md rounded-xl p-2 border border-slate-600 space-y-1">
                    <button class="theme-btn w-10 h-10 rounded-lg bg-earth-500 hover:scale-110 transition-transform" data-theme="earth">🌍</button>
                    <button class="theme-btn w-10 h-10 rounded-lg bg-fire-500 hover:scale-110 transition-transform" data-theme="fire">🔥</button>
                    <button class="theme-btn w-10 h-10 rounded-lg bg-water-500 hover:scale-110 transition-transform" data-theme="water">💧</button>
                    <button class="theme-btn w-10 h-10 rounded-lg bg-air-500 hover:scale-110 transition-transform" data-theme="air">☁️</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', themeSelectorHTML);
        this.setupThemeEvents();
    }
    
    setupThemeEvents() {
        const themeToggle = document.getElementById('theme-toggle');
        const themeOptions = document.getElementById('theme-options');
        
        themeToggle.addEventListener('click', () => {
            themeOptions.classList.toggle('hidden');
        });
        
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const theme = e.target.dataset.theme;
                this.applyTheme(theme);
                themeOptions.classList.add('hidden');
            });
        });
    }
    
    applyTheme(theme) {
        const themes = {
            earth: {
                primary: '#8b5a3c',
                secondary: '#7a4d33',
                accent: '#d4a574'
            },
            fire: {
                primary: '#ea580c',
                secondary: '#dc2626',
                accent: '#fbbf24'
            },
            water: {
                primary: '#0ea5e9',
                secondary: '#0284c7',
                accent: '#67e8f9'
            },
            air: {
                primary: '#64748b',
                secondary: '#475569',
                accent: '#cbd5e1'
            }
        };
        
        const selectedTheme = themes[theme];
        if (selectedTheme) {
            document.documentElement.style.setProperty('--theme-primary', selectedTheme.primary);
            document.documentElement.style.setProperty('--theme-secondary', selectedTheme.secondary);
            document.documentElement.style.setProperty('--theme-accent', selectedTheme.accent);
            
            // Guardar preferencia
            localStorage.setItem('vartar_theme', theme);
            
            this.showNotification(`Tema ${theme} activado`, 'success');
        }
    }
    
    setupResponsiveHandlers() {
        // Detector de orientación
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleOrientationChange(), 100);
        });
        
        // Detector de redimensionamiento
        window.addEventListener('resize', () => this.handleResize());
        
        // Detector de visibilidad (para pausar el juego)
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
    }
    
    handleOrientationChange() {
        const isLandscape = window.innerHeight < window.innerWidth;
        document.body.classList.toggle('landscape-mode', isLandscape);
        
        // Ajustar UI para orientación
        if (isLandscape) {
            this.showNotification('Modo paisaje activado', 'info', 2000);
            this.optimizeForLandscape();
        } else {
            this.showNotification('Modo retrato activado', 'info', 2000);
            this.optimizeForPortrait();
        }
    }
    
    optimizeForLandscape() {
        // Mover controles para mejor acceso en paisaje
        const hud = document.getElementById('player-hud');
        const themeSelector = document.getElementById('theme-selector');
        
        if (hud) {
            hud.style.top = '8px';
            hud.style.left = '8px';
        }
        
        if (themeSelector) {
            themeSelector.style.bottom = '8px';
            themeSelector.style.right = '8px';
        }
    }
    
    optimizeForPortrait() {
        // Restaurar posiciones normales
        const hud = document.getElementById('player-hud');
        const themeSelector = document.getElementById('theme-selector');
        
        if (hud) {
            hud.style.top = '16px';
            hud.style.left = '16px';
        }
        
        if (themeSelector) {
            themeSelector.style.bottom = '80px';
            themeSelector.style.right = '16px';
        }
    }
    
    handleResize() {
        // Reajustar canvas y elementos responsivos
        const canvas = document.getElementById('mapa');
        if (canvas) {
            this.resizeCanvas(canvas);
        }
    }
    
    resizeCanvas(canvas) {
        const container = canvas.parentElement;
        const containerWidth = container.clientWidth;
        const aspectRatio = 4 / 3;
        
        let canvasWidth = containerWidth - 32; // padding
        let canvasHeight = canvasWidth / aspectRatio;
        
        // Limitar altura en pantallas muy anchas
        const maxHeight = window.innerHeight * 0.7;
        if (canvasHeight > maxHeight) {
            canvasHeight = maxHeight;
            canvasWidth = canvasHeight * aspectRatio;
        }
        
        canvas.style.width = `${canvasWidth}px`;
        canvas.style.height = `${canvasHeight}px`;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
    }
    
    handleVisibilityChange() {
        if (document.hidden) {
            // Pausar juego cuando la pestaña no está visible
            this.pauseGame();
        } else {
            // Reanudar juego
            this.resumeGame();
        }
    }
    
    pauseGame() {
        // Emitir evento personalizado para pausar el juego
        window.dispatchEvent(new CustomEvent('gamePaused'));
        this.showNotification('Juego pausado', 'warning');
    }
    
    resumeGame() {
        // Emitir evento personalizado para reanudar el juego
        window.dispatchEvent(new CustomEvent('gameResumed'));
        this.showNotification('Juego reanudado', 'success');
    }
    
    showNotification(message, type = 'info', duration = 3000) {
        const notification = this.createNotification(message, type);
        this.notificationContainer.appendChild(notification);
        
        // Animación de entrada
        setTimeout(() => {
            notification.classList.add('animate-slide-up');
        }, 10);
        
        // Auto-eliminar
        setTimeout(() => {
            this.removeNotification(notification);
        }, duration);
        
        // Feedback háptico
        if (this.vibrationEnabled && navigator.vibrate) {
            const vibrationPattern = type === 'error' ? [100, 50, 100] : [50];
            navigator.vibrate(vibrationPattern);
        }
    }
    
    createNotification(message, type) {
        const typeStyles = {
            success: 'bg-green-600 border-green-500',
            error: 'bg-red-600 border-red-500',
            warning: 'bg-yellow-600 border-yellow-500',
            info: 'bg-blue-600 border-blue-500'
        };
        
        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ'
        };
        
        const notification = document.createElement('div');
        notification.className = `
            p-4 rounded-lg border backdrop-blur-md text-white text-sm font-medium
            transform transition-all duration-300 translate-x-full opacity-0
            ${typeStyles[type] || typeStyles.info}
        `;
        
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <span class="text-lg">${icons[type] || icons.info}</span>
                <span>${message}</span>
                <button class="ml-auto text-white/70 hover:text-white" onclick="this.parentElement.parentElement.remove()">
                    ×
                </button>
            </div>
        `;
        
        return notification;
    }
    
    removeNotification(notification) {
        notification.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
    
    showOverlay(id, content, options = {}) {
        const overlay = this.createOverlay(id, content, options);
        this.overlayContainer.appendChild(overlay);
        this.overlays.set(id, overlay);
        
        // Animación de entrada
        setTimeout(() => {
            overlay.classList.add('opacity-100');
            const modal = overlay.querySelector('.modal-content');
            if (modal) {
                modal.classList.add('scale-100');
            }
        }, 10);
    }
    
    createOverlay(id, content, options) {
        const overlay = document.createElement('div');
        overlay.id = `overlay-${id}`;
        overlay.className = `
            fixed inset-0 bg-black/50 backdrop-blur-sm opacity-0
            transition-opacity duration-300 pointer-events-auto
            flex items-center justify-center p-4
        `;
        
        const modal = document.createElement('div');
        modal.className = `
            modal-content bg-slate-800 rounded-xl border border-slate-600
            max-w-md w-full p-6 text-white transform scale-95
            transition-transform duration-300
        `;
        
        modal.innerHTML = content;
        overlay.appendChild(modal);
        
        // Cerrar al hacer clic fuera
        if (options.closeOnClickOutside !== false) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.hideOverlay(id);
                }
            });
        }
        
        return overlay;
    }
    
    hideOverlay(id) {
        const overlay = this.overlays.get(id);
        if (overlay) {
            overlay.classList.add('opacity-0');
            const modal = overlay.querySelector('.modal-content');
            if (modal) {
                modal.classList.add('scale-95');
            }
            
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
                this.overlays.delete(id);
            }, 300);
        }
    }
    
    updatePlayerHUD(playerData) {
        const nameEl = document.getElementById('player-name');
        const lifeBar = document.getElementById('life-bar');
        const lifeCount = document.getElementById('life-count');
        const avatar = document.getElementById('player-avatar');
        
        if (nameEl && playerData.name) {
            nameEl.textContent = playerData.name;
        }
        
        if (lifeBar && lifeCount && typeof playerData.lives === 'number') {
            const lifePercentage = (playerData.lives / 100) * 100;
            lifeBar.style.width = `${Math.max(lifePercentage, 10)}px`;
            lifeCount.textContent = playerData.lives;
            
            // Cambiar color según la vida
            if (playerData.lives > 60) {
                lifeBar.className = 'h-2 bg-green-500 rounded-full transition-all duration-300';
            } else if (playerData.lives > 30) {
                lifeBar.className = 'h-2 bg-yellow-500 rounded-full transition-all duration-300';
            } else {
                lifeBar.className = 'h-2 bg-red-500 rounded-full transition-all duration-300';
            }
        }
        
        // if (avatar && playerData.character) {
        //     avatar.innerHTML = `<img src="./assets/${playerData.character}mini.webp" alt="${playerData.character}" class="w-full h-full object-cover">`;
        // }
    }
    
    // Métodos de configuración
    enableSound(enabled = true) {
        this.soundEnabled = enabled;
    }
    
    enableVibration(enabled = true) {
        this.vibrationEnabled = enabled;
    }
    
    // Limpiar recursos
    destroy() {
        this.overlays.clear();
        this.notifications = [];
        
        // Remover event listeners
        window.removeEventListener('orientationchange', this.handleOrientationChange);
        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
}
