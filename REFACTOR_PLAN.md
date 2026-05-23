# Vartar - Plan de Refactorización a Phaser 3

**Versión:** 1.0  
**Fecha:** Mayo 2026  
**Autor:** NikosophosCode  

---

## 1. Resumen Ejecutivo

### Estado Actual
Juego multijugador en tiempo real construido con vanilla Canvas API + HTML5. Arquitectura basada en managers dispersos, polling HTTP intensivo (~30 req/s por jugador), y sprites estáticos sin animación.

### Problemas Identificados
| Problema | Impacto | Prioridad |
|----------|---------|-----------|
| Polling HTTP cada ~33ms | Latencia alta, batería, coste móvil | **CRÍTICO** |
| Sin sprites animados | Experiencia visual pobre, personajes "teletransportan" | **ALTA** |
| Canvas manual | Render loop manual, física improvisada | **MEDIA** |
| Sin arquitectura clara | Difícil mantener y extender | **MEDIA** |

### Visión Refactorizada
Juego 2D top-down multijugador con Phaser 3, WebSockets (Socket.io), sprites animados, y experiencia mobile-first optimizada.

---

## 2. Arquitectura Técnica

### 2.1 Stack Tecnológico

```
Frontend:
├── Phaser 3.70+ (Arcade Physics)
├── TypeScript 5.x
├── Vite 5.x (bundler)
└── Socket.io Client 4.x

Backend:
├── Node.js 18+
├── Express 4.x (API REST legacy + WebSocket)
├── Socket.io 4.x (WebSocket server)
└── Mantiene compatibilidad REST para debugging

Recursos:
├── Spritesheets (PNG) - 8 personajes x 4 direcciones x 4 frames
├── Tilemap JSON (Tiled)
├── Audio OGG/MP3/WEBM
└── Fonts: Orbitron, Space Grotesk, Exo 2
```

### 2.2 Estructura de Directorios

```
vartar/
├── src/
│   ├── core/
│   │   ├── EventBus.ts          # Event emitter singleton
│   │   ├── GameState.ts         # Estado centralizado con reset()
│   │   ├── Constants.ts         # TODA la configuración
│   │   └── SocketManager.ts     # Wrapper Socket.io
│   ├── scenes/
│   │   ├── Boot.ts              # Configuración inicial Phaser
│   │   ├── Preloader.ts         # Carga de assets con progress bar
│   │   ├── CharacterSelect.ts   # Selección de personaje
│   │   ├── GameMap.ts           # Mapa principal (top-down)
│   │   └── Combat.ts            # Pantalla de combate
│   ├── objects/
│   │   ├── Player.ts            # Sprite jugador con state machine
│   │   ├── Enemy.ts             # Sprite enemigo con interpolación
│   │   └── PowerButton.ts       # Botón de poder (Container)
│   ├── systems/
│   │   ├── NetworkSystem.ts     # Sincronización WebSocket
│   │   ├── CollisionSystem.ts   # Colisiones Arcade Physics
│   │   └── CombatSystem.ts      # Resolución de combate
│   ├── ui/
│   │   ├── HUD.ts               # Barra de vida, score, estado
│   │   ├── VirtualJoystick.ts   # Control táctil móvil
│   │   └── NotificationToast.ts # Notificaciones flotantes
│   ├── components/
│   │   ├── CharacterCard.ts     # Tarjeta selección personaje
│   │   ├── PowerGrid.ts         # Grid de 6 poderes
│   │   └── CombatArena.ts      # Arena de combate visual
│   ├── data/
│   │   ├── characters.json      # Definición de personajes
│   │   ├── powers.json           # Poderes y ventajas elementales
│   │   └── maps.json            # Configuración de mapas
│   ├── audio/
│   │   └── AudioManager.ts       # Gestión centralizada audio
│   ├── config.ts                 # Phaser.Types.Core.GameConfig
│   └── main.ts                  # Entry point
├── public/
│   ├── assets/
│   │   ├── sprites/             # Spritesheets personajes
│   │   ├── maps/                # Tilemaps Tiled
│   │   ├── audio/               # SFX y música
│   │   └── images/              # UI, fondos, iconos
│   ├── index.html               # HTML shell
│   └── CSS/                     # Estilos fallback (opcional)
├── server/
│   ├── index.js                 # Entry point servidor
│   ├── websocket/
│   │   ├── handler.js           # Manejador conexiones WS
│   │   └── sync.js              # Sincronización jugadores
│   └── rest/
│       ├── users.js             # Endpoint /users
│       ├── vartar.js            # Endpoints /vartar/*
│       └── metrics.js           # /vartar/metricas
├── package.json
├── tsconfig.json
├── vite.config.ts
└── SPEC.md                     # Este documento
```

