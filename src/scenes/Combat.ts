import Phaser from 'phaser';
import { Player } from '../objects/Player';
import { Enemy } from '../objects/Enemy';
import { PowerButton } from '../components/PowerButton';
import { EventBus } from '../core/EventBus';
import { GameState } from '../core/GameState';
import { SocketManager } from '../core/SocketManager';
import {
  GAME,
  PX,
  SAFE_ZONE,
  SPECTACLE,
  COLORS,
  ELEMENTS,
  COMBAT,
  ANIMATIONS,
} from '../core/Constants';

interface PowerData {
  id: string;
  name: string;
  element: string;
  emoji: string;
  damage: number;
}

interface RoundResult {
  playerPower: PowerData;
  enemyPower: PowerData;
  result: 'win' | 'lose' | 'draw';
  playerWins: number;
  enemyWins: number;
}

export class Combat extends Phaser.Scene {
  private playerData!: { player: Player; enemy: Enemy };
  private arena!: Phaser.GameObjects.Container;
  private playerSprite!: Phaser.GameObjects.Sprite;
  private enemySprite!: Phaser.GameObjects.Sprite;
  private powerGrid!: Phaser.GameObjects.Container;
  private powerButtons: PowerButton[] = [];
  private selectedPowers: PowerData[] = [];
  private enemyPowers: PowerData[] = [];
  private playerWins: number = 0;
  private enemyWins: number = 0;
  private roundText!: Phaser.GameObjects.Text;
  private resultText!: Phaser.GameObjects.Text;
  private timerBar!: Phaser.GameObjects.Graphics;
  private timerEvent!: Phaser.Time.TimerEvent;
  private selectionTimeout: number = COMBAT.SELECTION_TIMEOUT;
  private isResolving: boolean = false;
  private playerElement!: string;
  private enemyElement!: string;

  constructor() {
    super({ key: 'Combat' });
  }

  init(data: { player: Player; enemy: Enemy }): void {
    this.playerData = data;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x0a0a15);

    this.createArena();
    this.createCombatants();
    this.createPowerGrid();
    this.createUI();
    this.startSelectionPhase();

