// js/variants/ClassicAzul.js — Classic variant config bundle

import { CLASSIC } from '../config.js';

export const ClassicAzulConfig = {
  id: 'classic',
  name: 'Classic Azul',
  description: 'The original tile-laying game. Complete rows on your wall to score!',
  playerRange: [2, 4],

  tileColors: CLASSIC.COLORS,
  tilesPerColor: CLASSIC.TILES_PER_COLOR,
  totalTiles: CLASSIC.TOTAL_TILES,
  tileSetKey: 'classic',

  factoryCount: (playerCount) => CLASSIC.FACTORIES[playerCount] || 5,
  tilesPerFactory: CLASSIC.TILES_PER_FACTORY,

  rounds: 'dynamic',
  endGameTrigger: (state) => state.players.some(p =>
    p.wall.some(row => row.every(cell => cell !== null))
  ),

  startingScore: 0,
  minimumScore: CLASSIC.MIN_SCORE,
  floorPenalties: CLASSIC.FLOOR_PENALTIES,

  boardType: 'grid',
  boardConfig: {
    wallPattern: CLASSIC.WALL_PATTERN,
    patternLines: 5,
    wallSize: 5,
  },

  wildMechanic: null,
  specialRules: {},

  boardCSSFile: 'board.css',
  rendererClass: 'BoardRenderer',
};