---

## 3. Sistema de Red (WebSocket)

### 3.1 Reemplazo de Polling HTTP → WebSocket

**ANTES (HTTP Polling):**
```
Cliente → GET /vartar/:id/posicion cada 33ms → Servidor
Respuesta: { enemigos[], estadoPropio }
```

**AHORA (WebSocket):**
```
Cliente ↔ Servidor: Canal bidireccional persistente
- Posiciones: broadcasts automáticos a todos los clientes
- Eventos: colisión, combate, victoria, derrota
- Heartbeat: cada 30s (no 33ms)
```

### 3.2 Eventos WebSocket

| Evento | Dirección | Descripción |
|--------|-----------|-------------|
| `player:join` | Client → Server | Unirse al juego con personaje |
| `player:position` | Client → Server | Posición actual del jugador |
| `player:move` | Server → Clients | Broadcast de posición (interpolado) |
| `collision:detected` | Server → Clients | Dos jugadores colisionaron |
| `combat:start` | Server → Clients | Inicio de combate |
| `combat:result` | Server → Clients | Resultado del combate |
| `player:left` | Server → Clients | Jugador desconectado |
| `state:snapshot` | Server → Client | Estado completo (reconexión) |

### 3.3 Reconexión Automática

```typescript
socket.on('disconnect', () => {
    // Reintento con backoff exponencial
    // Max 5 intentos, delay: 1s, 2s, 4s, 8s, 16s
});

socket.on('reconnect', () => {
    // Solicitar state:snapshot para sincronizar
});
```

---

## 4. Sistema de Sprites

### 4.1 Estructura de Spritesheets

Cada personaje requiere un spritesheet con animaciones para 4 direcciones (abajo, izquierda, derecha, arriba) y 4 frames de walk cycle.

```
Character Spritesheet Layout (ejemplo: sinji)
├── Filas: 4 (DOWN, LEFT, RIGHT, UP)
├── Columnas: 4 (walk cycle: 0, 1, 2, 3)
├── Frame size: 64x64 px
└── Spritesheet: 256x256 px
```

### 4.2 Animaciones por Personaje

| Animación | Frames | Uso |
|-----------|--------|-----|
| `idle` | 1 (frame 0) | Personaje quieto |
| `walk_down` | 4 | Movimiento hacia abajo |
| `walk_left` | 4 | Movimiento hacia izquierda |
| `walk_right` | 4 | Movimiento hacia derecha |
| `walk_up` | 4 | Movimiento hacia arriba |
| `attack` | 4 | Ataque (en combate) |
| `hit` | 2 | Recibió daño |
| `victory` | 4 | Ganó combate |
| `defeat` | 4 | Perdió combate |

### 4.3 Implementación en Phaser

```typescript
// Player.ts
export class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene: Phaser.Scene, texture: string) {
        super(scene, 0, 0, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Animaciones
        this.anims.create({
            key: 'idle',
            frames: [{ key: texture, frame: 'sinji_idle' }],
            frameRate: 1
        });

        this.anims.create({
            key: 'walk_down',
            frames: this.generateWalkFrames('sinji', 'down', 4),
            frameRate: 8,
            repeat: -1
        });
        // ... etc
    }

    move(direction: Direction, speed: number) {
        this.setVelocity(...);
        this.play(`walk_${direction}`);
    }

    stop() {
        this.setVelocity(0, 0);
        this.play('idle');
    }
}
```

