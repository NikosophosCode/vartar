import Phaser from 'phaser';
import { PLAYER, DIRECTIONS, Direction, ANIMATIONS, PX } from '../core/Constants';

export class Player extends Phaser.Physics.Arcade.Sprite {
  public id: string;
  public character: string;
  public direction: Direction = 'down';
  public playerState: 'idle' | 'moving' | 'combat' = 'idle';
  private animsCreated: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, character: string = 'sinji') {
    super(scene, x, y, 'characters');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.id = `player_${Date.now()}`;
    this.character = character;

    this.createAnimations();
    this.play(ANIMATIONS.IDLE);
  }

  private createAnimations(): void {
    if (this.animsCreated) return;
    this.animsCreated = true;

    const texture = 'characters';

    this.anims.create({
      key: ANIMATIONS.IDLE,
      frames: [{ key: texture, frame: `${this.character}_idle` }],
      frameRate: 1,
    });

    DIRECTIONS.forEach((dir) => {
      const frames = [0, 1, 2, 3].map((i) => ({
        key: texture,
        frame: `${this.character}_${dir}_${i}`,
      }));
      this.anims.create({
        key: `walk_${dir}`,
        frames: frames as Phaser.Types.Animations.AnimationFrame[],
        frameRate: 8,
        repeat: -1,
      });
    });
  }

  move(x: number, y: number, _delta: number): void {
    if (this.playerState === 'combat') return;

    this.playerState = 'moving';

    const speed = PLAYER.SPEED;
    this.setVelocity(x * speed, y * speed);

    if (Math.abs(x) > Math.abs(y)) {
      this.direction = x > 0 ? 'right' : 'left';
    } else if (y !== 0) {
      this.direction = y > 0 ? 'down' : 'up';
    }

    const animKey = `walk_${this.direction}`;
    if (this.anims.exists(animKey) && this.anims.currentAnim?.key !== animKey) {
      this.play(animKey);
    }
  }

  stopMovement(): void {
    if (this.playerState === 'combat') return;

    this.playerState = 'idle';
    this.setVelocity(0, 0);

    if (this.anims.exists(ANIMATIONS.IDLE)) {
      this.play(ANIMATIONS.IDLE);
    }
  }

  setDirection(dir: Direction): void {
    this.direction = dir;
  }

  enterCombat(): void {
    this.playerState = 'combat';
    this.setVelocity(0, 0);
  }

  exitCombat(): void {
    this.playerState = 'idle';
  }
}