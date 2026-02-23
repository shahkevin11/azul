// js/engine/Wall.js — Wall placement + adjacency scoring (Classic)

import { CLASSIC } from '../config.js';

export class Wall {
  static getColumnForColor(row, color) {
    return CLASSIC.WALL_PATTERN[row].indexOf(color);
  }

  static getColorForPosition(row, col) {
    return CLASSIC.WALL_PATTERN[row][col];
  }

  static canPlaceColor(wall, row, color) {
    const col = Wall.getColumnForColor(row, color);
    if (col === -1) return false;
    return wall[row][col] === null;
  }

  static placeTile(wall, row, color) {
    const col = Wall.getColumnForColor(row, color);
    if (col === -1 || wall[row][col] !== null) {
      return null; // Invalid placement
    }

    const newWall = wall.map(r => [...r]);
    newWall[row][col] = color;
    const score = Wall.scoreAdjacency(newWall, row, col);

    return { newWall, col, score };
  }

  static scoreAdjacency(wall, row, col) {
    let horizontal = 1;
    let vertical = 1;

    // Count left
    for (let c = col - 1; c >= 0 && wall[row][c] !== null; c--) horizontal++;
    // Count right
    for (let c = col + 1; c < 5 && wall[row][c] !== null; c++) horizontal++;
    // Count up
    for (let r = row - 1; r >= 0 && wall[r][col] !== null; r--) vertical++;
    // Count down
    for (let r = row + 1; r < 5 && wall[r][col] !== null; r++) vertical++;

    if (horizontal === 1 && vertical === 1) return 1; // isolated tile
    let score = 0;
    if (horizontal > 1) score += horizontal;
    if (vertical > 1) score += vertical;
    return score;
  }

  static getEndGameBonuses(wall) {
    let bonus = 0;
    const details = { rows: 0, columns: 0, colors: 0 };

    // Complete rows: +2 each
    for (let r = 0; r < 5; r++) {
      if (wall[r].every(cell => cell !== null)) {
        bonus += CLASSIC.BONUS_ROW;
        details.rows++;
      }
    }

    // Complete columns: +7 each
    for (let c = 0; c < 5; c++) {
      if (wall.every(row => row[c] !== null)) {
        bonus += CLASSIC.BONUS_COLUMN;
        details.columns++;
      }
    }

    // Complete color sets: +10 each
    for (const color of CLASSIC.COLORS) {
      let count = 0;
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          if (wall[r][c] === color) count++;
        }
      }
      if (count === 5) {
        bonus += CLASSIC.BONUS_COLOR_SET;
        details.colors++;
      }
    }

    return { bonus, details };
  }

  static hasCompleteRow(wall) {
    return wall.some(row => row.every(cell => cell !== null));
  }

  static countCompleteRows(wall) {
    return wall.filter(row => row.every(cell => cell !== null)).length;
  }

  static createEmptyWall() {
    return Array.from({ length: 5 }, () => Array(5).fill(null));
  }
}
