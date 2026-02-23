// js/engine/PatternLine.js — Pattern line placement + overflow (Classic)

import { Wall } from './Wall.js';

export class PatternLine {
  static canPlace(patternLine, color, rowIndex, wall) {
    // If line has tiles of different color, can't place
    if (patternLine.length > 0 && patternLine[0] !== color) {
      return false;
    }
    // If wall already has this color in corresponding row
    if (!Wall.canPlaceColor(wall, rowIndex, color)) {
      return false;
    }
    // If line is full
    const maxSize = rowIndex + 1;
    if (patternLine.length >= maxSize) {
      return false;
    }
    return true;
  }

  static place(patternLine, tiles, color, rowIndex) {
    const maxSize = rowIndex + 1;
    const currentCount = patternLine.length;
    const available = maxSize - currentCount;
    const toPlace = Math.min(tiles.length, available);
    const overflow = tiles.length - toPlace;

    const newLine = [...patternLine];
    for (let i = 0; i < toPlace; i++) {
      newLine.push(color);
    }

    return {
      newLine,
      placed: toPlace,
      overflowCount: overflow,
      overflowTiles: Array(overflow).fill(color),
    };
  }

  static isComplete(patternLine, rowIndex) {
    return patternLine.length === rowIndex + 1;
  }

  static tileToWall(patternLine) {
    if (patternLine.length === 0) return null;
    const color = patternLine[0];
    // One tile goes to wall, rest go to discard
    const discardTiles = Array(patternLine.length - 1).fill(color);
    return { color, discardTiles };
  }

  static createEmptyPatternLines() {
    return [[], [], [], [], []];
  }

  static getAnyLegalRow(color, patternLines, wall) {
    for (let row = 0; row < 5; row++) {
      if (PatternLine.canPlace(patternLines[row], color, row, wall)) {
        return row;
      }
    }
    return -1; // No legal row — must go to floor
  }

  static hasAnyLegalRow(color, patternLines, wall) {
    return PatternLine.getAnyLegalRow(color, patternLines, wall) !== -1;
  }
}
