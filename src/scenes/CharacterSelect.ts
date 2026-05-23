import Phaser from 'phaser';
import { CHARACTERS } from '../data/characters';
import { EventBus } from '../core/EventBus';
import { GameState } from '../core/GameState';
import { COLORS, PX, GAME, SAFE_ZONE, SPECTACLE } from '../core/Constants';

export class CharacterSelect extends Phaser.Scene {
  private cards: Phaser.GameObjects.Container[] = [];
  private selectedCharacter: string | null = null;
  private characterData: any[] = [];
  private titleText!: Phaser.GameObjects.Text;
  private instructionText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'CharacterSelect' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.UI_BACKGROUND);

    this.createTitle();
    this.createCharacterGrid();
    this.createInstruction();
    this.setupInput();
    this.createAudioButton();

    EventBus.emit(SPECTACLE.ENTRANCE, { scene: 'CharacterSelect' });
  }

  private createTitle(): void {
    const { width } = this.scale;
    const titleY = SAFE_ZONE.TOP + 60 * PX;

    this.titleText = this.add.text(width / 2, titleY, 'SELECT YOUR FIGHTER', {
      fontSize: `${28 * PX}px`,
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
    this.titleText.setOrigin(0.5);
  }

  private createCharacterGrid(): void {
    const characters = CHARACTERS;
    this.characterData = characters;

    const { width, height } = this.scale;
    const gridStartY = SAFE_ZONE.TOP + 140 * PX;
    const gridEndY = height - SAFE_ZONE.BOTTOM - 120 * PX;
    const availableHeight = gridEndY - gridStartY;
    const availableWidth = width - 40 * PX;

    const cols = 4;
    const rows = 2;
    const cardW = Math.min((availableWidth - (cols - 1) * 16 * PX) / cols, 140 * PX);
    const cardH = cardW * 1.3;
    const gapX = (availableWidth - cardW * cols) / (cols - 1);
    const gapY = (availableHeight - cardH * rows) / (rows - 1);

    const totalGridW = cardW * cols + gapX * (cols - 1);
    const startX = (width - totalGridW) / 2 + cardW / 2;

    let index = 0;
    for (let row = 0; row < rows && index < characters.length; row++) {
      for (let col = 0; col < cols && index < characters.length; col++) {
        const char = characters[index];
        const x = startX + col * (cardW + gapX);
        const y = gridStartY + row * (cardH + gapY);

        const card = this.createCharacterCard(char, x, y, cardW, cardH);
        this.cards.push(card);
        this.add.container(0, 0, [card]);
        index++;
      }
    }
  }

  private createCharacterCard(char: any, x: number, y: number, w: number, h: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x2a2a3e, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 12 * PX);
    bg.lineStyle(2, this.getElementColor(char.element), 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12 * PX);

    const charName = this.add.text(0, -h / 2 + 20 * PX, char.name, {
      fontSize: `${14 * PX}px`,
      fontFamily: 'Exo 2, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    charName.setOrigin(0.5);

    const elementBadge = this.add.graphics();
    const elemColor = this.getElementColor(char.element);
    elementBadge.fillStyle(elemColor, 1);
    elementBadge.fillCircle(0, 0, 10 * PX);

    const elementText = this.add.text(0, h / 2 - 25 * PX, char.element, {
      fontSize: `${11 * PX}px`,
      fontFamily: 'Space Grotesk, sans-serif',
      color: '#aaaaaa',
    });
    elementText.setOrigin(0.5);

    const placeholder = this.add.graphics();
    placeholder.fillStyle(0x444455, 1);
    placeholder.fillRoundedRect(-w / 2 + 15, -h / 2 + 45, w - 30, h - 100, 8);
    const charInitial = this.add.text(0, -5 * PX, char.name.charAt(0), {
      fontSize: `${32 * PX}px`,
      fontFamily: 'Orbitron, sans-serif',
      color: this.intToHex(elemColor),
    });
    charInitial.setOrigin(0.5);

    container.add([bg, charName, elementBadge, elementText, placeholder, charInitial]);

    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => this.onCardHover(container, true));
    container.on('pointerout', () => this.onCardHover(container, false));
    container.on('pointerdown', () => this.onCardSelect(container, char));

    return container;
  }

  private onCardHover(card: Phaser.GameObjects.Container, isHover: boolean): void {
    const scale = isHover ? 1.08 : 1;
    this.tweens.add({
      targets: card,
      scaleX: scale,
      scaleY: scale,
      duration: 150,
      ease: 'Back.easeOut',
    });
  }

  private onCardSelect(card: Phaser.GameObjects.Container, char: any): void {
    if (this.selectedCharacter) {
      this.tweens.add({
        targets: card,
        scaleX: 1.15,
        scaleY: 1.15,
        duration: 200,
        yoyo: true,
        ease: 'Bounce.easeOut',
      });
    }

    this.selectedCharacter = char.id;
    GameState.setCharacter(char.id);

    this.sound.play('sfx_select');

    this.cameras.main.flash(200, 99, 65, 241, true);

    this.time.delayedCall(500, () => {
      this.cameras.main.fade(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameMap', { character: char });
      });
    });

    EventBus.emit(SPECTACLE.ACTION, { type: 'character_select', character: char.id });
  }

  private createInstruction(): void {
    const { width, height } = this.scale;

    this.instructionText = this.add.text(width / 2, height - SAFE_ZONE.BOTTOM - 60 * PX, 'Tap a character to select', {
      fontSize: `${16 * PX}px`,
      fontFamily: 'Space Grotesk, sans-serif',
      color: '#888888',
    });
    this.instructionText.setOrigin(0.5);
  }

  private createAudioButton(): void {
    const { width } = this.scale;
    const audioBtn = this.add.text(width - 30 * PX, 30 * PX, '🔊', {
      fontSize: `${24 * PX}px`,
    });
    audioBtn.setOrigin(0.5);
    audioBtn.setInteractive({ useHandCursor: true });

    let isMuted = false;
    audioBtn.on('pointerdown', () => {
      isMuted = !isMuted;
      this.sound.mute = isMuted;
      audioBtn.setText(isMuted ? '🔇' : '🔊');
    });
  }

  private setupInput(): void {
    if (!this.input.keyboard) return;

    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.selectedCharacter) {
        const char = this.characterData.find((c) => c.id === this.selectedCharacter);
        if (char) {
          this.onCardSelect(this.cards[this.characterData.indexOf(char)], char);
        }
      }
    });

    this.input.keyboard.on('keydown-ENTER', () => {
      if (this.selectedCharacter) {
        const char = this.characterData.find((c) => c.id === this.selectedCharacter);
        if (char) {
          this.onCardSelect(this.cards[this.characterData.indexOf(char)], char);
        }
      }
    });
  }

  private getElementColor(element: string): number {
    switch (element.toUpperCase()) {
      case 'FUEGO': return COLORS.ELEMENT_FIRE;
      case 'AGUA': return COLORS.ELEMENT_WATER;
      case 'TIERRA': return COLORS.ELEMENT_EARTH;
      case 'AIRE': return COLORS.ELEMENT_AIR;
      default: return COLORS.UI_PRIMARY;
    }
  }

  private intToHex(num: number): string {
    return '#' + num.toString(16).padStart(6, '0');
  }
}