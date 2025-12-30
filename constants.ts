import { FruitType, Language } from './types';

export const GRAVITY = 0.15;
export const BLADE_MAX_LENGTH = 10; // Number of points in the trail
export const BLADE_LIFETIME_DECAY = 0.1;
export const FRUIT_SPAWN_RATE_INITIAL = 60; // Frames
export const MAX_LIVES = 3;
export const ZEN_TIME_LIMIT = 90; // Seconds

export const FRUIT_CONFIG: Record<FruitType, { color: string; radius: number; score: number; innerColor: string }> = {
  [FruitType.APPLE]: { color: '#ef4444', innerColor: '#fef3c7', radius: 30, score: 10 },
  [FruitType.BANANA]: { color: '#facc15', innerColor: '#fef9c3', radius: 35, score: 15 },
  [FruitType.ORANGE]: { color: '#f97316', innerColor: '#ffedd5', radius: 30, score: 10 },
  [FruitType.WATERMELON]: { color: '#22c55e', innerColor: '#fca5a5', radius: 45, score: 25 },
  [FruitType.STRAWBERRY]: { color: '#ec4899', innerColor: '#fce7f3', radius: 20, score: 30 },
  [FruitType.BOMB]: { color: '#1f2937', innerColor: '#ef4444', radius: 35, score: 0 },
};

export const COLORS = {
  BLADE: '#00ffff',
  BLADE_GLOW: '#rgba(0, 255, 255, 0.5)',
  BACKGROUND_CLASSIC: '#1e1b4b', // Indigo 950
  BACKGROUND_ZEN: '#3f6212', // Lime 800
};

export const TRANSLATIONS = {
  EN: {
    TITLE: "FRUIT SLASH",
    SUBTITLE: "AI MOTION EDITION",
    CLASSIC_TITLE: "CLASSIC",
    CLASSIC_DESC: "Don't drop fruit. Avoid bombs. 3 Lives.",
    ZEN_TITLE: "ZEN MODE",
    ZEN_DESC: "No bombs. 90 seconds. Pure relaxation.",
    CAMERA_BTN: "📷 Camera",
    MOUSE_BTN: "🖱️ Mouse",
    TIPS: ["Ensure room is well-lit.", "Stand back to show your hand."],
    LOADING: "Initializing Dojo...",
    VISION_LOADING: "Summoning AI Vision...",
    SCORE: "Score",
    TIME: "Time",
    GAME_OVER: "GAME OVER",
    PLAY_AGAIN: "Play Again",
    MAIN_MENU: "Main Menu",
    SENSEI: "Sensei's Wisdom",
    SENSEI_PLACEHOLDER: "Practice makes perfect.",
    PERMISSIONS: "Please allow camera access.",
    ERROR_CAM: "Camera Error"
  },
  CN: {
    TITLE: "水果忍者",
    SUBTITLE: "AI 体感版",
    CLASSIC_TITLE: "经典模式",
    CLASSIC_DESC: "切水果，避开炸弹，3条命。",
    ZEN_TITLE: "禅模式",
    ZEN_DESC: "无炸弹，90秒，纯粹的放松。",
    CAMERA_BTN: "📷 摄像头",
    MOUSE_BTN: "🖱️ 鼠标",
    TIPS: ["确保房间光线充足。", "站远一点，展示你的手势。"],
    LOADING: "道场初始化中...",
    VISION_LOADING: "正在召唤 AI 视觉...",
    SCORE: "分数",
    TIME: "时间",
    GAME_OVER: "游戏结束",
    PLAY_AGAIN: "再玩一次",
    MAIN_MENU: "主菜单",
    SENSEI: "大师的教诲",
    SENSEI_PLACEHOLDER: "熟能生巧。",
    PERMISSIONS: "请允许摄像头访问权限。",
    ERROR_CAM: "摄像头错误"
  }
};