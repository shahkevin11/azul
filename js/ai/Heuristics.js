// js/ai/Heuristics.js — Board evaluation functions

import { Wall } from '../engine/Wall.js';
import { FloorLine } from '../engine/FloorLine.js';
import { CLASSIC } from '../config.js';

export class Heuristics {
  /**
   * Evaluate a board position for a player (higher = better).
   */
  static evaluate(state, playerIndex) {
    const player = state.players[playerIndex];
    let score = 0;

    // 1. Current score
    score += player.score * 1.0;

    // 2. Pattern line completion potential
    score += Heuristics.patternLineValue(player) * 0.8;

    // 3. Wall adjacency potential
    score += Heuristics.wallPotential(player.wall) * 0.6;

    // 4. Floor line risk
    const floorPenalty = FloorLine.calculatePenalty(player.floorLine);
    score += floorPenalty * 1.2;

    // 5. End-game bonus progress
    score += Heuristics.endGameProgress(player.wall) * 0.5;

    return score;
  }

  static patternLineValue(player) {
    let value = 0;
    for (let row = 0; row < 5; row++) {
      const line = player.patternLines[row];
      if (line.length === 0) continue;

      const maxSize = row + 1;
      const progress = line.length / maxSize;
      const color = line[0];

      // Value of completing this line
      if (Wall.canPlaceColor(player.wall, row, color)) {
        // Estimate wall score
        const col = Wall.getColumnForColor(row, color);
        value += progress * 2;

        // Higher value if close to completion
        if (progress >= 0.8) value += 1.5;
      }
    }
    return value;
  }

  static wallPotential(wall) {
    let value = 0;

    // Check for rows close to completion
    for (let r = 0; r < 5; r++) {
      const filled = wall[r].filter(c => c !== null).length;
      if (filled >= 3) value += (filled - 2) * 1.5; // Rows with 3+ are valuable
      if (filled === 4) value += 3; // Almost complete row
    }

    // Check columns
    for (let c = 0; c < 5; c++) {
      let filled = 0;
      for (let r = 0; r < 5; r++) {
        if (wall[r][c] !== null) filled++;
      }
      if (filled >= 3) value += (filled - 2) * 1.0;
    }

    return value;
  }

  static endGameProgress(wall) {
    let value = 0;

    // Partial row completion
    for (let r = 0; r < 5; r++) {
      const filled = wall[r].filter(c => c !== null).length;
      if (filled >= 3) value += filled * 0.4; // +2 bonus for complete
    }

    // Partial column completion
    for (let c = 0; c < 5; c++) {
      let filled = 0;
      for (let r = 0; r < 5; r++) {
        if (wall[r][c] !== null) filled++;
      }
      if (filled >= 3) value += filled * 0.6; // +7 bonus for complete
    }

    // Partial color set completion
    for (const color of CLASSIC.COLORS) {
      let count = 0;
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          if (wall[r][c] === color) count++;
        }
      }
      if (count >= 3) value += count * 0.8; // +10 bonus for complete
    }

    return value;
  }
}
