import Phaser from 'phaser';
import { EventBus } from '../core/EventBus';

class AudioManagerClass {
  private static instance: AudioManagerClass;
  private scene: Phaser.Scene | null = null;
  private bgmVolume: number = 0.5;
  private sfxVolume: number = 0.7;
  private isMuted: boolean = false;
  private currentBgm: Phaser.Sound.HTML5AudioSound | Phaser.Sound.NoAudioSound | null = null;

  static getInstance(): AudioManagerClass {
    if (!AudioManagerClass.instance) {
      AudioManagerClass.instance = new AudioManagerClass();
    }
    return AudioManagerClass.instance;
  }

  setScene(scene: Phaser.Scene): void {
    this.scene = scene;
  }

  playBgm(key: string, loop: boolean = true): void {
    if (!this.scene || this.isMuted) return;

    if (this.currentBgm) {
      this.currentBgm.stop();
    }

    this.currentBgm = this.scene.sound.add(key, {
      volume: this.bgmVolume,
      loop,
    }) as Phaser.Sound.HTML5AudioSound | Phaser.Sound.NoAudioSound;

    this.currentBgm.play();
  }

  playSfx(key: string): void {
    if (!this.scene || this.isMuted) return;

    const sfx = this.scene.sound.add(key, {
      volume: this.sfxVolume,
    });
    sfx.play();
  }

  setBgmVolume(volume: number): void {
    this.bgmVolume = Math.max(0, Math.min(1, volume));
    if (this.currentBgm) {
      this.currentBgm.setVolume(this.bgmVolume);
    }
  }

  setSfxVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.currentBgm) {
      if (this.isMuted) {
        this.currentBgm.pause();
      } else {
        this.currentBgm.resume();
      }
    }
    return this.isMuted;
  }

  setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.currentBgm) {
      if (muted) {
        this.currentBgm.pause();
      } else {
        this.currentBgm.resume();
      }
    }
  }

  isMutedState(): boolean {
    return this.isMuted;
  }

  stopBgm(): void {
    if (this.currentBgm) {
      this.currentBgm.stop();
      this.currentBgm = null;
    }
  }
}

export const AudioManager = AudioManagerClass.getInstance();