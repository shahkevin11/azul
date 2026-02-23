// js/engine/GameState.js — Immutable state object + reducer

import { deepCopy, CLASSIC, SUMMER, genId } from '../config.js';
import { TileBag } from './TileBag.js';
import { FactoryDisplay } from './FactoryDisplay.js';
import { PatternLine } from './PatternLine.js';
import { FloorLine } from './FloorLine.js';
import { Wall } from './Wall.js';
import { StarBoard } from './StarBoard.js';
import { GameRules } from './GameRules.js';
import { TurnManager } from './TurnManager.js';

export class GameState {
  /**
   * Create a new game state.
   */
  static create(options) {
    const {
      variant = 'classic',
      players = [
        { name: 'Player 1', type: 'human' },
        { name: 'Player 2', type: 'ai-easy' },
      ],
    } = options;

    const config = variant === 'summer' ? SUMMER : CLASSIC;
    const bag = new TileBag(config.COLORS, config.TILES_PER_COLOR);
    const factoryCount = FactoryDisplay.getFactoryCount(players.length, config);

    const discard = [];
    const factories = FactoryDisplay.fillFactories(
      FactoryDisplay.createFactories(factoryCount),
      bag,
      discard,
      config.TILES_PER_FACTORY
    );

    const state = {
      variant,
      players: players.map((p, i) => ({
        id: `p${i + 1}`,
        name: p.name,
        type: p.type,
        score: variant === 'summer' ? SUMMER.STARTING_SCORE : 0,
        // Classic fields
        patternLines: PatternLine.createEmptyPatternLines(),
        wall: Wall.createEmptyWall(),
        floorLine: [],
        hasFirstPlayer: i === 0,
        // Summer fields
        starBoard: variant === 'summer' ? StarBoard.createEmpty() : null,
        handTiles: variant === 'summer' ? [] : null,
        hasPassed: false,
      })),
      currentPlayerIndex: 0,
      round: 1,
      phase: 'factory-offer',
      factories,
      center: [],
      centerHasFirstPlayer: true,
      bag: bag.toArray(),
      discard,
      turnHistory: [],
      // Summer-specific
      wildColor: variant === 'summer' ? SUMMER.WILD_SEQUENCE[0] : null,
    };

    return state;
  }

  /**
   * Apply an action to the state. Returns { newState, events }.
   * This is a pure function.
   */
  static applyAction(state, action) {
    if (state.variant === 'classic') {
      return GameState.applyClassicAction(state, action);
    }
    return GameState.applySummerAction(state, action);
  }

