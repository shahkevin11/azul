// js/config.js — Game constants, tile definitions, wall patterns

export const CLASSIC = {
  COLORS: ['blue', 'yellow', 'red', 'black', 'white'],
  TILES_PER_COLOR: 20,
  TOTAL_TILES: 100,
  FACTORIES: { 2: 5, 3: 7, 4: 9 },
  TILES_PER_FACTORY: 4,
  WALL_PATTERN: [
    ['blue','yellow','red','black','white'],
    ['white','blue','yellow','red','black'],
    ['black','white','blue','yellow','red'],
    ['red','black','white','blue','yellow'],
    ['yellow','red','black','white','blue'],
  ],
  FLOOR_PENALTIES: [-1, -1, -2, -2, -2, -3, -3],
  BONUS_ROW: 2,
  BONUS_COLUMN: 7,
  BONUS_COLOR_SET: 10,
  MIN_SCORE: 0,
  PATTERN_LINE_SIZES: [1, 2, 3, 4, 5],
};

export const SUMMER = {
  COLORS: ['purple', 'green', 'orange', 'yellow', 'blue', 'red'],
  TILES_PER_COLOR: 22,
  TOTAL_TILES: 132,
  ROUNDS: 6,
  FACTORIES: { 2: 5, 3: 7, 4: 9 },
  TILES_PER_FACTORY: 4,
  WILD_SEQUENCE: ['purple', 'green', 'orange', 'yellow', 'blue', 'red'],
  STARTING_SCORE: 5,
  MIN_SCORE: 1,
  CORNER_STORAGE: 4,
  SUPPLY_SPACES: 10,
  STAR_BONUSES: { center: 12, red: 14, blue: 15, yellow: 16, orange: 17, green: 18, purple: 20 },
  NUMBER_BONUSES: { 1: 4, 2: 8, 3: 12, 4: 16, 5: 0, 6: 0 },
};

export const ASSETS = {
  BASE_PATH: './assets/',
  TILE_SETS: {
    classic: {
      blue: 'assets/tiles/classic/blue.png',
      yellow: 'assets/tiles/classic/yellow.png',
      red: 'assets/tiles/classic/red.png',
      black: 'assets/tiles/classic/black.png',
      white: 'assets/tiles/classic/white.png',
      firstPlayer: 'assets/tiles/classic/first-player.png',
    },
    summer: {
      purple: 'assets/tiles/summer/purple.png',
      green: 'assets/tiles/summer/green.png',
      orange: 'assets/tiles/summer/orange.png',
      yellow: 'assets/tiles/summer/yellow.png',
      blue: 'assets/tiles/summer/blue.png',
      red: 'assets/tiles/summer/red.png',
      wildGlow: 'assets/tiles/summer/wild-glow.png',
    }
  },
  BACKGROUNDS: {
    gameBg: 'bg/game-bg.jpg',
    lobbyBg: 'bg/lobby-bg.jpg',
    gameBgTile: 'bg/game-bg-tile.png',
    overlayTexture: 'bg/overlay-texture.png',
  },
  FRAMES: {
    factory: 'frames/factory-frame.png',
    board: 'frames/board-frame.png',
    panel: 'frames/panel-frame.png',
    centerPool: 'frames/center-pool-frame.png',
    scoreBar: 'frames/score-bar-bg.png',
    divider: 'frames/divider.png',
  },
  UI: {
    logo: 'ui/logo-azul.png',
    iconSettings: 'ui/icon-settings.png',
    iconCrown: 'ui/icon-crown.png',
    iconArrow: 'ui/icon-arrow-right.png',
    btnStartBg: 'ui/btn-start-bg.png',
    tileSlotEmpty: 'ui/tile-slot-empty.png',
    tileSlotLegal: 'ui/tile-slot-legal.png',
    tileSelectedGlow: 'ui/tile-selected-glow.png',
    floorPenalty: 'ui/floor-penalty.png',
    roundBanner: 'ui/round-banner.png',
  },
  SUMMER: {
    starBoardBg: 'summer/star-board-bg.png',
    decorationPillar: 'summer/decoration-pillar.png',
    decorationStatue: 'summer/decoration-statue.png',
    decorationWindow: 'summer/decoration-window.png',
  },
  ICONS: {
    icon192: 'icons/icon-192.png',
    icon512: 'icons/icon-512.png',
    appleTouchIcon: 'icons/apple-touch-icon.png',
    favicon: 'icons/favicon.png',
  },
  AUDIO: {
    tilePick: 'assets/audio/tile-pick.mp3',
    tilePlace: 'assets/audio/tile-place.mp3',
    tileWall: 'assets/audio/tile-wall.mp3',
    tileBreak: 'assets/audio/tile-break.mp3',
    scoreTick: 'assets/audio/score-tick.mp3',
    scoreBonus: 'assets/audio/score-bonus.mp3',
    roundEnd: 'assets/audio/round-end.mp3',
    gameOver: 'assets/audio/game-over.mp3',
    turnAlert: 'assets/audio/turn-alert.mp3',
    playerJoin: 'assets/audio/player-join.mp3',
    error: 'assets/audio/error.mp3',
  },
};

// Deep clone utility
export function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Generate unique IDs
let _idCounter = 0;
export function genId() {
  return `id_${Date.now()}_${++_idCounter}`;
}
