// js/ai/AIPlayer.js — AI interface + difficulty dispatcher

import { EasyAI } from './strategies/EasyAI.js';
import { MediumAI } from './strategies/MediumAI.js';
import { HardAI } from './strategies/HardAI.js';

const strategies = {
  'ai-easy': () => new EasyAI(),
  'ai-medium': () => new MediumAI(),
  'ai-hard': () => new HardAI(),
};

export class AIPlayer {
  static isAI(playerType) {
    return playerType.startsWith('ai-');
  }

  static getStrategy(playerType) {
    const factory = strategies[playerType];
    if (!factory) return new EasyAI(); // Fallback
    return factory();
  }

  static async executeAITurn(state) {
    const player = state.players[state.currentPlayerIndex];
    if (!AIPlayer.isAI(player.type)) return null;

    const strategy = AIPlayer.getStrategy(player.type);
    const move = strategy.selectMove(state);

    if (!move) return null;

    // Artificial thinking delay
    const delay = strategy.thinkingDelay();
    await new Promise(resolve => setTimeout(resolve, delay));

    return move;
  }
}