  /**
   * Classic variant action handler.
   */
  static applyClassicAction(state, action) {
    // Validate
    const validation = GameRules.validateMove(state, action);
    if (!validation.valid) {
      return { newState: state, events: [{ type: 'INVALID_MOVE', error: validation.error }] };
    }

    const newState = deepCopy(state);
    const events = [];
    const player = newState.players[newState.currentPlayerIndex];

    // 1. Pick tiles
    let taken, remaining;

    if (action.source === 'factory') {
      const pickResult = FactoryDisplay.pickFromFactory(
        newState.factories, action.factoryIndex, action.color
      );
      taken = pickResult.taken;
      remaining = pickResult.remaining;
      newState.factories = pickResult.newFactories;
      // Push remaining to center
      newState.center.push(...remaining);

      events.push({
        type: 'TILES_PICKED',
        source: 'factory',
        factoryIndex: action.factoryIndex,
        color: action.color,
        count: taken.length,
        remaining: remaining.length,
      });
    } else {
      const pickResult = FactoryDisplay.pickFromCenter(
        newState.center, action.color, newState.centerHasFirstPlayer
      );
      taken = pickResult.taken;
      newState.center = pickResult.newCenter;

      if (pickResult.tookFirstPlayer) {
        player.hasFirstPlayer = true;
        newState.centerHasFirstPlayer = false;

        events.push({
          type: 'FIRST_PLAYER_TAKEN',
          playerIndex: newState.currentPlayerIndex,
        });
      }

      events.push({
        type: 'TILES_PICKED',
        source: 'center',
        color: action.color,
        count: taken.length,
        tookFirstPlayer: pickResult.tookFirstPlayer,
      });
    }

    // 2. Place tiles
    if (action.targetRow === 'floor') {
      // All tiles to floor
      const { newFloor, discardExcess } = FloorLine.addToFloor(
        player.floorLine,
        taken,
        action.source === 'center' && state.centerHasFirstPlayer && !player.hasFirstPlayer
      );
      // Actually, first player marker was already handled above
      if (player.hasFirstPlayer && !state.players[newState.currentPlayerIndex].hasFirstPlayer) {
        // First player marker goes to floor
        const fpResult = FloorLine.addToFloor(player.floorLine, taken, true);
        player.floorLine = fpResult.newFloor;
        newState.discard.push(...fpResult.discardExcess);
      } else {
        player.floorLine = newFloor;
        newState.discard.push(...discardExcess);
      }

      events.push({
        type: 'TILES_TO_FLOOR',
        count: taken.length,
      });
    } else {
      const row = action.targetRow;
      const placeResult = PatternLine.place(
        player.patternLines[row], taken, action.color, row
      );
      player.patternLines[row] = placeResult.newLine;

      events.push({
        type: 'TILES_PLACED',
        targetRow: row,
        placed: placeResult.placed,
        overflow: placeResult.overflowCount,
      });

      // Overflow to floor
      if (placeResult.overflowCount > 0) {
        const floorTiles = placeResult.overflowTiles;

        // If took first player from center, add marker to floor too
        let addFP = false;
        if (action.source === 'center' && state.centerHasFirstPlayer && player.hasFirstPlayer) {
          addFP = true;
        }

        const { newFloor, discardExcess } = FloorLine.addToFloor(
          player.floorLine, floorTiles, addFP
        );
        player.floorLine = newFloor;
        newState.discard.push(...discardExcess);

        events.push({
          type: 'TILES_TO_FLOOR',
          count: placeResult.overflowCount,
        });
      } else if (action.source === 'center' && state.centerHasFirstPlayer && player.hasFirstPlayer) {
        // First player marker goes to floor with no overflow tiles
        const { newFloor, discardExcess } = FloorLine.addToFloor(
          player.floorLine, [], true
        );
        player.floorLine = newFloor;
        newState.discard.push(...discardExcess);
      }
    }

    // 3. Record turn
    newState.turnHistory.push({
      action: deepCopy(action),
      playerIndex: newState.currentPlayerIndex,
      timestamp: Date.now(),
    });

    // 4. Check if round is over
    if (GameRules.isRoundOver(newState)) {
      newState.phase = 'wall-tiling';
      events.push({ type: 'ROUND_OVER' });
    } else {
      // Advance to next player
      newState.currentPlayerIndex = TurnManager.nextPlayer(newState);
      events.push({
        type: 'NEXT_TURN',
        playerIndex: newState.currentPlayerIndex,
      });
    }

    return { newState, events };
  }

  /**
   * Summer Pavilion action handler (simplified for drafting phase).
   */
  static applySummerAction(state, action) {
    if (action.type === 'draft') {
      return GameState.applySummerDraft(state, action);
    }
    if (action.type === 'place') {
      return GameState.applySummerPlace(state, action);
    }
    if (action.type === 'pass') {
      return GameState.applySummerPass(state, action);
    }
    return { newState: state, events: [{ type: 'INVALID_MOVE', error: 'Unknown action type' }] };
  }

  static applySummerDraft(state, action) {
    const newState = deepCopy(state);
    const events = [];
    const player = newState.players[newState.currentPlayerIndex];
    const wildColor = newState.wildColor;

    let taken;

    if (action.source === 'factory') {
      const pickResult = FactoryDisplay.pickFromFactorySummer(
        newState.factories, action.factoryIndex, action.color, wildColor
      );
      if (!pickResult) {
        return { newState: state, events: [{ type: 'INVALID_MOVE', error: 'Invalid factory pick' }] };
      }
      taken = pickResult.taken;
      newState.factories = pickResult.newFactories;
      newState.center.push(...pickResult.remaining);
    } else {
      const pickResult = FactoryDisplay.pickFromCenterSummer(
        newState.center, action.color, wildColor, newState.centerHasFirstPlayer
      );
      if (!pickResult) {
        return { newState: state, events: [{ type: 'INVALID_MOVE', error: 'Invalid center pick' }] };
      }
      taken = pickResult.taken;
      newState.center = pickResult.newCenter;

      if (pickResult.tookFirstPlayer) {
        player.hasFirstPlayer = true;
        newState.centerHasFirstPlayer = false;
        // Penalty = number of tiles taken
        const penalty = taken.length;
        player.score = Math.max(SUMMER.MIN_SCORE, player.score - penalty);
        events.push({ type: 'FIRST_PLAYER_PENALTY', penalty });
      }
    }

    player.handTiles.push(...taken);
    events.push({
      type: 'TILES_DRAFTED',
      color: action.color,
      count: taken.length,
    });

    newState.turnHistory.push({
      action: deepCopy(action),
      playerIndex: newState.currentPlayerIndex,
      timestamp: Date.now(),
    });

    // Check if drafting phase over
    if (FactoryDisplay.allEmpty(newState.factories, newState.center)) {
      newState.phase = 'placement';
      // Set first player for placement
      for (let i = 0; i < newState.players.length; i++) {
        if (newState.players[i].hasFirstPlayer) {
          newState.currentPlayerIndex = i;
          break;
        }
      }
      events.push({ type: 'PLACEMENT_PHASE_START' });
    } else {
      newState.currentPlayerIndex = TurnManager.nextPlayer(newState);
    }

    return { newState, events };
  }

