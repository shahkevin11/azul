// js/engine/FactoryDisplay.js — Factory setup, tile picking logic

export class FactoryDisplay {
  static getFactoryCount(playerCount, config) {
    return config.FACTORIES[playerCount] || 5;
  }

  static createFactories(count) {
    return Array.from({ length: count }, () => []);
  }

  static fillFactories(factories, bag, discard, tilesPerFactory = 4) {
    const newFactories = factories.map(() => []);
    for (let i = 0; i < newFactories.length; i++) {
      const drawn = bag.draw(tilesPerFactory, discard);
      newFactories[i] = drawn;
    }
    return newFactories;
  }

  static pickFromFactory(factories, factoryIndex, color) {
    const factory = [...factories[factoryIndex]];
    const taken = factory.filter(t => t === color);
    const remaining = factory.filter(t => t !== color);

    if (taken.length === 0) {
      return null; // Invalid pick
    }

    const newFactories = factories.map((f, i) =>
      i === factoryIndex ? [] : [...f]
    );

    return { taken, remaining, newFactories };
  }

  static pickFromCenter(center, color, centerHasFirstPlayer) {
    const taken = center.filter(t => t === color);
    const newCenter = center.filter(t => t !== color);

    if (taken.length === 0) {
      return null; // Invalid pick
    }

    const tookFirstPlayer = centerHasFirstPlayer;

    return {
      taken,
      newCenter,
      tookFirstPlayer,
      newCenterHasFirstPlayer: tookFirstPlayer ? false : centerHasFirstPlayer,
    };
  }

  static allEmpty(factories, center) {
    return factories.every(f => f.length === 0) && center.length === 0;
  }

  static getAvailableColors(factories, center) {
    const colors = new Set();
    for (const factory of factories) {
      for (const tile of factory) colors.add(tile);
    }
    for (const tile of center) colors.add(tile);
    return [...colors];
  }

  static getFactoryColors(factory) {
    const colors = new Set(factory);
    return [...colors];
  }

  // Summer Pavilion: pick with wild tile logic
  static pickFromFactorySummer(factories, factoryIndex, color, wildColor) {
    const factory = [...factories[factoryIndex]];

    if (color === wildColor) {
      return null; // Cannot select wild color as choice
    }

    const taken = factory.filter(t => t === color);
    if (taken.length === 0) return null;

    // Take at most 1 wild tile from this factory
    let wildTaken = [];
    const remainingAfterColor = factory.filter(t => t !== color);
    const wildIndex = remainingAfterColor.indexOf(wildColor);
    if (wildIndex !== -1) {
      wildTaken = [wildColor];
      remainingAfterColor.splice(wildIndex, 1);
    }

    const newFactories = factories.map((f, i) =>
      i === factoryIndex ? [] : [...f]
    );

    return {
      taken: [...taken, ...wildTaken],
      remaining: remainingAfterColor,
      newFactories,
    };
  }

  static pickFromCenterSummer(center, color, wildColor, centerHasFirstPlayer) {
    if (color === wildColor) {
      // Special case: only wild tiles in center, can take exactly 1
      const onlyWild = center.every(t => t === wildColor);
      if (onlyWild && center.length > 0) {
        const newCenter = center.slice(1);
        return {
          taken: [wildColor],
          newCenter,
          tookFirstPlayer: centerHasFirstPlayer,
          newCenterHasFirstPlayer: false,
        };
      }
      return null;
    }

    const taken = center.filter(t => t === color);
    if (taken.length === 0) return null;

    let newCenter = center.filter(t => t !== color);

    // Take at most 1 wild from center
    let wildTaken = [];
    const wildIdx = newCenter.indexOf(wildColor);
    if (wildIdx !== -1) {
      wildTaken = [wildColor];
      newCenter = [...newCenter];
      newCenter.splice(wildIdx, 1);
    }

    const tookFirstPlayer = centerHasFirstPlayer;

    return {
      taken: [...taken, ...wildTaken],
      newCenter,
      tookFirstPlayer,
      newCenterHasFirstPlayer: tookFirstPlayer ? false : centerHasFirstPlayer,
    };
  }
}
