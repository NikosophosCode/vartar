import { io, Socket } from 'socket.io-client';
import { EventBus } from './EventBus';
import { GameState } from './GameState';
import { NETWORK, SPECTACLE } from './Constants';

class SocketManagerClass {
  private static instance: SocketManagerClass;
  private socket: Socket | null = null;
  private reconnectAttempts: number = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private serverUrl: string = '';

  static getInstance(): SocketManagerClass {
    if (!SocketManagerClass.instance) {
      SocketManagerClass.instance = new SocketManagerClass();
    }
    return SocketManagerClass.instance;
  }

  connect(url: string = 'http://localhost:3000'): void {
    if (this.socket?.connected) return;

    this.serverUrl = url;
    this.socket = io(url, {
      transports: ['websocket'],
      reconnection: false,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[SocketManager] Connected');
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      EventBus.emit('socket:connected');
      EventBus.emit(SPECTACLE.ACTION, { type: 'socket_connected' });
    });

    this.socket.on('disconnect', () => {
      console.log('[SocketManager] Disconnected');
      this.stopHeartbeat();
      EventBus.emit('socket:disconnected');
      this.attemptReconnect();
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('[SocketManager] Connection error:', error.message);
      EventBus.emit('socket:error', { error });
    });

    this.socket.on('player:join', (data: { playerId: string; character: string }) => {
      GameState.setPlayerId(data.playerId);
      EventBus.emit('player:joined', data);
      EventBus.emit(SPECTACLE.PLAYER_JOIN, data);
    });

    this.socket.on('player:move', (data: { id: string; x: number; y: number; direction: string }) => {
      GameState.updateEnemy(data.id, {
        targetX: data.x,
        targetY: data.y,
        direction: data.direction,
      });
    });

    this.socket.on('state:snapshot', (data: { players: any[]; enemies: any[] }) => {
      data.players.forEach((p) => {
        GameState.updatePlayer(p.id, p);
      });
      data.enemies.forEach((e) => {
        GameState.updateEnemy(e.id, e);
      });
    });

    this.socket.on('collision:detected', (data: { playerId: string; enemyId: string }) => {
      EventBus.emit('collision:detected', data);
      EventBus.emit(SPECTACLE.COLLISION, data);
    });

    this.socket.on('combat:start', (data: { playerId: string; enemyId: string }) => {
      EventBus.emit('combat:start', data);
      EventBus.emit(SPECTACLE.COMBAT_START, data);
    });

    this.socket.on('combat:result', (data: { result: 'victory' | 'defeat' | 'draw'; scores?: any }) => {
      GameState.setCombatResult(data.result);
      if (data.scores) {
        GameState.setScore(data.scores.player);
      }
      EventBus.emit('combat:result', data);
    });

    this.socket.on('player:left', (data: { id: string }) => {
      GameState.removePlayer(data.id);
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= NETWORK.RECONNECT_MAX_ATTEMPTS) {
      console.log('[SocketManager] Max reconnect attempts reached');
      EventBus.emit('socket:reconnect_failed');
      return;
    }

    const delay = NETWORK.RECONNECT_DELAYS[this.reconnectAttempts] || NETWORK.RECONNECT_DELAYS[NETWORK.RECONNECT_DELAYS.length - 1];
    console.log(`[SocketManager] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect(this.serverUrl);
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('heartbeat', { timestamp: Date.now() });
      }
    }, NETWORK.HEARTBEAT_INTERVAL);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  emit(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('[SocketManager] Cannot emit, not connected');
    }
  }

  on(event: string, callback: (...args: any[]) => void): void {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.off(event);
    }
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.stopHeartbeat();
    this.socket?.disconnect();
    this.socket = null;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const SocketManager = SocketManagerClass.getInstance();