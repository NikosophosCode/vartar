import Phaser from 'phaser';
import { GAME } from '../core/Constants';

export class Boot extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  preload(): void {
    this.createLoadingGraphics();
  }

  create(): void {
    this.scale.scaleMode = Phaser.Scale.FIT;
    this.scale.autoCenter = Phaser.Scale.CENTER_BOTH;

    if (this.scale.zoom < 1) {
      this.scale.zoom = 1 / (window.devicePixelRatio || 1);
    }

    this.scale.on('resize', this.onResize, this);

    this.scene.start('Preloader');
  }

  private createLoadingGraphics(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    const bgBar = this.add.graphics();
    bgBar.fillStyle(0x333333, 1);
    bgBar.fillRect(cx - 150, cy - 10, 300, 20);

    const progressBar = this.add.graphics();
    const loadingText = this.add.text(cx, cy - 40, 'Loading...', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Orbitron, Space Grotesk, sans-serif',
    });
    loadingText.setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x6366f1, 1);
      progressBar.fillRect(cx - 150, cy - 10, 300 * value, 20);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      bgBar.destroy();
      loadingText.destroy();
    });
  }

  private onResize(game: Phaser.Game): void {
    this.scale.scaleMode = Phaser.Scale.FIT;
    this.scale.autoCenter = Phaser.Scale.CENTER_BOTH;
  }
}