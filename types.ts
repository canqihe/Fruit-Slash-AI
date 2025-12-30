export enum GameMode {
  MENU = 'MENU',
  CLASSIC = 'CLASSIC', // Lives, Bombs
  ZEN = 'ZEN',         // No bombs, Time limit
  GAME_OVER = 'GAME_OVER'
}

export enum FruitType {
  APPLE = 'APPLE',
  BANANA = 'BANANA',
  ORANGE = 'ORANGE',
  WATERMELON = 'WATERMELON',
  STRAWBERRY = 'STRAWBERRY',
  BOMB = 'BOMB'
}

export type Language = 'EN' | 'CN';

export interface Entity {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  type: FruitType;
  sliced: boolean;
  scoreValue: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 0 to 1
  color: string;
  size: number;
}

export interface Splatter {
  id: string;
  x: number;
  y: number;
  color: string;
  rotation: number;
  scale: number;
  opacity: number;
}

export interface Point {
  x: number;
  y: number;
  life: number; // For trail fading
}

export interface GameState {
  score: number;
  highScore: number;
  lives: number;
  timeLeft: number; // For Zen mode
  mode: GameMode;
  isPlaying: boolean;
}

// Global MediaPipe types
declare global {
  interface Window {
    Hands: any;
    Camera: any;
    drawConnectors: any;
    drawLandmarks: any;
    HAND_CONNECTIONS: any;
  }
}