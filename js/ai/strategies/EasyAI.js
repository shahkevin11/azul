// js/ai/strategies/EasyAI.js — Random legal move

import { GameRules } from '../../engine/GameRules.js';

export class EasyAI {
  selectMove(state) {
    const moves = GameRules.getLegalMoves(state);
    if (moves.length === 0) return null;
    return moves[Math.floor(Math.random() * moves.length)];
  }

  thinkingDelay() {
    return 500 + Math.random() * 500;
  }
}
