import Phaser from 'phaser';
import { GAME, COLORS, PX } from '../core/Constants';
import { EventBus } from '../core/EventBus';
import { SPECTACLE } from '../core/Constants';

export class Preloader extends Phaser.Scene {
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBox!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;
  private assetText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'Preloader' });
  }

  init(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x222222, 1);
    this.progressBox.fillRect(cx - 160, cy - 25, 320, 50);
    this.progressBox.lineStyle(2, COLORS.UI_PRIMARY, 1);
    this.progressBox.strokeRect(cx - 160, cy - 25, 320, 50);

    this.progressBar = this.add.graphics();

    this.loadingText = this.add.text(cx, cy - 60, 'LOADING', {
      fontSize: `${20 * PX}px`,
      fontFamily: 'Orbitron, Space Grotesk, sans-serif',
      color: '#ffffff',
    });
    this.loadingText.setOrigin(0.5);

    this.assetText = this.add.text(cx, cy + 40, '', {
      fontSize: `${14 * PX}px`,
      fontFamily: 'Space Grotesk, sans-serif',
      color: '#888888',
    });
    this.assetText.setOrigin(0.5);
  }

  preload(): void {
    this.load.on('start', this.onLoadStart, this);
    this.load.on('progress', this.onLoadProgress, this);
    this.load.on('fileprogress', this.onFileProgress, this);
    this.load.on('complete', this.onLoadComplete, this);

    this.loadAtlas();
    this.loadImages();
    this.loadAudio();
    this.loadJson();
  }

  private loadAtlas(): void {
    const atlasExists = this.textures.exists('characters');
    if (!atlasExists) {
      this.load.atlas('characters', 'assets/sprites/characters.png', 'assets/sprites/characters.json');
      this.updateAssetText('Loading character sprites...');
    }
  }

  private loadImages(): void {
    this.updateAssetText('Loading map assets...');
    this.load.image('map-bg', 'assets/images/map-bg.png');

    this.updateAssetText('Loading UI assets...');
    this.load.image('ui-panel', 'assets/images/ui-panel.png');
    this.load.image('heart-icon', 'assets/images/heart.png');

    this.updateAssetText('Loading element icons...');
    this.load.image('icon-fire', 'assets/images/icon-fire.png');
    this.load.image('icon-water', 'assets/images/icon-water.png');
    this.load.image('icon-earth', 'assets/images/icon-earth.png');
    this.load.image('icon-air', 'assets/images/icon-air.png');
  }

  private loadAudio(): void {
    this.updateAssetText('Loading audio...');
    this.load.audio('bgm', [
      'assets/audio/bgm.mp3',
      'assets/audio/bgm.ogg',
    ]);
    this.load.audio('sfx_select', 'assets/audio/select.mp3');
    this.load.audio('sfx_attack', 'assets/audio/attack.mp3');
    this.load.audio('sfx_collision', 'assets/audio/collision.mp3');
    this.load.audio('sfx_victory', 'assets/audio/victory.mp3');
    this.load.audio('sfx_defeat', 'assets/audio/defeat.mp3');
  }

  private loadJson(): void {
    this.updateAssetText('Loading game data...');
    this.load.json('characters', 'assets/data/characters.json');
    this.load.json('powers', 'assets/data/powers.json');
    this.load.json('maps', 'assets/data/maps.json');
  }

  private updateAssetText(text: string): void {
    if (this.assetText) {
      this.assetText.setText(text);
    }
  }

  private onLoadStart(): void {
    EventBus.emit(SPECTACLE.ACTION, { type: 'preload_start' });
  }

  private onLoadProgress(value: number): void {
    this.progressBar.clear();
    this.progressBar.fillStyle(COLORS.UI_PRIMARY, 1);
    const { width } = this.scale;
    const cx = width / 2;
    const progressWidth = 300 * value;
    this.progressBar.fillRect(cx - 150, this.scale.height / 2 - 25, progressWidth, 30);

    EventBus.emit(SPECTACLE.ACTION, { type: 'preload_progress', value });
  }

  private onFileProgress(file: Phaser.Loader.File): void {
    this.updateAssetText(`Loading: ${file.key}`);
  }

  private onLoadComplete(): void {
    this.updateAssetText('Loading complete!');

    this.tweens.add({
      targets: this.progressBar,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        this.scene.start('CharacterSelect');
      },
    });

    EventBus.emit(SPECTACLE.ACTION, { type: 'preload_complete' });
  }
}