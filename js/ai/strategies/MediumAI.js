// js/ai/strategies/MediumAI.js — Greedy: maximize immediate score

import { GameRules } from '../../engine/GameRules.js';
import { PatternLine } from '../../engine/PatternLine.js';
import { Wall } from '../../engine/Wall.js';
import { FloorLine } from '../../engine/FloorLine.js';
import { deepCopy, CLASSIC } from '../../config.js';

export class MediumAI {
  selectMove(state) {
    const moves = GameRules.getLegalMoves(state);
    if (moves.length === 0) return null;

    const player = state.players[state.currentPlayerIndex];
    let bestMove = null;
    let bestScore = -Infinity;

    for (const move of moves) {
      const score = this.evaluateMove(state, move, player);
      if (score > bestScore || (score === bestScore && Math.random() > 0.5)) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove || moves[0];
  }

  evaluateMove(state, move, player) {
    let score = 0;

    // Count tiles taken
    let tileCount;
    if (move.source === 'factory') {
      tileCount = state.factories[move.factoryIndex].filter(t => t === move.color).length;
    } else {
      tileCount = state.center.filter(t => t === move.color).length;
    }

    if (move.targetRow === 'floor') {
      // Simulate floor penalty
      const penalty = this.estimateFloorPenalty(player.floorLine.length + tileCount);
      score = penalty; // Negative
      return score - 5; // Extra penalty to discourage floor dumps
    }

    const row = move.targetRow;
    const maxSize = row + 1;
    const currentFill = player.patternLines[row].length;
    const placeable = Math.min(tileCount, maxSize - currentFill);
    const overflow = tileCount - placeable;

    // Will this complete the pattern line?
    if (currentFill + placeable === maxSize) {
      // Estimate wall score
      const wallCopy = deepCopy(player.wall);
      const col = Wall.getColumnForColor(row, move.color);
      wallCopy[row][col] = move.color;
      const wallScore = Wall.scoreAdjacency(wallCopy, row, col);
      score += wallScore * 2; // High weight for completing
    } else {
      // Partial fill — value progress toward completion
      score += placeable * 0.5;
      // Bonus for getting closer to completion
      const progress = (currentFill + placeable) / maxSize;
      score += progress * 1.5;
    }

    // Penalty for overflow to floor
    if (overflow > 0) {
      const floorPenalty = this.estimateFloorPenalty(player.floorLine.length + overflow);
      const currentPenalty = this.estimateFloorPenalty(player.floorLine.length);
      score += (floorPenalty - currentPenalty);
    }

    // Center pick penalty (first player)
    if (move.source === 'center' && state.centerHasFirstPlayer) {
      score -= 1.5;
    }

    // Denial value (simplified)
    score += this.calculateDenial(state, move) * 0.3;

    return score;
  }

  estimateFloorPenalty(count) {
    let penalty = 0;
    for (let i = 0; i < Math.min(count, 7); i++) {
      penalty += CLASSIC.FLOOR_PENALTIES[i];
    }
    return penalty;
  }

  calculateDenial(state, move) {
    let denialValue = 0;
    const tileCount = move.source === 'factory'
      ? state.factories[move.factoryIndex].filter(t => t === move.color).length
      : state.center.filter(t => t === move.color).length;

    for (let i = 0; i < state.players.length; i++) {
      if (i === state.currentPlayerIndex) continue;
      const opp = state.players[i];

      for (let row = 0; row < 5; row++) {
        const pl = opp.patternLines[row];
        if (pl.length > 0 && pl[0] === move.color) {
          // Opponent needs this color
          const needed = (row + 1) - pl.length;
          denialValue += Math.min(tileCount, needed) * 0.5;
        }
      }
    }

    return denialValue;
  }

  thinkingDelay() {
    return 800 + Math.random() * 700;
  }
}
