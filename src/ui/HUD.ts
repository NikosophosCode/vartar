import Phaser from 'phaser';
import { EventBus } from '../core/EventBus';
import { GameState } from '../core/GameState';
import { GAME, PX, SAFE_ZONE, COLORS, PLAYER, SPECTACLE } from '../core/Constants';

export class HUD {
  private healthBar!: Phaser.GameObjects.Graphics;
  private scoreText!: Phaser.GameObjects.Text;
  private healthText!: Phaser.GameObjects.Text;
  private playerNameText!: Phaser.GameObjects.Text;
  private notificationText: Phaser.GameObjects.Text | null = null;
  private health: number = 100;
  private maxHealth: number = 100;
  private scene!: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.createHealthBar();
    this.createScoreDisplay();
    this.createPlayerInfo();
    this.setupEventListeners();
    this.updateFromGameState();
  }

  private createHealthBar(): void {
    const barX = 20 * PX;
    const barY = SAFE_ZONE.TOP + 20 * PX;
    const barWidth = 200 * PX;
    const barHeight = 24 * PX;

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.8);
    bg.fillRoundedRect(barX, barY, barWidth, barHeight, 4 * PX);
    bg.lineStyle(2, COLORS.UI_PRIMARY, 0.6);
    bg.strokeRoundedRect(barX, barY, barWidth, barHeight, 4 * PX);
    this.container.add(bg);

    this.healthBar = this.scene.add.graphics();
    this.container.add(this.healthBar);

    const heartX = barX - 30 * PX;
    const heartY = barY + barHeight / 2;
    const heart = this.scene.add.text(heartX, heartY, '❤️', {
      fontSize: `${18 * PX}px`,
    });
    heart.setOrigin(0.5);
    this.container.add(heart);

    this.healthText = this.scene.add.text(barX + barWidth / 2, barY + barHeight / 2, `${this.health}/${this.maxHealth}`, {
      fontSize: `${12 * PX}px`,
      fontFamily: 'Space Grotesk, sans-serif',
      color: '#ffffff',
    });
    this.healthText.setOrigin(0.5);
    this.container.add(this.healthText);
  }

  private createScoreDisplay(): void {
    const { width } = this.scene.scale;
    const scoreX = width - 20 * PX;
    const scoreY = SAFE_ZONE.TOP + 30 * PX;

    const scoreLabel = this.scene.add.text(scoreX, scoreY, 'SCORE', {
      fontSize: `${12 * PX}px`,
      fontFamily: 'Space Grotesk, sans-serif',
      color: '#888888',
    });
    scoreLabel.setOrigin(1, 0);
    this.container.add(scoreLabel);

    this.scoreText = this.scene.add.text(scoreX, scoreY + 20 * PX, '0', {
      fontSize: `${32 * PX}px`,
      fontFamily: 'Orbitron, sans-serif',
      color: '#ffffff',
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: COLORS.UI_PRIMARY.toString(16),
        blur: 8,
        fill: true,
      },
    });
    this.scoreText.setOrigin(1, 0);
    this.container.add(this.scoreText);
  }

  private createPlayerInfo(): void {
    const { width } = this.scene.scale;
    const infoX = width / 2;
    const infoY = SAFE_ZONE.TOP + 25 * PX;

    const character = GameState.character || 'Unknown';
    this.playerNameText = this.scene.add.text(infoX, infoY, character.toUpperCase(), {
      fontSize: `${16 * PX}px`,
      fontFamily: 'Orbitron, sans-serif',
      color: '#ffffff',
    });
    this.playerNameText.setOrigin(0.5, 0);
    this.container.add(this.playerNameText);
  }

  private setupEventListeners(): void {
    EventBus.on(SPECTACLE.HIT, this.onHit, this);
    EventBus.on(SPECTACLE.COMBAT_END, this.onCombatEnd, this);
    EventBus.on('game_state_update', this.updateFromGameState, this);
  }

  private onHit(data: { type: string; value?: number }): void {
    if (data.type === 'score' && data.value !== undefined) {
      this.updateScore(data.value);
    }
  }

  private onCombatEnd(data: { result: 'victory' | 'defeat' | 'draw' }): void {
    if (data.result === 'victory') {
      this.showNotification('VICTORY! +1', 2000);
    } else if (data.result === 'defeat') {
      this.showNotification('DEFEAT', 2000);
    }
  }

  private updateFromGameState(): void {
    this.health = GameState.health;
    this.updateHealthBar();
    this.updateScore(GameState.score);
  }

  private updateHealthBar(): void {
    this.healthBar.clear();

    const barX = 20 * PX;
    const barY = SAFE_ZONE.TOP + 20 * PX;
    const barWidth = 200 * PX;
    const barHeight = 24 * PX;

    const healthPercent = this.health / this.maxHealth;
    const fillWidth = barWidth * healthPercent;

    const healthColor = healthPercent > 0.5 ? COLORS.HEALTH_FULL : healthPercent > 0.25 ? 0xf59e0b : COLORS.HEALTH_LOW;

    this.healthBar.fillStyle(healthColor, 1);
    this.healthBar.fillRoundedRect(barX, barY, fillWidth, barHeight, 4 * PX);

    this.healthText.setText(`${Math.round(this.health)}/${this.maxHealth}`);

    if (healthPercent <= 0.25) {
      this.scene.tweens.add({
        targets: this.healthBar,
        alpha: 0.5,
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  private updateScore(score: number): void {
    this.scoreText.setText(score.toString());

    this.scene.tweens.add({
      targets: this.scoreText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 100,
      yoyo: true,
      ease: 'Bounce.easeOut',
    });
  }

  showNotification(message: string, duration: number = 3000): void {
    if (this.notificationText) {
      this.notificationText.destroy();
    }

    const { width } = this.scene.scale;
    this.notificationText = this.scene.add.text(width / 2, SAFE_ZONE.TOP + 80 * PX, message, {
      fontSize: `${18 * PX}px`,
      fontFamily: 'Orbitron, sans-serif',
      color: '#ffffff',
      backgroundColor: 'rgba(99, 102, 241, 0.8)',
      padding: { x: 16, y: 8 },
    });
    this.notificationText.setOrigin(0.5);

    this.scene.tweens.add({
      targets: this.notificationText,
      alpha: { from: 0, to: 1 },
      y: SAFE_ZONE.TOP + 60 * PX,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.time.delayedCall(duration, () => {
          if (this.notificationText) {
            this.scene.tweens.add({
              targets: this.notificationText,
              alpha: 0,
              y: SAFE_ZONE.TOP + 40 * PX,
              duration: 300,
              onComplete: () => {
                if (this.notificationText) {
                  this.notificationText.destroy();
                  this.notificationText = null;
                }
              },
            });
          }
        });
      },
    });
  }

  destroy(): void {
    EventBus.off(SPECTACLE.HIT, this.onHit, this);
    EventBus.off(SPECTACLE.COMBAT_END, this.onCombatEnd, this);
    EventBus.off('game_state_update', this.updateFromGameState, this);
    this.container.destroy();
  }
}