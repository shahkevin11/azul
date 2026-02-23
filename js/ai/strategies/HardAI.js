// js/ai/strategies/HardAI.js — Minimax with heuristic eval (depth-limited)

import { GameRules } from '../../engine/GameRules.js';
import { GameState } from '../../engine/GameState.js';
import { Heuristics } from '../Heuristics.js';
import { deepCopy } from '../../config.js';

export class HardAI {
  constructor() {
    this.maxDepth = 2;
    this.timeLimit = 2000; // ms
    this.startTime = 0;
    this.bestMoveSoFar = null;
  }

  selectMove(state) {
    const moves = GameRules.getLegalMoves(state);
    if (moves.length === 0) return null;
    if (moves.length === 1) return moves[0];

    this.startTime = Date.now();
    this.bestMoveSoFar = moves[0];

    try {
      let bestScore = -Infinity;

      for (const move of moves) {
        if (this.isTimeUp()) break;

        const { newState } = GameState.applyAction(state, move);
        const score = this.minimax(
          newState,
          this.maxDepth - 1,
          -Infinity,
          Infinity,
          false,
          state.currentPlayerIndex
        );

        if (score > bestScore) {
          bestScore = score;
          this.bestMoveSoFar = move;
        }
      }
    } catch (e) {
      // Time ran out or error — return best found so far
    }

    return this.bestMoveSoFar;
  }

  minimax(state, depth, alpha, beta, isMaximizing, aiPlayerIndex) {
    if (this.isTimeUp()) return Heuristics.evaluate(state, aiPlayerIndex);
    if (depth === 0 || state.phase === 'game-over' || state.phase === 'wall-tiling') {
      return Heuristics.evaluate(state, aiPlayerIndex);
    }

    const moves = GameRules.getLegalMoves(state);
    if (moves.length === 0) {
      return Heuristics.evaluate(state, aiPlayerIndex);
    }

    // Limit branching factor for performance
    const limitedMoves = moves.length > 10 ? this.pruneMovesPreliminarily(state, moves).slice(0, 10) : moves;

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of limitedMoves) {
        if (this.isTimeUp()) break;
        const { newState } = GameState.applyAction(state, move);
        const isNextMax = newState.currentPlayerIndex === aiPlayerIndex;
        const evaluation = this.minimax(newState, depth - 1, alpha, beta, isNextMax, aiPlayerIndex);
        maxEval = Math.max(maxEval, evaluation);
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of limitedMoves) {
        if (this.isTimeUp()) break;
        const { newState } = GameState.applyAction(state, move);
        const isNextMax = newState.currentPlayerIndex === aiPlayerIndex;
        const evaluation = this.minimax(newState, depth - 1, alpha, beta, isNextMax, aiPlayerIndex);
        minEval = Math.min(minEval, evaluation);
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  pruneMovesPreliminarily(state, moves) {
    // Quick score each move and return sorted
    const medium = new (require('./MediumAI.js').MediumAI || class { evaluateMove() { return 0; } })();
    const player = state.players[state.currentPlayerIndex];

    return moves
      .map(m => ({ move: m, score: this.quickEval(state, m, player) }))
      .sort((a, b) => b.score - a.score)
      .map(ms => ms.move);
  }

  quickEval(state, move, player) {
    // Simple quick evaluation without deep copy
    let score = 0;
    let tileCount;

    if (move.source === 'factory') {
      tileCount = state.factories[move.factoryIndex].filter(t => t === move.color).length;
    } else {
      tileCount = state.center.filter(t => t === move.color).length;
    }

    if (move.targetRow === 'floor') return -10;

    const row = move.targetRow;
    const maxSize = row + 1;
    const currentFill = player.patternLines[row].length;
    const placeable = Math.min(tileCount, maxSize - currentFill);
    const overflow = tileCount - placeable;

    if (currentFill + placeable === maxSize) score += 5;
    else score += placeable * 0.5;

    score -= overflow * 1.5;

    return score;
  }

  isTimeUp() {
    return Date.now() - this.startTime > this.timeLimit;
  }

  thinkingDelay() {
    return 1000 + Math.random() * 1000;
  }
}
