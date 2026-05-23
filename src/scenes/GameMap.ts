import Phaser from 'phaser';
import { Player } from '../objects/Player';
import { Enemy } from '../objects/Enemy';
import { VirtualJoystick } from '../ui/VirtualJoystick';
import { HUD } from '../ui/HUD';
import { EventBus } from '../core/EventBus';
import { GameState } from '../core/GameState';
import { SocketManager } from '../core/SocketManager';
import {
  GAME,
  PX,
  COLLISION,
  SAFE_ZONE,
  SPECTACLE,
  COLORS,
  PLAYER,
  ENEMY,
} from '../core/Constants';

export class GameMap extends Phaser.Scene {
  private player!: Player;
  private enemies!: Phaser.GameObjects.Group;
  private joystick?: VirtualJoystick;
  private hud!: HUD;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key };
  private mapBackground!: Phaser.GameObjects.Image;
  private isMobile: boolean = false;

  constructor() {
    super({ key: 'GameMap' });
  }

  init(data: { character: any }): void {
    if (data.character) {
      GameState.setCharacter(data.character.id);
    }
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.UI_BACKGROUND);

    this.createMap();
    this.createPlayer();
    this.createEnemies();
    this.createControls();
    this.createHUD();
    this.setupNetworking();
    this.setupCollisions();
    this.setupEventListeners();

    EventBus.emit(SPECTACLE.ENTRANCE, { scene: 'GameMap' });
    EventBus.emit(SPECTACLE.ACTION, { type: 'game_start' });
  }

  private createMap(): void {
    const mapExists = this.textures.exists('map-bg');
    if (mapExists) {
      this.mapBackground = this.add.image(0, 0, 'map-bg').setOrigin(0);
      this.mapBackground.setDisplaySize(GAME.WIDTH, GAME.HEIGHT);
    } else {
      const bg = this.add.graphics();
      bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
      bg.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

      const gridSize = 80 * PX;
      bg.lineStyle(1, 0x2a2a4e, 0.3);
      for (let x = 0; x < GAME.WIDTH; x += gridSize) {
        bg.lineBetween(x, 0, x, GAME.HEIGHT);
      }
      for (let y = 0; y < GAME.HEIGHT; y += gridSize) {
        bg.lineBetween(0, y, GAME.WIDTH, y);
      }

      this.drawMapDecoration(bg);
    }
  }

  private drawMapDecoration(bg: Phaser.GameObjects.Graphics): void {
    const cx = GAME.WIDTH / 2;
    const cy = GAME.HEIGHT / 2;

    bg.fillStyle(0x3a3a5e, 0.2);
    bg.fillCircle(cx, cy, 200 * PX);

    bg.lineStyle(2, COLORS.UI_PRIMARY, 0.3);
    bg.strokeCircle(cx, cy, 200 * PX);
    bg.strokeCircle(cx, cy, 300 * PX);
    bg.strokeCircle(cx, cy, 400 * PX);

    const markerSize = 8 * PX;
    bg.fillStyle(COLORS.UI_PRIMARY, 0.8);
    bg.fillRect(cx - GAME.WIDTH / 4, cy - markerSize / 2, markerSize, markerSize);
    bg.fillRect(cx + GAME.WIDTH / 4 - markerSize, cy - markerSize / 2, markerSize, markerSize);
    bg.fillRect(cx - markerSize / 2, cy - GAME.HEIGHT / 4, markerSize, markerSize);
    bg.fillRect(cx - markerSize / 2, cy + GAME.HEIGHT / 4 - markerSize, markerSize, markerSize);
  }

  private createPlayer(): void {
    const character = GameState.character || 'sinji';
    this.player = new Player(this, 0, 0, character);
    this.player.setPosition(GAME.WIDTH / 2, GAME.HEIGHT / 2);

    this.physics.add.existing(this.player);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.collideWorldBounds = true;
    body.setCircle(PLAYER.SIZE / 2, 0, 0);

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(100 * PX, 100 * PX);
  }

  private createEnemies(): void {
    this.enemies = this.physics.add.group();

    const spawnPoints = [
      { x: GAME.WIDTH * 0.25, y: GAME.HEIGHT * 0.25 },
      { x: GAME.WIDTH * 0.75, y: GAME.HEIGHT * 0.25 },
      { x: GAME.WIDTH * 0.25, y: GAME.HEIGHT * 0.75 },
      { x: GAME.WIDTH * 0.75, y: GAME.HEIGHT * 0.75 },
      { x: GAME.WIDTH * 0.5, y: GAME.HEIGHT * 0.2 },
    ];

    const characters = ['aqualis', 'terra', 'ventus', 'pyra', 'glacius'];
    spawnPoints.forEach((spawn, index) => {
      const enemy = new Enemy(this, spawn.x, spawn.y, characters[index % characters.length]);
      this.enemies.add(enemy);

      const targetX = spawn.x + (Math.random() - 0.5) * 200 * PX;
      const targetY = spawn.y + (Math.random() - 0.5) * 200 * PX;
      enemy.setTargetPosition(targetX, targetY);
    });
  }

  private createControls(): void {
    this.isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    if (this.isMobile) {
      this.joystick = new VirtualJoystick(this);
    } else {
      this.cursors = this.input.keyboard!.createCursorKeys();
      this.wasd = {
        up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
    }
  }

  private createHUD(): void {
    this.hud = new HUD(this);
  }

  private setupNetworking(): void {
    SocketManager.connect();
    SocketManager.emit('player:join', {
      playerId: GameState.playerId || `player_${Date.now()}`,
      character: GameState.character,
      x: this.player.x,
      y: this.player.y,
    });

    this.time.addEvent({
      delay: 50,
      callback: this.sendPositionUpdate,
      callbackScope: this,
      loop: true,
    });
  }

  private sendPositionUpdate(): void {
    if (!this.player) return;
    SocketManager.emit('player:position', {
      x: this.player.x,
      y: this.player.y,
      direction: this.player.direction,
    });
  }

  private setupCollisions(): void {
    this.physics.add.overlap(
      this.player,
      this.enemies,
      (_player, _enemy) => this.onCollision(_player as Player, _enemy as Enemy),
      undefined,
      this
    );
  }

  private onCollision = (player: Player, enemy: Enemy): void => {
    if (GameState.isInCombat) return;

    GameState.setInCombat(true);
    SocketManager.emit('collision:detected', { enemyId: enemy.id });

    this.scene.pause();
    this.scene.launch('Combat', { player, enemy });

    EventBus.emit(SPECTACLE.COLLISION, { player: player.id, enemy: enemy.id });
  };

  private setupEventListeners(): void {
    EventBus.on('combat:end', this.onCombatEnd, this);
    EventBus.on('player:move', this.onEnemyMove, this);
    EventBus.on('socket:disconnected', this.onDisconnected, this);
  }

  private onCombatEnd = (data: { result: 'victory' | 'defeat' | 'draw'; enemyId?: string }): void => {
    GameState.setInCombat(false);

    if (data.result === 'victory') {
      GameState.incrementScore();
      const enemy = this.enemies.getChildren().find((e) => (e as Enemy).id === data.enemyId) as Enemy;
      if (enemy) {
        const spawnX = GAME.WIDTH * (0.2 + Math.random() * 0.6);
        const spawnY = GAME.HEIGHT * (0.2 + Math.random() * 0.6);
        enemy.setTargetPosition(spawnX, spawnY);
      }
    }

    this.scene.resume();
  };

  private onEnemyMove = (data: { id: string; x: number; y: number; direction: string }): void => {
    const enemy = this.enemies.getChildren().find((e) => (e as Enemy).id === data.id) as Enemy;
    if (enemy) {
      enemy.setTargetPosition(data.x, data.y);
      enemy.updateFacingDirection(data.direction);
    }
  };

  private onDisconnected(): void {
    this.hud.showNotification('Connection lost. Reconnecting...', 5000);
  }

  update(_time: number, delta: number): void {
    if (!this.player) return;

    const direction = this.getInputDirection();

    if (direction.x !== 0 || direction.y !== 0) {
      this.player.move(direction.x, direction.y, delta);
    } else {
      this.player.stopMovement();
    }

    this.enemies.getChildren().forEach((enemy) => {
      (enemy as Enemy).update(_time, delta);
    });

    this.checkBounds();
  }

  private getInputDirection(): { x: number; y: number } {
    if (this.joystick) {
      return this.joystick.getDirection();
    }

    let x = 0;
    let y = 0;

    if (this.cursors?.left.isDown || this.wasd?.left.isDown) x -= 1;
    if (this.cursors?.right.isDown || this.wasd?.right.isDown) x += 1;
    if (this.cursors?.up.isDown || this.wasd?.up.isDown) y -= 1;
    if (this.cursors?.down.isDown || this.wasd?.down.isDown) y += 1;

    const length = Math.sqrt(x * x + y * y);
    if (length > 0) {
      x /= length;
      y /= length;
    }

    return { x, y };
  }

  private checkBounds(): void {
    const padding = PLAYER.SIZE / 2;
    if (this.player.x < padding) this.player.x = padding;
    if (this.player.x > GAME.WIDTH - padding) this.player.x = GAME.WIDTH - padding;
    if (this.player.y < padding) this.player.y = padding;
    if (this.player.y > GAME.HEIGHT - padding) this.player.y = GAME.HEIGHT - padding;
  }

  shutdown(): void {
    EventBus.off('combat:end', this.onCombatEnd, this);
    EventBus.off('player:move', this.onEnemyMove, this);
    EventBus.off('socket:disconnected', this.onDisconnected, this);
    SocketManager.disconnect();
  }
}