// js/variants/SummerPavilion.js — Summer Pavilion variant config bundle

import { SUMMER } from '../config.js';

export const SummerPavilionConfig = {
  id: 'summer',
  name: 'Summer Pavilion',
  description: 'A colorful star-board variant with wild tiles and decorations.',
  playerRange: [2, 4],

  tileColors: SUMMER.COLORS,
  tilesPerColor: SUMMER.TILES_PER_COLOR,
  totalTiles: SUMMER.TOTAL_TILES,
  tileSetKey: 'summer',

  factoryCount: (playerCount) => SUMMER.FACTORIES[playerCount] || 5,
  tilesPerFactory: SUMMER.TILES_PER_FACTORY,

  rounds: SUMMER.ROUNDS,
  endGameTrigger: (state) => state.round > SUMMER.ROUNDS,

  startingScore: SUMMER.STARTING_SCORE,
  minimumScore: SUMMER.MIN_SCORE,
  floorPenalties: null,

  boardType: 'star',
  boardConfig: {
    stars: 7,
    positionsPerStar: 6,
    cornerStorage: SUMMER.CORNER_STORAGE,
    supplySpaces: SUMMER.SUPPLY_SPACES,
  },

  wildMechanic: { sequence: SUMMER.WILD_SEQUENCE },
  specialRules: {
    cornerStorage: SUMMER.CORNER_STORAGE,
    starBonuses: SUMMER.STAR_BONUSES,
    numberBonuses: SUMMER.NUMBER_BONUSES,
  },

  boardCSSFile: 'board-summer.css',
  rendererClass: 'StarRenderer',
};
