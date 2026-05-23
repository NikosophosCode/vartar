import { EventBus } from './EventBus';
import { SPECTACLE } from './Constants';

export interface PlayerState {
  id: string;
  x: number;
  y: number;
  direction: string;
  character: string;
  health: number;
  score: number;
  state: 'idle' | 'moving' | 'combat' | 'collision_cooldown';
  lastUpdate: number;
}

export interface EnemyState {
  id: string;
  x: number;
  y: number;
  direction: string;
  character: string;
  state: string;
  targetX: number;
  targetY: number;
}

export interface GameStateData {
  playerId: string | null;
  character: string | null;
  players: Map<string, PlayerState>;
  enemies: Map<string, EnemyState>;
  score: number;
  health: number;
  isInCombat: boolean;
  combatResult: 'victory' | 'defeat' | 'draw' | null;
}

class GameStateClass implements GameStateData {
  playerId: string | null = null;
  character: string | null = null;
  players: Map<string, PlayerState> = new Map();
  enemies: Map<string, EnemyState> = new Map();
  score: number = 0;
  health: number = 100;
  isInCombat: boolean = false;
  combatResult: 'victory' | 'defeat' | 'draw' | null = null;

  private static instance: GameStateClass;

  static getInstance(): GameStateClass {
    if (!GameStateClass.instance) {
      GameStateClass.instance = new GameStateClass();
    }
    return GameStateClass.instance;
  }

  reset(): void {
    this.playerId = null;
    this.character = null;
    this.players.clear();
    this.enemies.clear();
    this.score = 0;
    this.health = 100;
    this.isInCombat = false;
    this.combatResult = null;
    EventBus.emit(SPECTACLE.ACTION, { type: 'game_state_reset' });
  }

  setPlayerId(id: string): void {
    this.playerId = id;
  }

  setCharacter(character: string): void {
    this.character = character;
  }

  updatePlayer(id: string, data: Partial<PlayerState>): void {
    const existing = this.players.get(id);
    const newData = { ...data, id, lastUpdate: Date.now() } as PlayerState;
    if (existing) {
      Object.assign(existing, newData);
    } else {
      this.players.set(id, newData);
    }
  }

  updateEnemy(id: string, data: Partial<EnemyState>): void {
    const existing = this.enemies.get(id);
    const newData = { ...data, id } as EnemyState;
    if (existing) {
      Object.assign(existing, newData);
    } else {
      this.enemies.set(id, newData);
    }
  }

  removePlayer(id: string): void {
    this.players.delete(id);
    this.enemies.delete(id);
    EventBus.emit(SPECTACLE.PLAYER_LEAVE, { id });
  }

  setScore(score: number): void {
    this.score = score;
  }

  incrementScore(): void {
    this.score++;
    EventBus.emit(SPECTACLE.HIT, { type: 'score', value: this.score });
  }

  setHealth(health: number): void {
    this.health = Math.max(0, Math.min(health, 100));
  }

  setInCombat(inCombat: boolean): void {
    this.isInCombat = inCombat;
  }

  setCombatResult(result: 'victory' | 'defeat' | 'draw' | null): void {
    this.combatResult = result;
    if (result) {
      EventBus.emit(SPECTACLE.COMBAT_END, { result });
    }
  }

  getState(): GameStateData {
    return {
      playerId: this.playerId,
      character: this.character,
      players: new Map(this.players),
      enemies: new Map(this.enemies),
      score: this.score,
      health: this.health,
      isInCombat: this.isInCombat,
      combatResult: this.combatResult,
    };
  }
}

export const GameState = GameStateClass.getInstance();