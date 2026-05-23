import { CHARACTERS } from './data/characters';
export { CHARACTERS };

import { Boot } from './scenes/Boot';
import { Preloader } from './scenes/Preloader';
import { CharacterSelect } from './scenes/CharacterSelect';
import { GameMap } from './scenes/GameMap';
import { Combat } from './scenes/Combat';

import { GAME, PX, DPR } from './core/Constants';

export const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME.WIDTH,
  height: GAME.HEIGHT,
  parent: 'game-container',
  backgroundColor: GAME.BACKGROUND_COLOR,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    zoom: 1 / DPR,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [Boot, Preloader, CharacterSelect, GameMap, Combat],
  pixelArt: false,
  antialias: true,
  roundPixels: true,
};