  static applySummerPlace(state, action) {
    const newState = deepCopy(state);
    const events = [];
    const player = newState.players[newState.currentPlayerIndex];

    const { star, position, color, tilesUsed, wildTilesUsed } = action;
    const cost = position;

    // Validate
    if (!StarBoard.canPlace(player.starBoard, star, position, player.handTiles, newState.wildColor)) {
      return { newState: state, events: [{ type: 'INVALID_MOVE', error: 'Cannot place here' }] };
    }

    // Remove tiles from hand
    let remaining = [...player.handTiles];
    let colorRemoved = 0;
    let wildRemoved = 0;

    for (let i = remaining.length - 1; i >= 0 && colorRemoved < tilesUsed; i--) {
      if (remaining[i] === color) {
        remaining.splice(i, 1);
        colorRemoved++;
      }
    }
    for (let i = remaining.length - 1; i >= 0 && wildRemoved < wildTilesUsed; i--) {
      if (remaining[i] === newState.wildColor) {
        remaining.splice(i, 1);
        wildRemoved++;
      }
    }

    if (colorRemoved + wildRemoved < cost) {
      return { newState: state, events: [{ type: 'INVALID_MOVE', error: 'Not enough tiles' }] };
    }

    player.handTiles = remaining;

    const result = StarBoard.place(
      player.starBoard, star, position, color, tilesUsed, wildTilesUsed
    );
    player.starBoard = result.newBoard;
    player.score += result.score;

    // Discard payment tiles
    for (let i = 0; i < result.discardedTiles; i++) {
      newState.discard.push(color); // simplified
    }

    events.push({
      type: 'TILE_PLACED_STAR',
      star, position, color,
      score: result.score,
      decorations: result.decorationBonuses,
    });

    // Advance to next non-passed player
    GameState.advanceSummerPlacement(newState);

    return { newState, events };
  }

  static applySummerPass(state, action) {
    const newState = deepCopy(state);
    const events = [];
    const player = newState.players[newState.currentPlayerIndex];

    player.hasPassed = true;
    events.push({
      type: 'PLAYER_PASSED',
      playerIndex: newState.currentPlayerIndex,
    });

    // Check if all passed
    if (newState.players.every(p => p.hasPassed)) {
      // Round end
      GameState.processSummerRoundEnd(newState, events);
    } else {
      GameState.advanceSummerPlacement(newState);
    }

    return { newState, events };
  }

  static advanceSummerPlacement(state) {
    let next = (state.currentPlayerIndex + 1) % state.players.length;
    let checks = 0;
    while (state.players[next].hasPassed && checks < state.players.length) {
      next = (next + 1) % state.players.length;
      checks++;
    }

    if (checks >= state.players.length) {
      // All passed — process round end
      const events = [];
      GameState.processSummerRoundEnd(state, events);
    } else {
      state.currentPlayerIndex = next;
    }
  }

  static processSummerRoundEnd(state, events) {
    // Discard excess tiles
    for (const player of state.players) {
      if (player.handTiles && player.handTiles.length > SUMMER.CORNER_STORAGE) {
        const excess = player.handTiles.length - SUMMER.CORNER_STORAGE;
        player.score = Math.max(SUMMER.MIN_SCORE, player.score - excess);
        state.discard.push(...player.handTiles.slice(SUMMER.CORNER_STORAGE));
        player.handTiles = player.handTiles.slice(0, SUMMER.CORNER_STORAGE);
      }
      player.hasPassed = false;
    }

    state.round++;

    if (state.round > SUMMER.ROUNDS) {
      // Game over
      state.phase = 'game-over';
      events.push({ type: 'GAME_OVER' });
    } else {
      // Next round setup
      state.wildColor = SUMMER.WILD_SEQUENCE[state.round - 1];
      state.phase = 'factory-offer';
      state.centerHasFirstPlayer = true;
      state.center = [];

      const bag = TileBag.fromArray(state.bag);
      const factoryCount = FactoryDisplay.getFactoryCount(state.players.length, SUMMER);
      state.factories = FactoryDisplay.fillFactories(
        FactoryDisplay.createFactories(factoryCount),
        bag,
        state.discard,
        SUMMER.TILES_PER_FACTORY
      );
      state.bag = bag.toArray();

      events.push({ type: 'ROUND_START', round: state.round });
    }
  }
}