### 4.4 Interpolación de Movimiento (Enemy)

```typescript
// Enemy.ts
export class Enemy extends Phaser.Physics.Arcade.Sprite {
    private targetX: number = 0;
    private targetY: number = 0;
    private interpolationSpeed: number = 0.15;

    setTargetPosition(x: number, y: number) {
        this.targetX = x;
        this.targetY = y;
    }

    update(_time: number, delta: number) {
        // Interpolación lineal suave
        const factor = this.interpolationSpeed * (delta / 16);
        this.x = Phaser.Math.Linear(this.x, this.targetX, factor);
        this.y = Phaser.Math.Linear(this.y, this.targetY, factor);

        // Actualizar dirección visual
        this.updateFacingDirection();
    }
}
```

---

## 5. Escenas del Juego

### 5.1 Boot Scene

```typescript
export class Boot extends Phaser.Scene {
    create() {
        // Configurar scale manager para mobile
        this.scale.scaleMode = Phaser.ScaleManager.FIT;
        this.scale.pageAlignHorizontally = true;
        this.scale.pageAlignVertically = true;

        // Transición a Preloader
        this.scene.start('Preloader');
    }
}
```

### 5.2 Preloader Scene

```typescript
export class Preloader extends Phaser.Scene {
    preload() {
        // Progress bar
        const bar = this.add.graphics();
        const bg = this.add.graphics();

        this.load.on('progress', (value: number) => {
            bar.clear();
            bar.fillStyle(0x6366f1, 1);
            bar.fillRect(0, 0, 400 * value, 20);
        });

        // Cargar todo
        this.load.atlas('characters', 'assets/sprites/characters.png', 'assets/sprites/characters.json');
        this.load.image('map', 'assets/maps/vartar-map.png');
        this.load.audio('bgm', ['assets/audio/bgm.mp3', 'assets/audio/bgm.ogg']);
        this.load.audio('sfx_select', 'assets/audio/select.mp3');
        this.load.audio('sfx_attack', 'assets/audio/attack.mp3');
    }

    create() {
        this.scene.start('CharacterSelect');
    }
}
```

### 5.3 CharacterSelect Scene

- Grid de 8 personajes (2 filas x 4 columnas)
- Cada tarjeta muestra: sprite animado, nombre, elemento (icono)
- Hover/tap: zoom + glow effect
- Selección: bounce animation + sonido
- Transición: fade out → GameMap

### 5.4 GameMap Scene

```typescript
export class GameMap extends Phaser.Scene {
    private player!: Player;
    private enemies: Phaser.GameObjects.Group;
    private joystick!: VirtualJoystick;
    private hud!: HUD;

    create() {
        // Fondo del mapa
        this.add.image(0, 0, 'map').setOrigin(0);

        // Jugador
        this.player = new Player(this, 'sinji');
        this.player.setPosition(400, 300);

        // Enemigos (grupo)
        this.enemies = this.physics.add.group();

        // Colisiones
        this.physics.add.overlap(
            this.player,
            this.enemies,
            this.onCollision,
            undefined,
            this
        );

        // Virtual Joystick (solo en táctil)
        if (this.sys.game.device.input.touch) {
            this.joystick = new VirtualJoystick(this);
        }

        // HUD
        this.hud = new HUD(this);

        // WebSocket
        SocketManager.connect();
        SocketManager.on('player:move', this.onEnemyMove, this);
    }

    update(time: number, delta: number) {
        this.player.update(delta);
        this.enemies.getChildren().forEach(e => (e as Enemy).update(time, delta));
    }

    private onCollision(player: Player, enemy: Enemy) {
        this.scene.pause();
        this.scene.launch('Combat', { player, enemy });
    }
}
```

### 5.5 Combat Scene

```typescript
export class Combat extends Phaser.Scene {
    init(data: { player: Player; enemy: Enemy }) {
        this.playerData = data.player;
        this.enemyData = data.enemy;
    }

    create() {
        // Arena visual (particles, glow)
        // Mostrar ambos sprites enfrentados
        // Grid de 6 poderes (2 filas x 3 columnas)
        // Timer de selección
        // Animación de resolución (poder vs poder, 6 rondas)
        // Resultado (victory/defeat/draw)
    }

    private resolveCombat() {
        // Procesar 6 poderes alternados
        // Mostrar animación de cada resolución
        // Actualizar scores
        // Mostrar resultado final
        // Transición back a GameMap
    }
}
```

