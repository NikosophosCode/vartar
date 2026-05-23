import Phaser from 'phaser';
import { COLORS, PX } from '../core/Constants';

interface PowerData {
  id: string;
  name: string;
  element: string;
  emoji: string;
  damage: number;
}

export class PowerButton extends Phaser.GameObjects.Container {
  private power: PowerData;
  private background!: Phaser.GameObjects.Graphics;
  private iconText!: Phaser.GameObjects.Text;
  private nameText!: Phaser.GameObjects.Text;
  private selected: boolean = false;
  private glowGraphics!: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, power: PowerData) {
    super(scene, x, y);

    this.power = power;
    this.createVisuals();
    this.setupInteraction();
  }

  private createVisuals(): void {
    const cardW = 70 * PX;
    const cardH = 90 * PX;

    this.background = this.scene.add.graphics();
    this.drawBackground(0x333333);

    this.glowGraphics = this.scene.add.graphics();
    this.glowGraphics.setAlpha(0);

    this.iconText = this.scene.add.text(0, -15 * PX, this.power.emoji, {
      fontSize: `${32 * PX}px`,
    });
    this.iconText.setOrigin(0.5);

    this.nameText = this.scene.add.text(0, 25 * PX, this.power.name.split(' ')[0], {
      fontSize: `${10 * PX}px`,
      fontFamily: 'Space Grotesk, sans-serif',
      color: '#ffffff',
    });
    this.nameText.setOrigin(0.5);

    this.add([this.background, this.glowGraphics, this.iconText, this.nameText]);
  }

  private drawBackground(color: number, stroke: boolean = false): void {
    const cardW = 70 * PX;
    const cardH = 90 * PX;

    this.background.clear();
    this.background.fillStyle(color, 1);
    this.background.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 8 * PX);

    if (stroke) {
      this.background.lineStyle(2, this.getElementColor(), 1);
      this.background.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 8 * PX);
    }
  }

  private getElementColor(): number {
    switch (this.power.element) {
      case 'FUEGO': return COLORS.ELEMENT_FIRE;
      case 'AGUA': return COLORS.ELEMENT_WATER;
      case 'TIERRA': return COLORS.ELEMENT_EARTH;
      case 'AIRE': return COLORS.ELEMENT_AIR;
      default: return COLORS.UI_PRIMARY;
    }
  }

  private setupInteraction(): void {
    this.setSize(70 * PX, 90 * PX);
    this.setInteractive({ useHandCursor: true });

    this.on('pointerover', this.onHover, this);
    this.on('pointerout', this.onHoverEnd, this);
    this.on('pointerdown', this.onSelect, this);
  }

  private onHover(): void {
    if (this.selected) return;

    this.scene.tweens.add({
      targets: this,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 150,
      ease: 'Back.easeOut',
    });

    this.glowGraphics.clear();
    this.glowGraphics.lineStyle(3, this.getElementColor(), 0.5);
    const cardW = 70 * PX;
    const cardH = 90 * PX;
    this.glowGraphics.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 8 * PX);
    this.glowGraphics.setAlpha(1);
  }

  private onHoverEnd(): void {
    if (this.selected) return;

    this.scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      duration: 150,
      ease: 'Quad.easeOut',
    });

    this.glowGraphics.setAlpha(0);
  }

  private onSelect(): void {
    if (this.selected) return;

    this.selected = true;
    this.drawBackground(this.getElementColor(), true);

    this.scene.tweens.add({
      targets: this,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 100,
      yoyo: true,
      ease: 'Bounce.easeOut',
    });

    this.createSelectionParticles();
    this.emit('power:selected', this.power);
  }

  private createSelectionParticles(): void {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const particle = this.scene.add.circle(
        Math.cos(angle) * 40 * PX,
        Math.sin(angle) * 40 * PX,
        4 * PX,
        this.getElementColor(),
        1
      );

      this.scene.tweens.add({
        targets: particle,
        x: particle.x * 0.2,
        y: particle.y * 0.2,
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: 400,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy(),
      });
    }
  }

  reset(): void {
    this.selected = false;
    this.drawBackground(0x333333);
    this.glowGraphics.setAlpha(0);
    this.setScale(1);
  }

  getPowerData(): PowerData {
    return this.power;
  }
}