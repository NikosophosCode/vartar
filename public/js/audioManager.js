/**
 * AudioManager - Sistema de audio moderno para Vartar
 * Gestiona sonidos, música y efectos con soporte para múltiples formatos
 */
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = new Map();
        this.music = new Map();
        this.currentMusic = null;
        
        this.masterVolume = Config.AUDIO?.MASTER_VOLUME || 0.7;
        this.enabled = Config.AUDIO?.ENABLED !== false;
        
        this.soundVolumes = {
            ui: 0.5,
            movement: 0.3,
            combat: 0.8,
            ambient: 0.4
        };
        
        this.supportedFormats = ['webm', 'ogg', 'mp3'];
        this.loadingPromises = new Map();
        
        this.initializeAudioContext();
        this.preloadSounds();
    }
    
    async initializeAudioContext() {
        try {
            // Usar Web Audio API para mejor control
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Crear nodos de ganancia para diferentes categorías
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = this.masterVolume;
            
            this.uiGain = this.audioContext.createGain();
            this.uiGain.connect(this.masterGain);
            this.uiGain.gain.value = this.soundVolumes.ui;
            
            this.gameGain = this.audioContext.createGain();
            this.gameGain.connect(this.masterGain);
            this.gameGain.gain.value = this.soundVolumes.combat;
            
            console.log('✅ AudioManager: Contexto de audio inicializado');
            
        } catch (error) {
            console.warn('⚠️ AudioManager: Error inicializando contexto de audio:', error);
            this.enabled = false;
        }
    }
    
    /**
     * Detectar el mejor formato de audio soportado
     */
    getBestAudioFormat() {
        const audio = new Audio();
        
        for (const format of this.supportedFormats) {
            const mimeType = `audio/${format === 'mp3' ? 'mpeg' : format}`;
            if (audio.canPlayType(mimeType) === 'probably') {
                return format;
            }
        }
        
        // Fallback a mp3
        return 'mp3';
    }
    
    /**
     * Precargar sonidos esenciales
     */
    async preloadSounds() {
        if (!this.enabled) return;
        
        const audioFormat = this.getBestAudioFormat();
        
        const soundsToLoad = [
            // UI Sounds
            { name: 'click', url: `./assets/sounds/ui-click.${audioFormat}`, category: 'ui' },
            { name: 'select', url: `./assets/sounds/ui-select.${audioFormat}`, category: 'ui' },
            { name: 'notification', url: `./assets/sounds/notification.${audioFormat}`, category: 'ui' },
            
            // Game Sounds
            { name: 'collision', url: `./assets/sounds/collision.${audioFormat}`, category: 'combat' },
            { name: 'powerup', url: `./assets/sounds/powerup.${audioFormat}`, category: 'combat' },
            { name: 'victory', url: `./assets/sounds/victory.${audioFormat}`, category: 'combat' },
            { name: 'defeat', url: `./assets/sounds/defeat.${audioFormat}`, category: 'combat' },
            
            // Movement
            { name: 'movement', url: `./assets/sounds/movement.${audioFormat}`, category: 'movement' },
            
            // Elemental Powers
            { name: 'fire', url: `./assets/sounds/fire-power.${audioFormat}`, category: 'combat' },
            { name: 'water', url: `./assets/sounds/water-power.${audioFormat}`, category: 'combat' },
            { name: 'earth', url: `./assets/sounds/earth-power.${audioFormat}`, category: 'combat' },
            { name: 'air', url: `./assets/sounds/air-power.${audioFormat}`, category: 'combat' }
        ];
        
        // Cargar sonidos en paralelo pero sin bloquear la inicialización
        soundsToLoad.forEach(sound => {
            this.loadSound(sound.name, sound.url, sound.category);
        });
        
        // Precargar música ambiente (opcional)
        this.loadMusic('ambient', `./assets/music/ambient.${audioFormat}`);
        this.loadMusic('combat', `./assets/music/combat.${audioFormat}`);
    }
    
    /**
     * Cargar un sonido individual
     */
    async loadSound(name, url, category = 'game') {
        if (!this.enabled) return;
        
        try {
            const audio = new Audio(url);
            audio.preload = 'auto';
            audio.volume = this.soundVolumes[category] || 0.5;
            
            // Crear múltiples instancias para sonidos que se superponen
            const audioPool = [];
            for (let i = 0; i < 3; i++) {
                const audioClone = audio.cloneNode();
                audioClone.volume = audio.volume;
                audioPool.push(audioClone);
            }
            
            this.sounds.set(name, {
                pool: audioPool,
                currentIndex: 0,
                category,
                volume: this.soundVolumes[category] || 0.5
            });
            
            console.log(`✅ AudioManager: Sonido cargado - ${name}`);
            
        } catch (error) {
            console.warn(`⚠️ AudioManager: Error cargando sonido ${name}:`, error);
        }
    }
    
    /**
     * Cargar música
     */
    async loadMusic(name, url) {
        if (!this.enabled) return;
        
        try {
            const audio = new Audio(url);
            audio.loop = true;
            audio.volume = this.soundVolumes.ambient;
            audio.preload = 'auto';
            
            this.music.set(name, audio);
            console.log(`✅ AudioManager: Música cargada - ${name}`);
            
        } catch (error) {
            console.warn(`⚠️ AudioManager: Error cargando música ${name}:`, error);
        }
    }
    
    /**
     * Reproducir un sonido
     */
    playSound(name, options = {}) {
        if (!this.enabled) return;
        
        const sound = this.sounds.get(name);
        if (!sound) {
            console.warn(`⚠️ AudioManager: Sonido no encontrado - ${name}`);
            return;
        }
        
        try {
            // Usar el siguiente audio disponible del pool
            const audio = sound.pool[sound.currentIndex];
            sound.currentIndex = (sound.currentIndex + 1) % sound.pool.length;
            
            // Configurar opciones
            audio.volume = (options.volume || 1) * sound.volume * this.masterVolume;
            audio.playbackRate = options.playbackRate || 1;
            
            // Reiniciar si ya se está reproduciendo
            if (!audio.paused) {
                audio.currentTime = 0;
            }
            
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn(`⚠️ AudioManager: Error reproduciendo ${name}:`, error);
                });
            }
            
        } catch (error) {
            console.warn(`⚠️ AudioManager: Error reproduciendo sonido ${name}:`, error);
        }
    }
    
    /**
     * Reproducir música
     */
    playMusic(name, fadeIn = true) {
        if (!this.enabled) return;
        
        const music = this.music.get(name);
        if (!music) {
            console.warn(`⚠️ AudioManager: Música no encontrada - ${name}`);
            return;
        }
        
        try {
            // Pausar música actual si existe
            if (this.currentMusic && this.currentMusic !== music) {
                this.stopMusic(true);
            }
            
            music.currentTime = 0;
            
            if (fadeIn) {
                music.volume = 0;
                music.play();
                this.fadeInMusic(music, this.soundVolumes.ambient * this.masterVolume);
            } else {
                music.volume = this.soundVolumes.ambient * this.masterVolume;
                music.play();
            }
            
            this.currentMusic = music;
            
        } catch (error) {
            console.warn(`⚠️ AudioManager: Error reproduciendo música ${name}:`, error);
        }
    }
    
    /**
     * Detener música
     */
    stopMusic(fadeOut = true) {
        if (!this.currentMusic) return;
        
        if (fadeOut) {
            this.fadeOutMusic(this.currentMusic, () => {
                this.currentMusic.pause();
                this.currentMusic = null;
            });
        } else {
            this.currentMusic.pause();
            this.currentMusic = null;
        }
    }
    
    /**
     * Fade in para música
     */
    fadeInMusic(audio, targetVolume, duration = 1000) {
        const steps = 20;
        const stepSize = targetVolume / steps;
        const stepDuration = duration / steps;
        
        let currentStep = 0;
        const fadeInterval = setInterval(() => {
            currentStep++;
            audio.volume = Math.min(stepSize * currentStep, targetVolume);
            
            if (currentStep >= steps) {
                clearInterval(fadeInterval);
            }
        }, stepDuration);
    }
    
    /**
     * Fade out para música
     */
    fadeOutMusic(audio, callback, duration = 1000) {
        const initialVolume = audio.volume;
        const steps = 20;
        const stepSize = initialVolume / steps;
        const stepDuration = duration / steps;
        
        let currentStep = 0;
        const fadeInterval = setInterval(() => {
            currentStep++;
            audio.volume = Math.max(initialVolume - (stepSize * currentStep), 0);
            
            if (currentStep >= steps) {
                clearInterval(fadeInterval);
                if (callback) callback();
            }
        }, stepDuration);
    }
    
    /**
     * Reproducir sonido de UI
     */
    playUISound(type = 'click', options = {}) {
        const soundMap = {
            click: 'click',
            select: 'select',
            notification: 'notification',
            error: 'notification',
            success: 'powerup'
        };
        
        this.playSound(soundMap[type] || 'click', options);
    }
    
    /**
     * Reproducir sonido de poder elemental
     */
    playPowerSound(element, options = {}) {
        const elementMap = {
            'FUEGO 🔥': 'fire',
            'AGUA 💧': 'water',
            'TIERRA 🌎': 'earth',
            'AIRE ☁': 'air'
        };
        
        const soundName = elementMap[element] || 'powerup';
        this.playSound(soundName, options);
    }
    
    /**
     * Reproducir sonido de colisión
     */
    playCollisionSound(intensity = 1) {
        this.playSound('collision', {
            volume: intensity,
            playbackRate: 0.8 + (Math.random() * 0.4) // Variación en pitch
        });
    }
    
    /**
     * Configurar volúmenes
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.masterVolume;
        }
    }
    
    setCategoryVolume(category, volume) {
        this.soundVolumes[category] = Math.max(0, Math.min(1, volume));
        
        // Actualizar sonidos existentes
        this.sounds.forEach(sound => {
            if (sound.category === category) {
                sound.volume = this.soundVolumes[category];
                sound.pool.forEach(audio => {
                    audio.volume = sound.volume * this.masterVolume;
                });
            }
        });
    }
    
    /**
     * Habilitar/deshabilitar audio
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.stopAllSounds();
            this.stopMusic();
        }
    }
    
    /**
     * Detener todos los sonidos
     */
    stopAllSounds() {
        this.sounds.forEach(sound => {
            sound.pool.forEach(audio => {
                audio.pause();
                audio.currentTime = 0;
            });
        });
    }
    
    /**
     * Pausar/reanudar por visibilidad de página
     */
    handleVisibilityChange() {
        if (document.hidden) {
            this.pauseAll();
        } else {
            this.resumeAll();
        }
    }
    
    pauseAll() {
        if (this.currentMusic && !this.currentMusic.paused) {
            this.currentMusic.pause();
            this.musicWasPaused = true;
        }
    }
    
    resumeAll() {
        if (this.currentMusic && this.musicWasPaused) {
            this.currentMusic.play();
            this.musicWasPaused = false;
        }
    }
    
    /**
     * Limpiar recursos
     */
    destroy() {
        this.stopAllSounds();
        this.stopMusic(false);
        
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
        
        this.sounds.clear();
        this.music.clear();
        this.loadingPromises.clear();
    }
}
