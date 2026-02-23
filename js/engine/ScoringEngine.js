// js/engine/ScoringEngine.js — Unified scoring

import { Wall } from './Wall.js';
import { FloorLine } from './FloorLine.js';
import { PatternLine } from './PatternLine.js';
import { CLASSIC } from '../config.js';
import { deepCopy } from '../config.js';

export class ScoringEngine {
  /**
   * Process wall-tiling for a single player (Classic variant).
   * Rows are processed TOP to BOTTOM — order matters for adjacency!
   */
  static wallTilingPhase(playerState) {
    const events = [];
    const newWall = deepCopy(playerState.wall);
    const newPatternLines = deepCopy(playerState.patternLines);
    let scoreGained = 0;
    const discardTiles = [];

    // Process rows top to bottom
    for (let row = 0; row < 5; row++) {
      if (PatternLine.isComplete(playerState.patternLines[row], row)) {
        const result = PatternLine.tileToWall(playerState.patternLines[row]);
        if (!result) continue;

        const { color, discardTiles: rowDiscard } = result;
        const col = Wall.getColumnForColor(row, color);

        newWall[row][col] = color;
        const tileScore = Wall.scoreAdjacency(newWall, row, col);
        scoreGained += tileScore;

        events.push({
          type: 'TILE_SCORED',
          row,
          col,
          color,
          points: tileScore,
        });

        discardTiles.push(...rowDiscard);
        newPatternLines[row] = []; // Clear pattern line
      }
    }

    // Floor penalty
    const floorPenalty = FloorLine.calculatePenalty(playerState.floorLine);
    if (floorPenalty < 0) {
      events.push({
        type: 'FLOOR_PENALTY',
        penalty: floorPenalty,
      });
    }

    scoreGained += floorPenalty;

    // Floor tiles go to discard
    const floorDiscard = FloorLine.getDiscardTiles(playerState.floorLine);
    discardTiles.push(...floorDiscard);

    const newScore = Math.max(CLASSIC.MIN_SCORE, playerState.score + scoreGained);

    return {
      newWall,
      newPatternLines,
      newScore,
      newFloorLine: [],
      discardTiles,
      events,
      scoreGained,
    };
  }

  /**
   * Calculate end-game bonuses for a player (Classic variant).
   */
  static calculateEndGameBonuses(wall) {
    return Wall.getEndGameBonuses(wall);
  }

  /**
   * Summer Pavilion: score a star placement.
   * Score = 1 + number of contiguous adjacent filled spaces in the same star.
   */
  static scoreStarPlacement(starBoard, starName, position) {
    const star = starBoard[starName];
    if (!star) return 1;

    // Count contiguous filled adjacent spaces
    let score = 1;
    // Check positions ±1 (wrapping for positions 1-6)
    const maxPos = 6;

    // Count clockwise
    let pos = position % maxPos + 1;
    while (pos !== position && star[pos]) {
      score++;
      pos = pos % maxPos + 1;
    }

    // Count counter-clockwise
    pos = ((position - 2 + maxPos) % maxPos) + 1;
    while (pos !== position && star[pos]) {
      score++;
      pos = ((pos - 2 + maxPos) % maxPos) + 1;
    }

    return score;
  }
}
