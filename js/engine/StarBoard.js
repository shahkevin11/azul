// js/engine/StarBoard.js — Star placement + decoration bonuses (Summer Pavilion)

import { SUMMER } from '../config.js';
import { deepCopy } from '../config.js';

// Decoration adjacency map
export const DECORATION_MAP = [
  // Pillars (4 adjacent spaces, 1 bonus tile)
  { type: 'pillar', id: 'p1', surroundedBy: [
    {star:'red', pos:1}, {star:'blue', pos:1}, {star:'center', pos:1}, {star:'center', pos:6}
  ], bonusTiles: 1 },
  { type: 'pillar', id: 'p2', surroundedBy: [
    {star:'blue', pos:1}, {star:'yellow', pos:1}, {star:'center', pos:1}, {star:'center', pos:2}
  ], bonusTiles: 1 },
  { type: 'pillar', id: 'p3', surroundedBy: [
    {star:'yellow', pos:1}, {star:'orange', pos:1}, {star:'center', pos:2}, {star:'center', pos:3}
  ], bonusTiles: 1 },
  { type: 'pillar', id: 'p4', surroundedBy: [
    {star:'orange', pos:1}, {star:'green', pos:1}, {star:'center', pos:3}, {star:'center', pos:4}
  ], bonusTiles: 1 },
  { type: 'pillar', id: 'p5', surroundedBy: [
    {star:'green', pos:1}, {star:'purple', pos:1}, {star:'center', pos:4}, {star:'center', pos:5}
  ], bonusTiles: 1 },
  { type: 'pillar', id: 'p6', surroundedBy: [
    {star:'purple', pos:1}, {star:'red', pos:1}, {star:'center', pos:5}, {star:'center', pos:6}
  ], bonusTiles: 1 },

  // Statues (4 adjacent spaces, 2 bonus tiles)
  { type: 'statue', id: 's1', surroundedBy: [
    {star:'red', pos:2}, {star:'red', pos:3}, {star:'blue', pos:5}, {star:'blue', pos:6}
  ], bonusTiles: 2 },
  { type: 'statue', id: 's2', surroundedBy: [
    {star:'blue', pos:2}, {star:'blue', pos:3}, {star:'yellow', pos:5}, {star:'yellow', pos:6}
  ], bonusTiles: 2 },
  { type: 'statue', id: 's3', surroundedBy: [
    {star:'yellow', pos:2}, {star:'yellow', pos:3}, {star:'orange', pos:5}, {star:'orange', pos:6}
  ], bonusTiles: 2 },
  { type: 'statue', id: 's4', surroundedBy: [
    {star:'orange', pos:2}, {star:'orange', pos:3}, {star:'green', pos:5}, {star:'green', pos:6}
  ], bonusTiles: 2 },
  { type: 'statue', id: 's5', surroundedBy: [
    {star:'green', pos:2}, {star:'green', pos:3}, {star:'purple', pos:5}, {star:'purple', pos:6}
  ], bonusTiles: 2 },
  { type: 'statue', id: 's6', surroundedBy: [
    {star:'purple', pos:2}, {star:'purple', pos:3}, {star:'red', pos:5}, {star:'red', pos:6}
  ], bonusTiles: 2 },

  // Windows (2 adjacent spaces, 3 bonus tiles)
  { type: 'window', id: 'w1', surroundedBy: [
    {star:'red', pos:5}, {star:'red', pos:6}
  ], bonusTiles: 3 },
  { type: 'window', id: 'w2', surroundedBy: [
    {star:'blue', pos:5}, {star:'blue', pos:6}
  ], bonusTiles: 3 },
  { type: 'window', id: 'w3', surroundedBy: [
    {star:'yellow', pos:5}, {star:'yellow', pos:6}
  ], bonusTiles: 3 },
  { type: 'window', id: 'w4', surroundedBy: [
    {star:'orange', pos:5}, {star:'orange', pos:6}
  ], bonusTiles: 3 },
  { type: 'window', id: 'w5', surroundedBy: [
    {star:'green', pos:5}, {star:'green', pos:6}
  ], bonusTiles: 3 },
  { type: 'window', id: 'w6', surroundedBy: [
    {star:'purple', pos:5}, {star:'purple', pos:6}
  ], bonusTiles: 3 },
];