    EventBus.emit(SPECTACLE.ACTION, { type: 'combat_entered' });
  }

  private createArena(): void {
    this.arena = this.add.container(GAME.WIDTH / 2, GAME.HEIGHT / 2);

    const arenaBg = this.add.graphics();
    arenaBg.fillStyle(0x1a1a2e, 0.9);
    arenaBg.fillEllipse(0, 0, GAME.WIDTH * 0.8, GAME.HEIGHT * 0.6);
    arenaBg.lineStyle(4, COLORS.UI_PRIMARY, 0.8);
    arenaBg.strokeEllipse(0, 0, GAME.WIDTH * 0.8, GAME.HEIGHT * 0.6);

    const innerGlow = this.add.graphics();
    innerGlow.lineStyle(2, COLORS.UI_SECONDARY, 0.5);
    innerGlow.strokeEllipse(0, 0, GAME.WIDTH * 0.6, GAME.HEIGHT * 0.4);

    this.arena.add([arenaBg, innerGlow]);
    this.createParticles();
  }

  private createParticles(): void {
    for (let i = 0; i < 20; i++) {
      const particle = this.add.circle(
        (Math.random() - 0.5) * GAME.WIDTH * 0.7,
        (Math.random() - 0.5) * GAME.HEIGHT * 0.5,
        3 * PX,
        COLORS.UI_PRIMARY,
        0.3
      );
      this.arena.add(particle);

      this.tweens.add({
        targets: particle,
        y: particle.y - 100 * PX,
        alpha: 0,
        duration: 2000 + Math.random() * 2000,
        repeat: -1,
        yoyo: true,
      });
    }
  }

  private createCombatants(): void {
    const playerX = -GAME.WIDTH * 0.2;
    const enemyX = GAME.WIDTH * 0.2;

    this.playerElement = this.getCharacterElement(this.playerData.player.character);
    this.enemyElement = this.getCharacterElement(this.playerData.enemy.character);

    const playerPlaceholder = this.add.graphics();
    playerPlaceholder.fillStyle(this.getElementColor(this.playerElement), 1);
    playerPlaceholder.fillRoundedRect(-40 * PX, -50 * PX, 80 * PX, 100 * PX, 8);
    playerPlaceholder.x = playerX;

    const enemyPlaceholder = this.add.graphics();
    enemyPlaceholder.fillStyle(this.getElementColor(this.enemyElement), 1);
    enemyPlaceholder.fillRoundedRect(-40 * PX, -50 * PX, 80 * PX, 100 * PX, 8);
    enemyPlaceholder.x = enemyX;

    const playerLabel = this.add.text(playerX, -80 * PX, 'YOU', {
      fontSize: `${16 * PX}px`,
      fontFamily: 'Orbitron, sans-serif',
      color: '#ffffff',
    });
    playerLabel.setOrigin(0.5);

    const enemyLabel = this.add.text(enemyX, -80 * PX, 'ENEMY', {
      fontSize: `${16 * PX}px`,
      fontFamily: 'Orbitron, sans-serif',
      color: '#ffffff',
    });
    enemyLabel.setOrigin(0.5);

    this.playerSprite = this.add.sprite(playerX, 0, 'characters');
    this.enemySprite = this.add.sprite(enemyX, 0, 'characters');

    this.arena.add([playerPlaceholder, enemyPlaceholder, playerLabel, enemyLabel]);
  }

  private createPowerGrid(): void {
    this.powerGrid = this.add.container(GAME.WIDTH / 2, GAME.HEIGHT - SAFE_ZONE.BOTTOM - 100 * PX);

    const gridBg = this.add.graphics();
    gridBg.fillStyle(0x1a1a2e, 0.8);
    gridBg.fillRoundedRect(-GAME.WIDTH / 2 + 20 * PX, -60 * PX, GAME.WIDTH - 40 * PX, 140 * PX, 12);
    this.add.existing(gridBg);

    this.powerGrid.add(gridBg);

    const powers = this.getPowersForElement(this.playerElement);
    const cols = 4;
    const cardW = 70 * PX;
    const cardH = 90 * PX;
    const gapX = 16 * PX;
    const startX = -((powers.length - 1) * (cardW + gapX)) / 2;

    powers.forEach((power, index) => {
      const x = startX + index * (cardW + gapX);
      const button = new PowerButton(this, x, 0, power);
      button.on('power:selected', this.onPowerSelected, this);
      this.powerButtons.push(button);
      this.powerGrid.add(button);
    });
  }

  private createUI(): void {
    const cx = GAME.WIDTH / 2;

    this.roundText = this.add.text(cx, SAFE_ZONE.TOP + 60 * PX, 'SELECT YOUR POWERS', {
      fontSize: `${22 * PX}px`,
      fontFamily: 'Orbitron, sans-serif',
      color: '#ffffff',
    });
    this.roundText.setOrigin(0.5);

    this.resultText = this.add.text(cx, GAME.HEIGHT / 2, '', {
      fontSize: `${36 * PX}px`,
      fontFamily: 'Orbitron, sans-serif',
      color: '#ffffff',
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#6366f1',
        blur: 10,
        fill: true,
      },
    });
    this.resultText.setOrigin(0.5);
    this.resultText.setAlpha(0);

    this.timerBar = this.add.graphics();
    this.updateTimerBar();
  }

  private startSelectionPhase(): void {
    this.selectedPowers = [];
    this.powerButtons.forEach((btn) => btn.reset());

    this.roundText.setText(`Select 6 Powers (${this.selectedPowers.length}/6)`);

    this.timerEvent = this.time.addEvent({
      delay: 100,
      callback: this.onTimerTick,
      callbackScope: this,
      repeat: this.selectionTimeout / 100,
    });

    EventBus.emit(SPECTACLE.ACTION, { type: 'combat_selection_start' });
  }

  private onTimerTick(): void {
    const elapsed = (this.timerEvent.getElapsed() || 0);
    const remaining = Math.max(0, this.selectionTimeout - elapsed);
    this.updateTimerBar(remaining / this.selectionTimeout);

    if (remaining <= 0) {
      this.finishSelection();
    }
  }

  private updateTimerBar(progress: number = 1): void {
    this.timerBar.clear();
    const barWidth = GAME.WIDTH * 0.4;
    const barHeight = 8 * PX;
    const cx = GAME.WIDTH / 2;
    const y = SAFE_ZONE.TOP + 100 * PX;

    this.timerBar.fillStyle(0x333333, 1);
    this.timerBar.fillRect(cx - barWidth / 2, y, barWidth, barHeight);

    const color = progress > 0.5 ? COLORS.HEALTH_FULL : (progress > 0.25 ? 0xf59e0b : COLORS.HEALTH_LOW);
    this.timerBar.fillStyle(color, 1);
    this.timerBar.fillRect(cx - barWidth / 2, y, barWidth * progress, barHeight);
  }

  private onPowerSelected = (power: PowerData): void => {
    if (this.isResolving) return;
    if (this.selectedPowers.length >= COMBAT.POWERS_PER_PLAYER) return;
    if (this.selectedPowers.find((p) => p.id === power.id)) return;

    this.selectedPowers.push(power);
    this.roundText.setText(`Select 6 Powers (${this.selectedPowers.length}/6)`);

    this.sound.play('sfx_select');
    EventBus.emit(SPECTACLE.ACTION, { type: 'power_selected', power: power.id });

    if (this.selectedPowers.length >= COMBAT.POWERS_PER_PLAYER) {
      this.time.delayedCall(500, () => this.finishSelection());
    }
  };

  private finishSelection(): void {
    if (this.timerEvent) {
      this.timerEvent.destroy();
    }

    while (this.selectedPowers.length < COMBAT.POWERS_PER_PLAYER) {
      const powers = this.getPowersForElement(this.playerElement);
      const randomPower = powers[Math.floor(Math.random() * powers.length)];
      if (!this.selectedPowers.find((p) => p.id === randomPower.id)) {
        this.selectedPowers.push(randomPower);
      }
    }

    this.enemyPowers = this.generateEnemyPowers();
    this.powerGrid.setVisible(false);
    this.resolveCombat();
  }

  private generateEnemyPowers(): PowerData[] {
    const powers = this.getPowersForElement(this.enemyElement);
    const selected: PowerData[] = [];
    for (let i = 0; i < COMBAT.POWERS_PER_PLAYER; i++) {
      const power = powers[Math.floor(Math.random() * powers.length)];
      selected.push({ ...power, id: `${power.id}_enemy_${i}` });
    }
    return selected;
  }

  private async resolveCombat(): Promise<void> {
    this.isResolving = true;
    this.playerWins = 0;
    this.enemyWins = 0;

    const results: RoundResult[] = [];

    for (let i = 0; i < COMBAT.POWERS_PER_PLAYER; i++) {
      const result = await this.resolveRound(i);
      results.push(result);
    }

    this.showFinalResult(results);
  }

  private resolveRound(roundIndex: number): Promise<RoundResult> {
    return new Promise((resolve) => {
      const playerPower = this.selectedPowers[roundIndex];
      const enemyPower = this.enemyPowers[roundIndex];

      this.roundText.setText(`Round ${roundIndex + 1}`);
      this.showPowerComparison(playerPower, enemyPower);

      const result = this.calculateRoundResult(playerPower, enemyPower);
      if (result === 'win') this.playerWins++;
      else if (result === 'lose') this.enemyWins++;

      const roundResult: RoundResult = {
        playerPower,
        enemyPower,
        result,
        playerWins: this.playerWins,
        enemyWins: this.enemyWins,
      };

      EventBus.emit(SPECTACLE.COMBAT_ROUND, roundResult);

      this.time.delayedCall(COMBAT.ROUND_DELAY, () => {
        this.clearPowerComparison();
        resolve(roundResult);
      });
    });
  }

  private calculateRoundResult(playerPower: PowerData, enemyPower: PowerData): 'win' | 'lose' | 'draw' {
    if (playerPower.element === enemyPower.element) return 'draw';

    const advantage = ELEMENTS.ADVANTAGES.find(
      ([w, l]) => w === playerPower.element && l === enemyPower.element
    );
    if (advantage) return 'win';

    const disadvantage = ELEMENTS.ADVANTAGES.find(
      ([w, l]) => w === enemyPower.element && l === playerPower.element
    );
    if (disadvantage) return 'lose';

    return Math.random() > 0.5 ? 'win' : 'lose';
  }

  private showPowerComparison(playerPower: PowerData, enemyPower: PowerData): void {
    const cx = GAME.WIDTH / 2;
    const cy = GAME.HEIGHT / 2 - 20 * PX;

    const playerPowerText = this.add.text(cx - 120 * PX, cy, playerPower.emoji + ' ' + playerPower.name, {
      fontSize: `${18 * PX}px`,
      fontFamily: 'Exo 2, sans-serif',
      color: '#ffffff',
    });
    playerPowerText.setOrigin(1, 0.5);

    const vsText = this.add.text(cx, cy, 'VS', {
      fontSize: `${16 * PX}px`,
      fontFamily: 'Orbitron, sans-serif',
      color: '#888888',
    });
    vsText.setOrigin(0.5);

    const enemyPowerText = this.add.text(cx + 120 * PX, cy, enemyPower.name + ' ' + enemyPower.emoji, {
      fontSize: `${18 * PX}px`,
      fontFamily: 'Exo 2, sans-serif',
      color: '#ffffff',
    });
    enemyPowerText.setOrigin(0, 0.5);

    this.tweens.add({
      targets: [playerPowerText, vsText, enemyPowerText],
      alpha: 1,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 200,
      yoyo: true,
    });
  }

  private clearPowerComparison(): void {
    this.children.getChildren().forEach((child) => {
      if (child instanceof Phaser.GameObjects.Text && child.text.includes('VS')) {
        this.tweens.add({
          targets: child,
          alpha: 0,
          duration: 200,
          onComplete: () => child.destroy(),
        });
      }
      if (child instanceof Phaser.GameObjects.Text && (child.text.includes('Fireball') || child.text.includes('Water') || child.text.includes('Rock') || child.text.includes('Wind'))) {
        this.tweens.add({
          targets: child,
          alpha: 0,
          duration: 200,
          onComplete: () => child.destroy(),
        });
      }
    });
  }

  private showFinalResult(results: RoundResult[]): void {
    let finalResult: 'victory' | 'defeat' | 'draw';
    if (this.playerWins > this.enemyWins) {
      finalResult = 'victory';
      this.showVictoryEffect();
    } else if (this.enemyWins > this.playerWins) {
      finalResult = 'defeat';
      this.showDefeatEffect();
    } else {
      finalResult = 'draw';
    }

    this.resultText.setText(finalResult.toUpperCase());
    this.resultText.setShadowColor(
      finalResult === 'victory' ? '#22c55e' : finalResult === 'defeat' ? '#ef4444' : '#888888'
    );
    this.resultText.setAlpha(1);

    const color = finalResult === 'victory' ? COLORS.HEALTH_FULL : finalResult === 'defeat' ? COLORS.HEALTH_LOW : 0x888888;
    this.showScoreSummary(results, color);

    GameState.setCombatResult(finalResult);
    SocketManager.emit('combat:result', {
      result: finalResult,
      playerWins: this.playerWins,
      enemyWins: this.enemyWins,
    });

    EventBus.emit('combat:end', { result: finalResult, enemyId: this.playerData.enemy.id });

    this.time.delayedCall(3000, () => {
      this.cameras.main.fade(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.stop();
        this.scene.resume('GameMap');
      });
    });
  }

  private showScoreSummary(results: RoundResult[], color: number): void {
    const cx = GAME.WIDTH / 2;
    const y = GAME.HEIGHT / 2 + 60 * PX;

    results.forEach((r, i) => {
      const x = cx + (i - 2.5) * 50 * PX;
      const indicator = this.add.circle(x, y, 10 * PX, r.result === 'win' ? COLORS.HEALTH_FULL : r.result === 'lose' ? COLORS.HEALTH_LOW : 0x888888);
      this.add.existing(indicator);
    });

    const scoreText = this.add.text(cx, y + 40 * PX, `${this.playerWins} - ${this.enemyWins}`, {
      fontSize: `${28 * PX}px`,
      fontFamily: 'Orbitron, sans-serif',
      color: '#ffffff',
    });
    scoreText.setOrigin(0.5);
  }

  private showVictoryEffect(): void {
    this.sound.play('sfx_victory');

    for (let i = 0; i < 40; i++) {
      const particle = this.add.circle(
        (Math.random() - 0.5) * GAME.WIDTH,
        GAME.HEIGHT + 20,
        (4 + Math.random() * 6) * PX,
        [0x22c55e, 0x6366f1, 0xf59e0b, 0xec4899][Math.floor(Math.random() * 4)],
        1
      );

      this.tweens.add({
        targets: particle,
        y: -50,
        x: particle.x + (Math.random() - 0.5) * 200 * PX,
        alpha: 0,
        duration: 2000 + Math.random() * 1500,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy(),
      });
    }
  }

  private showDefeatEffect(): void {
    this.sound.play('sfx_defeat');

    for (let i = 0; i < 15; i++) {
      const particle = this.add.circle(
        (Math.random() - 0.5) * GAME.WIDTH * 0.5,
        GAME.HEIGHT / 2,
        (5 + Math.random() * 10) * PX,
        0x555555,
        0.7
      );

      this.tweens.add({
        targets: particle,
        y: particle.y + 100 * PX,
        alpha: 0,
        scaleX: 0.5,
        scaleY: 0.5,
        duration: 1500,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy(),
      });
    }
  }

  private getCharacterElement(character: string): string {
    const elements: Record<string, string> = {
      sinji: 'FUEGO',
      pyra: 'FUEGO',
      aqualis: 'AGUA',
      glacius: 'AGUA',
      terra: 'TIERRA',
      petra: 'TIERRA',
      ventus: 'AIRE',
      tempest: 'AIRE',
    };
    return elements[character] || 'FUEGO';
  }

  private getElementColor(element: string): number {
    switch (element) {
      case 'FUEGO': return COLORS.ELEMENT_FIRE;
      case 'AGUA': return COLORS.ELEMENT_WATER;
      case 'TIERRA': return COLORS.ELEMENT_EARTH;
      case 'AIRE': return COLORS.ELEMENT_AIR;
      default: return COLORS.UI_PRIMARY;
    }
  }

  private getPowersForElement(element: string): PowerData[] {
    const powers: Record<string, PowerData[]> = {
      FUEGO: [
        { id: 'fireball', name: 'Fireball', element: 'FUEGO', emoji: '🔥', damage: 20 },
        { id: 'inferno', name: 'Inferno', element: 'FUEGO', emoji: '🔥', damage: 35 },
      ],
      AGUA: [
        { id: 'waterSlash', name: 'Water Slash', element: 'AGUA', emoji: '💧', damage: 18 },
        { id: 'tidalWave', name: 'Tidal Wave', element: 'AGUA', emoji: '💧', damage: 30 },
      ],
      TIERRA: [
        { id: 'rockThrow', name: 'Rock Throw', element: 'TIERRA', emoji: '🪨', damage: 22 },
        { id: 'earthquake', name: 'Earthquake', element: 'TIERRA', emoji: '🌋', damage: 32 },
      ],
      AIRE: [
        { id: 'windSlash', name: 'Wind Slash', element: 'AIRE', emoji: '🌪️', damage: 16 },
        { id: 'tornado', name: 'Tornado', element: 'AIRE', emoji: '🌀', damage: 28 },
      ],
    };
    return powers[element] || powers.FUEGO;
  }

  shutdown(): void {
    if (this.timerEvent) {
      this.timerEvent.destroy();
    }
    this.powerButtons.forEach((btn) => {
      btn.off('power:selected', this.onPowerSelected, this);
    });
  }
}