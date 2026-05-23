export const DPR = Math.min(window.devicePixelRatio || 1, 2);

const isPortrait = window.innerHeight > window.innerWidth;
const designW = isPortrait ? 540 : 960;
const designH = isPortrait ? 960 : 540;

const deviceW = window.innerWidth * DPR;
const deviceH = window.innerHeight * DPR;
const designAspect = designW / designH;

let canvasW: number;
let canvasH: number;
if (deviceW / deviceH > designAspect) {
  canvasW = deviceW;
  canvasH = Math.round(deviceW / designAspect);
} else {
  canvasW = Math.round(deviceH * designAspect);
  canvasH = deviceH;
}

export const PX = canvasW / designW;

function readSafeInsets(): { top: number; bottom: number } {
  const style = getComputedStyle(document.documentElement);
  const top = parseInt(style.getPropertyValue('--ogp-safe-top-inset')) || 0;
  const bottom = parseInt(style.getPropertyValue('--ogp-safe-bottom-inset')) || 0;
  return { top: top * DPR, bottom: bottom * DPR };
}

const _insets = readSafeInsets();

export const SAFE_ZONE = {
  TOP: Math.max(designH * 0.08 * PX, _insets.top),
  BOTTOM: _insets.bottom,
  LEFT: 0,
  RIGHT: 0,
};

export const GAME = {
  WIDTH: canvasW,
  HEIGHT: canvasH,
  DESIGN_WIDTH: designW,
  DESIGN_HEIGHT: designH,
  BACKGROUND_COLOR: '#1a1a2e',
  FPS_NETWORK: 20,
  FPS_RENDER: 60,
};

export const PLAYER = {
  SIZE: 64 * PX,
  SPEED: 200 * PX,
  INTERPOLATION_SPEED: 0.15,
  MAX_HEALTH: 100,
};

export const ENEMY = {
  SIZE: 64 * PX,
  SPEED: 150 * PX,
  INTERPOLATION_SPEED: 0.12,
  POSITION_TOLERANCE: 5,
};

export const COLLISION = {
  DETECTION_RADIUS: 80 * PX,
  CONFIRMATION_RADIUS: 70 * PX,
};

export const COMBAT = {
  POWERS_PER_PLAYER: 6,
  SELECTION_TIMEOUT: 10000,
  ROUND_DELAY: 1500,
};

export const ELEMENTS = {
  ADVANTAGES: [
    ['FUEGO', 'TIERRA'],
    ['AGUA', 'FUEGO'],
    ['TIERRA', 'AIRE'],
    ['AIRE', 'AGUA'],
  ],
};

export const MOBILE = {
  JOYSTICK: {
    SIZE: 120 * PX,
    DEAD_ZONE: 0.2,
    KNOB_SIZE: 40 * PX,
    BASE_ALPHA: 0.5,
    KNOB_ALPHA: 0.8,
  },
  SAFE_ZONE: {
    TOP: GAME.HEIGHT * 0.08,
    BOTTOM: 148 * PX,
  },
  TOUCH_ZONE: {
    MIN_SIZE: 44 * PX,
  },
};

export const COLORS = {
  UI_PRIMARY: 0x6366f1,
  UI_SECONDARY: 0x8b5cf6,
  ELEMENT_FIRE: 0xff6b35,
  ELEMENT_WATER: 0x3b82f6,
  ELEMENT_EARTH: 0x84cc16,
  ELEMENT_AIR: 0x06b6d4,
  HEALTH_FULL: 0x22c55e,
  HEALTH_LOW: 0xef4444,
  UI_BACKGROUND: 0x1e1e2e,
  UI_TEXT: 0xffffff,
};

export const NETWORK = {
  RECONNECT_MAX_ATTEMPTS: 5,
  RECONNECT_DELAYS: [1000, 2000, 4000, 8000, 16000],
  HEARTBEAT_INTERVAL: 30000,
  SNAPSHOT_INTERVAL: 50,
};

export const SPRITE = {
  FRAME_SIZE: 64,
  COLS: 4,
  ROWS: 4,
};

export const DIRECTIONS = ['down', 'left', 'right', 'up'] as const;
export type Direction = typeof DIRECTIONS[number];

export const ANIMATIONS = {
  IDLE: 'idle',
  WALK_DOWN: 'walk_down',
  WALK_LEFT: 'walk_left',
  WALK_RIGHT: 'walk_right',
  WALK_UP: 'walk_up',
  ATTACK: 'attack',
  HIT: 'hit',
  VICTORY: 'victory',
  DEFEAT: 'defeat',
} as const;

export const SPECTACLE = {
  ENTRANCE: 'spectacle:entrance',
  ACTION: 'spectacle:action',
  HIT: 'spectacle:hit',
  COMBO: 'spectacle:combo',
  STREAK: 'spectacle:streak',
  NEAR_MISS: 'spectacle:near_miss',
  COLLISION: 'spectacle:collision',
  COMBAT_START: 'spectacle:combat:start',
  COMBAT_ROUND: 'spectacle:combat:round',
  COMBAT_END: 'spectacle:combat:end',
  PLAYER_JOIN: 'spectacle:player:join',
  PLAYER_LEAVE: 'spectacle:player:leave',
} as const;