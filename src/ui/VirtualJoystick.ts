import Phaser from 'phaser';
import { MOBILE, GAME, PX } from '../core/Constants';

export class VirtualJoystick extends Phaser.GameObjects.Container {
  private base: Phaser.GameObjects.Graphics;
  private knob: Phaser.GameObjects.Graphics;
  private direction: { x: number; y: number } = { x: 0, y: 0 };
  private isDragging: boolean = false;
  private basePosition: { x: number; y: number };
  private maxKnobDistance: number;

  constructor(scene: Phaser.Scene) {
    super(scene);

    const cx = GAME.WIDTH * 0.2;
    const cy = GAME.HEIGHT - MOBILE.SAFE_ZONE.BOTTOM - 100 * PX;
    this.basePosition = { x: cx, y: cy };
    this.maxKnobDistance = MOBILE.JOYSTICK.SIZE / 2 - MOBILE.JOYSTICK.KNOB_SIZE / 2;

    this.base = scene.add.graphics();
    this.drawBase();

    this.knob = scene.add.graphics();
    this.drawKnob();

    this.add([this.base, this.knob]);
    scene.add.existing(this);

    this.setupInput();
  }

  private drawBase(): void {
    this.base.clear();
    this.base.fillStyle(0x333333, MOBILE.JOYSTICK.BASE_ALPHA);
    this.base.fillCircle(this.basePosition.x, this.basePosition.y, MOBILE.JOYSTICK.SIZE / 2);
    this.base.lineStyle(3, 0x6366f1, 0.5);
    this.base.strokeCircle(this.basePosition.x, this.basePosition.y, MOBILE.JOYSTICK.SIZE / 2);
  }

  private drawKnob(): void {
    this.knob.clear();
    this.knob.fillStyle(0x6366f1, MOBILE.JOYSTICK.KNOB_ALPHA);
    this.knob.fillCircle(this.basePosition.x, this.basePosition.y, MOBILE.JOYSTICK.KNOB_SIZE / 2);
    this.knob.fillStyle(0x8b5cf6, 0.8);
    this.knob.fillCircle(this.basePosition.x, this.basePosition.y, MOBILE.JOYSTICK.KNOB_SIZE / 4);
  }

  private setupInput(): void {
    this.setInteractive(
      new Phaser.Geom.Circle(this.basePosition.x, this.basePosition.y, MOBILE.JOYSTICK.SIZE),
      Phaser.Geom.Circle.Contains
    );

    this.scene.input.on('pointerdown', this.onPointerDown, this);
    this.scene.input.on('pointermove', this.onPointerMove, this);
    this.scene.input.on('pointerup', this.onPointerUp, this);
    this.scene.input.on('pointerupoutside', this.onPointerUp, this);
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    const dist = this.getDistanceToPointer(pointer);
    if (dist <= MOBILE.JOYSTICK.SIZE) {
      this.isDragging = true;
      this.updateKnobPosition(pointer);
    }
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.isDragging) return;
    this.updateKnobPosition(pointer);
  }

  private onPointerUp(): void {
    this.isDragging = false;
    this.resetKnob();
  }

  private updateKnobPosition(pointer: Phaser.Input.Pointer): void {
    const dx = pointer.x - this.basePosition.x;
    const dy = pointer.y - this.basePosition.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 10) {
      const angle = Math.atan2(dy, dx);
      const clampedDist = Math.min(dist, this.maxKnobDistance);

      const knobX = this.basePosition.x + Math.cos(angle) * clampedDist;
      const knobY = this.basePosition.y + Math.sin(angle) * clampedDist;

      this.knob.x = knobX - this.basePosition.x;
      this.knob.y = knobY - this.basePosition.y;

      const normalizedDist = Math.min(dist / this.maxKnobDistance, 1);
      if (normalizedDist > MOBILE.JOYSTICK.DEAD_ZONE) {
        this.direction.x = (dx / dist) * normalizedDist;
        this.direction.y = (dy / dist) * normalizedDist;
      } else {
        this.direction.x = 0;
        this.direction.y = 0;
      }
    }
  }

  private resetKnob(): void {
    this.knob.x = 0;
    this.knob.y = 0;
    this.direction.x = 0;
    this.direction.y = 0;
  }

  private getDistanceToPointer(pointer: Phaser.Input.Pointer): number {
    const dx = pointer.x - this.basePosition.x;
    const dy = pointer.y - this.basePosition.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  getDirection(): { x: number; y: number } {
    return { ...this.direction };
  }

  destroy(): void {
    this.scene.input.off('pointerdown', this.onPointerDown, this);
    this.scene.input.off('pointermove', this.onPointerMove, this);
    this.scene.input.off('pointerup', this.onPointerUp, this);
    this.scene.input.off('pointerupoutside', this.onPointerUp, this);
    super.destroy();
  }
}