---

## 6. Sistema de Combate

### 6.1 Flujo de Combate

```
1. Collision detectada (distancia < 80px)
2. Ambos jugadores pausados
3. Combat Scene iniciada
4. Jugador selecciona 6 poderes (uno por turno rápido)
5. Servidor determina poderes del enemigo
6. Resolución visual (alternar显示)
7. Contador de victorias
8. Resultado final
9. Winner: +1 score, teleport lejos
   Loser: respawn en posición inicial
```

### 6.2 Resolución de Poderes

```typescript
const POWER_ADVANTAGES = [
    ['FUEGO', 'TIERRA'],   // Fuego vence Tierra
    ['AGUA', 'FUEGO'],     // Agua vence Fuego
    ['TIERRA', 'AIRE'],    // Tierra vence Aire
    ['AIRE', 'AGUA'],      // Aire vence Agua
];

function resolvePower(player: string, enemy: string): 'win' | 'lose' | 'draw' {
    if (player === enemy) return 'draw';
    const advantage = POWER_ADVANTAGES.find(([w, l]) => w === player && l === enemy);
    return advantage ? 'win' : 'lose';
}
```

### 6.3 UI de Poderes

```typescript
// PowerButton.ts
export class PowerButton extends Phaser.GameObjects.Container {
    private power: PowerData;
    private selected: boolean = false;

    constructor(scene: Phaser.Scene, power: PowerData) {
        super(scene, 0, 0);

        const bg = scene.add.rectangle(0, 0, 80, 80, 0x333333);
        const icon = scene.add.text(0, 0, power.emoji, { fontSize: '32px' });

        this.add([bg, icon]);

        scene.add.existing(this);
        this.setSize(80, 80);

        this.setInteractive().on('pointerdown', () => this.select());
    }

    select() {
        if (this.selected) return;
        this.selected = true;
        this.emit('power:selected', this.power);
    }
}
```

---

## 7. Experiencia Mobile-First

### 7.1 Virtual Joystick

```typescript
export class VirtualJoystick extends Phaser.GameObjects.Container {
    private base: Phaser.GameObjects.Graphics;
    private knob: Phaser.GameObjects.Graphics;
    private direction: { x: number; y: number } = { x: 0, y: 0 };

    constructor(scene: Phaser.Scene) {
        super(scene);

        const cx = scene.scale.width * 0.2;
        const cy = scene.scale.height - 120;

        this.base = scene.add.circle(cx, cy, 60, 0x333333, 0.5);
        this.knob = scene.add.circle(cx, cy, 25, 0x6366f1, 0.8);

        this.add([this.base, this.knob]);

        scene.input.on('pointermove', this.onPointerMove, this);
        scene.input.on('pointerup', this.onPointerUp, this);
    }

    private onPointerMove(pointer: Phaser.Input.Pointer) {
        const dx = pointer.x - this.base.x;
        const dy = pointer.y - this.base.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 50;

        if (dist > 10) { // dead zone
            const angle = Math.atan2(dy, dx);
            const clampedDist = Math.min(dist, maxDist);

            this.knob.x = this.base.x + Math.cos(angle) * clampedDist;
            this.knob.y = this.base.y + Math.sin(angle) * clampedDist;

            this.direction.x = dx / maxDist;
            this.direction.y = dy / maxDist;
        }
    }

    getDirection(): { x: number; y: number } {
        return this.direction;
    }
}
```

### 7.2 UI Adaptables

```
┌─────────────────────────────────────┐
│  [HP: 100]              [Score: 3] │  ← HUD top (safe zone)
│                                     │
│         ┌─────────────┐             │
│         │   MAPA      │             │
│         │             │             │
│         │    ☺        │             │
│         └─────────────┘             │
│                                     │
│  ┌───┐                       ┌───┐  │
│  │Joy│                       │End│  │  ← Controls bottom
│  └───┘                       └───┘  │  ← Safe zone bottom
└─────────────────────────────────────┘
```

