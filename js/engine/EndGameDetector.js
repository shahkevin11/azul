// js/engine/EndGameDetector.js — Trigger conditions + final scoring

import { Wall } from './Wall.js';
import { ScoringEngine } from './ScoringEngine.js';
import { StarBoard } from './StarBoard.js';
import { CLASSIC, SUMMER, deepCopy } from '../config.js';

export class EndGameDetector {
  /**
   * Classic: check if game should end after wall-tiling.
   * Trigger: any player has at least one complete horizontal row.
   */
  static shouldEndClassic(state) {
    return state.players.some(p => Wall.hasCompleteRow(p.wall));
  }

  /**
   * Summer Pavilion: game ends after round 6.
   */
  static shouldEndSummer(state) {
    return state.round > SUMMER.ROUNDS;
  }

  /**
   * Apply end-game bonuses to all players (Classic).
   */
  static applyClassicEndGame(state) {
    const newState = deepCopy(state);
    const allEvents = [];

    for (let i = 0; i < newState.players.length; i++) {
      const player = newState.players[i];
      const { bonus, details } = ScoringEngine.calculateEndGameBonuses(player.wall);

      player.score += bonus;
      player.endGameBonus = bonus;
      player.endGameDetails = details;

      allEvents.push({
        type: 'END_GAME_BONUS',
        playerIndex: i,
        bonus,
        details,
      });
    }

    newState.phase = 'game-over';
    return { newState, events: allEvents };
  }

  /**
   * Apply end-game bonuses to all players (Summer Pavilion).
   */
  static applySummerEndGame(state) {
    const newState = deepCopy(state);
    const allEvents = [];

    for (let i = 0; i < newState.players.length; i++) {
      const player = newState.players[i];

      // Discard excess tiles beyond corner storage
      if (player.handTiles && player.handTiles.length > SUMMER.CORNER_STORAGE) {
        const excess = player.handTiles.length - SUMMER.CORNER_STORAGE;
        player.score = Math.max(SUMMER.MIN_SCORE, player.score - excess);
        player.handTiles = player.handTiles.slice(0, SUMMER.CORNER_STORAGE);
      }

      // Star and number bonuses
      const { starBonuses, numberBonuses, total } = StarBoard.getEndGameBonuses(player.starBoard);
      player.score += total;
      player.endGameBonus = total;
      player.endGameDetails = { starBonuses, numberBonuses };

      allEvents.push({
        type: 'END_GAME_BONUS',
        playerIndex: i,
        bonus: total,
        details: { starBonuses, numberBonuses },
      });
    }

    newState.phase = 'game-over';
    return { newState, events: allEvents };
  }
}
