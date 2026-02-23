// js/engine/GameRules.js — Validation: legal moves, blocked colors

import { PatternLine } from './PatternLine.js';
import { Wall } from './Wall.js';
import { FactoryDisplay } from './FactoryDisplay.js';

export class GameRules {
  /**
   * Get all legal moves for the current player (Classic variant).
   * Returns array of { source, factoryIndex?, color, targetRow }
   * targetRow: 0-4 for pattern lines, 'floor' for voluntary floor dump
   */
  static getLegalMoves(state) {
    const player = state.players[state.currentPlayerIndex];
    const moves = [];

    // Moves from factories
    for (let fi = 0; fi < state.factories.length; fi++) {
      const factory = state.factories[fi];
      if (factory.length === 0) continue;

      const colors = new Set(factory);
      for (const color of colors) {
        // Check each pattern line
        for (let row = 0; row < 5; row++) {
          if (PatternLine.canPlace(player.patternLines[row], color, row, player.wall)) {
            moves.push({
              source: 'factory',
              factoryIndex: fi,
              color,
              targetRow: row,
            });
          }
        }
        // Can always send to floor voluntarily
        moves.push({
          source: 'factory',
          factoryIndex: fi,
          color,
          targetRow: 'floor',
        });
      }
    }

    // Moves from center
    if (state.center.length > 0) {
      const colors = new Set(state.center);
      for (const color of colors) {
        for (let row = 0; row < 5; row++) {
          if (PatternLine.canPlace(player.patternLines[row], color, row, player.wall)) {
            moves.push({
              source: 'center',
              color,
              targetRow: row,
            });
          }
        }
        moves.push({
          source: 'center',
          color,
          targetRow: 'floor',
        });
      }
    }

    return moves;
  }

  /**
   * Validate a specific move.
   */
  static validateMove(state, action) {
    if (state.phase !== 'factory-offer') {
      return { valid: false, error: 'Not in factory offer phase' };
    }

    const player = state.players[state.currentPlayerIndex];

    if (action.source === 'factory') {
      const factory = state.factories[action.factoryIndex];
      if (!factory || factory.length === 0) {
        return { valid: false, error: 'Factory is empty' };
      }
      if (!factory.includes(action.color)) {
        return { valid: false, error: 'Color not in factory' };
      }
    } else if (action.source === 'center') {
      if (!state.center.includes(action.color)) {
        return { valid: false, error: 'Color not in center' };
      }
    } else {
      return { valid: false, error: 'Invalid source' };
    }

    if (action.targetRow !== 'floor') {
      const row = action.targetRow;
      if (row < 0 || row > 4) {
        return { valid: false, error: 'Invalid target row' };
      }
      if (!PatternLine.canPlace(player.patternLines[row], action.color, row, player.wall)) {
        return { valid: false, error: 'Cannot place this color on that row' };
      }
    }

    return { valid: true };
  }

  /**
   * Check if the factory offer phase is over.
   */
  static isRoundOver(state) {
    return FactoryDisplay.allEmpty(state.factories, state.center);
  }

  /**
   * Check if the game is over (Classic: any player has complete wall row).
   */
  static isGameOver(state) {
    if (state.variant !== 'classic') return false;
    return state.players.some(p => Wall.hasCompleteRow(p.wall));
  }

  /**
   * Determine winner. Returns { winners, tiebreaker }.
   */
  static determineWinner(state) {
    const scores = state.players.map((p, i) => ({
      index: i,
      score: p.score,
      completeRows: Wall.countCompleteRows(p.wall),
      name: p.name,
    }));

    scores.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.completeRows - a.completeRows; // tiebreaker
    });

    const topScore = scores[0].score;
    const topRows = scores[0].completeRows;
    const winners = scores.filter(s => s.score === topScore && s.completeRows === topRows);

    return {
      winners: winners.map(w => w.index),
      rankings: scores,
      isTie: winners.length > 1,
    };
  }
}
