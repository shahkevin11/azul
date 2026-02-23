// js/engine/TileBag.js — Bag draw, refill from discard

export class TileBag {
  constructor(colors, tilesPerColor) {
    this.tiles = [];
    for (const color of colors) {
      for (let i = 0; i < tilesPerColor; i++) {
        this.tiles.push(color);
      }
    }
    this.shuffle();
  }

  static fromArray(tiles) {
    const bag = new TileBag([], 0);
    bag.tiles = [...tiles];
    return bag;
  }

  shuffle() {
    // Fisher-Yates shuffle
    for (let i = this.tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.tiles[i], this.tiles[j]] = [this.tiles[j], this.tiles[i]];
    }
  }

  draw(n, discardPile = []) {
    const drawn = [];
    for (let i = 0; i < n; i++) {
      if (this.tiles.length === 0) {
        if (discardPile.length === 0) break; // Both empty
        this.refillFromDiscard(discardPile);
      }
      if (this.tiles.length > 0) {
        drawn.push(this.tiles.pop());
      }
    }
    return drawn;
  }

  refillFromDiscard(discardPile) {
    this.tiles = [...discardPile];
    discardPile.length = 0; // Empty the discard
    this.shuffle();
  }

  remaining() {
    return this.tiles.length;
  }

  isEmpty() {
    return this.tiles.length === 0;
  }

  toArray() {
    return [...this.tiles];
  }
}