### 7.3 Safe Zone (Play.fun / Mobile Safari)

```typescript
// Constants.ts
function readSafeInsets(): { top: number; bottom: number } {
    const style = getComputedStyle(document.documentElement);
    const top = parseInt(style.getPropertyValue('--ogp-safe-top-inset')) || 0;
    const bottom = parseInt(style.getPropertyValue('--ogp-safe-bottom-inset')) || 0;
    return { top: top * window.devicePixelRatio, bottom: bottom * window.devicePixelRatio };
}

export const SAFE_ZONE = {
    TOP: Math.max(GAME.HEIGHT * 0.08, readSafeInsets().top),
    BOTTOM: readSafeInsets().bottom,
};
```

---

## 8. Mejoras de Experiencia de Juego

### 8.1 Sistema de Partículas

| Efecto | Descripción | Partículas |
|--------|-------------|------------|
| `collision` | Explosion al colisionar | 20, radial, naranja/rojo |
| `victory` | Confetti al ganar | 40, cayendo, multicolor |
| `defeat` | Smoke al perder | 15, subiendo, gris |
| `movement` | Trail sutil al caminar | 3, fade, azul/purple |
| `power_select` | Sparkle al seleccionar poder | 8, radial, blanco |
| `power_use` | Burst al usar poder | 12, directional, color del elemento |

### 8.2 Efectos de Pantalla

```typescript
// Screen Effects
- Screen shake en colisiones y ataques
- Flash blanco en hits críticos
- Vignette dinámico según salud
- Parpadeo en daño recibido
```

### 8.3 Sistema de Audio

```typescript
// Audio Manager
const AUDIO = {
    BGM: 'bgm_main',
    SFX: {
        MENU_SELECT: 'select',
        MENU_CONFIRM: 'confirm',
        PLAYER_MOVE: 'step_grass',
        PLAYER_COLLISION: 'collision',
        COMBAT_START: 'combat_start',
        POWER_SELECT: 'power_select',
        POWER_ATTACK: 'power_attack',
        ROUND_WIN: 'round_win',
        ROUND_LOSE: 'round_lose',
        VICTORY: 'victory',
        DEFEAT: 'defeat'
    }
};
```

### 8.4 Elementos UI Adicionales

| Elemento | Descripción |
|----------|-------------|
| ** Minimapa ** | Corner map mostrando posiciones |
| ** Indicador de Dirección ** | Flecha pointing a enemigos fuera de pantalla |
| ** Speed Boost Indicator** | Cuando el jugador tiene bonus |
| ** Combo Counter** | Multiplicador de victorias seguidas |
| ** Chat Emotes** | Emotes rápidos (🔥💧🌍☁️) |

### 8.5 Feedback Visual de Combate

```
Round 1: [FUEGO 🔥] vs [AGUA 💧] → AGUA gana (flash azul)
Round 2: [TIERRA 🌎] vs [FUEGO 🔥] → TIERRA gana (flash marrón)
Round 3: [AIRE ☁] vs [AIRE ☁] → DRAW (flash blanco)
...
Final: Player 4 - Enemy 2 → VICTORY (confetti + animation)
```

### 8.6 Estados de Personaje Visuales

| Estado | Indicador Visual |
|--------|------------------|
| `idle` | Pulsing glow suave |
| `moving` | Sprite animation walk |
| `collision_cooldown` | Icono reloj + opacity reducido |
| `in_combat` | Border rojo brillante |
| `low_health` | HP bar rojo + parpadeo |

---

## 9. Servidor - Mantener Compatibilidad

### 9.1 Estructura Server

```
server/
├── index.js              # Express + Socket.io setup
├── websocket/
│   ├── handler.js         # Connection, disconnect, events
│   └── sync.js            # Position broadcast, interpolation
├── rest/
│   ├── users.js           # GET /users (legacy)
│   ├── vartar.js          # POST /vartar/:id/* (legacy debugging)
│   └── metrics.js         # GET /vartar/metricas
└── game/
    ├── Player.js          # Jugador state
    ├── Combat.js           # Lógica combate (server-side)
    └── Map.js             # Gestión mapa, spawns
```

