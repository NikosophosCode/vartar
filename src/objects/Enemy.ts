import Phaser from 'phaser';
import { ENEMY, DIRECTIONS, Direction, PX } from '../core/Constants';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  public id: string;
  public character: string;
  public direction: Direction = 'down';
  private targetX: number = 0;
  private targetY: number = 0;
  private interpolationSpeed: number = ENEMY.INTERPOLATION_SPEED;
  private moveTimer: number = 0;
  private moveInterval: number = 2000 + Math.random() * 3000;
  private animsCreated: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, character: string = 'aqualis') {
    super(scene, x, y, 'characters');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.id = `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.character = character;
    this.targetX = x;
    this.targetY = y;

    this.createAnimations();
  }

  private createAnimations(): void {
    if (this.animsCreated) return;
    this.animsCreated = true;

    const texture = 'characters';

    this.anims.create({
      key: `${this.character}_idle`,
      frames: [{ key: texture, frame: `${this.character}_idle` }],
      frameRate: 1,
    });

    DIRECTIONS.forEach((dir) => {
      const frames = [0, 1, 2, 3].map((i) => ({
        key: texture,
        frame: `${this.character}_${dir}_${i}`,
      }));
      this.anims.create({
        key: `enemy_walk_${dir}`,
        frames: frames as Phaser.Types.Animations.AnimationFrame[],
        frameRate: 8,
        repeat: -1,
      });
    });
  }

  setTargetPosition(x: number, y: number): void {
    this.targetX = x;
    this.targetY = y;
  }

  update(_time: number, delta: number): void {
    this.moveTimer += delta;

    if (this.moveTimer >= this.moveInterval) {
      this.moveTimer = 0;
      this.moveInterval = 2000 + Math.random() * 3000;

      const offsetX = (Math.random() - 0.5) * 400 * PX;
      const offsetY = (Math.random() - 0.5) * 400 * PX;
      this.targetX = Phaser.Math.Clamp(this.x + offsetX, 100 * PX, 1500 * PX);
      this.targetY = Phaser.Math.Clamp(this.y + offsetY, 100 * PX, 1100 * PX);
    }

    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > ENEMY.POSITION_TOLERANCE) {
      const factor = this.interpolationSpeed * (delta / 16);
      const clampedFactor = Math.min(factor, 0.5);

      this.x = Phaser.Math.Linear(this.x, this.targetX, clampedFactor);
      this.y = Phaser.Math.Linear(this.y, this.targetY, clampedFactor);

      if (Math.abs(dx) > Math.abs(dy)) {
        this.direction = dx > 0 ? 'right' : 'left';
      } else if (dy !== 0) {
        this.direction = dy > 0 ? 'down' : 'up';
      }

      const animKey = `enemy_walk_${this.direction}`;
      if (this.anims.exists(animKey) && this.anims.currentAnim?.key !== animKey) {
        this.play(animKey);
      }
    } else {
      if (this.anims.exists(`${this.character}_idle`)) {
        this.play(`${this.character}_idle`);
      }
    }
  }

  updateFacingDirection(dir: string): void {
    if (DIRECTIONS.includes(dir as Direction)) {
      this.direction = dir as Direction;
    }
  }
}