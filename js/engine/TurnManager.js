// js/engine/TurnManager.js — Turn order, phase transitions, round lifecycle

import { FactoryDisplay } from './FactoryDisplay.js';
import { ScoringEngine } from './ScoringEngine.js';
import { EndGameDetector } from './EndGameDetector.js';
import { TileBag } from './TileBag.js';
import { deepCopy, CLASSIC } from '../config.js';

export class TurnManager {
  /**
   * Advance to the next player.
   */
  static nextPlayer(state) {
    const next = (state.currentPlayerIndex + 1) % state.players.length;
    return next;
  }

  /**
   * Process the wall-tiling phase for all players (Classic).
   * Returns new state + events array.
   */
  static processWallTiling(state) {
    const newState = deepCopy(state);
    const allEvents = [];

    for (let i = 0; i < newState.players.length; i++) {
      const result = ScoringEngine.wallTilingPhase(newState.players[i]);

      newState.players[i].wall = result.newWall;
      newState.players[i].patternLines = result.newPatternLines;
      newState.players[i].score = result.newScore;
      newState.players[i].floorLine = result.newFloorLine;
      newState.discard.push(...result.discardTiles);

      allEvents.push({
        type: 'PLAYER_WALL_TILING',
        playerIndex: i,
        events: result.events,
        scoreGained: result.scoreGained,
        newScore: result.newScore,
      });
    }

    return { newState, events: allEvents };
  }

  /**
   * Process round end: check game over, set up next round.
   */
  static processRoundEnd(state) {
    // First, do wall tiling
    const { newState, events } = TurnManager.processWallTiling(state);
    const allEvents = [...events];

    // Check game over
    if (EndGameDetector.shouldEndClassic(newState)) {
      const endResult = EndGameDetector.applyClassicEndGame(newState);
      allEvents.push(...endResult.events);
      return {
        newState: endResult.newState,
        events: allEvents,
        gameOver: true,
      };
    }

    // Set up next round
    newState.round++;

    // Find who has first player marker
    let firstPlayerIdx = 0;
    for (let i = 0; i < newState.players.length; i++) {
      if (newState.players[i].hasFirstPlayer) {
        firstPlayerIdx = i;
        newState.players[i].hasFirstPlayer = false;
        break;
      }
    }
    newState.currentPlayerIndex = firstPlayerIdx;
    newState.centerHasFirstPlayer = true;
    newState.center = [];

    // Refill factories
    const bag = TileBag.fromArray(newState.bag);
    const factoryCount = FactoryDisplay.getFactoryCount(
      newState.players.length, CLASSIC
    );
    newState.factories = FactoryDisplay.fillFactories(
      FactoryDisplay.createFactories(factoryCount),
      bag,
      newState.discard,
      CLASSIC.TILES_PER_FACTORY
    );
    newState.bag = bag.toArray();

    newState.phase = 'factory-offer';

    allEvents.push({
      type: 'ROUND_START',
      round: newState.round,
    });

    return {
      newState,
      events: allEvents,
      gameOver: false,
    };
  }
}