### 9.2 Socket.io Events (Server)

```javascript
// server/websocket/handler.js
io.on('connection', (socket) => {
    socket.on('player:join', ({ playerId, character }) => { ... });
    socket.on('player:position', ({ x, y, direction }) => { ... });
    socket.on('combat:select', ({ powers }) => { ... });
    socket.on('disconnect', () => { ... });
});

io.on('tick', () => {
    // Broadcast positions cada 50ms (20 FPS de red, no 30!)
    io.emit('state:snapshot', getAllPositions());
});
```

---

## 10. Plan de Implementación por Fases

### Fase 1: Proyecto Base (Semana 1)
- [ ] Inicializar Vite + TypeScript + Phaser
- [ ] Configurar `tsconfig.json`, `vite.config.ts`
- [ ] Crear estructura de directorios
- [ ] Implementar `core/EventBus.ts`, `core/GameState.ts`, `core/Constants.ts`
- [ ] Crear `Boot.ts` y `Preloader.ts` básicos
- [ ] Configurar scale manager para mobile

### Fase 2: Sprites y Assets (Semana 2)
- [ ] Diseñar spritesheets 8 personajes (4 direcciones x 4 frames)
- [ ] Crear tilemap del mapa principal
- [ ] Preparar assets de audio (BGM, SFX)
- [ ] Actualizar `Preloader.ts` con todos los assets
- [ ] Implementar animaciones base en `Player.ts`

### Fase 3: GameMap Scene (Semana 2-3)
- [ ] Implementar `GameMap.ts` con fondo y player
- [ ] Crear `VirtualJoystick.ts` para mobile
- [ ] Implementar movimiento con state machine
- [ ] Crear `Enemy.ts` con interpolación
- [ ] Implementar colisiones Arcade Physics
- [ ] Crear `HUD.ts` con vida/score

### Fase 4: Sistema de Red (Semana 3)
- [ ] Implementar `SocketManager.ts` (client)
- [ ] Implementar WebSocket server
- [ ] Migrar polling HTTP → WebSocket position updates
- [ ] Implementar reconciliación de estado
- [ ] Añadir reconnect con backoff

### Fase 5: Combat Scene (Semana 4)
- [ ] Crear `Combat.ts` scene
- [ ] Implementar `PowerButton.ts` component
- [ ] Crear `CombatArena.ts` visual
- [ ] Implementar lógica de resolución 6 rounds
- [ ] Añadir efectos visuales de combate
- [ ] Implementar resultado y transición

### Fase 6: Polish (Semana 4-5)
- [ ] Partículas para todos los eventos
- [ ] Screen shake y flash effects
- [ ] Audio implementation (BGM + SFX)
- [ ] Mute toggle
- [ ] Notifications/Toast system
- [ ] Animaciones de UI (transiciones, hover)

### Fase 7: Testing y Deployment (Semana 5)
- [ ] Testing en mobile (Chrome DevTools)
- [ ] Performance profiling
- [ ] Bug fixing
- [ ] Deployment configuration
- [ ] Documentation

---

## 11. Constantes Importantes

