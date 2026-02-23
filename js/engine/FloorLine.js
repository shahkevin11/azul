// js/engine/FloorLine.js — Floor penalty calculation (Classic)

import { CLASSIC } from '../config.js';

export class FloorLine {
  static calculatePenalty(floorLine) {
    let penalty = 0;
    for (let i = 0; i < Math.min(floorLine.length, 7); i++) {
      penalty += CLASSIC.FLOOR_PENALTIES[i];
    }
    return penalty; // Always negative or zero
  }

  static addToFloor(floorLine, tiles, hasFirstPlayer = false) {
    const newFloor = [...floorLine];
    if (hasFirstPlayer) {
      newFloor.push('first-player');
    }
    newFloor.push(...tiles);

    // Tiles beyond position 6 go to discard with no additional penalty
    const kept = newFloor.slice(0, 7);
    const excess = newFloor.slice(7);

    // Filter out first-player marker from excess discard (it's not a real tile)
    const discardExcess = excess.filter(t => t !== 'first-player');

    return { newFloor: kept, discardExcess };
  }

  static getDiscardTiles(floorLine) {
    // All tiles on floor go to discard at end of round (except first-player marker)
    return floorLine.filter(t => t !== 'first-player');
  }

  static getPenaltyAtPosition(position) {
    if (position < 0 || position >= 7) return 0;
    return CLASSIC.FLOOR_PENALTIES[position];
  }
}