export class StarBoard {
  static createEmpty() {
    const board = {};
    const stars = ['red', 'blue', 'yellow', 'orange', 'green', 'purple', 'center'];
    for (const star of stars) {
      board[star] = {}; // positions 1-6, each null or color string
      for (let i = 1; i <= 6; i++) {
        board[star][i] = null;
      }
    }
    return board;
  }

  static canPlace(starBoard, star, position, tilesInHand, wildColor) {
    // Position already filled
    if (starBoard[star][position] !== null) return false;

    // Cost = position number
    const cost = position;
    if (tilesInHand.length < cost) return false;

    // Determine the star's required color
    const starColor = star === 'center' ? null : star;

    if (starColor) {
      // Must have at least 1 non-wild tile of the star's color
      const nonWild = tilesInHand.filter(t => t === starColor);
      if (nonWild.length === 0) return false;
    } else {
      // Center star: the tile must be a color not already on center star
      const usedColors = new Set();
      for (let i = 1; i <= 6; i++) {
        if (starBoard.center[i]) usedColors.add(starBoard.center[i]);
      }
      // Need at least 1 non-wild tile of a color not yet on center
      const eligible = tilesInHand.filter(t => t !== wildColor && !usedColors.has(t));
      if (eligible.length === 0) return false;
    }

    return true;
  }

  static place(starBoard, star, position, color, tilesUsed, wildTilesUsed) {
    const newBoard = deepCopy(starBoard);
    newBoard[star][position] = color;

    // Score: 1 + contiguous adjacent filled in same star
    const score = StarBoard.scoreContiguous(newBoard, star, position);

    // Tiles used: position N costs N tiles. 1 stays on board, rest discarded
    const discardedTiles = tilesUsed + wildTilesUsed - 1;

    // Check decoration bonuses
    const decorationBonuses = StarBoard.checkDecorations(newBoard, star, position);

    return {
      newBoard,
      score,
      discardedTiles,
      decorationBonuses,
    };
  }

  static scoreContiguous(board, star, position) {
    let score = 1;
    const starData = board[star];

    // Check clockwise
    let pos = (position % 6) + 1;
    while (pos !== position && starData[pos] !== null) {
      score++;
      pos = (pos % 6) + 1;
    }

    // Check counter-clockwise
    pos = ((position - 2 + 6) % 6) + 1;
    while (pos !== position && starData[pos] !== null) {
      score++;
      pos = ((pos - 2 + 6) % 6) + 1;
    }

    return score;
  }

  static checkDecorations(board, star, position) {
    const bonuses = [];
    for (const deco of DECORATION_MAP) {
      // Check if this placement is adjacent to this decoration
      const isAdjacent = deco.surroundedBy.some(
        s => s.star === star && s.pos === position
      );
      if (!isAdjacent) continue;

      // Check if all surrounding spaces are now filled
      const allFilled = deco.surroundedBy.every(
        s => board[s.star][s.pos] !== null
      );
      if (allFilled) {
        bonuses.push({ type: deco.type, id: deco.id, bonusTiles: deco.bonusTiles });
      }
    }
    return bonuses;
  }

  static getEndGameBonuses(board) {
    let total = 0;
    const starBonuses = {};
    const numberBonuses = {};

    // Star completion bonuses
    const stars = ['red', 'blue', 'yellow', 'orange', 'green', 'purple', 'center'];
    for (const star of stars) {
      const allFilled = Object.values(board[star]).every(v => v !== null);
      if (allFilled) {
        const bonus = SUMMER.STAR_BONUSES[star] || 0;
        starBonuses[star] = bonus;
        total += bonus;
      }
    }

    // Number coverage bonuses (all 7 stars have position N filled)
    for (let n = 1; n <= 6; n++) {
      const allHaveN = stars.every(star => board[star][n] !== null);
      if (allHaveN) {
        const bonus = SUMMER.NUMBER_BONUSES[n] || 0;
        numberBonuses[n] = bonus;
        total += bonus;
      }
    }

    return { starBonuses, numberBonuses, total };
  }
}