```typescript
// src/core/Constants.ts

export const GAME = {
    WIDTH: 800,
    HEIGHT: 600,
    BACKGROUND_COLOR: '#1a1a2e',
    FPS_NETWORK: 20,           // 20 FPS de red (no 30!)
    FPS_RENDER: 60,
};

export const PLAYER = {
    SIZE: 64,
    SPEED: 200,
    INTERPOLATION_SPEED: 0.15,
};

export const ENEMY = {
    SIZE: 64,
    SPEED: 150,                // Ligeramente más lento
    INTERPOLATION_SPEED: 0.12,
    POSITION_TOLERANCE: 5,
};

export const COLLISION = {
    DETECTION_RADIUS: 80,
    CONFIRMATION_RADIUS: 70,
};

export const COMBAT = {
    POWERS_PER_PLAYER: 6,
    SELECTION_TIMEOUT: 10000,  // 10 segundos
    ROUND_DELAY: 1500,         // 1.5s entre rondas
};

export const ELEMENTS = {
    ADVANTAGES: [
        ['FUEGO', 'TIERRA'],
        ['AGUA', 'FUEGO'],
        ['TIERRA', 'AIRE'],
        ['AIRE', 'AGUA'],
    ],
};

export const MOBILE = {
    JOYSTICK: {
        SIZE: 120,
        DEAD_ZONE: 0.2,
        KNOB_SIZE: 40,
    },
    SAFE_ZONE: {
        TOP: GAME.HEIGHT * 0.08,
        BOTTOM: 148,  // Default para iOS safe area
    },
};

export const COLORS = {
    UI_PRIMARY: 0x6366f1,
    UI_SECONDARY: 0x8b5cf6,
    ELEMENT_FIRE: 0xff6b35,
    ELEMENT_WATER: 0x3b82f6,
    ELEMENT_EARTH: 0x84cc16,
    ELEMENT_AIR: 0x06b6d4,
    HEALTH_FULL: 0x22c55e,
    HEALTH_LOW: 0xef4444,
};
```

---

## 12. Checklist Pre-Ship

- [ ] **Core loop works** — Player moves, collides, combat resolves
- [ ] **Restart works** — `GameState.reset()` + scene restart clean
- [ ] **Touch + keyboard** — Virtual joystick on mobile, arrows on desktop
- [ ] **Responsive canvas** — `Scale.FIT` + `CENTER_BOTH`
- [ ] **All values in Constants** — Zero magic numbers
- [ ] **EventBus only** — No direct scene references
- [ ] **Scene cleanup** — All listeners removed in `shutdown()`
- [ ] **Physics wired** — Every collider has explicit `addCollider()`
- [ ] **Object pooling** — Groups for enemies, particles
- [ ] **Delta-based movement** — All motion uses `delta`
- [ ] **Mute toggle** — Audio can be muted
- [ ] **Spectacle hooks** — Events for all major actions
- [ ] **WebSocket reconnect** — Automatic with backoff
- [ ] **Build passes** — `npm run build` succeeds
- [ ] **No console errors** — Clean runtime

---

## 13. Recomendaciones de Assets

### 13.1 Spritesheets

```
Character Spritesheet Template:
├── Formato: PNG con transparencia
├── Frame size: 64x64 px (escalable a 80x80 o 96x96)
├── Layout: 4 columnas (walk) x 4 filas (direcciones)
├── Orden de filas: DOWN, LEFT, RIGHT, UP
└── Nombre archivo: {character}_spritesheet.png

Ejemplo: sinji_spritesheet.png (256x256 px)
```

### 13.2 Iconos de Elementos

```
Element/Icons:
├── 🔥 Fuego (naranja/rojo) - 64x64
├── 💧 Agua (azul) - 64x64
├── 🌍 Tierra (marrón/verde) - 64x64
└── ☁️ Aire (celeste/blanco) - 64x64
```

### 13.3 Tilemap

```
Map Requirements:
├── Tamaño: 1600x1200 px (2x del viewport)
├── Formato: PNG o tiled JSON (Tiled)
├── Densidad: zonas abiertas + obstáculos
└──兼容性: funcional con Phaser 3 tilemap
```

---

## 14. Glosario

| Término | Definición |
|---------|------------|
| **State Machine** | Patrón de diseño para gestionar estados de entidad (idle, walk, attack) |
| **Interpolation** | Suavizado de movimiento entre posiciones de red |
| **Dead Zone** | Área central del joystick que no produce movimiento |
| **Backoff** | Retraso exponencial en reconexiones (1s, 2s, 4s...) |
| **Sprite Sheet** | Imagen conteniendo múltiples frames de animación |
| **Arcade Physics** | Sistema de física simple de Phaser (no realista) |
| **Event Bus** | Patrón de comunicación por eventos (decoupling) |

---

*Documento vivo - Actualizar según progreso del proyecto*